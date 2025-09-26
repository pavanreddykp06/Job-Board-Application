from django.contrib.auth import get_user_model
from rest_framework import generics, status, filters, serializers
from rest_framework.permissions import IsAuthenticated, AllowAny, BasePermission
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError, PermissionDenied
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Q
from django.core.mail import EmailMessage
from django.template.loader import render_to_string
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.conf import settings
from django.http import FileResponse, Http404
from rest_framework import generics, mixins
from rest_framework.generics import RetrieveUpdateAPIView
from .models import (
    User, Job, JobApplication, CompanyProfile, Message, Notification, 
    EmployerActivity, JobSeekerActivity, JobSeekerProfile
)
from django.db.models import Q
from django.core.mail import EmailMultiAlternatives
from .serializers import (
    UserSerializer, CustomTokenObtainPairSerializer, JobSerializer, 
    CompanyProfileSerializer, JobApplicationSerializer, MessageSerializer, 
    NotificationSerializer, EmployerActivitySerializer,
    JobSeekerActivitySerializer,
    PasswordResetRequestSerializer, 
    PasswordResetConfirmSerializer,
    ChangePasswordSerializer,
    UserSearchSerializer,
    ConversationSerializer,
    JobSeekerProfileSerializer,
)
from rest_framework.response import Response
from .filters import JobFilter

# Custom permissions for role-based access
class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'

class IsEmployer(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'employer'

class IsJobSeeker(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'job_seeker'

class IsJobOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.employer == request.user

# DRF APIView for registration
class UserRegisterAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        # DEBUG: Print the incoming data
        print("DEBUG: Registration data received:")
        print(f"Data: {request.data}")
        
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Generate tokens for the new user
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': serializer.data
            }, status=status.HTTP_201_CREATED)
        else:
            # DEBUG: Print the validation errors
            print("DEBUG: Validation errors:")
            print(f"Errors: {serializer.errors}")
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# DRF APIView for profile (retrieve/update)
class UserProfileAPIView(RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class JobSeekerProfileRetrieveUpdateAPIView(generics.RetrieveUpdateAPIView):
    serializer_class = JobSeekerProfileSerializer
    permission_classes = [IsAuthenticated, IsJobSeeker]

    def get_object(self):
        profile, created = JobSeekerProfile.objects.get_or_create(user=self.request.user)
        return profile

class CompanyProfileRetrieveUpdateAPIView(generics.RetrieveUpdateAPIView):
    serializer_class = CompanyProfileSerializer
    permission_classes = [IsAuthenticated, IsEmployer]

    def get_object(self):
        profile, created = CompanyProfile.objects.get_or_create(employer=self.request.user)
        return profile

    def perform_update(self, serializer):
        profile = serializer.save()
        EmployerActivity.objects.create(
            employer=self.request.user,
            activity_type='company_updated',
            description=f"Updated company profile: '{profile.company_name}'"
        )


# DRF APIView for employer-only endpoint example
class ConversationListView(generics.ListAPIView):
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        # Get all users that have exchanged messages with the current user
        sent_to_ids = Message.objects.filter(sender=user).values_list('recipient_id', flat=True).distinct()
        received_from_ids = Message.objects.filter(recipient=user).values_list('sender_id', flat=True).distinct()
        
        user_ids = set(list(sent_to_ids) + list(received_from_ids))
        
        if not user_ids:
            return User.objects.none()
        
        # Return users ordered by their latest message timestamp
        users_with_messages = []
        for user_id in user_ids:
            try:
                other_user = User.objects.get(id=user_id)
                # Get the latest message timestamp for ordering
                latest_message = Message.objects.filter(
                    (Q(sender=user, recipient=other_user)) |
                    (Q(sender=other_user, recipient=user))
                ).order_by('-timestamp').first()
                
                if latest_message:
                    users_with_messages.append((other_user, latest_message.timestamp))
            except User.DoesNotExist:
                continue
        
        # Sort by timestamp and return users
        users_with_messages.sort(key=lambda x: x[1], reverse=True)
        return [user_data[0] for user_data in users_with_messages]
    

# Add this view to start new conversations
class StartConversationView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        recipient_id = request.data.get('recipient_id')
        initial_message = request.data.get('message', '')
        job_id = request.data.get('job_id', None)  # Optional, for job-related messages

        if not recipient_id:
            return Response(
                {'error': 'Recipient ID is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            recipient = User.objects.get(id=recipient_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'Recipient not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

        # Validate roles (employers can message job seekers and vice versa)
        user_role = request.user.role
        recipient_role = recipient.role

        if user_role == recipient_role:
            return Response(
                {'error': 'Cannot message users with the same role'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create the initial message if provided
        message = None
        if initial_message.strip():
            message = Message.objects.create(
                sender=request.user,
                recipient=recipient,
                content=initial_message
            )

            # Create notification
            sender_name = request.user.full_name or request.user.username
            Notification.objects.create(
                user=recipient,
                message=f"New message from {sender_name}",
                link=f"/messages"
            )

        # Return conversation data
        serializer = ConversationSerializer(recipient, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

# Update your existing MessageListView to handle conversation creation
class MessageListView(generics.ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        other_user_id = self.kwargs['user_id']
        user = self.request.user
        
        try:
            other_user = User.objects.get(id=other_user_id)
        except User.DoesNotExist:
            return Message.objects.none()
            
        # Get all messages between the current user and the other user
        return Message.objects.filter(
            (Q(sender=user, recipient=other_user)) |
            (Q(sender=other_user, recipient=user))
        ).order_by('timestamp')

    def list(self, request, *args, **kwargs):
        # Mark messages from the other user as read
        other_user_id = self.kwargs['user_id']
        try:
            other_user = User.objects.get(id=other_user_id)
            Message.objects.filter(
                sender=other_user, 
                recipient=request.user, 
                is_read=False
            ).update(is_read=True)
        except User.DoesNotExist:
            pass
        
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

# Add this new view for sending messages
class SendMessageView(generics.CreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        recipient_id = self.kwargs['user_id']
        
        try:
            recipient = User.objects.get(id=recipient_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'Recipient not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

        # Create the message
        message = Message.objects.create(
            sender=request.user,
            recipient=recipient,
            content=request.data.get('content', '')
        )

        # Create notification for recipient
        sender_name = request.user.full_name or request.user.username
        Notification.objects.create(
            user=recipient,
            message=f"New message from {sender_name}",
            link=f"/messages"
        )

        serializer = self.get_serializer(message)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class UserSearchView(generics.ListAPIView):
    serializer_class = UserSearchSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        query = self.request.query_params.get('search', None)
        if query:
            return User.objects.filter(
                Q(username__icontains=query) |
                Q(full_name__icontains=query) |
                Q(email__icontains=query)
            ).exclude(id=self.request.user.id)
        return User.objects.none()


class EmployerOnlyAPIView(APIView):
    permission_classes = [IsAuthenticated, IsEmployer]
    def get(self, request):
        return Response({'message': 'Hello Employer!'})

# DRF APIView for jobseeker-only endpoint example
class JobSeekerOnlyAPIView(APIView):
    permission_classes = [IsAuthenticated, IsJobSeeker]
    def get(self, request):
        return Response({'message': 'Hello Job Seeker!'})

# DRF APIView for admin-only endpoint example
class AdminOnlyAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]
    def get(self, request):
        return Response({'message': 'Hello Admin!'})

custom_token_view = TokenObtainPairView.as_view(serializer_class=CustomTokenObtainPairSerializer)

class JobListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = JobSerializer

    def get_queryset(self):
        queryset = Job.objects.select_related('employer__company_profile').all()
        
        # Get filter parameters from request
        keyword = self.request.query_params.get('keyword')
        location = self.request.query_params.get('location')
        job_type = self.request.query_params.get('job_type')
        salary = self.request.query_params.get('salary')
        
        # Apply filters manually
        if keyword:
            queryset = queryset.filter(
                Q(title__icontains=keyword) |
                Q(description__icontains=keyword) |
                Q(skills_required__icontains=keyword)
            )
        
        if location:
            queryset = queryset.filter(
                Q(location_city__icontains=location) |
                Q(location_state__icontains=location)
            )
        
        if job_type:
            queryset = queryset.filter(job_type__iexact=job_type)
            
        if salary:
            if salary == '2000000+':
                queryset = queryset.filter(salary_min__gte=2000000)
            elif '-' in salary:
                try:
                    min_val, max_val = salary.split('-')
                    queryset = queryset.filter(
                        salary_min__gte=int(min_val),
                        salary_max__lte=int(max_val)
                    )
                except (ValueError, TypeError):
                    pass
        
        return queryset.order_by('-created_at')

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated(), IsEmployer()]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def perform_create(self, serializer):
        job = serializer.save(employer=self.request.user)
        EmployerActivity.objects.create(
            employer=self.request.user,
            activity_type='job_posted',
            description=f"Posted a new job: '{job.title}'"
        )

class EmployerJobsAPIView(generics.ListAPIView):
    serializer_class = JobSerializer
    permission_classes = [IsAuthenticated, IsEmployer]

    def get_queryset(self):
        return Job.objects.filter(employer=self.request.user).order_by('-created_at')


class JobRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Job.objects.all()
    serializer_class = JobSerializer

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAuthenticated(), IsJobOwner()]
        return [IsAuthenticated()]

    # ✅ Add this method
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request  # needed for current_status
        return context

    def perform_update(self, serializer):
        job = serializer.save()
        EmployerActivity.objects.create(
            employer=self.request.user,
            activity_type='job_edited',
            description=f"Updated job posting: '{job.title}'"
        )

    def perform_destroy(self, instance):
        EmployerActivity.objects.create(
            employer=self.request.user,
            activity_type='job_deleted',
            description=f"Deleted job posting: '{instance.title}'"
        )
        instance.delete()

class JobApplicationListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = JobApplicationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'job_seeker':
            # Include related job, employer, and company_profile for efficiency
            return JobApplication.objects.filter(user=user).select_related(
                'job', 'job__employer', 'job__employer__company_profile'
            )
        elif user.role == 'employer':
            return JobApplication.objects.filter(job__employer=user).select_related(
                'job', 'user', 'job__employer__company_profile'
            )
        return JobApplication.objects.none()

    def perform_create(self, serializer):
        if self.request.user.role != 'job_seeker':
            raise PermissionDenied("Only job seekers can apply for jobs.")

        job = serializer.validated_data.get('job')
        if job.application_deadline and job.application_deadline < timezone.now().date():
            raise ValidationError("The application deadline for this job has passed.")

        # Check if the user has already applied for this job
        if JobApplication.objects.filter(user=self.request.user, job=job).exists():
            raise ValidationError("You have already applied for this job.")
        
        application = serializer.save(user=self.request.user)

        # Notify the employer about the new application
        employer = application.job.employer
        applicant_name = application.user.full_name
        job_title = application.job.title

        Notification.objects.create(
            user=employer,
            message=f"You have a new application from {applicant_name} for the job '{job_title}'.",
            link=f"/employer/jobs/{application.job.id}/applications"
        )


class JobApplicationRetrieveUpdateAPIView(generics.RetrieveUpdateAPIView):
    queryset = JobApplication.objects.all()
    serializer_class = JobApplicationSerializer
    permission_classes = [IsAuthenticated] # Permissions handled in get_object

    def get_object(self):
        application = super().get_object()
        user = self.request.user

        # Allow job seeker to see their own application
        # Allow employer to see applications for their jobs
        if application.user == user or application.job.employer == user:
            return application
        
        raise PermissionDenied("You do not have permission to view this application.")

class DownloadResumeAPIView(APIView):
    permission_classes = [IsAuthenticated, IsEmployer]

    def get(self, request, application_id):
        application = get_object_or_404(JobApplication, id=application_id)

        # Check if the user is the employer for the job associated with the application
        if application.job.employer != request.user:
            raise PermissionDenied("You do not have permission to download this resume.")

        if not application.resume or not application.resume.path:
            raise Http404("Resume file not found.")

        try:
            return FileResponse(application.resume.open('rb'), as_attachment=True, filename=application.resume.name)
        except FileNotFoundError:
            raise Http404("Resume file not found on disk.")


class JobApplicationsForJobAPIView(generics.ListAPIView):
    serializer_class = JobApplicationSerializer
    permission_classes = [IsAuthenticated, IsEmployer]

    def get_queryset(self):
        job_id = self.kwargs.get('job_id')
        job = get_object_or_404(Job, id=job_id)

        if job.employer != self.request.user:
            raise PermissionDenied("You do not have permission to view applications for this job.")

        # Track activity
        EmployerActivity.objects.create(
            employer=self.request.user,
            activity_type='application_viewed',
            description=f"Viewed applications for job: '{job.title}'"
        )

        return JobApplication.objects.filter(job=job)

# In your views.py, update the JobSearchAPIView
class JobSearchAPIView(generics.ListAPIView):
    serializer_class = JobSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = Job.objects.all()
        
        # Debug logging
        print(f"DEBUG: All query params: {dict(self.request.query_params)}")
        
        keyword = self.request.query_params.get('keyword')
        location = self.request.query_params.get('location')
        job_type = self.request.query_params.get('job_type')
        salary = self.request.query_params.get('salary')
        
        # Debug salary specifically
        print(f"DEBUG: Salary parameter received: '{salary}' (type: {type(salary)})")
        
        # Apply other filters first
        if keyword:
            queryset = queryset.filter(
                Q(title__icontains=keyword) |
                Q(description__icontains=keyword) |
                Q(skills_required__icontains=keyword)
            )
            print(f"DEBUG: After keyword filter: {queryset.count()} jobs")
            
        if location:
            queryset = queryset.filter(Q(location_city__icontains=location) | Q(location_state__icontains=location))
            print(f"DEBUG: After location filter: {queryset.count()} jobs")
            
        if job_type:
            queryset = queryset.filter(job_type__iexact=job_type)
            print(f"DEBUG: After job_type filter: {queryset.count()} jobs")

        # Detailed salary filtering with debugging
        if salary:
            print(f"DEBUG: Processing salary filter: {salary}")
            if salary == '2000000+':
                queryset = queryset.filter(salary_min__gte=2000000)
                print(f"DEBUG: Applied 2000000+ filter, result: {queryset.count()} jobs")
            elif '-' in salary:
                try:
                    min_val, max_val = salary.split('-')
                    min_val = int(min_val)
                    max_val = int(max_val)
                    print(f"DEBUG: Salary range: {min_val} - {max_val}")
                    
                    # Check both salary_min and salary_max fields
                    queryset = queryset.filter(
                        salary_min__gte=min_val,
                        salary_max__lte=max_val
                    )
                    print(f"DEBUG: Applied range filter, result: {queryset.count()} jobs")
                    
                    # Alternative approach - check if job salary overlaps with range
                    # queryset = queryset.filter(
                    #     Q(salary_min__lte=max_val) & Q(salary_max__gte=min_val)
                    # )
                    
                except (ValueError, TypeError) as e:
                    print(f"DEBUG: Error parsing salary range: {e}")
            else:
                print(f"DEBUG: Unrecognized salary format: {salary}")

        print(f"DEBUG: Final queryset count: {queryset.count()}")
        return queryset.order_by('-created_at')

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context



class ConversationListAPIView(generics.ListAPIView):
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        # Find all users that have exchanged messages with the current user
        message_partners = User.objects.filter(
            Q(sent_messages__recipient=user) | Q(received_messages__sender=user)
        ).distinct()
        return message_partners
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

class MessageListAPIView(generics.ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        other_user_id = self.kwargs.get('user_id')
        
        try:
            other_user = User.objects.get(id=other_user_id)
            # Mark messages from other user as read
            Message.objects.filter(sender=other_user, recipient=user, is_read=False).update(is_read=True)
            # Return all messages between these two users
            return Message.objects.filter(
                (Q(sender=user) & Q(recipient=other_user)) | 
                (Q(sender=other_user) & Q(recipient=user))
            ).order_by('timestamp')
        except User.DoesNotExist:
            return Message.objects.none()

class MessageCreateAPIView(generics.CreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        recipient_id = self.request.data.get('recipient')
        try:
            recipient = User.objects.get(id=recipient_id)
            serializer.save(sender=self.request.user, recipient=recipient)
            
            # Create a notification for the recipient
            sender_name = self.request.user.full_name or self.request.user.username
            Notification.objects.create(
                user=recipient,
                message=f"New message from {sender_name}",
                link=f"/messages/{self.request.user.id}"
            )
        except User.DoesNotExist:
            raise serializers.ValidationError("Recipient not found")

class UnreadMessageCountAPIView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        unread_count = Message.objects.filter(recipient=request.user, is_read=False).count()
        return Response({'unread_count': unread_count})

class NotificationListAPIView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

class NotificationMarkReadAPIView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, pk):
        try:
            notification = Notification.objects.get(pk=pk, user=request.user)
            notification.is_read = True
            notification.save()
            return Response({'status': 'marked as read'})
        except Notification.DoesNotExist:
            return Response({'error': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)

class NotificationMarkAllReadAPIView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'status': 'all notifications marked as read'})

class UnreadNotificationCountAPIView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        unread_count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({'unread_count': unread_count})

class EmployerDashboardAPIView(APIView):
    permission_classes = [IsAuthenticated, IsEmployer]
    def get(self, request):
        user = request.user
        jobs = Job.objects.filter(employer=user)
        applications = JobApplication.objects.filter(job__employer=user)
        recent_activities = EmployerActivity.objects.filter(employer=user)[:5]
        return Response({
            'job_count': jobs.count(),
            'application_count': applications.count(),
            'recent_activities': EmployerActivitySerializer(recent_activities, many=True).data,
        })

class JobSeekerDashboardAPIView(APIView):
    permission_classes = [IsAuthenticated, IsJobSeeker]

    def get(self, request):
        user = request.user
        applications = JobApplication.objects.filter(user=user)

        # Compute counts by status
        applied_count = applications.count()  # All applications
        shortlisted_count = applications.filter(status='shortlisted').count()
        rejected_count = applications.filter(status='rejected').count()

        return Response({
            'applied_count': applied_count,
            'shortlisted_count': shortlisted_count,
            'rejected_count': rejected_count,
        })


class AdminDashboardAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]
    def get(self, request):
        user_count = User.objects.count()
        job_count = Job.objects.count()
        application_count = JobApplication.objects.count()
        flagged_content = []  # Placeholder for moderation logic
        return Response({
            'user_count': user_count,
            'job_count': job_count,
            'application_count': application_count,
            'flagged_content': flagged_content,
        })


class RequestPasswordResetAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            user = User.objects.get(email=email)
            token_generator = PasswordResetTokenGenerator()
            uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
            token = token_generator.make_token(user)
            reset_link = f"{settings.CLIENT_URL}/reset-password/{uidb64}/{token}/"

            mail_subject = 'Reset your password'
            
            # Plain text version (backup)
            text_content = f"""
Hello {user.full_name or user.username},

You requested a password reset. Click this link to reset your password:
{reset_link}

If you did not request this, please ignore this email.

Thanks,
The Job Board Team
            """
            
            # HTML version (what user will see)
            html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Password Reset</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f4f4f4;">
    <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
        <h2 style="color: #333; text-align: center; margin-bottom: 20px;">Password Reset Request</h2>
        <p style="font-size: 16px;">Hello {user.full_name or user.username},</p>
        <p style="font-size: 16px;">You requested a password reset. Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{reset_link}" style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 16px;">Reset Password</a>
        </div>
        <p style="font-size: 14px; color: #666;">If the button doesn't work, copy and paste this link in your browser:</p>
        <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 5px; font-size: 12px;">{reset_link}</p>
        <p style="font-size: 16px;">If you did not request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 16px;">Thanks,<br>The Job Board Team</p>
    </div>
</body>
</html>
            """
            
            # Send email with both text and HTML versions
            msg = EmailMultiAlternatives(
                mail_subject, 
                text_content, 
                settings.DEFAULT_FROM_EMAIL, 
                [user.email]
            )
            msg.attach_alternative(html_content, "text/html")
            msg.send()
            
            return Response({'message': 'Password reset link sent.'}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class JobApplicationRetrieveUpdateAPIView(generics.RetrieveUpdateAPIView):
    queryset = JobApplication.objects.all()
    serializer_class = JobApplicationSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        obj = super().get_object()
        user = self.request.user
        if not (obj.user == user or (user.role == 'employer' and obj.job.employer == user)):
            raise PermissionDenied("You do not have permission to view this application.")
        return obj

    def perform_update(self, serializer):
        user = self.request.user
        if user.role != 'employer':
            raise PermissionDenied("Only employers can update job applications.")

        application = self.get_object()
        if application.job.employer != user:
            raise PermissionDenied("You can only update applications for your own jobs.")

        # Prevent status change if already rejected
        if application.status == 'rejected':
            raise ValidationError({'status': 'This application has been rejected and its status cannot be changed.'})

        original_status = application.status
        instance = serializer.save()
        new_status = instance.status

        if original_status != new_status:
            Notification.objects.create(
                user=instance.user,
                message=f"The status of your application for '{instance.job.title}' has been updated to {instance.get_status_display()}.",
                link="/job-seeker/applications"
            )


class PasswordResetConfirmAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, uidb64, token):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            try:
                uid = force_str(urlsafe_base64_decode(uidb64))
                user = User.objects.get(pk=uid)
            except (TypeError, ValueError, OverflowError, User.DoesNotExist):
                user = None

            if user is not None and PasswordResetTokenGenerator().check_token(user, token):
                user.set_password(serializer.validated_data['password'])
                user.save()
                return Response({'message': 'Password has been reset successfully.'}, status=status.HTTP_200_OK)
            else:
                return Response({'error': 'Invalid token.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(generics.UpdateAPIView):
    serializer_class = ChangePasswordSerializer
    model = User
    permission_classes = (IsAuthenticated,)

    def get_object(self, queryset=None):
        return self.request.user

    def update(self, request, *args, **kwargs):
        self.object = self.get_object()
        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            if not self.object.check_password(serializer.data.get("old_password")):
                return Response({"old_password": ["Wrong password."]}, status=status.HTTP_400_BAD_REQUEST)
            self.object.set_password(serializer.data.get("new_password"))
            self.object.save()
            return Response({"status": "success", "message": "Password updated successfully"}, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



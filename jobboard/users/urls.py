from django.urls import path
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    UserRegisterAPIView,
    UserProfileAPIView,
    EmployerOnlyAPIView,
    JobSeekerOnlyAPIView,
    AdminOnlyAPIView,
    JobSeekerProfileRetrieveUpdateAPIView,
    JobListCreateAPIView,
    JobRetrieveUpdateDestroyAPIView,
    EmployerJobsAPIView,
    CompanyProfileRetrieveUpdateAPIView,
    JobApplicationListCreateAPIView,
    JobApplicationRetrieveUpdateAPIView,
    JobApplicationsForJobAPIView,
    DownloadResumeAPIView,
    JobSearchAPIView,
    UserSearchView,
    ConversationListView,  # Updated import
    MessageListView,       # Updated import
    SendMessageView,       # New import
    StartConversationView,
    UnreadMessageCountAPIView,
    NotificationListAPIView,
    NotificationMarkReadAPIView,
    NotificationMarkAllReadAPIView,
    UnreadNotificationCountAPIView,
    EmployerDashboardAPIView,
    JobSeekerDashboardAPIView,
    AdminDashboardAPIView,
    custom_token_view,
    RequestPasswordResetAPIView,
    PasswordResetConfirmAPIView,
    ChangePasswordView
)

urlpatterns = [
    # JWT and User Management API endpoints
    path('login/', custom_token_view, name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', UserRegisterAPIView.as_view(), name='api_register'),
    path('users/search/', UserSearchView.as_view(), name='user-search'),
    path('profile/', UserProfileAPIView.as_view(), name='api_profile'),



    # DRF API endpoints for frontend integration
    
    path('profile/', UserProfileAPIView.as_view(), name='api_profile'),
    path('employer-only/', EmployerOnlyAPIView.as_view(), name='api_employer_only'),
    path('jobseeker-only/', JobSeekerOnlyAPIView.as_view(), name='api_jobseeker_only'),
    path('admin-only/', AdminOnlyAPIView.as_view(), name='api_admin_only'),
    path('jobseeker-profile/', JobSeekerProfileRetrieveUpdateAPIView.as_view(), name='api_jobseeker_profile'),

    # Job and company profile API endpoints
    path('jobs/', JobListCreateAPIView.as_view(), name='api_jobs_list_create'),
    path('jobs/<int:pk>/', JobRetrieveUpdateDestroyAPIView.as_view(), name='api_job_rud'),
    path('employer/jobs/', EmployerJobsAPIView.as_view(), name='api_employer_jobs_list'),
    path('company-profile/', CompanyProfileRetrieveUpdateAPIView.as_view(), name='api_company_profile'),

    # Job application API endpoints
    path('applications/', JobApplicationListCreateAPIView.as_view(), name='api_applications_list_create'),
    path('applications/<int:pk>/', JobApplicationRetrieveUpdateAPIView.as_view(), name='api_applications_rud'),
    path('jobs/<int:job_id>/applications/', JobApplicationsForJobAPIView.as_view(), name='api_job_applications_list'),
    path('applications/<int:application_id>/download-resume/', DownloadResumeAPIView.as_view(), name='api_download_resume'),

    # Job search API endpoint
    path('job-search/', JobSearchAPIView.as_view(), name='api_job_search'),

    # Messaging API endpoints
    path('conversations/', ConversationListView.as_view(), name='api_conversations_list'),
    path('messages/<int:user_id>/', MessageListView.as_view(), name='api_messages_list'),
    path('messages/<int:user_id>/send/', SendMessageView.as_view(), name='api_send_message'),  # New
    path('conversations/start/', StartConversationView.as_view(), name='api_start_conversation'),  # New
    path('messages/unread-count/', UnreadMessageCountAPIView.as_view(), name='api_messages_unread_count'),
    
    # Notification API endpoints
    path('notifications/', NotificationListAPIView.as_view(), name='api_notifications_list'),
    path('notifications/<int:pk>/read/', NotificationMarkReadAPIView.as_view(), name='api_notifications_mark_read'),
    path('notifications/mark-all-read/', NotificationMarkAllReadAPIView.as_view(), name='api_notifications_mark_all_read'),
    path('notifications/unread-count/', UnreadNotificationCountAPIView.as_view(), name='api_notifications_unread_count'),

    # Dashboard and analytics API endpoints
    path('employer-dashboard/', EmployerDashboardAPIView.as_view(), name='api_employer_dashboard'),
    path('jobseeker-dashboard/', JobSeekerDashboardAPIView.as_view(), name='api_jobseeker_dashboard'),
    path('admin-dashboard/', AdminDashboardAPIView.as_view(), name='api_admin_dashboard'),

    # Password reset API endpoints
    path('request-password-reset/', RequestPasswordResetAPIView.as_view(), name='request_password_reset'),
    path('reset-password/<uidb64>/<token>/', PasswordResetConfirmAPIView.as_view(), name='password_reset_confirm'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
]

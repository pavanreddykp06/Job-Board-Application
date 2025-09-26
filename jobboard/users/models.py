from django.db import models
from django.contrib.auth.models import AbstractUser
from datetime import date  
from django.contrib.auth import get_user_model


class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('employer', 'Employer'),
        ('job_seeker', 'Job Seeker'),
    )
    
    GENDER_CHOICES = (
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
    )

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='job_seeker')

    # ✅ Additional fields
    full_name = models.CharField(max_length=100, blank=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True)
    phone = models.CharField(max_length=15, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)
    resume = models.FileField(upload_to='resumes/', blank=True, null=True)

    is_employer = models.BooleanField(default=False)
    is_jobseeker = models.BooleanField(default=False)
    is_admin = models.BooleanField(default=False)

    def __str__(self):
        return self.username
    



User = get_user_model()

class Job(models.Model):
    JOB_TYPE_CHOICES = [
        ('Full-Time', 'Full-Time'),
        ('Part-Time', 'Part-Time'),
        ('Internship', 'Internship'),
        ('Remote', 'Remote'),
    ]

    employer = models.ForeignKey(User, on_delete=models.CASCADE, default=1)  
    title = models.CharField(max_length=200)
    description = models.TextField(help_text="A brief summary of the job.")
    job_description_pdf = models.FileField(upload_to='job_descriptions/', null=True, blank=True)
    skills_required = models.CharField(max_length=300)
    salary_min = models.PositiveIntegerField(null=True, blank=True)
    salary_max = models.PositiveIntegerField(null=True, blank=True)
    location_city = models.CharField(max_length=100)
    location_state = models.CharField(max_length=100)
    job_type = models.CharField(max_length=50, choices=JOB_TYPE_CHOICES)
    application_deadline = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    ]
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    views = models.PositiveIntegerField(default=0)

    def __str__(self):
        return self.title

    def is_expired(self):
        if self.application_deadline:
            return self.application_deadline < date.today()
        return False

    @property
    def current_status(self):
        if self.is_expired():
            return 'inactive'
        return self.status


    

class JobApplication(models.Model):
    STATUS_CHOICES = [
        ('applied', 'Applied'),
        ('under_review', 'Under Review'),
        ('shortlisted', 'Shortlisted'),
        ('rejected', 'Rejected'),
        ('hired', 'Hired'),
    ]

    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='applications')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    resume = models.FileField(upload_to='resumes/', null=True, blank=True)
    cover_letter = models.TextField(blank=True)
    portfolio_link = models.URLField(blank=True)
    education_level = models.CharField(max_length=100, blank=True)
    university = models.CharField(max_length=255, blank=True)
    major = models.CharField(max_length=255, blank=True)
    gpa = models.FloatField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='applied')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} -> {self.job.title}"
    





User = get_user_model()

class CompanyProfile(models.Model):
    employer = models.OneToOneField(User, on_delete=models.CASCADE, related_name='company_profile')
    company_name = models.CharField(max_length=255)
    logo = models.ImageField(upload_to='company_logos/', blank=True, null=True)
    website = models.URLField(blank=True)
    description = models.TextField(blank=True)
    location_city = models.CharField(max_length=100)
    location_state = models.CharField(max_length=100)
    industry = models.CharField(max_length=100, blank=True)
    company_size = models.CharField(max_length=50, blank=True)
    contact_email = models.EmailField()
    contact_phone = models.CharField(max_length=20, blank=True)
    linkedin = models.URLField(blank=True)
    twitter = models.URLField(blank=True)

    def __str__(self):
        return self.company_name



class EmployerActivity(models.Model):
    ACTIVITY_TYPE_CHOICES = [
        ('job_posted', 'Job Posted'),
        ('job_edited', 'Job Edited'),
        ('job_deleted', 'Job Deleted'),
        ('company_updated', 'Company Info Updated'),
        ('application_viewed', 'Viewed Applications'),
    ]

    employer = models.ForeignKey(User, on_delete=models.CASCADE)
    activity_type = models.CharField(max_length=50, choices=ACTIVITY_TYPE_CHOICES)
    description = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.employer.username} - {self.activity_type}"


class JobSeekerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    resume = models.FileField(upload_to='resumes/', null=True, blank=True)
    skills = models.TextField(blank=True)
    experience = models.TextField(blank=True)
    portfolio_url = models.URLField(blank=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"

from django.db import models
from django.conf import settings

class JobSeekerActivity(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    activity_type = models.CharField(max_length=100)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.activity_type} at {self.timestamp}"


class Message(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages')
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.sender.username} -> {self.recipient.username}: {self.content[:30]}"

class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    message = models.CharField(max_length=255)
    link = models.CharField(max_length=255, blank=True, null=True, help_text='URL to navigate to when notification is clicked')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification for {self.user.username}: {self.message[:30]}"







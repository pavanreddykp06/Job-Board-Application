from django.contrib import admin

# Register your models here.
from django.contrib import admin

# Register your models here.
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.http import HttpResponse
from .models import User, Job, JobApplication, CompanyProfile, EmployerActivity, JobSeekerProfile, Message, Notification
from reportlab.pdfgen import canvas
import csv

from .models import (   
    User, Job, JobApplication, CompanyProfile,
    EmployerActivity, JobSeekerProfile, 
    Message, Notification
)

# -------------------------
# CUSTOM ACTIONS (CSV / PDF EXPORT)
# -------------------------
def export_as_csv(modeladmin, request, queryset):
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename=report.csv'
    writer = csv.writer(response)

    # Write header
    field_names = [field.name for field in queryset.model._meta.fields]
    writer.writerow(field_names)

    # Write rows
    for obj in queryset:
        row = [getattr(obj, field) for field in field_names]
        writer.writerow(row)

    return response
export_as_csv.short_description = "Export selected items to CSV"


def export_as_pdf(modeladmin, request, queryset):
    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = 'attachment; filename=report.pdf'
    p = canvas.Canvas(response)
    y = 800
    for obj in queryset:
        p.drawString(100, y, str(obj))
        y -= 20
    p.showPage()
    p.save()
    return response
export_as_pdf.short_description = "Export selected items to PDF"


# -------------------------
# USER ADMIN
# -------------------------
@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'role', 'is_active', 'is_staff', 'is_superuser')
    list_filter = ('role', 'is_staff', 'is_superuser', 'is_active')
    search_fields = ('username', 'email', 'full_name')
    fieldsets = UserAdmin.fieldsets + (
        (None, {'fields': ('role', 'full_name', 'gender', 'phone', 'city', 'state', 'country', 'profile_picture', 'resume')}),
    )


# -------------------------
# JOB ADMIN
# -------------------------
@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ('title', 'employer', 'job_type', 'status', 'created_at', 'current_status')
    list_filter = ('job_type', 'status', 'created_at')
    search_fields = ('title', 'description', 'skills_required')
    actions = [export_as_csv, export_as_pdf]


# -------------------------
# JOB APPLICATION ADMIN
# -------------------------
@admin.register(JobApplication)
class JobApplicationAdmin(admin.ModelAdmin):
    list_display = ('job', 'user', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('job_title', 'user_username')
    actions = [export_as_csv, export_as_pdf]


# -------------------------
# COMPANY PROFILE ADMIN
# -------------------------
@admin.register(CompanyProfile)
class CompanyProfileAdmin(admin.ModelAdmin):
    list_display = ('company_name', 'employer', 'industry', 'company_size', 'location_city', 'location_state')
    search_fields = ('company_name', 'industry')
    actions = [export_as_csv, export_as_pdf]


# -------------------------
# EMPLOYER ACTIVITY ADMIN
# -------------------------
@admin.register(EmployerActivity)
class EmployerActivityAdmin(admin.ModelAdmin):
    list_display = ('employer', 'activity_type', 'description', 'timestamp')
    list_filter = ('activity_type', 'timestamp')
    actions = [export_as_csv, export_as_pdf]


# -------------------------
# JOB SEEKER PROFILE ADMIN
# -------------------------
@admin.register(JobSeekerProfile)
class JobSeekerProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'skills', 'experience')
    search_fields = ('user__username', 'skills')
    actions = [export_as_csv, export_as_pdf]




# -------------------------
# MESSAGE ADMIN
# -------------------------
@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('sender', 'recipient', 'content', 'timestamp', 'is_read')
    search_fields = ('sender_username', 'recipient_username', 'content')
    list_filter = ('is_read', 'timestamp')
    actions = [export_as_csv, export_as_pdf]


# -------------------------
# NOTIFICATION ADMIN
# -------------------------
@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'message', 'is_read', 'created_at')
    list_filter = ('is_read', 'created_at')
    search_fields = ('user__username', 'message')
    actions = [export_as_csv, export_as_pdf]
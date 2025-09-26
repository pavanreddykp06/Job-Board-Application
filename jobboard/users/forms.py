from django import forms
from .models import Job
from .models import CompanyProfile,JobApplication
from .models import Job

class JobForm(forms.ModelForm):
    class Meta:
        model = Job
        fields = [
            'title', 'description', 'skills_required', 'salary',
            'location_city', 'location_state', 'job_type', 'deadline'
        ]
        widgets = {
            'description': forms.Textarea(attrs={'rows': 3}),
            'skills_required': forms.TextInput(attrs={'placeholder': 'e.g. Python, Django'}),
            'salary': forms.TextInput(attrs={'placeholder': 'e.g. ₹40,000/month'}),
            'deadline': forms.DateInput(attrs={'type': 'date'}),
        }

    def __init__(self, *args, **kwargs):
        super(JobForm, self).__init__(*args, **kwargs)
        for field in self.fields.values():
            field.required = True  # optional, just to clarify all fields are required
            field.label_suffix = ''  # removes * from the label
            field.widget.attrs['class'] = 'form-control form-control-sm'





class CompanyProfileForm(forms.ModelForm):
    class Meta:
        model = CompanyProfile
        exclude = ['employer']  # Employer must not be editable

    def __init__(self, *args, **kwargs):
        super(CompanyProfileForm, self).__init__(*args, **kwargs)
        for field_name, field in self.fields.items():
            field.widget.attrs['class'] = 'form-control'

        # Set placeholders
        self.fields['company_name'].widget.attrs['placeholder'] = 'e.g. Acme Corp Pvt. Ltd.'
        self.fields['website'].widget.attrs['placeholder'] = 'https://www.company.com'
        self.fields['description'].widget.attrs['placeholder'] = 'About your company...'
        self.fields['location_city'].widget.attrs['placeholder'] = 'City'
        self.fields['location_state'].widget.attrs['placeholder'] = 'State'
        self.fields['industry'].widget.attrs['placeholder'] = 'e.g. IT, Education'
        self.fields['company_size'].widget.attrs['placeholder'] = 'e.g. 11–50 employees'
        self.fields['contact_email'].widget.attrs['placeholder'] = 'contact@example.com'
        self.fields['contact_phone'].widget.attrs['placeholder'] = '+91 9876543210'
        self.fields['linkedin'].widget.attrs['placeholder'] = 'https://linkedin.com/company/...'
        self.fields['twitter'].widget.attrs['placeholder'] = 'https://twitter.com/...'



from .models import JobSeekerProfile

class JobSeekerProfileForm(forms.ModelForm):
    class Meta:
        model = JobSeekerProfile
        fields = ['resume', 'skills', 'experience', 'portfolio_url']
        widgets = {
            'skills': forms.TextInput(attrs={'placeholder': 'e.g. Python, Django'}),
            'experience': forms.TextInput(attrs={'placeholder': 'e.g. 3 years'}),
            'portfolio_url': forms.URLInput(attrs={'placeholder': 'https://yourportfolio.com'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            field.widget.attrs['class'] = 'form-control'

class JobApplicationForm(forms.ModelForm):
    class Meta:
        model = JobApplication
        fields = ['resume', 'cover_letter']
        widgets = {
            'cover_letter': forms.Textarea(attrs={'rows': 4}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            field.widget.attrs['class'] = 'form-control'

class JobSearchForm(forms.Form):
    keyword = forms.CharField(required=False, label="Keyword")
    location = forms.CharField(required=False, label="Location")
    job_type = forms.ChoiceField(
        choices=[
            ('', 'Any'),
            ('Full-Time', 'Full-Time'),
            ('Part-Time', 'Part-Time'),
            ('Internship', 'Internship'),
            ('Remote', 'Remote')
        ],
        required=False,
        label="Job Type"
    )
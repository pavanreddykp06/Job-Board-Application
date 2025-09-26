import django_filters
from django.db.models import Q
from .models import Job

class JobFilter(django_filters.FilterSet):
    keyword = django_filters.CharFilter(method='filter_by_keyword', label="Keyword")
    location = django_filters.CharFilter(method='filter_by_location', label="Location")
    salary = django_filters.CharFilter(method='filter_by_salary', label="Salary")

    class Meta:
        model = Job
        fields = ['job_type']

    def filter_by_keyword(self, queryset, name, value):
        return queryset.filter(
            Q(title__icontains=value) | Q(description__icontains=value) | Q(skills_required__icontains=value)
        )

    def filter_by_location(self, queryset, name, value):
        return queryset.filter(
            Q(location_city__icontains=value) | Q(location_state__icontains=value)
        )

    def filter_by_salary(self, queryset, name, value):
        try:
            if '-' in value:
                min_salary, max_salary = value.split('-')
                return queryset.filter(salary_min__gte=int(min_salary), salary_max__lte=int(max_salary))
            elif value.endswith('+'):
                min_salary = value[:-1]
                return queryset.filter(salary_min__gte=int(min_salary))
            else:
                return queryset
        except (ValueError, TypeError):
            return queryset

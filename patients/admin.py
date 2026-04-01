from django.contrib import admin

from patients.models import Patient


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ("mrn", "first_name", "last_name", "phone", "created_at")
    search_fields = ("mrn", "first_name", "last_name", "phone", "email")
    list_filter = ("sex",)

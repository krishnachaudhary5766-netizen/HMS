from django.contrib import admin

from appointments.models import Appointment


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ("id", "patient", "doctor", "start_at", "end_at", "status")
    list_filter = ("status", "doctor")
    search_fields = ("patient__mrn", "patient__first_name", "patient__last_name", "doctor__username")

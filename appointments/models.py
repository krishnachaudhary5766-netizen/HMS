from django.db import models

from core.fields import EncryptedTextField


class AppointmentStatus(models.TextChoices):
    SCHEDULED = "SCHEDULED", "Scheduled"
    CHECKED_IN = "CHECKED_IN", "Checked in"
    COMPLETED = "COMPLETED", "Completed"
    CANCELLED = "CANCELLED", "Cancelled"
    NO_SHOW = "NO_SHOW", "No show"


class Appointment(models.Model):
    patient = models.ForeignKey("patients.Patient", on_delete=models.PROTECT, related_name="appointments")
    doctor = models.ForeignKey("accounts.User", on_delete=models.PROTECT, related_name="doctor_appointments")

    start_at = models.DateTimeField()
    end_at = models.DateTimeField()
    status = models.CharField(max_length=20, choices=AppointmentStatus.choices, default=AppointmentStatus.SCHEDULED)

    reason = EncryptedTextField()
    clinical_notes = EncryptedTextField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["doctor", "start_at"]),
            models.Index(fields=["patient", "start_at"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self) -> str:
        return f"Appt {self.id} ({self.start_at:%Y-%m-%d %H:%M})"

from django.db import models

from core.fields import EncryptedTextField


class Sex(models.TextChoices):
    MALE = "M", "Male"
    FEMALE = "F", "Female"
    OTHER = "O", "Other"


class Patient(models.Model):
    mrn = models.CharField(max_length=32, unique=True)  # Medical Record Number
    first_name = models.CharField(max_length=80)
    last_name = models.CharField(max_length=80, blank=True, default="")
    phone = models.CharField(max_length=32, blank=True, default="")
    email = models.EmailField(blank=True, default="")

    date_of_birth = models.DateField(null=True, blank=True)
    sex = models.CharField(max_length=1, choices=Sex.choices, blank=True, default="")

    address = EncryptedTextField()
    emergency_contact = EncryptedTextField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["mrn"]),
            models.Index(fields=["last_name", "first_name"]),
            models.Index(fields=["phone"]),
        ]

    def __str__(self) -> str:
        full = f"{self.first_name} {self.last_name}".strip()
        return f"{self.mrn} - {full}"

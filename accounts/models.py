from django.contrib.auth.models import AbstractUser
from django.db import models


class UserRole(models.TextChoices):
    ADMIN = "ADMIN", "Admin"
    DOCTOR = "DOCTOR", "Doctor"
    RECEPTION = "RECEPTION", "Reception"
    BILLING = "BILLING", "Billing"
    PHARMACY = "PHARMACY", "Pharmacy"


class User(AbstractUser):
    role = models.CharField(max_length=20, choices=UserRole.choices, default=UserRole.RECEPTION)
    phone = models.CharField(max_length=32, blank=True, default="")

    def __str__(self) -> str:
        return self.get_username()

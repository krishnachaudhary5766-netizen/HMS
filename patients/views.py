from rest_framework import viewsets

from core.permissions import role_required
from patients.models import Patient
from patients.serializers import PatientSerializer


class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all().order_by("-created_at")
    serializer_class = PatientSerializer
    permission_classes = [role_required("ADMIN", "DOCTOR", "RECEPTION", "BILLING", "PHARMACY")]
from django.shortcuts import render

# Create your views here.

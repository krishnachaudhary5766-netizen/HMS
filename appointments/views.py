from rest_framework import viewsets

from appointments.models import Appointment
from appointments.serializers import AppointmentSerializer
from core.permissions import role_required


class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.select_related("patient", "doctor").all().order_by("-start_at")
    serializer_class = AppointmentSerializer
    permission_classes = [role_required("ADMIN", "DOCTOR", "RECEPTION")]
from django.shortcuts import render

# Create your views here.

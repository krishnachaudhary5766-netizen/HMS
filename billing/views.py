from rest_framework import viewsets

from billing.models import Invoice, InvoiceLine, Payment
from billing.serializers import InvoiceLineSerializer, InvoiceSerializer, PaymentSerializer
from core.permissions import role_required


class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.select_related("patient", "appointment").all().order_by("-created_at")
    serializer_class = InvoiceSerializer
    permission_classes = [role_required("ADMIN", "BILLING")]


class InvoiceLineViewSet(viewsets.ModelViewSet):
    queryset = InvoiceLine.objects.select_related("invoice").all()
    serializer_class = InvoiceLineSerializer
    permission_classes = [role_required("ADMIN", "BILLING")]


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.select_related("invoice").all().order_by("-received_at")
    serializer_class = PaymentSerializer
    permission_classes = [role_required("ADMIN", "BILLING")]
from django.shortcuts import render

# Create your views here.

from django.db import transaction
from rest_framework import viewsets
from rest_framework.exceptions import ValidationError

from core.permissions import role_required
from pharmacy.models import Dispense, InventoryTxn, Medication, StockLot
from pharmacy.serializers import (
    DispenseSerializer,
    InventoryTxnSerializer,
    MedicationSerializer,
    StockLotSerializer,
)


class MedicationViewSet(viewsets.ModelViewSet):
    queryset = Medication.objects.all().order_by("name")
    serializer_class = MedicationSerializer
    permission_classes = [role_required("ADMIN", "PHARMACY")]


class StockLotViewSet(viewsets.ModelViewSet):
    queryset = StockLot.objects.select_related("medication").all().order_by("expiry_date")
    serializer_class = StockLotSerializer
    permission_classes = [role_required("ADMIN", "PHARMACY")]


class InventoryTxnViewSet(viewsets.ModelViewSet):
    queryset = InventoryTxn.objects.select_related("lot", "performed_by").all().order_by("-created_at")
    serializer_class = InventoryTxnSerializer
    permission_classes = [role_required("ADMIN", "PHARMACY")]

    @transaction.atomic
    def perform_create(self, serializer):
        obj: InventoryTxn = serializer.save(performed_by=self.request.user)
        lot = obj.lot
        lot.quantity_on_hand = lot.quantity_on_hand + obj.quantity_delta
        if lot.quantity_on_hand < 0:
            raise ValidationError({"quantity_delta": "Insufficient stock for this transaction."})
        lot.save(update_fields=["quantity_on_hand"])


class DispenseViewSet(viewsets.ModelViewSet):
    queryset = Dispense.objects.select_related("patient", "appointment", "invoice", "lot", "dispensed_by").all().order_by(
        "-dispensed_at"
    )
    serializer_class = DispenseSerializer
    permission_classes = [role_required("ADMIN", "PHARMACY")]

    @transaction.atomic
    def perform_create(self, serializer):
        obj: Dispense = serializer.save(dispensed_by=self.request.user)
        lot = obj.lot
        lot.quantity_on_hand = lot.quantity_on_hand - obj.quantity
        if lot.quantity_on_hand < 0:
            raise ValidationError({"quantity": "Insufficient stock to dispense."})
        lot.save(update_fields=["quantity_on_hand"])

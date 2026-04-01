from rest_framework import serializers

from pharmacy.models import Dispense, InventoryTxn, Medication, StockLot


class MedicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medication
        fields = ["id", "sku", "name", "strength", "form", "reorder_level", "is_active"]
        read_only_fields = ["id"]


class StockLotSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockLot
        fields = ["id", "medication", "lot_number", "expiry_date", "unit_cost", "quantity_on_hand", "created_at"]
        read_only_fields = ["id", "created_at"]


class InventoryTxnSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryTxn
        fields = ["id", "lot", "txn_type", "quantity_delta", "note", "performed_by", "created_at"]
        read_only_fields = ["id", "performed_by", "created_at"]


class DispenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dispense
        fields = ["id", "patient", "appointment", "invoice", "lot", "quantity", "dispensed_by", "dispensed_at"]
        read_only_fields = ["id", "dispensed_by", "dispensed_at"]

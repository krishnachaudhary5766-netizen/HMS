from django.contrib import admin

from pharmacy.models import Dispense, InventoryTxn, Medication, StockLot


@admin.register(Medication)
class MedicationAdmin(admin.ModelAdmin):
    list_display = ("sku", "name", "strength", "form", "reorder_level", "is_active")
    search_fields = ("sku", "name")
    list_filter = ("is_active",)


@admin.register(StockLot)
class StockLotAdmin(admin.ModelAdmin):
    list_display = ("id", "medication", "lot_number", "expiry_date", "quantity_on_hand", "unit_cost", "created_at")
    search_fields = ("medication__name", "medication__sku", "lot_number")
    list_filter = ("expiry_date",)


@admin.register(InventoryTxn)
class InventoryTxnAdmin(admin.ModelAdmin):
    list_display = ("id", "lot", "txn_type", "quantity_delta", "performed_by", "created_at")
    list_filter = ("txn_type",)


@admin.register(Dispense)
class DispenseAdmin(admin.ModelAdmin):
    list_display = ("id", "patient", "lot", "quantity", "dispensed_by", "dispensed_at")

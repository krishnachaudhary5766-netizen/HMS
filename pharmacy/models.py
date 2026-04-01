from django.db import models


class Medication(models.Model):
    sku = models.CharField(max_length=64, unique=True)
    name = models.CharField(max_length=255)
    strength = models.CharField(max_length=128, blank=True, default="")
    form = models.CharField(max_length=64, blank=True, default="")  # tablet/syrup/etc

    reorder_level = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        indexes = [models.Index(fields=["name"]), models.Index(fields=["sku"])]

    def __str__(self) -> str:
        return self.name


class StockLot(models.Model):
    medication = models.ForeignKey(Medication, on_delete=models.PROTECT, related_name="lots")
    lot_number = models.CharField(max_length=64, blank=True, default="")
    expiry_date = models.DateField(null=True, blank=True)
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    quantity_on_hand = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["medication", "expiry_date"]),
        ]

    def __str__(self) -> str:
        return f"{self.medication} lot {self.lot_number or self.id}"


class InventoryTxnType(models.TextChoices):
    RECEIVE = "RECEIVE", "Receive"
    ADJUST = "ADJUST", "Adjust"
    DISPENSE = "DISPENSE", "Dispense"


class InventoryTxn(models.Model):
    lot = models.ForeignKey(StockLot, on_delete=models.PROTECT, related_name="txns")
    txn_type = models.CharField(max_length=10, choices=InventoryTxnType.choices)
    quantity_delta = models.IntegerField()  # +receive, -dispense, +/-adjust
    note = models.CharField(max_length=255, blank=True, default="")
    performed_by = models.ForeignKey("accounts.User", on_delete=models.PROTECT, related_name="inventory_txns")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["txn_type", "created_at"]),
            models.Index(fields=["performed_by", "created_at"]),
        ]


class Dispense(models.Model):
    patient = models.ForeignKey("patients.Patient", on_delete=models.PROTECT, related_name="dispenses")
    appointment = models.ForeignKey(
        "appointments.Appointment", on_delete=models.SET_NULL, null=True, blank=True, related_name="dispenses"
    )
    invoice = models.ForeignKey("billing.Invoice", on_delete=models.SET_NULL, null=True, blank=True, related_name="dispenses")
    lot = models.ForeignKey(StockLot, on_delete=models.PROTECT, related_name="dispenses")

    quantity = models.IntegerField()
    dispensed_by = models.ForeignKey("accounts.User", on_delete=models.PROTECT, related_name="dispenses")
    dispensed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["patient", "dispensed_at"])]

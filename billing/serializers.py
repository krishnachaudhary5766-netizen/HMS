from rest_framework import serializers

from billing.models import Invoice, InvoiceLine, Payment


class InvoiceLineSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceLine
        fields = ["id", "invoice", "description", "quantity", "unit_price", "line_total"]
        read_only_fields = ["id"]


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ["id", "invoice", "amount", "method", "reference", "received_at"]
        read_only_fields = ["id", "received_at"]


class InvoiceSerializer(serializers.ModelSerializer):
    lines = InvoiceLineSerializer(many=True, read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)

    class Meta:
        model = Invoice
        fields = [
            "id",
            "patient",
            "appointment",
            "status",
            "currency",
            "subtotal",
            "tax",
            "total",
            "balance_due",
            "issued_at",
            "due_at",
            "created_at",
            "updated_at",
            "lines",
            "payments",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "lines", "payments"]

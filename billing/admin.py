from django.contrib import admin

from billing.models import Invoice, InvoiceLine, Payment


class InvoiceLineInline(admin.TabularInline):
    model = InvoiceLine
    extra = 0


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ("id", "patient", "status", "total", "balance_due", "created_at")
    list_filter = ("status",)
    search_fields = ("patient__mrn", "patient__first_name", "patient__last_name")
    inlines = [InvoiceLineInline]


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("id", "invoice", "amount", "method", "received_at")
    list_filter = ("method",)

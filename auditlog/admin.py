from django.contrib import admin

from auditlog.models import AuditEvent


@admin.register(AuditEvent)
class AuditEventAdmin(admin.ModelAdmin):
    list_display = ("id", "action", "actor", "object_type", "object_id", "ip_address", "created_at")
    list_filter = ("action", "object_type")
    search_fields = ("object_id", "actor__username")

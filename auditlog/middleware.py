from __future__ import annotations

from typing import Callable

from django.utils.deprecation import MiddlewareMixin

from auditlog.models import AuditEvent


class AuditLogMiddleware(MiddlewareMixin):
    """
    Minimal request-level auditing.
    App-level events (create/update/view) should also log explicitly in views/serializers.
    """

    def __init__(self, get_response: Callable):
        super().__init__(get_response)
        self.get_response = get_response

    def process_response(self, request, response):
        try:
            user = getattr(request, "user", None)
            actor = user if getattr(user, "is_authenticated", False) else None
            path = getattr(request, "path", "")

            # Avoid logging noisy endpoints; expand as needed.
            if path.startswith("/admin/") or path.startswith("/api/schema") or path.startswith("/api/docs"):
                return response

            AuditEvent.objects.create(
                actor=actor,
                action="HTTP_REQUEST",
                object_type="http",
                object_id="",
                metadata={
                    "method": request.method,
                    "path": path,
                    "status_code": response.status_code,
                },
                ip_address=_get_ip(request),
                user_agent=(request.META.get("HTTP_USER_AGENT", "") or "")[:255],
            )
        except Exception:
            # Never block a request because audit logging failed.
            return response
        return response


def _get_ip(request) -> str | None:
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    if xff:
        return xff.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")

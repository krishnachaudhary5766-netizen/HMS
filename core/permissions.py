from __future__ import annotations

from rest_framework.permissions import BasePermission


class HasRole(BasePermission):
    allowed_roles: set[str] = set()

    def has_permission(self, request, view) -> bool:
        user = getattr(request, "user", None)
        if not user or not getattr(user, "is_authenticated", False):
            return False
        if not self.allowed_roles:
            return True
        return getattr(user, "role", None) in self.allowed_roles or getattr(user, "is_superuser", False)


def role_required(*roles: str):
    class _RolePermission(HasRole):
        allowed_roles = set(roles)

    return _RolePermission

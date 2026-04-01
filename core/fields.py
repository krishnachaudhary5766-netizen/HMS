from __future__ import annotations

from django.conf import settings
from django.db import models

from core.crypto import FernetCipher


class EncryptedTextField(models.TextField):
    """
    Application-layer encryption for sensitive text values.
    - Stored in DB as ciphertext (string)
    - Decrypted on access in Python
    """

    def __init__(self, *args, **kwargs):
        kwargs.setdefault("blank", True)
        kwargs.setdefault("default", "")
        super().__init__(*args, **kwargs)

    @property
    def _cipher(self) -> FernetCipher:
        key_material = getattr(settings, "FIELD_ENCRYPTION_KEY", "")
        if not key_material:
            raise RuntimeError("FIELD_ENCRYPTION_KEY is not configured")
        return FernetCipher.from_key_material(key_material)

    def get_prep_value(self, value):
        value = super().get_prep_value(value)
        if value in (None, ""):
            return value
        return self._cipher.encrypt_str(str(value))

    def from_db_value(self, value, expression, connection):
        if value in (None, ""):
            return value
        return self._cipher.decrypt_str(value)

    def to_python(self, value):
        if value in (None, ""):
            return value
        # If it's already decrypted, return as-is.
        if isinstance(value, str) and not value.startswith("gAAAA"):
            return value
        try:
            return self._cipher.decrypt_str(str(value))
        except Exception:
            return value

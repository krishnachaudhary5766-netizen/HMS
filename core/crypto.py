import base64
import hashlib
from dataclasses import dataclass

from cryptography.fernet import Fernet, InvalidToken


@dataclass(frozen=True)
class FernetCipher:
    fernet: Fernet

    @staticmethod
    def from_key_material(key_material: str) -> "FernetCipher":
        """
        Derive a stable Fernet key from provided key material.
        Keep key_material secret and rotate carefully (rotation support can be added later).
        """
        digest = hashlib.sha256(key_material.encode("utf-8")).digest()
        fernet_key = base64.urlsafe_b64encode(digest)
        return FernetCipher(fernet=Fernet(fernet_key))

    def encrypt_str(self, value: str) -> str:
        token = self.fernet.encrypt(value.encode("utf-8"))
        return token.decode("utf-8")

    def decrypt_str(self, token: str) -> str:
        try:
            value = self.fernet.decrypt(token.encode("utf-8"))
        except InvalidToken as e:
            raise ValueError("Invalid encrypted value") from e
        return value.decode("utf-8")

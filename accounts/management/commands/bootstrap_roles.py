from django.core.management.base import BaseCommand

from accounts.models import UserRole


class Command(BaseCommand):
    help = "Print supported HMS user roles (for onboarding)."

    def handle(self, *args, **options):
        self.stdout.write("Supported roles:")
        for role in UserRole:
            self.stdout.write(f"- {role.value}")

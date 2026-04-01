from django.conf import settings
from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import role_required
from accounts.models import UserRole, User
from accounts.serializers import CreateUserSerializer, MeSerializer, UserSerializer


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = MeSerializer(request.user)
        return Response(serializer.data)


@api_view(["GET"])
@permission_classes([AllowAny])
def roles_view(request):
    return Response([{"value": r.value, "label": r.label} for r in UserRole])


@api_view(["POST"])
@permission_classes([AllowAny])
def register_view(request):
    """
    Dev-only self registration endpoint for demos.
    In production, disable this and create users via admin / secure onboarding.
    """
    if not settings.DEBUG:
        return Response({"detail": "Registration disabled"}, status=403)
    serializer = CreateUserSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    return Response(UserSerializer(user).data, status=201)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by("username")
    serializer_class = UserSerializer
    permission_classes = [role_required("ADMIN")]

    def get_serializer_class(self):
        if self.action == "create":
            return CreateUserSerializer
        return UserSerializer

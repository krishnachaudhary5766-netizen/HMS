from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from accounts.models import User, UserRole


class MeSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "role"]


class RoleSerializer(serializers.Serializer):
    value = serializers.CharField()
    label = serializers.CharField()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "role", "is_active", "is_staff"]
        read_only_fields = ["id", "is_staff"]


class CreateUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "role", "password"]
        read_only_fields = ["id"]

    def validate_role(self, value: str):
        if value not in set(r.value for r in UserRole):
            raise serializers.ValidationError("Invalid role")
        return value

    def validate_password(self, value: str):
        validate_password(value)
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

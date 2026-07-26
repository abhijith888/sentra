from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.models import Group
from django.db import transaction
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import Role, AuditLog

User = get_user_model()


def _get_user_role(user):
    """Returns 'Admin' if the user is a superuser, otherwise defaults to 'User'."""
    if user.is_superuser:
        return 'Admin'
    return 'User'


# --- User Serializer ---
class UserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(required=False, allow_blank=True, default='User')
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 
            'last_name', 'role', 'is_active', 'last_login', 'password'
        ]
        extra_kwargs = {
            'username': {'required': False},
            'email': {'required': True},
        }

    def create(self, validated_data):
        role_name = validated_data.pop('role', 'User')
        password = validated_data.pop('password', None)
        email = validated_data.get('email')

        # Fallback to email if username is missing
        if not validated_data.get('username'):
            validated_data['username'] = email

        user = User(**validated_data)

        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()

        user.save()

        # Attach Group Role
        if role_name:
            group, _ = Group.objects.get_or_create(name=role_name)
            user.groups.set([group])

        return user

    def update(self, instance, validated_data):
        role_name = validated_data.pop('role', None)
        password = validated_data.pop('password', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # Update password only if non-empty string provided
        if password:
            instance.set_password(password)

        instance.save()

        # Update Group Role if passed in request
        if role_name is not None:
            group, _ = Group.objects.get_or_create(name=role_name)
            instance.groups.set([group])

        return instance

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['role'] = _get_user_role(instance)
        return data


# --- Custom Token Serializer (Auto-creates missing users & handles login) ---
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    # Override default DRF/SimpleJWT field constraints so both can be optional in raw payload
    username = serializers.CharField(required=False, allow_blank=True)
    email = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        login_input = attrs.get('username') or attrs.get('email')
        password = attrs.get('password')

        if not login_input or not password:
            raise serializers.ValidationError({"detail": "Both email/username and password are required."})

        # Safe lookup for case-insensitive username or email
        if '@' in login_input:
            users = User.objects.filter(email__iexact=login_input)
        else:
            users = User.objects.filter(username__iexact=login_input)

        authenticated_user = None

        if not users.exists():
            # Account doesn't exist -> Auto-provision a standard user account
            with transaction.atomic():
                email_val = login_input if '@' in login_input else f"{login_input}@example.com"
                base_username = login_input.split('@')[0] if '@' in login_input else login_input

                # Handle potential username collisions
                username = base_username
                counter = 1
                while User.objects.filter(username__iexact=username).exists():
                    username = f"{base_username}{counter}"
                    counter += 1

                user = User.objects.create_user(
                    username=username,
                    email=email_val,
                    password=password,
                    is_active=True
                )

                # Assign standard 'User' group role
                user_group, _ = Group.objects.get_or_create(name='User')
                user.groups.set([user_group])
                
                authenticated_user = user
        else:
            # Account exists -> Verify password across matching accounts
            for candidate in users:
                authenticated = authenticate(username=candidate.username, password=password)
                if authenticated:
                    authenticated_user = authenticated
                    break

            if authenticated_user is None:
                raise serializers.ValidationError({"detail": "Invalid password."})

        if not authenticated_user.is_active:
            raise serializers.ValidationError({"detail": "User account is disabled."})

        self.user = authenticated_user

        # Generate JWT Refresh and Access tokens
        refresh = RefreshToken.for_user(self.user)
        role = _get_user_role(self.user)
        full_name = f"{self.user.first_name} {self.user.last_name}".strip()

        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': self.user.id,
                'username': self.user.username,
                'email': self.user.email,
                'name': full_name or self.user.username,
                'role': role,
                'is_superuser': self.user.is_superuser,
                'is_staff': self.user.is_staff,
            }
        }


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


# --- Role & Audit Serializers ---
class RoleSerializer(serializers.ModelSerializer):
    user_count = serializers.SerializerMethodField()

    class Meta:
        model = Role
        fields = ['id', 'name', 'description', 'permissions', 'user_count']

    def get_user_count(self, obj):
        # Count assigned users across standard Django Group mappings
        return User.objects.filter(groups__name=obj.name).count()


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = ['id', 'action', 'details', 'created_at']
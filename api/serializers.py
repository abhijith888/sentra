from django.contrib.auth.models import Group, User
from rest_framework import serializers
from .models import Role, AuditLog


def _get_user_role(user):
    group = user.groups.first()
    return group.name if group else 'Viewer'


class UserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(required=False, allow_blank=True, default='Viewer')
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'is_active', 'last_login', 'password']
        extra_kwargs = {
            'username': {'required': False},
            'email': {'required': True},
        }

    def create(self, validated_data):
        role_name = validated_data.pop('role', 'Viewer')
        password = validated_data.pop('password', None)
        first_name = validated_data.get('first_name', '')
        last_name = validated_data.get('last_name', '')
        email = validated_data.get('email')

        username = validated_data.get('username') or email
        user = User(username=username, email=email, first_name=first_name, last_name=last_name)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()

        if role_name:
            group, _ = Group.objects.get_or_create(name=role_name)
            user.groups.set([group])

        return user

    def update(self, instance, validated_data):
        role_name = validated_data.pop('role', None)
        password = validated_data.pop('password', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()

        if role_name is not None:
            group, _ = Group.objects.get_or_create(name=role_name)
            instance.groups.set([group])

        return instance

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['role'] = _get_user_role(instance)
        return data


class RoleSerializer(serializers.ModelSerializer):
    user_count = serializers.SerializerMethodField()

    class Meta:
        model = Role
        fields = ['id', 'name', 'description', 'permissions', 'user_count']

    def get_user_count(self, obj):
        return User.objects.filter(groups__name=obj.name).count()


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = ['id', 'action', 'details', 'created_at']

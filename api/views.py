import openpyxl
from django.http import HttpResponse
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group as Role

from rest_framework import generics, permissions, viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import BasePermission, IsAuthenticated, AllowAny, SAFE_METHODS
from rest_framework.response import Response

from .models import AuditLog
from .serializers import (
    UserSerializer, 
    RoleSerializer, 
    AuditLogSerializer,
    CustomTokenObtainPairView
)

User = get_user_model()


# 1. Custom Permissions (Binary: Admin vs User)
class IsAdminUserRole(BasePermission):
    """
    Custom permission to check if the authenticated user is a Superuser (Admin).
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_superuser)


class IsAdminOrReadOnly(BasePermission):
    """
    Allows read-only access (GET, HEAD, OPTIONS) to authenticated users,
    but restricts write actions (POST, PUT, PATCH, DELETE) strictly to Superusers (Admins).
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return True
        return request.user.is_superuser


# Helper function to write audit logs cleanly
def _create_audit_log(request_user, action, target_user_name):
    actor = getattr(request_user, 'username', 'System')
    AuditLog.objects.create(
        action=action,
        details=f"User '{target_user_name}' was target of action '{action}' by '{actor}'"
    )


# 2. Public Registration Endpoint (Allows non-admin users to sign up)
class RegisterView(generics.CreateAPIView):
    """
    Public registration view. Creates a standard user account by default.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        user = serializer.save()
        _create_audit_log(user, "USER_REGISTERED", user.username)


# 3. ViewSets (Router-Based)
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-id')
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]

    def perform_create(self, serializer):
        user = serializer.save()
        _create_audit_log(self.request.user, "USER_CREATED", user.username)

    def perform_update(self, serializer):
        user = serializer.save()
        _create_audit_log(self.request.user, "USER_UPDATED", user.username)

    def perform_destroy(self, instance):
        username = instance.username
        instance.delete()
        _create_audit_log(self.request.user, "USER_DELETED", username)


class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all().order_by('id')
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]


# 4. Generic API Views (Used by api/urls.py)
class UserListCreateView(generics.ListCreateAPIView):
    queryset = User.objects.all().order_by('-id')
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]

    def perform_create(self, serializer):
        user = serializer.save()
        _create_audit_log(self.request.user, "USER_CREATED", user.username)


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all().order_by('id')
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]

    def perform_update(self, serializer):
        user = serializer.save()
        _create_audit_log(self.request.user, "USER_UPDATED", user.username)

    def perform_destroy(self, instance):
        username = instance.username
        instance.delete()
        _create_audit_log(self.request.user, "USER_DELETED", username)


class RoleListCreateView(generics.ListCreateAPIView):
    queryset = Role.objects.all().order_by('id')
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]


class RoleDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Role.objects.all().order_by('id')
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]


class AuditLogListCreateView(generics.ListCreateAPIView):
    queryset = AuditLog.objects.all().order_by('-created_at')
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]


# Re-export token view for clean routing in urls.py
TokenObtainPairView = CustomTokenObtainPairView


# 5. Utility Views
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_users_excel(request):
    """Streams an Excel workbook (.xlsx) of users."""
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Users"

    # Write Table Header
    ws.append(["ID", "Username", "Email", "Is Active", "Date Joined"])

    # Query and Write User Data Rows
    users = User.objects.all().values_list('id', 'username', 'email', 'is_active', 'date_joined')
    for user in users:
        row = list(user)
        # Format datetimes safely for Excel output
        row[4] = row[4].strftime('%Y-%m-%d %H:%M:%S') if row[4] else ""
        ws.append(row)

    # Set up HTTP Response header for binary download
    response = HttpResponse(
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response['Content-Disposition'] = 'attachment; filename="users_export.xlsx"'
    wb.save(response)
    return response
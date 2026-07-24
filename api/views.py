from django.contrib.auth.models import User
from rest_framework import generics
from .models import Role

# Make sure permissions is imported from rest_framework
from rest_framework import generics, permissions

from .serializers import UserSerializer, RoleSerializer, AuditLogSerializer
import openpyxl

from django.http import HttpResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

from django.contrib.auth import get_user_model
from .models import AuditLog

User = get_user_model()

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
        # Convert datetime object to string for Excel compatibility
        row[4] = str(row[4])
        ws.append(row)

    # Set up HTTP Response header for binary download
    response = HttpResponse(
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response['Content-Disposition'] = 'attachment; filename="users_export.xlsx"'
    wb.save(response)
    return response




class UserListCreateView(generics.ListCreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]


class RoleListCreateView(generics.ListCreateAPIView):
    queryset = Role.objects.all().order_by('id')
    serializer_class = RoleSerializer
    permission_classes = [permissions.AllowAny]


class RoleDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Role.objects.all().order_by('id')
    serializer_class = RoleSerializer
    permission_classes = [permissions.AllowAny]


class AuditLogListCreateView(generics.ListCreateAPIView):
    queryset = AuditLog.objects.all().order_by('-created_at')
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.AllowAny]

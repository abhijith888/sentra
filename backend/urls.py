"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from api.views import UserListCreateView, RoleListCreateView, RoleDetailView, AuditLogListCreateView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/users/', UserListCreateView.as_view(), name='user-list-create'),
    path('api/roles/', RoleListCreateView.as_view(), name='role-list-create'),
    path('api/roles/<int:pk>/', RoleDetailView.as_view(), name='role-detail'),
    path('api/audit-logs/', AuditLogListCreateView.as_view(), name='audit-log-list-create'),
]

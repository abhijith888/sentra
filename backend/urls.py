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
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # 1. Django Admin Portal
    path('admin/', admin.site.urls),
    
    # 2. API v1 routes (Handles auth token, users, roles, audit-logs)
    path('api/v1/', include('api.urls')),
    
    # 3. Swagger & OpenAPI Documentation
    path('api/v1/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/v1/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]

# Development/Production static asset handling support
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# 4. React Single Page App (SPA) Catch-all Route 
# (API/Admin അല്ലാത്ത മറ്റെല്ലാ റൂട്ടുകളും React-ന്റെ index.html-ലേക്ക് തിരിച്ചുവിടും)
urlpatterns += [
    re_path(r'^.*$', TemplateView.as_view(template_name='index.html'), name='react-app'),
]
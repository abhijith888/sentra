from django.test import TestCase

# Create your tests here.
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def test_user(db):
    return User.objects.create_user(
        username="testuser",
        email="test@example.com",
        password="Password123!"
    )

@pytest.mark.django_db
def test_user_list_endpoint(api_client):
    """Verify user list endpoint response."""
    response = api_client.get('/api/v1/users/')
    assert response.status_code in [200, 401, 403]

@pytest.mark.django_db
def test_export_users_excel(api_client, test_user):
    """Test downloading the Excel (.xlsx) export."""
    api_client.force_authenticate(user=test_user)
    response = api_client.get('/api/v1/users/export/')
    assert response.status_code == 200
    assert response['Content-Type'] == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
from django.db import migrations


def create_roles(apps, schema_editor):
    Role = apps.get_model('api', 'Role')

    roles = [
        {
            'name': 'Admin',
            'description': 'Full access, delete-protected',
            'permissions': [
                'users.view', 'users.create', 'users.edit', 'users.delete',
                'roles.view', 'roles.manage', 'permissions.view', 'audit.view'
            ]
        },
        {
            'name': 'Manager',
            'description': 'Manage users, view roles',
            'permissions': [
                'users.view', 'users.create', 'users.edit', 'users.delete',
                'roles.view', 'permissions.view'
            ]
        },
        {
            'name': 'Viewer',
            'description': 'Read-only access',
            'permissions': [
                'users.view', 'roles.view', 'permissions.view'
            ]
        }
    ]

    for r in roles:
        Role.objects.update_or_create(name=r['name'], defaults={'description': r['description'], 'permissions': r['permissions']})


def delete_roles(apps, schema_editor):
    Role = apps.get_model('api', 'Role')
    Role.objects.filter(name__in=['Admin', 'Manager', 'Viewer']).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0002_role_permissions'),
    ]

    operations = [
        migrations.RunPython(create_roles, delete_roles),
    ]

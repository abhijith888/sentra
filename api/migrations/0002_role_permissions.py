from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='role',
            name='permissions',
            field=models.JSONField(default=list, blank=True),
        ),
    ]

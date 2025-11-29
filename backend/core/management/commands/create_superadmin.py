from django.core.management.base import BaseCommand
from django.conf import settings
from users.models import User


class Command(BaseCommand):
    help = 'Создание глобального администратора из переменных окружения'
    
    def handle(self, *args, **options):
        username = settings.ADMIN_USERNAME
        email = settings.ADMIN_EMAIL
        password = settings.ADMIN_PASSWORD
        
        # Проверяем, существует ли уже пользователь
        if User.objects.filter(username=username).exists():
            self.stdout.write(
                self.style.WARNING(f'Пользователь {username} уже существует')
            )
            return
        
        # Создаём суперпользователя
        user = User.objects.create_superuser(
            username=username,
            email=email,
            password=password,
            first_name='Глобальный',
            last_name='Администратор',
            role='admin'
        )
        
        self.stdout.write(
            self.style.SUCCESS(f'Суперпользователь {username} успешно создан!')
        )

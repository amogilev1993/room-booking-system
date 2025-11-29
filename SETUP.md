# 🚀 Быстрый старт Slot.Me

## Шаг 1: Настройка базы данных PostgreSQL

```bash
# Войдите в PostgreSQL
psql -U postgres

# Создайте базу данных
CREATE DATABASE room_booking_db;

# Создайте пользователя (опционально)
CREATE USER booking_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE room_booking_db TO booking_user;

# Выйдите
\q
```

## Шаг 2: Запуск Backend

```bash
cd backend

# Создайте виртуальное окружение
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# или venv\Scripts\activate для Windows

# Установите зависимости
pip install -r requirements.txt

# Создайте .env файл
cp .env.example .env

# Отредактируйте .env (укажите параметры БД)
nano .env

# Примените миграции
python manage.py makemigrations
python manage.py migrate

# Создайте суперадмина из .env
python manage.py create_superadmin

# Запустите сервер
python manage.py runserver
```

✅ Backend запущен на http://localhost:8000

Доступ в админку: http://localhost:8000/admin
- Username: admin (из .env)
- Password: admin123 (из .env)

## Шаг 3: Запуск Frontend

Откройте новый терминал:

```bash
cd frontend

# Установите зависимости
npm install

# Запустите dev-сервер
npm run dev
```

✅ Frontend запущен на http://localhost:3000

## Шаг 4: Первый вход

1. Откройте http://localhost:3000
2. Зарегистрируйте нового пользователя
3. Войдите в систему
4. Начните бронировать переговорные!

## Создание тестовых данных

### Через Django Admin (http://localhost:8000/admin):

1. Войдите как admin
2. Создайте несколько комнат:
   - Переговорная А (вместимость: 8, этаж: 2)
   - Переговорная Б (вместимость: 12, этаж: 3)
   - Переговорная В (вместимость: 4, этаж: 1)

### Через Django Shell:

```bash
python manage.py shell
```

```python
from bookings.models import Room
from users.models import User

# Создать комнаты
Room.objects.create(name="Переговорная А", capacity=8, floor=2, description="Комната с проектором")
Room.objects.create(name="Переговорная Б", capacity=12, floor=3, description="Большая комната")
Room.objects.create(name="Переговорная В", capacity=4, floor=1, description="Маленькая комната")

# Назначить пользователя администратором
user = User.objects.get(username="ivanov")
user.role = "admin"
user.save()
```

## Полезные команды

### Backend
```bash
# Создать нового суперюзера вручную
python manage.py createsuperuser

# Собрать статику
python manage.py collectstatic

# Проверить проект на ошибки
python manage.py check

# Запустить тесты
python manage.py test
```

### Frontend
```bash
# Сборка для продакшена
npm run build

# Предпросмотр продакшен-сборки
npm run preview
```

## Troubleshooting

### Ошибка подключения к БД
- Проверьте, что PostgreSQL запущен
- Проверьте параметры в .env файле
- Убедитесь, что база данных создана

### Ошибка CORS
- Проверьте CORS_ALLOWED_ORIGINS в backend/config/settings.py
- Убедитесь, что frontend запущен на порту 3000

### Ошибка миграций
```bash
# Сброс миграций (ОСТОРОЖНО: удалит все данные)
python manage.py migrate --run-syncdb
```

## Готово! 🎉

Ваша система бронирования готова к использованию!

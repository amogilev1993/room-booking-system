# Slot.Me - Система бронирования переговорных комнат

🌐 **Продакшн:** https://slotme.space

Fullstack приложение для управления бронированиями переговорных комнат с поддержкой ролей пользователей (user/admin).

## 🚀 Стек технологий

### Backend
- Python 3.12
- Django 4.2.7
- Django REST Framework
- PostgreSQL
- JWT Authentication (Simple JWT)
- drf-spectacular (Swagger/OpenAPI)

### Frontend
- React 18
- Vite
- React Router v6
- Axios

### Инфраструктура
- Ubuntu 22.04 (VPS)
- Nginx (reverse proxy + static files)
- Gunicorn (WSGI server)
- Let's Encrypt SSL
- Systemd (process management)

## 📋 Функциональность

### Для пользователей:
- ✅ Регистрация и авторизация
- ✅ Просмотр расписания в виде календарной сетки
- ✅ Режимы просмотра: День / Неделя
- ✅ Мини-календарь для быстрой навигации
- ✅ Создание бронирования (клик по ячейке)
- ✅ Tooltip с информацией о бронировании при наведении
- ✅ Просмотр своих бронирований
- ✅ Отмена бронирований
- ✅ Отмена по уникальной ссылке (без входа в систему)

### Для администраторов:
- ✅ Все функции пользователя
- ✅ Управление аудиториями (CRUD)
- ✅ Настройка оборудования для каждой аудитории
- ✅ Просмотр всех бронирований
- ✅ Отмена любых бронирований

## 🛠️ Локальная установка

### Предварительные требования
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+

### Backend

```bash
cd backend

# Создание виртуального окружения
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# или: venv\Scripts\activate  # Windows

# Установка зависимостей
pip install -r requirements.txt

# Создание .env файла
cat > .env << EOF
DEBUG=True
SECRET_KEY=$(openssl rand -hex 32)
DATABASE_NAME=room_booking_db
DATABASE_USER=booking_user
DATABASE_PASSWORD=your_password
DATABASE_HOST=localhost
DATABASE_PORT=5432
CORS_ALLOWED_ORIGINS=http://localhost:5173
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@slotme.com
ADMIN_PASSWORD=Admin123!
EOF

# Применение миграций
python manage.py migrate

# Создание суперпользователя
python manage.py create_superadmin

# Запуск сервера
python manage.py runserver
```

Backend: http://localhost:8000

### Frontend

```bash
cd frontend

# Установка зависимостей
npm install

# Создание .env файла
echo "VITE_API_URL=http://localhost:8000/api" > .env

# Запуск dev-сервера
npm run dev
```

Frontend: http://localhost:5173

## 📚 API Документация

### Swagger UI
- **Локально:** http://localhost:8000/api/docs/
- **Продакшн:** https://slotme.space/api/docs/

### ReDoc
- **Локально:** http://localhost:8000/api/redoc/
- **Продакшн:** https://slotme.space/api/redoc/

### Основные эндпоинты

#### Аутентификация
| Метод | Endpoint | Описание |
|-------|----------|----------|
| POST | `/api/auth/register/` | Регистрация |
| POST | `/api/auth/login/` | Вход |
| POST | `/api/auth/logout/` | Выход |
| GET | `/api/auth/me/` | Текущий пользователь |

#### Расписание и бронирования
| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/schedule/?date=YYYY-MM-DD` | Расписание на дату |
| POST | `/api/bookings/` | Создать бронирование |
| GET | `/api/bookings/my/` | Мои бронирования |
| DELETE | `/api/bookings/{id}/` | Отменить бронирование |
| DELETE | `/api/cancel/{token}/` | Отмена по токену |

#### Комнаты
| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/rooms/` | Список комнат |
| POST | `/api/rooms/` | Создать комнату (admin) |
| PATCH | `/api/rooms/{id}/` | Обновить комнату (admin) |
| DELETE | `/api/rooms/{id}/` | Удалить комнату (admin) |

#### Админ
| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/admin/bookings/` | Все бронирования |
| DELETE | `/api/admin/bookings/{id}/` | Отменить любое бронирование |

### Пример создания бронирования

```json
POST /api/bookings/
Authorization: Bearer {access_token}

{
  "room": 1,
  "booking_date": "2025-12-05",
  "start_time": "14:00",
  "end_time": "16:00",
  "purpose": "Встреча с клиентом"
}
```

### Формат оборудования комнаты

```json
{
  "name": "Г-414",
  "capacity": 10,
  "floor": 4,
  "description": "Переговорная с видом на парк",
  "equipment": ["Проектор", "Маркерная доска", "Видеоконференцсвязь", "Wi-Fi"]
}
```

## 🔒 Безопасность

- Пароли хешируются с использованием PBKDF2-SHA256
- JWT токены для аутентификации
  - Access token: 60 минут
  - Refresh token: 7 дней
- HTTPS (Let's Encrypt SSL)
- CORS настроен для безопасной работы
- Защита от двойного бронирования на уровне БД

## 📝 Валидация бронирований

- Дата не может быть в прошлом
- Максимальный срок бронирования: 30 дней вперёд
- Время работы: 09:00 - 23:00
- Время окончания должно быть позже времени начала
- Автоматическая проверка пересечений с существующими бронированиями

## 👥 Роли пользователей

### User (по умолчанию)
- Просмотр расписания
- Создание бронирований
- Управление своими бронированиями

### Admin
- Все права пользователя
- Управление комнатами (создание, редактирование, удаление)
- Настройка оборудования комнат
- Просмотр всех бронирований
- Отмена любых бронирований

**Создание администратора:**
```bash
python manage.py create_superadmin
```

Или через Django Admin: https://slotme.space/admin

## 🎨 Интерфейс

### Расписание
- Календарная сетка (как в Google Calendar)
- Режимы: **День** (все комнаты) / **Неделя** (одна комната)
- Временные слоты: 09:00 - 23:00
- Мини-календарь для быстрой навигации
- Цветовая индикация комнат (уникальный цвет для каждой)
- Tooltip с информацией при наведении на бронирование

### Бронирование
- Клик по свободной ячейке открывает модальное окно
- Отображение информации об аудитории и оборудовании
- Выбор даты и времени

### Адаптивность
- Полная адаптация для мобильных устройств
- Оптимизация для планшетов и десктопов

## 🚀 Деплой на сервер

### Требования к серверу
- Ubuntu 20.04+ / Debian 11+
- 1 GB RAM минимум
- Домен с настроенным DNS

### Быстрый деплой

```bash
# Клонирование репозитория
git clone https://github.com/amogilev1993/room-booking-system.git
cd room-booking-system

# Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install gunicorn

# Создание .env (настроить параметры)
nano .env

# Миграции и статика
python manage.py migrate
python manage.py collectstatic
python manage.py create_superadmin

# Frontend
cd ../frontend
npm install
npm run build
```

### Systemd сервис для Gunicorn

```ini
# /etc/systemd/system/slotme.service
[Unit]
Description=Slot.Me Gunicorn
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/room-booking-system/backend
ExecStart=/var/www/room-booking-system/backend/venv/bin/gunicorn --workers 3 --bind 127.0.0.1:8000 config.wsgi:application
Restart=always

[Install]
WantedBy=multi-user.target
```

### Nginx конфигурация

```nginx
server {
    listen 80;
    server_name slotme.space www.slotme.space;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name slotme.space www.slotme.space;

    ssl_certificate /etc/letsencrypt/live/slotme.space/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/slotme.space/privkey.pem;

    # Frontend
    location / {
        root /var/www/room-booking-system/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Django Admin
    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
    }

    # Static files
    location /static/ {
        alias /var/www/room-booking-system/backend/staticfiles/;
    }
}
```

### SSL сертификат

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d slotme.space -d www.slotme.space
```

## 📂 Структура проекта

```
room-booking-system/
├── backend/
│   ├── bookings/          # Приложение бронирований
│   ├── config/            # Настройки Django
│   ├── core/              # Общие утилиты и команды
│   ├── users/             # Приложение пользователей
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/           # API клиент
│   │   ├── components/    # React компоненты
│   │   ├── context/       # Context API (Auth)
│   │   └── pages/         # Страницы
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## 🔗 Ссылки

- **Продакшн:** https://slotme.space
- **API Docs:** https://slotme.space/api/docs/
- **Django Admin:** https://slotme.space/admin/
- **GitHub:** https://github.com/amogilev1993/room-booking-system

## 📄 Лицензия

MIT License - свободное использование для образовательных и коммерческих целей.

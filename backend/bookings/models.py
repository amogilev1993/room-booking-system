from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import datetime, timedelta, date, time as dt_time
import uuid
from users.models import User


class Room(models.Model):
    """Модель переговорной комнаты"""
    
    id = models.AutoField(primary_key=True)
    name = models.CharField('Название', max_length=100, unique=True)
    capacity = models.IntegerField('Вместимость', default=1)
    description = models.TextField('Описание', blank=True, null=True)
    floor = models.IntegerField('Этаж', blank=True, null=True)
    equipment = models.JSONField('Оборудование', default=list, blank=True)
    is_active = models.BooleanField('Активна', default=True, db_index=True)
    created_at = models.DateTimeField('Создана', auto_now_add=True)
    created_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='created_rooms',
        verbose_name='Создана пользователем'
    )
    
    class Meta:
        db_table = 'rooms'
        verbose_name = 'Комната'
        verbose_name_plural = 'Комнаты'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Booking(models.Model):
    """Модель бронирования"""
    
    STATUS_CHOICES = [
        ('active', 'Активно'),
        ('cancelled', 'Отменено'),
    ]
    
    id = models.AutoField(primary_key=True)
    room = models.ForeignKey(
        Room, 
        on_delete=models.CASCADE, 
        related_name='bookings',
        verbose_name='Комната'
    )
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='bookings',
        verbose_name='Пользователь'
    )
    booking_date = models.DateField('Дата бронирования', db_index=True)
    start_time = models.TimeField('Время начала')
    end_time = models.TimeField('Время окончания')
    purpose = models.TextField('Цель бронирования', blank=True, null=True)
    cancellation_token = models.UUIDField(
        'Токен отмены', 
        default=uuid.uuid4, 
        unique=True, 
        editable=False,
        db_index=True
    )
    status = models.CharField(
        'Статус', 
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='active',
        db_index=True
    )
    created_at = models.DateTimeField('Создано', auto_now_add=True)
    cancelled_at = models.DateTimeField('Отменено', null=True, blank=True)
    
    class Meta:
        db_table = 'bookings'
        verbose_name = 'Бронирование'
        verbose_name_plural = 'Бронирования'
        ordering = ['-booking_date', '-start_time']
        indexes = [
            models.Index(fields=['room', 'booking_date', 'status']),
            models.Index(fields=['user', 'status']),
            models.Index(fields=['booking_date', 'start_time', 'end_time']),
        ]
    
    def __str__(self):
        return f"{self.room.name} - {self.booking_date} {self.start_time}-{self.end_time}"
    
    def clean(self):
        """Валидация бронирования"""
        errors = {}
        
        # Проверка времени
        if self.start_time >= self.end_time:
            errors['end_time'] = 'Время окончания должно быть позже времени начала'
        
        # Проверка даты (не в прошлом)
        today = date.today()
        if self.booking_date < today:
            errors['booking_date'] = 'Нельзя бронировать на прошедшую дату'
        
        # Если сегодня, проверяем время
        if self.booking_date == today:
            now_time = timezone.now().time()
            if self.start_time < now_time:
                errors['start_time'] = 'Нельзя бронировать на прошедшее время'
        
        # Проверка максимального срока (30 дней вперёд)
        max_date = today + timedelta(days=30)
        if self.booking_date > max_date:
            errors['booking_date'] = 'Можно бронировать не более чем на 30 дней вперёд'
        
        # Проверка максимальной длительности (24 часа)
        duration = datetime.combine(date.min, self.end_time) - datetime.combine(date.min, self.start_time)
        if duration > timedelta(hours=24):
            errors['end_time'] = 'Максимальная длительность бронирования - 24 часа'
        
        # Проверка пересечений с другими бронированиями
        if self.room_id:
            overlapping = Booking.objects.filter(
                room=self.room,
                booking_date=self.booking_date,
                status='active'
            ).exclude(id=self.id)
            
            for booking in overlapping:
                if (self.start_time < booking.end_time and self.end_time > booking.start_time):
                    errors['time'] = f'Это время уже забронировано ({booking.start_time}-{booking.end_time})'
                    break
        
        if errors:
            raise ValidationError(errors)
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
    
    def cancel(self):
        """Отмена бронирования"""
        self.status = 'cancelled'
        self.cancelled_at = timezone.now()
        self.save()
    
    @property
    def can_cancel(self):
        """Можно ли отменить бронирование"""
        if self.status != 'active':
            return False
        
        # Нельзя отменить прошедшие бронирования
        now = timezone.now()
        booking_datetime = datetime.combine(self.booking_date, self.start_time)
        
        if timezone.is_aware(now):
            booking_datetime = timezone.make_aware(booking_datetime)
        
        return booking_datetime > now
    
    @property
    def duration_minutes(self):
        """Длительность бронирования в минутах"""
        duration = datetime.combine(date.min, self.end_time) - datetime.combine(date.min, self.start_time)
        return int(duration.total_seconds() / 60)

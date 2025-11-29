from django.contrib import admin
from .models import Room, Booking


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ['name', 'capacity', 'floor', 'is_active', 'created_at']
    list_filter = ['is_active', 'floor', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['name']
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('name', 'capacity', 'description')
        }),
        ('Дополнительная информация', {
            'fields': ('floor', 'equipment')
        }),
        ('Статус', {
            'fields': ('is_active', 'created_by')
        }),
    )
    
    readonly_fields = ['created_at']


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ['id', 'room', 'user', 'booking_date', 'start_time', 
                    'end_time', 'status', 'created_at']
    list_filter = ['status', 'booking_date', 'created_at', 'room']
    search_fields = ['room__name', 'user__username', 'user__email', 'purpose']
    ordering = ['-booking_date', '-start_time']
    
    fieldsets = (
        ('Информация о бронировании', {
            'fields': ('room', 'user', 'booking_date', 'start_time', 'end_time', 'purpose')
        }),
        ('Статус', {
            'fields': ('status', 'cancellation_token', 'cancelled_at')
        }),
        ('Даты', {
            'fields': ('created_at',)
        }),
    )
    
    readonly_fields = ['cancellation_token', 'created_at', 'cancelled_at']
    
    def get_readonly_fields(self, request, obj=None):
        """Запрет редактирования некоторых полей после создания"""
        if obj:  # Редактирование существующего объекта
            return self.readonly_fields + ['room', 'user', 'booking_date', 
                                          'start_time', 'end_time']
        return self.readonly_fields

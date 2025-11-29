from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'full_name', 'role', 'group_name', 'is_active', 'created_at']
    list_filter = ['role', 'is_active', 'group_name', 'created_at']
    search_fields = ['username', 'email', 'first_name', 'last_name', 'group_name']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('username', 'email', 'password')
        }),
        ('Персональные данные', {
            'fields': ('first_name', 'last_name', 'patronymic', 'group_name', 'phone_number')
        }),
        ('Права доступа', {
            'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')
        }),
        ('Важные даты', {
            'fields': ('last_login', 'created_at', 'updated_at')
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at', 'last_login']
    
    add_fieldsets = (
        ('Создание пользователя', {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2', 
                      'first_name', 'last_name', 'patronymic', 
                      'group_name', 'phone_number', 'role'),
        }),
    )

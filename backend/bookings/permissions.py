from rest_framework import permissions


class IsAdminUser(permissions.BasePermission):
    """Проверка, является ли пользователь администратором"""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_admin


class IsOwnerOrAdmin(permissions.BasePermission):
    """Проверка, является ли пользователь владельцем объекта или администратором"""
    
    def has_object_permission(self, request, view, obj):
        # Администраторы могут всё
        if request.user.is_admin:
            return True
        
        # Владелец может управлять своим бронированием
        if hasattr(obj, 'user'):
            return obj.user == request.user
        
        return False

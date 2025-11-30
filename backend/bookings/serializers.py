from rest_framework import serializers
from .models import Room, Booking
from users.serializers import UserSerializer


class RoomSerializer(serializers.ModelSerializer):
    """Сериализатор для комнаты"""
    
    class Meta:
        model = Room
        fields = ['id', 'name', 'capacity', 'description', 'floor', 
                  'equipment', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']


class BookingSerializer(serializers.ModelSerializer):
    """Сериализатор для бронирования"""
    room_name = serializers.CharField(source='room.name', read_only=True)
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    can_cancel = serializers.ReadOnlyField()
    duration_minutes = serializers.ReadOnlyField()
    
    class Meta:
        model = Booking
        fields = ['id', 'room', 'room_name', 'user', 'user_name', 'user_username',
                  'booking_date', 'start_time', 'end_time', 'purpose', 
                  'cancellation_token', 'status', 'can_cancel', 'duration_minutes',
                  'created_at', 'cancelled_at']
        read_only_fields = ['id', 'user', 'cancellation_token', 'status', 
                            'created_at', 'cancelled_at']
    
    def validate(self, data):
        """Валидация данных бронирования"""
        # Получаем текущего пользователя из контекста
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            data['user'] = request.user
        
        # Создаём временный объект для валидации
        booking = Booking(**data)
        
        # Если это обновление, сохраняем ID
        if self.instance:
            booking.id = self.instance.id
        
        # Вызываем метод clean для валидации
        booking.clean()
        
        return data


class BookingCreateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания бронирования"""
    
    class Meta:
        model = Booking
        fields = ['room', 'booking_date', 'start_time', 'end_time', 'purpose']
    
    def validate(self, data):
        """Валидация данных бронирования"""
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            data['user'] = request.user
        
        booking = Booking(**data)
        booking.clean()
        
        return data
    
    def create(self, validated_data):
        """Создание бронирования"""
        request = self.context.get('request')
        validated_data['user'] = request.user
        return super().create(validated_data)


class ScheduleSlotSerializer(serializers.Serializer):
    """Сериализатор для отображения слота в расписании"""
    id = serializers.IntegerField(required=False, allow_null=True)
    start_time = serializers.TimeField()
    end_time = serializers.TimeField()
    status = serializers.CharField()
    user_name = serializers.CharField(required=False, allow_null=True)
    user_username = serializers.CharField(required=False, allow_null=True)
    is_own = serializers.BooleanField(default=False)
    purpose = serializers.CharField(required=False, allow_null=True)
    can_cancel = serializers.BooleanField(default=False)


class ScheduleRoomSerializer(serializers.Serializer):
    """Сериализатор для комнаты в расписании"""
    id = serializers.IntegerField()
    name = serializers.CharField()
    capacity = serializers.IntegerField()
    description = serializers.CharField(required=False, allow_null=True)
    floor = serializers.IntegerField(required=False, allow_null=True)
    bookings = ScheduleSlotSerializer(many=True)


class ScheduleSerializer(serializers.Serializer):
    """Сериализатор для расписания"""
    date = serializers.DateField()
    rooms = ScheduleRoomSerializer(many=True)

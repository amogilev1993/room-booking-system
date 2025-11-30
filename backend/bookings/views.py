from rest_framework import viewsets, generics, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from datetime import datetime, date
from django.db.models import Q
from .models import Room, Booking
from .serializers import (
    RoomSerializer, 
    BookingSerializer, 
    BookingCreateSerializer,
    ScheduleSerializer
)
from .permissions import IsAdminUser, IsOwnerOrAdmin


class RoomViewSet(viewsets.ModelViewSet):
    """ViewSet для управления комнатами"""
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    
    def get_permissions(self):
        """Права доступа: просмотр - всем авторизованным, изменение - только админам"""
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [IsAdminUser]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """Фильтрация комнат"""
        queryset = Room.objects.all()
        
        # Показывать только активные комнаты для обычных пользователей
        if not self.request.user.is_admin:
            queryset = queryset.filter(is_active=True)
        
        # Фильтры
        is_active = self.request.query_params.get('is_active')
        capacity_min = self.request.query_params.get('capacity_min')
        capacity_max = self.request.query_params.get('capacity_max')
        floor = self.request.query_params.get('floor')
        
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        if capacity_min:
            queryset = queryset.filter(capacity__gte=capacity_min)
        if capacity_max:
            queryset = queryset.filter(capacity__lte=capacity_max)
        if floor:
            queryset = queryset.filter(floor=floor)
        
        return queryset
    
    def perform_create(self, serializer):
        """Сохранение создателя комнаты"""
        serializer.save(created_by=self.request.user)


class ScheduleView(generics.GenericAPIView):
    """Представление для получения расписания"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ScheduleSerializer
    
    def get(self, request):
        """Получить расписание на указанную дату"""
        # Получаем дату из query параметров или используем сегодня
        date_str = request.query_params.get('date')
        
        if date_str:
            try:
                target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response({
                    'error': 'Неверный формат даты. Используйте YYYY-MM-DD'
                }, status=status.HTTP_400_BAD_REQUEST)
        else:
            target_date = date.today()
        
        # Получаем все активные комнаты
        rooms = Room.objects.filter(is_active=True).order_by('name')
        
        # Получаем все бронирования на эту дату
        bookings = Booking.objects.filter(
            booking_date=target_date,
            status='active'
        ).select_related('user', 'room')
        
        # Формируем данные расписания
        schedule_data = []
        
        for room in rooms:
            room_bookings = [
                {
                    'id': booking.id,
                    'start_time': booking.start_time,
                    'end_time': booking.end_time,
                    'status': 'booked',
                    'user_name': booking.user.full_name,
                    'user_username': booking.user.username,
                    'is_own': booking.user == request.user,
                    'purpose': booking.purpose,
                    'can_cancel': booking.can_cancel
                }
                for booking in bookings if booking.room == room
            ]
            
            schedule_data.append({
                'id': room.id,
                'name': room.name,
                'capacity': room.capacity,
                'description': room.description,
                'floor': room.floor,
                'bookings': room_bookings
            })
        
        response_data = {
            'date': target_date,
            'rooms': schedule_data
        }
        
        serializer = self.get_serializer(response_data)
        return Response(serializer.data)


class BookingViewSet(viewsets.ModelViewSet):
    """ViewSet для управления бронированиями"""
    queryset = Booking.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        """Выбор сериализатора в зависимости от действия"""
        if self.action == 'create':
            return BookingCreateSerializer
        return BookingSerializer
    
    def get_queryset(self):
        """Фильтрация бронирований"""
        queryset = Booking.objects.select_related('room', 'user')
        
        # Обычные пользователи видят только свои бронирования
        if not self.request.user.is_admin:
            queryset = queryset.filter(user=self.request.user)
        
        # Фильтры
        room_id = self.request.query_params.get('room_id')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        booking_status = self.request.query_params.get('status')
        user_id = self.request.query_params.get('user_id')
        
        if room_id:
            queryset = queryset.filter(room_id=room_id)
        if date_from:
            queryset = queryset.filter(booking_date__gte=date_from)
        if date_to:
            queryset = queryset.filter(booking_date__lte=date_to)
        if booking_status:
            queryset = queryset.filter(status=booking_status)
        if user_id and self.request.user.is_admin:
            queryset = queryset.filter(user_id=user_id)
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        """Создание бронирования"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        booking = serializer.save()
        
        # Формируем URL для отмены
        cancellation_url = f"/cancel/{booking.cancellation_token}"
        
        return Response({
            'id': booking.id,
            'status': 'success',
            'cancellation_url': cancellation_url,
            'cancellation_token': str(booking.cancellation_token),
            'booking': BookingSerializer(booking).data
        }, status=status.HTTP_201_CREATED)
    
    def destroy(self, request, *args, **kwargs):
        """Отмена бронирования"""
        booking = self.get_object()
        
        # Проверка прав доступа
        if not (booking.user == request.user or request.user.is_admin):
            return Response({
                'error': 'У вас нет прав на отмену этого бронирования'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Проверка возможности отмены
        if not booking.can_cancel:
            return Response({
                'error': 'Это бронирование нельзя отменить'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        booking.cancel()
        
        return Response({
            'status': 'success',
            'message': 'Бронирование успешно отменено'
        })
    
    @action(detail=False, methods=['get'])
    def my(self, request):
        """Получить мои бронирования"""
        queryset = Booking.objects.filter(user=request.user).select_related('room')
        
        # Фильтр по статусу
        status_filter = request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Фильтр только будущих бронирований
        future_only = request.query_params.get('future_only')
        if future_only and future_only.lower() == 'true':
            today = date.today()
            queryset = queryset.filter(
                Q(booking_date__gt=today) |
                Q(booking_date=today, start_time__gte=timezone.now().time())
            )
        
        queryset = queryset.order_by('booking_date', 'start_time')
        
        serializer = BookingSerializer(queryset, many=True)
        return Response({
            'bookings': serializer.data
        })


class CancelBookingView(generics.GenericAPIView):
    """Представление для отмены бронирования по токену"""
    permission_classes = [permissions.AllowAny]  # Доступ по токену
    
    def get(self, request, token):
        """Получить информацию о бронировании"""
        try:
            booking = Booking.objects.select_related('room', 'user').get(
                cancellation_token=token
            )
            serializer = BookingSerializer(booking)
            return Response(serializer.data)
        except Booking.DoesNotExist:
            return Response({
                'error': 'Бронирование не найдено'
            }, status=status.HTTP_404_NOT_FOUND)
    
    def delete(self, request, token):
        """Отменить бронирование по токену"""
        try:
            booking = Booking.objects.get(cancellation_token=token)
            
            if not booking.can_cancel:
                return Response({
                    'error': 'Это бронирование нельзя отменить'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            booking.cancel()
            
            return Response({
                'status': 'success',
                'message': 'Бронирование успешно отменено'
            })
        except Booking.DoesNotExist:
            return Response({
                'error': 'Бронирование не найдено'
            }, status=status.HTTP_404_NOT_FOUND)


# Админские представления
class AdminBookingViewSet(viewsets.ModelViewSet):
    """ViewSet для управления всеми бронированиями (только для админов)"""
    queryset = Booking.objects.all().select_related('room', 'user')
    serializer_class = BookingSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        """Получить все бронирования с фильтрацией"""
        queryset = super().get_queryset()
        
        # Фильтры
        room_id = self.request.query_params.get('room_id')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        booking_status = self.request.query_params.get('status')
        user_id = self.request.query_params.get('user_id')
        
        if room_id:
            queryset = queryset.filter(room_id=room_id)
        if date_from:
            queryset = queryset.filter(booking_date__gte=date_from)
        if date_to:
            queryset = queryset.filter(booking_date__lte=date_to)
        if booking_status:
            queryset = queryset.filter(status=booking_status)
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        return queryset.order_by('-booking_date', '-start_time')

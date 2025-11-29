from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RoomViewSet,
    BookingViewSet,
    AdminBookingViewSet,
    ScheduleView,
    CancelBookingView
)

app_name = 'bookings'

router = DefaultRouter()
router.register(r'rooms', RoomViewSet, basename='room')
router.register(r'bookings', BookingViewSet, basename='booking')
router.register(r'admin/bookings', AdminBookingViewSet, basename='admin-booking')

urlpatterns = [
    path('schedule/', ScheduleView.as_view(), name='schedule'),
    path('cancel/<uuid:token>/', CancelBookingView.as_view(), name='cancel-booking'),
    path('', include(router.urls)),
]

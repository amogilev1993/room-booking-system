import React, { useState, useEffect } from 'react';
import { bookingsAPI } from '../api/api';
import './MyBookings.css';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const response = await bookingsAPI.my({ future_only: true, status: 'active' });
      // API может вернуть bookings напрямую, или results (пагинация), или массив
      const data = response.data.bookings || response.data.results || response.data;
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Ошибка загрузки бронирований:', err);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Отменить бронирование?')) return;
    try {
      await bookingsAPI.delete(id);
      loadBookings();
    } catch (err) {
      alert('Ошибка отмены');
    }
  };

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div className="my-bookings-container">
      <h2>Мои бронирования</h2>
      {bookings.length === 0 ? (
        <div className="no-data">У вас нет активных бронирований</div>
      ) : (
        <div className="bookings-grid">
          {bookings.map(booking => (
            <div key={booking.id} className="booking-card">
              <h3>{booking.room_name}</h3>
              <p><strong>Дата:</strong> {booking.booking_date}</p>
              <p><strong>Время:</strong> {booking.start_time} - {booking.end_time}</p>
              {booking.purpose && <p><strong>Цель:</strong> {booking.purpose}</p>}
              {booking.can_cancel && (
                <button onClick={() => handleCancel(booking.id)} className="btn-danger">
                  Отменить
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBookings;

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { bookingsAPI } from '../api/api';
import './Auth.css';

const CancelBooking = () => {
  const { token } = useParams();
  const [booking, setBooking] = useState(null);
  const [cancelled, setCancelled] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadBooking();
  }, [token]);

  const loadBooking = async () => {
    try {
      const response = await bookingsAPI.getByToken(token);
      setBooking(response.data);
    } catch (err) {
      setError('Бронирование не найдено');
    }
  };

  const handleCancel = async () => {
    try {
      await bookingsAPI.cancelByToken(token);
      setCancelled(true);
    } catch (err) {
      setError('Ошибка отмены');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Отмена бронирования</h2>
        {error && <div className="error-message">{error}</div>}
        {cancelled && <div className="success-message">✅ Бронирование отменено!</div>}
        {booking && !cancelled && (
          <>
            <div className="booking-info">
              <p><strong>Комната:</strong> {booking.room_name}</p>
              <p><strong>Дата:</strong> {booking.booking_date}</p>
              <p><strong>Время:</strong> {booking.start_time} - {booking.end_time}</p>
              <p><strong>Пользователь:</strong> {booking.user_name}</p>
            </div>
            {booking.can_cancel ? (
              <button onClick={handleCancel} className="btn-danger btn-block">
                Отменить бронирование
              </button>
            ) : (
              <div className="error-message">Это бронирование нельзя отменить</div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CancelBooking;

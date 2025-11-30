import React, { useState, useEffect } from 'react';
import { adminBookingsAPI } from '../api/api';
import './Admin.css';

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const response = await adminBookingsAPI.list({ status: 'active' });
      // API может вернуть массив или объект с results (пагинация)
      const data = response.data.results || response.data;
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Ошибка загрузки бронирований:', err);
      setBookings([]);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Отменить это бронирование?')) return;
    await adminBookingsAPI.delete(id);
    loadBookings();
  };

  return (
    <div className="admin-container">
      <h2>Все бронирования</h2>
      <table className="bookings-table">
        <thead>
          <tr>
            <th>Комната</th>
            <th>Пользователь</th>
            <th>Дата</th>
            <th>Время</th>
            <th>Цель</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map(booking => (
            <tr key={booking.id}>
              <td>{booking.room_name}</td>
              <td>{booking.user_name}</td>
              <td>{booking.booking_date}</td>
              <td>{booking.start_time} - {booking.end_time}</td>
              <td>{booking.purpose || '-'}</td>
              <td>
                <button onClick={() => handleCancel(booking.id)} className="btn-danger btn-sm">Отменить</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminBookings;

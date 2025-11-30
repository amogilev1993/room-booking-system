import React, { useState, useMemo } from 'react';
import { bookingsAPI } from '../api/api';
import './BookingModal.css';

const BookingModal = ({ room, date, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    booking_date: date,
    start_time: '09:00',
    end_time: '10:00',
    purpose: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);

  // Вычисляем минимальную (сегодня) и максимальную (30 дней вперёд) даты
  const { minDate, maxDate } = useMemo(() => {
    const today = new Date();
    const max = new Date();
    max.setDate(max.getDate() + 30);
    
    const formatDate = (d) => d.toISOString().split('T')[0];
    return {
      minDate: formatDate(today),
      maxDate: formatDate(max)
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await bookingsAPI.create({
        room: room.id,
        booking_date: formData.booking_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        purpose: formData.purpose
      });
      setSuccessData(response.data);
    } catch (err) {
      setError(err.response?.data?.time || err.response?.data?.booking_date || err.response?.data?.detail || 'Ошибка создания бронирования');
    } finally {
      setLoading(false);
    }
  };

  if (successData) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <h3>✅ Бронирование создано!</h3>
          <div className="success-info">
            <p><strong>Комната:</strong> {room.name}</p>
            <p><strong>Дата:</strong> {formData.booking_date}</p>
            <p><strong>Время:</strong> {formData.start_time} - {formData.end_time}</p>
            <p><strong>Ссылка для отмены:</strong></p>
            <input
              type="text"
              value={`${window.location.origin}${successData.cancellation_url}`}
              readOnly
              onClick={e => e.target.select()}
              className="cancel-link-input"
            />
          </div>
          <button onClick={() => { onSuccess(); onClose(); }} className="btn-primary">Закрыть</button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3>Бронирование: {room.name}</h3>
        
        {/* Информация об аудитории */}
        <div className="room-info-block">
          <div className="room-details">
            <span className="room-capacity">👥 {room.capacity} чел.</span>
            {room.floor && <span className="room-floor">📍 Этаж {room.floor}</span>}
          </div>
          {room.equipment && room.equipment.length > 0 && (
            <div className="room-equipment">
              <span className="equipment-label">Оборудование:</span>
              <div className="equipment-list">
                {room.equipment.map((item, idx) => (
                  <span key={idx} className="equipment-tag">
                    {typeof item === 'string' ? item : item.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          {room.description && (
            <p className="room-description">{room.description}</p>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          <div className="form-group">
            <label>Дата бронирования</label>
            <input
              type="date"
              value={formData.booking_date}
              onChange={e => setFormData({...formData, booking_date: e.target.value})}
              min={minDate}
              max={maxDate}
              required
            />
          </div>
          <div className="form-group">
            <label>Время начала</label>
            <input
              type="time"
              value={formData.start_time}
              onChange={e => setFormData({...formData, start_time: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Время окончания</label>
            <input
              type="time"
              value={formData.end_time}
              onChange={e => setFormData({...formData, end_time: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Цель (необязательно)</label>
            <textarea
              value={formData.purpose}
              onChange={e => setFormData({...formData, purpose: e.target.value})}
              rows="3"
            />
          </div>
          <div className="modal-buttons">
            <button type="button" onClick={onClose} className="btn-secondary">Отмена</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Создание...' : 'Забронировать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;

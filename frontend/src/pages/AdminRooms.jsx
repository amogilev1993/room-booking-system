import React, { useState, useEffect } from 'react';
import { roomsAPI } from '../api/api';
import './Admin.css';

const AdminRooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    capacity: '',
    description: '',
    floor: '',
    equipment: ''
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      const response = await roomsAPI.list();
      const data = response.data.results || response.data;
      setRooms(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Ошибка загрузки комнат:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingRoom(null);
    setFormData({
      name: '',
      capacity: '',
      description: '',
      floor: '',
      equipment: ''
    });
    setError('');
    setShowModal(true);
  };

  const openEditModal = (room) => {
    setEditingRoom(room);
    setFormData({
      name: room.name,
      capacity: room.capacity.toString(),
      description: room.description || '',
      floor: room.floor?.toString() || '',
      equipment: Array.isArray(room.equipment) ? room.equipment.join(', ') : ''
    });
    setError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingRoom(null);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      // Преобразуем equipment из строки в массив
      const equipmentArray = formData.equipment
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);

      const payload = {
        name: formData.name,
        capacity: parseInt(formData.capacity),
        description: formData.description || null,
        floor: formData.floor ? parseInt(formData.floor) : null,
        equipment: equipmentArray
      };

      if (editingRoom) {
        await roomsAPI.update(editingRoom.id, payload);
      } else {
        await roomsAPI.create(payload);
      }

      closeModal();
      loadRooms();
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.name?.[0] || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (room) => {
    if (!window.confirm(`Удалить комнату "${room.name}"? Это также удалит все связанные бронирования.`)) {
      return;
    }

    try {
      await roomsAPI.delete(room.id);
      loadRooms();
    } catch (err) {
      alert(err.response?.data?.detail || 'Ошибка удаления');
    }
  };

  if (loading) {
    return <div className="admin-container"><div className="loading">Загрузка...</div></div>;
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>Управление аудиториями</h2>
        <button onClick={openCreateModal} className="btn-primary">
          + Добавить аудиторию
        </button>
      </div>

      {rooms.length === 0 ? (
        <div className="no-data">Аудитории не найдены. Добавьте первую!</div>
      ) : (
        <div className="rooms-grid">
          {rooms.map(room => (
            <div key={room.id} className="room-card">
              <div className="room-card-header">
                <h3>{room.name}</h3>
                <div className="room-card-actions">
                  <button onClick={() => openEditModal(room)} className="btn-icon" title="Редактировать">
                    ✏️
                  </button>
                  <button onClick={() => handleDelete(room)} className="btn-icon btn-icon-danger" title="Удалить">
                    🗑️
                  </button>
                </div>
              </div>
              
              <div className="room-card-body">
                <div className="room-card-info">
                  <span className="info-item">👥 {room.capacity} чел.</span>
                  {room.floor && <span className="info-item">📍 {room.floor} этаж</span>}
                </div>
                
                {room.description && (
                  <p className="room-card-description">{room.description}</p>
                )}
                
                {Array.isArray(room.equipment) && room.equipment.length > 0 && (
                  <div className="room-card-equipment">
                    {room.equipment.map((item, idx) => (
                      <span key={idx} className="equipment-tag">{item}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Модальное окно */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>{editingRoom ? 'Редактировать аудиторию' : 'Новая аудитория'}</h3>
            
            <form onSubmit={handleSubmit}>
              {error && <div className="error-message">{error}</div>}
              
              <div className="form-group">
                <label>Название *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="Например: Г-414"
                  required
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Вместимость *</label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={e => setFormData({...formData, capacity: e.target.value})}
                    placeholder="10"
                    min="1"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Этаж</label>
                  <input
                    type="number"
                    value={formData.floor}
                    onChange={e => setFormData({...formData, floor: e.target.value})}
                    placeholder="4"
                    min="1"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Описание</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Краткое описание аудитории..."
                  rows="2"
                />
              </div>
              
              <div className="form-group">
                <label>Оборудование</label>
                <input
                  type="text"
                  value={formData.equipment}
                  onChange={e => setFormData({...formData, equipment: e.target.value})}
                  placeholder="Проектор, Маркерная доска, Wi-Fi"
                />
                <span className="form-hint">Введите оборудование через запятую</span>
              </div>
              
              <div className="modal-buttons">
                <button type="button" onClick={closeModal} className="btn-secondary">
                  Отмена
                </button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? 'Сохранение...' : (editingRoom ? 'Сохранить' : 'Создать')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRooms;

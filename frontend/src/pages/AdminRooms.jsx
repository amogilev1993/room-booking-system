import React, { useState, useEffect } from 'react';
import { roomsAPI } from '../api/api';
import './Admin.css';

const AdminRooms = () => {
  const [rooms, setRooms] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', capacity: '', description: '', floor: '' });

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    const response = await roomsAPI.list();
    setRooms(response.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await roomsAPI.create(formData);
    setShowForm(false);
    setFormData({ name: '', capacity: '', description: '', floor: '' });
    loadRooms();
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>Управление комнатами</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'Отмена' : '+ Добавить комнату'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="admin-form">
          <input placeholder="Название" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
          <input type="number" placeholder="Вместимость" value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} required />
          <input type="number" placeholder="Этаж" value={formData.floor} onChange={e => setFormData({...formData, floor: e.target.value})} />
          <textarea placeholder="Описание" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          <button type="submit" className="btn-success">Создать</button>
        </form>
      )}

      <div className="rooms-list">
        {rooms.map(room => (
          <div key={room.id} className="room-item">
            <h3>{room.name}</h3>
            <p>Вместимость: {room.capacity} | Этаж: {room.floor || 'N/A'}</p>
            <p className="description">{room.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminRooms;

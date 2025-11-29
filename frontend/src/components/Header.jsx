import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Header.css';

const Header = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          <h1>Slot.Me</h1>
        </Link>
        <nav className="nav">
          <Link to="/" className="nav-link">Расписание</Link>
          <Link to="/my-bookings" className="nav-link">Мои бронирования</Link>
          {isAdmin && (
            <>
              <Link to="/admin/rooms" className="nav-link">Комнаты</Link>
              <Link to="/admin/bookings" className="nav-link">Все брони</Link>
            </>
          )}
        </nav>
        <div className="user-section">
          <span className="user-name">{user?.full_name || user?.username}</span>
          {user?.role === 'admin' && <span className="admin-badge">Админ</span>}
          <button onClick={handleLogout} className="btn-logout">Выход</button>
        </div>
      </div>
    </header>
  );
};

export default Header;

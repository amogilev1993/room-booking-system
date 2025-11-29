import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    patronymic: '',
    group_name: '',
    phone_number: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.password_confirm) {
      setError('Пароли не совпадают');
      return;
    }

    const result = await registerUser(formData);
    if (result.success) {
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } else {
      setError(JSON.stringify(result.error));
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Регистрация</h2>
        {success && <div className="success-message">Регистрация успешна! Перенаправление...</div>}
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          <div className="form-group">
            <label>Имя пользователя *</label>
            <input name="username" onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Email *</label>
            <input type="email" name="email" onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Пароль *</label>
            <input type="password" name="password" onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Подтверждение пароля *</label>
            <input type="password" name="password_confirm" onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Имя *</label>
            <input name="first_name" onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Фамилия *</label>
            <input name="last_name" onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Отчество</label>
            <input name="patronymic" onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Группа</label>
            <input name="group_name" onChange={handleChange} placeholder="Например: КтСо3-5" />
          </div>
          <div className="form-group">
            <label>Телефон</label>
            <input name="phone_number" onChange={handleChange} placeholder="+7..." />
          </div>
          <button type="submit" className="btn-primary btn-block">Зарегистрироваться</button>
        </form>
        <p className="auth-link">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

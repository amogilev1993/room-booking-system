#!/bin/bash
cd /home/claude/room-booking-system/frontend

# Header Component уже создан выше, создадим остальное

# Login Page  
cat > src/pages/Login.jsx << 'EOFLOGIN'
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAuthenticated) navigate('/');
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(username, password);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Вход в Slot.Me</h2>
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary btn-block">Войти</button>
        </form>
        <p className="auth-link">
          Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
EOFLOGIN

# Register Page
cat > src/pages/Register.jsx << 'EOFREG'
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
            <label>Username *</label>
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
EOFREG

# Auth.css
cat > src/pages/Auth.css << 'EOFCSS'
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.auth-box {
  background: white;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 450px;
}

.auth-box h2 {
  margin-bottom: 24px;
  text-align: center;
  color: #333;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  color: #555;
  font-weight: 500;
}

.btn-block {
  width: 100%;
  margin-top: 8px;
}

.auth-link {
  text-align: center;
  margin-top: 16px;
  color: #666;
}

.auth-link a {
  color: #007bff;
  text-decoration: none;
}

.auth-link a:hover {
  text-decoration: underline;
}
EOFCSS

echo "Frontend files created successfully!"

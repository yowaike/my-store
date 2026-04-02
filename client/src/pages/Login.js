import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
  e.preventDefault();
  
  console.log('🔐 Попытка входа:', { email, password }); // ← ДОБАВЬТЕ ЭТО
  
  setError('');
  setLoading(true);

  try {
    const response = await api.login({ email, password });
    console.log('✅ Ответ сервера:', response.data); // ← ДОБАВЬТЕ ЭТО
    
    const { accessToken, refreshToken } = response.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    
    navigate('/products');
  } catch (err) {
    console.error('❌ Ошибка:', err); // ← ДОБАВЬТЕ ЭТО
    setError(err.response?.data?.error || 'Ошибка входа');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="auth-container">
      <h2>Вход в систему</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label>Пароль:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Вход...' : 'Войти'}
        </button>
      </form>
      <p>
        Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
      </p>
    </div>
  );
}

export default Login;
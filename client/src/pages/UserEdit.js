import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';

function UserEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    role: 'user'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadUser();
    loadCurrentUser();
  }, [id]);

  const loadCurrentUser = async () => {
    try {
      const response = await api.me();
      setCurrentUser(response.data);
    } catch (err) {
      console.error('Ошибка:', err);
    }
  };

  const loadUser = async () => {
    try {
      const response = await api.getUser(id);
      const user = response.data;
      setFormData({
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role
      });
    } catch (err) {
      setError('Ошибка загрузки пользователя');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.updateUser(id, formData);
      navigate('/users');
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка сохранения');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/login');
  };

  const isEditingSelf = currentUser?.id === id;

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="container">
      <div className="header">
        <h2>Редактирование пользователя</h2>
        <div>
          <button onClick={() => navigate('/users')} className="nav-btn">Назад</button>
          <button onClick={handleLogout} className="logout-btn">Выйти</button>
        </div>
      </div>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit} className="product-form">
        <div className="form-group">
          <label>Имя:</label>
          <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Фамилия:</label>
          <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Роль:</label>
          <select name="role" value={formData.role} onChange={handleChange} disabled={isEditingSelf}>
            <option value="user">Пользователь</option>
            <option value="seller">Продавец</option>
            <option value="admin">Администратор</option>
          </select>
        </div>
        <button type="submit" disabled={loading}>{loading ? 'Сохранение...' : 'Сохранить'}</button>
      </form>
    </div>
  );
}

export default UserEdit;
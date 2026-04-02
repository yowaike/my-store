import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadUsers();
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const response = await api.me();
      setCurrentUser(response.data);
    } catch (err) {
      console.error('Ошибка загрузки пользователя:', err);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await api.getUsers();
      setUsers(response.data);
    } catch (err) {
      setError('Ошибка загрузки пользователей');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Заблокировать пользователя?')) return;

    try {
      await api.deleteUser(id);
      setUsers(users.filter(u => u.id !== id));
    } catch (err) {
      alert('Ошибка: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/login');
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="container">
      <div className="header">
        <h2>Управление пользователями</h2>
        <div>
          <span>{currentUser?.first_name} {currentUser?.last_name} ({currentUser?.role})</span>
          <button onClick={() => navigate('/products')} className="nav-btn">
            Товары
          </button>
          <button onClick={handleLogout} className="logout-btn">
            Выйти
          </button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="users-list">
        <table className="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Email</th>
              <th>Имя</th>
              <th>Фамилия</th>
              <th>Роль</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.email}</td>
                <td>{user.first_name}</td>
                <td>{user.last_name}</td>
                <td>
                  <span className={`role-badge role-${user.role}`}>
                    {user.role === 'admin' ? 'Администратор' : 
                     user.role === 'seller' ? 'Продавец' : 'Пользователь'}
                  </span>
                </td>
                <td className="actions">
                  <button 
                    onClick={() => navigate(`/users/${user.id}/edit`)}
                    disabled={user.role === 'admin' && user.id === currentUser?.id}
                  >
                    Редактировать
                  </button>
                  <button 
                    onClick={() => handleDelete(user.id)}
                    className="delete-btn"
                    disabled={user.role === 'admin' && user.id === currentUser?.id}
                  >
                    Заблокировать
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Users;
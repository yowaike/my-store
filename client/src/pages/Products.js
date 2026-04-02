import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadProducts();
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

  const loadProducts = async () => {
    try {
      const response = await api.getProducts();
      setProducts(response.data);
    } catch (err) {
      setError('Ошибка загрузки товаров');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить товар?')) return;

    try {
      await api.deleteProduct(id);
      setProducts(products.filter(p => p.id !== id));
    } catch (err) {
      alert('Ошибка удаления: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/login');
  };

  if (loading) return <div>Загрузка...</div>;

  const canManageProducts = currentUser?.role === 'seller' || currentUser?.role === 'admin';
  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="container">
      <div className="header">
        <h2>Товары</h2>
        <div>
          <span>
            {currentUser?.first_name} {currentUser?.last_name} ({currentUser?.role})
          </span>
          <button onClick={handleLogout} className="logout-btn">
            Выйти
          </button>
          {isAdmin && (
            <button onClick={() => navigate('/users')} className="nav-btn">
              Пользователи
            </button>
          )}
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {canManageProducts && (
        <button onClick={() => navigate('/products/new')} className="add-btn">
          Добавить товар
        </button>
      )}

      <div className="products-list">
        {products.map(product => (
          <div key={product.id} className="product-card">
            <h3>{product.name}</h3>
            <p>Категория: {product.category}</p>
            <p>Цена: {product.price} ₽</p>
            <p>{product.description}</p>
            <p>На складе: {product.stock}</p>
            <div className="product-actions">
              <button onClick={() => navigate(`/products/${product.id}`)}>
                Подробнее
              </button>
              {canManageProducts && (
                <button onClick={() => navigate(`/products/${product.id}/edit`)}>
                  Редактировать
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={() => handleDelete(product.id)}
                  className="delete-btn"
                >
                  Удалить
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Products;
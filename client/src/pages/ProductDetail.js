import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadProduct();
    loadCurrentUser();
  }, [id]);

  const loadCurrentUser = async () => {
    try {
      const response = await api.me();
      setCurrentUser(response.data);
    } catch (err) {
      console.error('Ошибка загрузки пользователя:', err);
    }
  };

  const loadProduct = async () => {
    try {
      const response = await api.getProduct(id);
      setProduct(response.data);
    } catch (err) {
      setError('Ошибка загрузки товара');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Удалить товар?')) return;

    try {
      await api.deleteProduct(id);
      navigate('/products');
    } catch (err) {
      alert('Ошибка удаления: ' + (err.response?.data?.error || err.message));
    }
  };

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!product) return <div>Товар не найден</div>;

  const canManageProducts = currentUser?.role === 'seller' || currentUser?.role === 'admin';
  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="container">
      <div className="header">
        <h2>Товар: {product.name}</h2>
        <div>
          <span>{currentUser?.first_name} {currentUser?.last_name} ({currentUser?.role})</span>
          <button onClick={() => navigate('/products')} className="nav-btn">
            Назад к списку
          </button>
        </div>
      </div>

      <div className="product-detail">
        <div className="product-card">
          <h3>{product.name}</h3>
          <p><strong>Категория:</strong> {product.category}</p>
          <p><strong>Цена:</strong> {product.price} ₽</p>
          <p><strong>Описание:</strong> {product.description}</p>
          <p><strong>На складе:</strong> {product.stock}</p>
          
          <div className="product-actions">
            {canManageProducts && (
              <button onClick={() => navigate(`/products/${id}/edit`)}>
                Редактировать
              </button>
            )}
            {isAdmin && (
              <button onClick={handleDelete} className="delete-btn">
                Удалить
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
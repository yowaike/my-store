import React, { useEffect, useState } from "react";
import "./ProductModal.scss";

export default function ProductModal({ open, product, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    description: '',
    stock: ''
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        price: product.price || '',
        category: product.category || '',
        description: product.description || '',
        stock: product.stock || ''
      });
    }
  }, [product]);

  if (!open || !product) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="product-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <div className="modal-header">
          <h2>{product.name}</h2>
          <span className="modal-category">{product.category}</span>
        </div>

        <div className="modal-body">
          <div className="modal-image">
            <img src="https://via.placeholder.com/300x200" alt={product.name} />
          </div>

          <div className="modal-info">
            <div className="info-row">
              <label>Название:</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                readOnly
              />
            </div>

            <div className="info-row">
              <label>Категория:</label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                readOnly
              />
            </div>

            <div className="info-row">
              <label>Описание:</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                readOnly
                rows="3"
              />
            </div>

            <div className="info-row">
              <label>Цена:</label>
              <div className="price-display">{formData.price} ₽</div>
            </div>

            <div className="info-row">
              <label>На складе:</label>
              <div className="stock-display">
                {formData.stock} шт.
                {formData.stock > 0 ? (
                  <span className="in-stock">✓ В наличии</span>
                ) : (
                  <span className="out-of-stock">✗ Нет в наличии</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn--secondary" onClick={onClose}>
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
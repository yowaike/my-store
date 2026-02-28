import React from "react";
import "./ProductCard.scss";

export default function ProductCard({ product, onClick }) {
  return (
    <div className="product-card" onClick={() => onClick(product)}>
      <div className="product-card__image">
        <img src="https://via.placeholder.com/200" alt={product.name} />
      </div>
      <h3 className="product-card__title">{product.name}</h3>
      <p className="product-card__category">{product.category}</p>
      <p className="product-card__description">{product.description}</p>
      <div className="product-card__price">{product.price} ₽</div>
      <div className="product-card__stock">На складе: {product.stock}</div>
    </div>
  );
}
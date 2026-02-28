import React, { useEffect, useState } from "react";
import { api } from "../../api";
import ProductCard from "../../components/ProductCard";
import ProductModal from "../../components/ProductModal";
import "./ProductsPage.scss";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    description: '',
    stock: ''
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await api.getProducts();
      setProducts(data);
    } catch (err) {
      console.error(err);
      alert("Ошибка загрузки товаров");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      price: '',
      category: '',
      description: '',
      stock: ''
    });
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price,
      category: product.category,
      description: product.description,
      stock: product.stock
    });
    setModalOpen(true);
  };

  const openView = (product) => {
    setSelectedProduct(product);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
  };

  const closeViewModal = () => {
    setSelectedProduct(null);
  };

  const handleDelete = async (id) => {
    const ok = window.confirm("Удалить товар?");
    if (!ok) return;
    
    try {
      await api.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
      alert("Ошибка удаления товара");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const productData = {
        name: formData.name,
        price: Number(formData.price),
        category: formData.category,
        description: formData.description,
        stock: Number(formData.stock)
      };

      if (editingProduct) {
        await api.updateProduct(editingProduct.id, productData);
        setProducts((prev) =>
          prev.map((p) => (p.id === editingProduct.id ? { ...p, ...productData } : p))
        );
      } else {
        const newProduct = await api.createProduct(productData);
        setProducts((prev) => [...prev, newProduct]);
      }
      
      closeModal();
    } catch (err) {
      console.error(err);
      alert("Ошибка сохранения товара");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="products-page">
      <header className="header">
        <h1>Интернет-магазин</h1>
        <button className="btn btn--primary" onClick={openCreate}>
          + Создать товар
        </button>
      </header>
      <main className="main">
        {loading ? (
          <div className="loading">Загрузка товаров...</div>
        ) : (
          <div className="products-grid">
            {products.map((product) => (
              <div key={product.id} className="product-wrapper">
                <ProductCard product={product} onClick={openView} />
                <div className="product-actions">
                  <button className="btn" onClick={() => openEdit(product)}>
                    Редактировать
                  </button>
                  <button className="btn btn--danger" onClick={() => handleDelete(product.id)}>
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* модальное окно просмотра товара */}
      {selectedProduct && (
        <ProductModal
          open={!!selectedProduct}
          product={selectedProduct}
          onClose={closeViewModal}
        />
      )}

      {/* модальное окно создания/редактирования */}
      {modalOpen && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingProduct ? 'Редактировать товар' : 'Создать товар'}</h2>
            <form onSubmit={handleSubmit}>
              <label>
                Название:
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </label>
              <label>
                Цена:
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                />
              </label>
              <label>
                Категория:
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                />
              </label>
              <label>
                Описание:
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                />
              </label>
              <label>
                На складе:
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  required
                />
              </label>
              <div className="modal-actions">
                <button type="button" className="btn" onClick={closeModal}>
                  Отмена
                </button>
                <button type="submit" className="btn btn--primary">
                  {editingProduct ? 'Сохранить' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function AddProduct() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    imageUrl: ''
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        price: parseFloat(form.price),
        category: form.category,
        stock: parseInt(form.stock, 10),
        images: form.imageUrl ? [form.imageUrl] : []
      };
      const res = await fetch(`${import.meta.env.REACT_APP_API_URL}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to add product');
      }
      navigate('/products');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-gray-900 bg-opacity-80 rounded-2xl shadow-neon">
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500 mb-6">
        Add New Product
      </h1>

      {error && (
        <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="text-gray-300">Title</span>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md bg-gray-800 p-2 text-gray-100 focus:outline-none"
            placeholder="Product title"
          />
        </label>

        <label className="block">
          <span className="text-gray-300">Description</span>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            className="mt-1 block w-full rounded-md bg-gray-800 p-2 text-gray-100 focus:outline-none"
            placeholder="Brief description"
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-gray-300">Price ($)</span>
            <input
              type="number"
              step="0.01"
              name="price"
              value={form.price}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md bg-gray-800 p-2 text-gray-100 focus:outline-none"
              placeholder="e.g. 19.99"
            />
          </label>
          <label className="block">
            <span className="text-gray-300">Stock</span>
            <input
              type="number"
              name="stock"
              value={form.stock}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md bg-gray-800 p-2 text-gray-100 focus:outline-none"
              placeholder="e.g. 10"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-gray-300">Category</span>
          <input
            type="text"
            name="category"
            value={form.category}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md bg-gray-800 p-2 text-gray-100 focus:outline-none"
            placeholder="e.g. Electronics"
          />
        </label>

        <label className="block">
          <span className="text-gray-300">Image URL</span>
          <input
            type="url"
            name="imageUrl"
            value={form.imageUrl}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md bg-gray-800 p-2 text-gray-100 focus:outline-none"
            placeholder="https://example.com/image.jpg"
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2 rounded-full font-semibold bg-pink-500 hover:bg-pink-600 transition drop-shadow-neon text-white disabled:opacity-50"
        >
          {submitting ? 'Adding…' : 'Add Product'}
        </button>
      </form>
    </div>
  );
}
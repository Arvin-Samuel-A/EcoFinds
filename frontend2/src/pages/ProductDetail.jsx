// src/pages/ProductDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');

  // Fetch product detail
  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`${import.meta.env.REACT_APP_API_URL}/api/products/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error('Failed to load product');
        const data = await res.json();
        setProduct(data);
      } catch (err) {
        setError(err.message);
      }
    }
    fetchProduct();
  }, [id, token]);

  const handleAddToCart = async () => {
    try {
      const res = await fetch(`${import.meta.env.REACT_APP_API_URL}/api/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: id, quantity }),
      });
      if (!res.ok) throw new Error('Failed to add to cart');
      navigate('/cart');
    } catch (err) {
      setError(err.message);
    }
  };

  if (error) {
    return <p className="text-center text-red-400 mt-6">{error}</p>;
  }

  if (!product) {
    return <p className="text-center text-gray-400 mt-6">Loading product…</p>;
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 grid grid-cols-1 md:grid-cols-2 gap-6">
      <img
        src={product.images[0] || '/placeholder.png'}
        alt={product.title}
        className="w-full h-80 object-cover rounded-2xl shadow-neon"
      />

      <div>
        <h1 className="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500">
          {product.title}
        </h1>
        <p className="text-gray-300 mb-4">{product.description}</p>
        <p className="text-2xl font-semibold text-pink-400 mb-4">${product.price.toFixed(2)}</p>

        <div className="flex items-center mb-6">
          <label className="text-gray-300 mr-4">Quantity:</label>
          <input
            type="number"
            value={quantity}
            min="1"
            onChange={(e) => setQuantity(parseInt(e.target.value, 10))}
            className="w-20 rounded-md bg-gray-800 p-2 text-gray-100 focus:outline-none"
          />
        </div>

        <button
          onClick={handleAddToCart}
          className="w-full py-3 rounded-full bg-pink-500 hover:bg-pink-600 transition drop-shadow-neon text-white font-semibold"
        >
          Add to Cart
        </button>
      </div>
    </div>
);
}

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Cart() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch cart on mount
  useEffect(() => {
    async function fetchCart() {
      try {
        const res = await fetch(`${import.meta.env.REACT_APP_API_URL}/api/cart`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error('Failed to load cart');
        const data = await res.json();
        setCart(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchCart();
  }, [token]);

  const handleRemove = async (productId) => {
    try {
      const res = await fetch(`${import.meta.env.REACT_APP_API_URL}/api/cart/${productId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to remove item');
      const updated = await res.json();
      setCart(updated);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCheckout = async () => {
    try {
      const res = await fetch(`${import.meta.env.REACT_APP_API_URL}/api/orders`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Checkout failed');
      navigate('/history');
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <p className="text-center text-gray-400 mt-6">Loading cart…</p>;
  }
  if (error) {
    return <p className="text-center text-red-400 mt-6">{error}</p>;
  }
  if (!cart.items.length) {
    return <p className="text-center text-gray-400 mt-6">Your cart is empty.</p>;
  }

  const total = cart.items.reduce(
    (sum, item) => sum + item.quantity * item.product.price,
    0
  );

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500">
        Your Cart
      </h1>

      <div className="space-y-4">
        {cart.items.map(({ product, quantity }) => (
          <div
            key={product._id}
            className="flex items-center bg-gray-800 rounded-2xl p-4 shadow-neon"
          >
            <img
              src={product.images[0] || '/placeholder.png'}
              alt={product.title}
              className="w-20 h-20 object-cover rounded-md mr-4"
            />
            <div className="flex-grow">
              <h2 className="text-lg font-semibold text-white">
                {product.title}
              </h2>
              <p className="text-gray-400">
                ${product.price.toFixed(2)} × {quantity} = $
                {(product.price * quantity).toFixed(2)}
              </p>
            </div>
            <button
              onClick={() => handleRemove(product._id)}
              className="px-3 py-1 bg-red-600 rounded-full text-white hover:bg-red-500 transition"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-6">
        <span className="text-2xl font-bold text-pink-400">
          Total: ${total.toFixed(2)}
        </span>
        <button
          onClick={handleCheckout}
          className="px-6 py-2 bg-green-500 hover:bg-green-600 rounded-full font-semibold drop-shadow-neon text-white transition"
        >
          Checkout
        </button>
      </div>
    </div>
  );
}

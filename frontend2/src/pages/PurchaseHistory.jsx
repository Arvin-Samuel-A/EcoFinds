import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function PurchaseHistory() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch(`${import.meta.env.REACT_APP_API_URL}/api/orders`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error('Failed to load orders');
        const data = await res.json();
        setOrders(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, [token]);

  if (loading) {
    return (
      <p className="text-center text-gray-400 mt-6">
        Loading purchase history…
      </p>
    );
  }

  if (error) {
    return (
      <p className="text-center text-red-400 mt-6">
        {error}
      </p>
    );
  }

  if (orders.length === 0) {
    return (
      <p className="text-center text-gray-400 mt-6">
        You have no past purchases.
      </p>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500">
        Purchase History
      </h1>
      <div className="space-y-4">
        {orders.map(order => (
          <div
            key={order._id}
            className="bg-gray-800 rounded-2xl p-4 shadow-neon"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-lg font-semibold text-white">
                Order #{order._id.slice(-6).toUpperCase()}
              </span>
              <span className="text-gray-400 text-sm">
                {new Date(order.createdAt).toLocaleDateString()}
              </span>
            </div>
            <ul className="space-y-1 mb-2">
              {order.items.map(item => (
                <li key={item.product} className="flex justify-between">
                  <span className="text-gray-200">{item.quantity} × {item.product.title || 'Item'}</span>
                  <span className="text-gray-200">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between items-center">
              <span className="font-bold text-pink-400">
                Total: ${order.total.toFixed(2)}
              </span>
              <button
                onClick={() => navigate(`/orders/${order._id}`)}
                className="text-sm text-purple-300 hover:text-pink-400 transition"
              >
                Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

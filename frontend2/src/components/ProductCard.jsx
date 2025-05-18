import React from 'react';
import { Link } from 'react-router-dom';

export default function ProductCard({ product }) {
  return (
    <div className="bg-gray-800 rounded-2xl overflow-hidden shadow-neon hover:shadow-lg transition">
      <img src={product.images[0] || '/placeholder.png'} alt={product.title} className="w-full h-48 object-cover" />
      <div className="p-4">
        <h3 className="text-xl font-semibold text-white mb-2">{product.title}</h3>
        <p className="text-gray-400 mb-4 truncate">{product.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-pink-400">${product.price.toFixed(2)}</span>
          <Link to={`/products/${product._id}`} className="text-sm font-medium text-purple-300 hover:text-pink-400">
            View
          </Link>
        </div>
      </div>
    </div>
  );
}
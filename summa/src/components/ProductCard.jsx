// Product Card Component
import React, { useState, useEffect } from 'react';
import {  MessageCircle, Plus, Minus, Trash2, Clock, } from 'lucide-react';
const ProductCard = ({ product, onQuantityChange, onRemove, onChat, isPurchased = false }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [quantity, setQuantity] = useState(product.quantity || 1);

  const handleQuantityChange = async (newQuantity) => {
    if (newQuantity < 1) return;
    setQuantity(newQuantity);
    if (onQuantityChange) {
      await onQuantityChange(product.id, newQuantity);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
      <div className="relative overflow-hidden">
        <div className={`w-full h-48 bg-gray-200 flex items-center justify-center ${imageLoaded ? 'hidden' : ''}`}>
          <div className="animate-pulse bg-gray-300 w-full h-full"></div>
        </div>
        <img
          src={product.image}
          alt={product.name}
          className={`w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300 ${imageLoaded ? '' : 'hidden'}`}
          onLoad={() => setImageLoaded(true)}
          loading="lazy"
        />
        <div className="absolute top-4 right-4">
          <button
            onClick={() => onChat(product)}
            className="bg-white bg-opacity-90 p-2 rounded-full shadow-lg hover:bg-opacity-100 transition-all duration-200 hover:scale-110"
          >
            <MessageCircle className="w-5 h-5 text-blue-500" />
          </button>
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{product.name}</h3>
        <p className="text-sm text-gray-600 mb-3">{product.sellerName}</p>
        
        {isPurchased && (
          <div className="flex items-center text-sm text-gray-500 mb-3">
            <Clock className="w-4 h-4 mr-2" />
            Purchased on {new Date(product.purchaseDate).toLocaleDateString()}
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-green-600">${product.price}</span>
          
          {!isPurchased && (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1">
                <button
                  onClick={() => handleQuantityChange(quantity - 1)}
                  className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-semibold">{quantity}</span>
                <button
                  onClick={() => handleQuantityChange(quantity + 1)}
                  className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              <button
                onClick={() => onRemove(product.id)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default ProductCard;
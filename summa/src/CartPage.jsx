import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShoppingCart, MessageCircle, Plus, Minus, Trash2, Clock, X, Send, User } from 'lucide-react';
import ProductCard from './components/ProductCard';
import ChatInterface from './components/ChatInterface';

// Helper to get auth token (adjust as needed for your auth flow)
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const CartPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [previousPurchases, setPreviousPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('cart');
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [purchasesLoading, setPurchasesLoading] = useState(false);

  // Fetch cart items on component mount
  useEffect(() => {
    fetchCartItems();
  }, []);

  const fetchCartItems = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/cart', { headers: getAuthHeaders() });
      // The backend returns { items: [...] } or the full cart object
      const items = res.data.items || (res.data && res.data.items) || [];
      // Map backend cart items to expected frontend format
      setCartItems(
        items.map(item => ({
          id: item.product._id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          image: item.product.images && item.product.images[0] ? item.product.images[0].url : '',
          sellerId: item.product.seller ? item.product.seller._id : '',
          sellerName: item.product.seller ? item.product.seller.name : '',
          countInStock: item.product.countInStock,
        }))
      );
    } catch (error) {
      console.error('Error fetching cart items:', error);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPreviousPurchases = async () => {
    try {
      setPurchasesLoading(true);
      const res = await axios.get('/api/orders/myorders', { headers: getAuthHeaders() });
      // Each order has orderItems array
      const purchases = [];
      (res.data.orders || []).forEach(order => {
        (order.orderItems || []).forEach(item => {
          purchases.push({
            id: item.product._id,
            name: item.product.name,
            price: item.product.price,
            purchaseDate: order.createdAt,
            image: item.product.images && item.product.images[0] ? item.product.images[0].url : '',
            sellerId: item.product.seller ? item.product.seller._id : '',
            sellerName: item.product.seller ? item.product.seller.name : '',
          });
        });
      });
      setPreviousPurchases(purchases);
    } catch (error) {
      console.error('Error fetching previous purchases:', error);
      setPreviousPurchases([]);
    } finally {
      setPurchasesLoading(false);
    }
  };

  const handleQuantityChange = async (productId, newQuantity) => {
    try {
      await axios.put(
        '/api/cart',
        { productId, quantity: newQuantity },
        { headers: getAuthHeaders() }
      );
      setCartItems(prev =>
        prev.map(item =>
          item.id === productId ? { ...item, quantity: newQuantity } : item
        )
      );
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const handleRemoveItem = async (productId) => {
    try {
      await axios.delete(`/api/cart/${productId}`, { headers: getAuthHeaders() });
      setCartItems(prev => prev.filter(item => item.id !== productId));
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const handleChatOpen = (product) => {
    setSelectedProduct(product);
    setChatOpen(true);
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-xl">
                <ShoppingCart className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ShopCart Pro
              </h1>
            </div>
            
            <nav className="flex space-x-4">
              <button
                onClick={() => setActiveTab('cart')}
                className={`px-6 py-2 rounded-full font-medium transition-all duration-200 ${
                  activeTab === 'cart'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'text-gray-600 hover:text-blue-500'
                }`}
              >
                Cart ({cartItems.length})
              </button>
              <button
                onClick={() => {
                  setActiveTab('purchases');
                  if (previousPurchases.length === 0) {
                    fetchPreviousPurchases();
                  }
                }}
                className={`px-6 py-2 rounded-full font-medium transition-all duration-200 ${
                  activeTab === 'purchases'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'text-gray-600 hover:text-blue-500'
                }`}
              >
                Previous Purchases
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cart Section */}
        {activeTab === 'cart' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-gray-900">Shopping Cart</h2>
              {cartItems.length > 0 && (
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-3xl font-bold text-green-600">${calculateTotal().toFixed(2)}</p>
                </div>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <div className="w-full h-48 bg-gray-200 animate-pulse"></div>
                    <div className="p-6 space-y-3">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
                      <div className="h-8 bg-gray-200 rounded animate-pulse w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : cartItems.length === 0 ? (
              <div className="text-center py-16">
                <ShoppingCart className="w-24 h-24 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">Your cart is empty</h3>
                <p className="text-gray-400">Add some products to get started!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cartItems.map((item) => (
                  <ProductCard
                    key={item.id}
                    product={item}
                    onQuantityChange={handleQuantityChange}
                    onRemove={handleRemoveItem}
                    onChat={handleChatOpen}
                  />
                ))}
              </div>
            )}

            {cartItems.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">Order Summary</h3>
                  <span className="text-2xl font-bold text-green-600">${calculateTotal().toFixed(2)}</span>
                </div>
                <button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 transform hover:scale-105">
                  Proceed to Checkout
                </button>
              </div>
            )}
          </div>
        )}

        {/* Previous Purchases Section */}
        {activeTab === 'purchases' && (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-gray-900">Previous Purchases</h2>

            {purchasesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <div className="w-full h-48 bg-gray-200 animate-pulse"></div>
                    <div className="p-6 space-y-3">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
                      <div className="h-8 bg-gray-200 rounded animate-pulse w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : previousPurchases.length === 0 ? (
              <div className="text-center py-16">
                <Clock className="w-24 h-24 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No previous purchases</h3>
                <p className="text-gray-400">Your purchase history will appear here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {previousPurchases.map((item) => (
                  <ProductCard
                    key={item.id}
                    product={item}
                    onChat={handleChatOpen}
                    isPurchased={true}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Chat Interface */}
      <ChatInterface
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        product={selectedProduct}
      />
    </div>
  );
};

export default CartPage;
// Create new file: frontend_final/src/Cart.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Leaf,
  Package,
  CreditCard,
  AlertCircle,
  CheckCircle,
  X,
  Heart,
  Star,
  MapPin
} from 'lucide-react';
import { useAuth } from './AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';

const API_BASE_URL = 'http://localhost:5000/api';

const Cart = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [cart, setCart] = useState({ items: [], totalItems: 0, totalPrice: 0 });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch cart data
  const fetchCart = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/cart`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCart(data);
      } else if (response.status === 401) {
        navigate('/login');
      } else {
        throw new Error('Failed to fetch cart');
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      setError('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  // Update item quantity
  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;

    try {
      setUpdating(prev => ({ ...prev, [productId]: true }));
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/cart`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId,
          quantity: newQuantity
        })
      });

      const data = await response.json();

      if (response.ok) {
        setCart(data.cart);
        setSuccess('Cart updated successfully');
        setTimeout(() => setSuccess(''), 2000);
      } else {
        setError(data.message || 'Failed to update cart');
      }
    } catch (error) {
      console.error('Error updating cart:', error);
      setError('Failed to update cart');
    } finally {
      setUpdating(prev => ({ ...prev, [productId]: false }));
    }
  };

  // Remove item from cart
  const removeItem = async (productId) => {
    try {
      setUpdating(prev => ({ ...prev, [productId]: true }));
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/cart/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setCart(data.cart);
        setSuccess('Item removed from cart');
        setTimeout(() => setSuccess(''), 2000);
      } else {
        setError(data.message || 'Failed to remove item');
      }
    } catch (error) {
      console.error('Error removing item:', error);
      setError('Failed to remove item');
    } finally {
      setUpdating(prev => ({ ...prev, [productId]: false }));
    }
  };

  // Clear entire cart
  const clearCart = async () => {
    if (!window.confirm('Are you sure you want to clear your entire cart?')) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/cart`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setCart(data.cart);
        setSuccess('Cart cleared successfully');
        setTimeout(() => setSuccess(''), 2000);
      } else {
        setError(data.message || 'Failed to clear cart');
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      setError('Failed to clear cart');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const proceedToCheckout = () => {
    if (cart.items.length === 0) {
      setError('Your cart is empty');
      return;
    }
    navigate('/checkout');
  };

  if (!user) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <ShoppingCart size={64} className="text-muted mb-3" />
          <h3>Please log in to view your cart</h3>
          <Link to="/login" className="btn btn-primary">Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100" style={{ backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <nav className="navbar navbar-light bg-white shadow-sm sticky-top">
        <div className="container-fluid px-4">
          <div className="d-flex align-items-center">
            <button 
              onClick={() => navigate(-1)}
              className="btn btn-light rounded-circle me-3 d-flex align-items-center justify-content-center"
              style={{ width: '40px', height: '40px' }}
            >
              <ArrowLeft size={20} />
            </button>
            
            <Link to="/" className="navbar-brand d-flex align-items-center text-decoration-none">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center me-2"
                style={{
                  width: '40px',
                  height: '40px',
                  background: 'linear-gradient(135deg, #9333ea, #f97316)'
                }}
              >
                <Leaf className="text-white" size={20} />
              </div>
              <span className="fs-4 fw-bold" style={{ color: '#9333ea' }}>EcoFinds</span>
            </Link>
          </div>

          <div className="d-flex align-items-center">
            <div className="d-flex align-items-center me-3">
              <ShoppingCart size={24} className="me-2" style={{ color: '#9333ea' }} />
              <span className="h5 mb-0 fw-bold">My Cart</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Success/Error Messages */}
      {success && (
        <div className="container-fluid px-4 py-2">
          <div className="alert alert-success d-flex align-items-center mb-0" role="alert">
            <CheckCircle size={20} className="me-2" />
            {success}
          </div>
        </div>
      )}

      {error && (
        <div className="container-fluid px-4 py-2">
          <div className="alert alert-danger d-flex align-items-center mb-0" role="alert">
            <AlertCircle size={20} className="me-2" />
            {error}
          </div>
        </div>
      )}

      <div className="container-fluid px-4 py-4">
        {loading ? (
          // Loading State
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted mt-3">Loading your cart...</p>
          </div>
        ) : cart.items.length === 0 ? (
          // Empty Cart State
          <div className="text-center py-5">
            <div className="mb-4">
              <ShoppingCart size={80} className="text-muted" />
            </div>
            <h3 className="fw-bold text-dark mb-3">Your cart is empty</h3>
            <p className="text-muted mb-4">
              Looks like you haven't added anything to your cart yet. 
              Start shopping to find amazing deals!
            </p>
            <Link
              to="/marketplace"
              className="btn text-white px-4 py-2"
              style={{ background: 'linear-gradient(135deg, #9333ea, #f97316)' }}
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          // Cart with Items
          <div className="row">
            {/* Cart Items */}
            <div className="col-lg-8 mb-4">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-0 py-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0 fw-semibold">
                      Shopping Cart ({cart.totalItems} item{cart.totalItems !== 1 ? 's' : ''})
                    </h5>
                    {cart.items.length > 0 && (
                      <button
                        onClick={clearCart}
                        className="btn btn-outline-danger btn-sm"
                        disabled={loading}
                      >
                        Clear Cart
                      </button>
                    )}
                  </div>
                </div>
                <div className="card-body p-0">
                  {cart.items.map((item, index) => (
                    <div
                      key={item.product._id}
                      className={`p-4 ${index !== cart.items.length - 1 ? 'border-bottom' : ''}`}
                    >
                      <div className="row align-items-center">
                        {/* Product Image */}
                        <div className="col-md-2 col-3">
                          <Link
                            to={`/product/${item.product._id}`}
                            className="text-decoration-none"
                          >
                            <div
                              className="rounded position-relative overflow-hidden"
                              style={{
                                paddingTop: '100%',
                                background: 'linear-gradient(135deg, #ede9fe, #fed7aa)'
                              }}
                            >
                              {item.product.images && item.product.images.length > 0 ? (
                                <img
                                  src={item.product.images[0].url}
                                  alt={item.product.images[0].altText || item.product.name}
                                  className="position-absolute top-0 start-0 w-100 h-100"
                                  style={{ objectFit: 'cover' }}
                                />
                              ) : (
                                <div className="position-absolute top-50 start-50 translate-middle">
                                  <Package size={24} className="text-muted" />
                                </div>
                              )}
                            </div>
                          </Link>
                        </div>

                        {/* Product Details */}
                        <div className="col-md-4 col-9">
                          <Link
                            to={`/product/${item.product._id}`}
                            className="text-decoration-none text-dark"
                          >
                            <h6 className="fw-semibold mb-1">{item.product.name}</h6>
                          </Link>
                          <div className="small text-muted mb-2">
                            <div className="d-flex align-items-center mb-1">
                              <MapPin size={12} className="me-1" />
                              <span>Sold by {item.product.seller?.name || 'Seller'}</span>
                            </div>
                            <div className="d-flex align-items-center">
                              <Package size={12} className="me-1" />
                              <span>
                                {item.product.countInStock > 0 
                                  ? `${item.product.countInStock} in stock` 
                                  : 'Out of stock'
                                }
                              </span>
                            </div>
                          </div>
                          
                          {/* Stock Warning */}
                          {item.quantity > item.product.countInStock && (
                            <div className="alert alert-warning alert-sm py-1 px-2 mb-2" role="alert">
                              <small>Only {item.product.countInStock} left in stock</small>
                            </div>
                          )}
                        </div>

                        {/* Quantity Controls */}
                        <div className="col-md-3 col-6">
                          <div className="d-flex align-items-center justify-content-center">
                            <button
                              onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                              disabled={item.quantity <= 1 || updating[item.product._id]}
                              className="btn btn-outline-secondary btn-sm rounded-circle d-flex align-items-center justify-content-center"
                              style={{ width: '32px', height: '32px' }}
                            >
                              <Minus size={14} />
                            </button>
                            
                            <span className="mx-3 fw-medium" style={{ minWidth: '30px', textAlign: 'center' }}>
                              {updating[item.product._id] ? (
                                <div className="spinner-border spinner-border-sm" role="status">
                                  <span className="visually-hidden">Loading...</span>
                                </div>
                              ) : (
                                item.quantity
                              )}
                            </span>
                            
                            <button
                              onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                              disabled={item.quantity >= item.product.countInStock || updating[item.product._id]}
                              className="btn btn-outline-secondary btn-sm rounded-circle d-flex align-items-center justify-content-center"
                              style={{ width: '32px', height: '32px' }}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Price and Actions */}
                        <div className="col-md-3 col-6 text-end">
                          <div className="d-flex flex-column align-items-end">
                            <span className="h6 fw-bold mb-2" style={{ color: '#9333ea' }}>
                              {formatPrice(item.product.price * item.quantity)}
                            </span>
                            <div className="small text-muted mb-2">
                              {formatPrice(item.product.price)} each
                            </div>
                            <div className="d-flex gap-2">
                              <button
                                onClick={() => removeItem(item.product._id)}
                                disabled={updating[item.product._id]}
                                className="btn btn-outline-danger btn-sm d-flex align-items-center"
                                title="Remove from cart"
                              >
                                <Trash2 size={14} />
                              </button>
                              <button
                                className="btn btn-outline-secondary btn-sm d-flex align-items-center"
                                title="Save for later"
                              >
                                <Heart size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="col-lg-4">
              <div className="card border-0 shadow-sm position-sticky" style={{ top: '100px' }}>
                <div className="card-header bg-white border-0 py-3">
                  <h5 className="mb-0 fw-semibold">Order Summary</h5>
                </div>
                <div className="card-body">
                  <div className="d-flex justify-content-between mb-3">
                    <span>Subtotal ({cart.totalItems} item{cart.totalItems !== 1 ? 's' : ''})</span>
                    <span className="fw-medium">{formatPrice(cart.totalPrice)}</span>
                  </div>
                  
                  <div className="d-flex justify-content-between mb-3">
                    <span>Shipping</span>
                    <span className="text-success">FREE</span>
                  </div>
                  
                  <div className="d-flex justify-content-between mb-3">
                    <span>Tax</span>
                    <span className="fw-medium">{formatPrice(cart.totalPrice * 0.18)}</span>
                  </div>
                  
                  <hr />
                  
                  <div className="d-flex justify-content-between mb-4">
                    <span className="h6 fw-bold">Total</span>
                    <span className="h6 fw-bold" style={{ color: '#9333ea' }}>
                      {formatPrice(cart.totalPrice + (cart.totalPrice * 0.18))}
                    </span>
                  </div>

                  <button
                    onClick={proceedToCheckout}
                    disabled={cart.items.length === 0}
                    className="btn text-white w-100 py-3 fw-semibold d-flex align-items-center justify-content-center"
                    style={{ background: 'linear-gradient(135deg, #9333ea, #f97316)' }}
                  >
                    <CreditCard size={20} className="me-2" />
                    Proceed to Checkout
                  </button>

                  <Link
                    to="/marketplace"
                    className="btn btn-outline-secondary w-100 mt-3 py-2 text-decoration-none"
                  >
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .alert-sm {
          font-size: 0.875rem;
        }
        
        .btn:hover {
          transform: translateY(-1px);
          transition: all 0.2s ease;
        }
        
        .card:hover {
          box-shadow: 0 8px 25px rgba(0,0,0,0.1) !important;
        }
      `}</style>
    </div>
  );
};

export default Cart;
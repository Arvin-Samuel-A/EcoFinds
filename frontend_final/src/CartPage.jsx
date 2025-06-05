import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  X, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingCart, 
  Heart, 
  Leaf, 
  Menu, 
  User, 
  LogOut,
  Package,
  CreditCard,
  MessageCircle,
  Star,
  MapPin,
  AlertCircle,
  CheckCircle,
  ShoppingBag
} from 'lucide-react';
import { useAuth } from './AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';

const API_BASE_URL = 'http://localhost:5000/api';

const Cart = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // State management
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [updating, setUpdating] = useState({});

  // Fetch cart items
  const fetchCartItems = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/cart`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setCartItems(data.items || []); // Backend returns cart object with items array
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch cart items');
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      setError('Failed to load cart');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCartItems();
  }, [fetchCartItems]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    setUpdating(prev => ({ ...prev, [productId]: true }));
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/cart`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId, quantity: newQuantity })
      });

      if (response.ok) {
        setCartItems(prev => 
          prev.map(item => 
            item.product._id === productId 
              ? { ...item, quantity: newQuantity }
              : item
          )
        );
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update quantity');
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      setError('Failed to update quantity');
    } finally {
      setUpdating(prev => ({ ...prev, [productId]: false }));
    }
  };

  const removeFromCart = async (productId) => {
    setUpdating(prev => ({ ...prev, [productId]: true }));
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/cart/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setCartItems(prev => prev.filter(item => item.product._id !== productId));
        setSuccess('Item removed from cart');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to remove item');
      }
    } catch (error) {
      console.error('Error removing item:', error);
      setError('Failed to remove item');
    } finally {
      setUpdating(prev => ({ ...prev, [productId]: false }));
    }
  };

  const clearCart = async () => {
    if (!window.confirm('Are you sure you want to clear your entire cart?')) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/cart`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setCartItems([]);
        setSuccess('Cart cleared successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to clear cart');
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      setError('Failed to clear cart');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  // Fix the cart item count calculation
  const calculateItemCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const handleStartChat = (sellerId, productId) => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate(`/chat/${sellerId}/${productId}`);
  };

  if (!user) {
    return (
      <div className="min-vh-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: '#f8fafc' }}>
        <div className="text-center">
          <ShoppingCart size={64} className="text-muted mb-3" />
          <h3 className="fw-bold text-dark mb-2">Please Sign In</h3>
          <p className="text-muted mb-4">You need to sign in to view your cart</p>
          <Link
            to="/login"
            className="btn text-white px-4 py-2"
            style={{ background: 'linear-gradient(135deg, #9333ea, #f97316)' }}
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100" style={{ backgroundColor: '#f8fafc' }}>
      {/* Navigation Header */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top">
        <div className="container-fluid px-4">
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

          <button
            className="navbar-toggler d-lg-none"
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Desktop Navigation */}
          <div className="collapse navbar-collapse">
            <div className="d-flex align-items-center ms-auto">
              <Link to="/dashboard" className="btn btn-outline-primary me-2 d-flex align-items-center">
                <User size={16} className="me-2" />
                Dashboard
              </Link>
              
              <button className="btn position-relative me-3">
                <Heart size={20} />
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-warning">3</span>
              </button>
              <button className="btn position-relative me-3">
                <ShoppingCart size={20} />
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-warning">
                  {calculateItemCount()}
                </span>
              </button>

              <div className="d-flex align-items-center">
                <div className="d-flex align-items-center me-3">
                  {user.images?.url ? (
                    <img
                      src={user.images.url}
                      alt={user.images.altText || user.name}
                      className="rounded-circle me-2"
                      style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center me-2 text-white"
                      style={{
                        width: '32px',
                        height: '32px',
                        background: 'linear-gradient(135deg, #9333ea, #f97316)'
                      }}
                    >
                      <User size={16} />
                    </div>
                  )}
                  <span className="small fw-medium">{user.name}</span>
                </div>
                <button onClick={handleLogout} className="btn">
                  <LogOut size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="container-fluid d-lg-none">
              <div className="border-top pt-3 mt-3">
                <div className="d-flex flex-column gap-2">
                  <div className="mt-2">
                    <div className="small text-muted mb-2">Welcome, {user.name}</div>
                    <button
                      onClick={handleLogout}
                      className="btn btn-danger w-100 rounded-pill"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Page Header */}
      <div className="bg-white border-bottom">
        <div className="container-fluid px-4 py-4">
          <div className="row align-items-center">
            <div className="col-md-6">
              <div className="d-flex align-items-center">
                <button
                  onClick={() => navigate('/marketplace')}
                  className="btn btn-light rounded-circle me-3 d-flex align-items-center justify-content-center"
                  style={{ width: '40px', height: '40px' }}
                >
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <h1 className="h3 fw-bold mb-2" style={{ color: '#1e293b' }}>
                    Shopping Cart
                  </h1>
                  <p className="text-muted mb-0">
                    {cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in your cart
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-6 text-md-end">
              <div className="d-flex align-items-center justify-content-md-end gap-2 mt-3 mt-md-0">
                {cartItems.length > 0 && (
                  <>
                    <button
                      onClick={clearCart}
                      className="btn btn-outline-danger d-flex align-items-center gap-2"
                      disabled={loading}
                    >
                      <Trash2 size={16} />
                      Clear Cart
                    </button>
                    <Link
                      to="/marketplace"
                      className="btn btn-outline-primary"
                    >
                      Continue Shopping
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success/Error Alerts */}
      {success && (
        <div className="container-fluid px-4 pt-4">
          <div className="alert alert-success d-flex align-items-center" role="alert">
            <CheckCircle className="me-2" size={16} />
            {success}
          </div>
        </div>
      )}

      {error && (
        <div className="container-fluid px-4 pt-4">
          <div className="alert alert-danger d-flex align-items-center" role="alert">
            <AlertCircle className="me-2" size={16} />
            {error}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container-fluid px-4 py-4">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted mt-3">Loading your cart...</p>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="text-center py-5">
            <div className="display-1 mb-3">🛒</div>
            <h3 className="fw-bold text-dark mb-2">Your cart is empty</h3>
            <p className="text-muted mb-4">Add some amazing products to your cart and start shopping!</p>
            <Link
              to="/marketplace"
              className="btn text-white px-4 py-2"
              style={{ background: 'linear-gradient(135deg, #9333ea, #f97316)' }}
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="row g-4">
            {/* Cart Items */}
            <div className="col-lg-8">
              <div className="row g-4">
                {cartItems.map((item) => (
                  <div key={item.product._id} className="col-12">
                    <div className="card border-0 shadow-sm">
                      <div className="row g-0">
                        <div className="col-md-3">
                          <div
                            className="h-100 d-flex align-items-center justify-content-center position-relative"
                            style={{
                              minHeight: '200px',
                              background: 'linear-gradient(135deg, #ede9fe, #fed7aa)'
                            }}
                          >
                            {item.product.images && item.product.images.length > 0 ? (
                              <img
                                src={item.product.images[0].url}
                                alt={item.product.images[0].altText || item.product.name}
                                className="w-100 h-100"
                                style={{ objectFit: 'cover' }}
                              />
                            ) : (
                              <Package size={48} className="text-muted" />
                            )}
                          </div>
                        </div>
                        <div className="col-md-9">
                          <div className="card-body h-100 d-flex flex-column">
                            <div className="flex-grow-1">
                              <div className="d-flex justify-content-between align-items-start mb-3">
                                <div className="flex-grow-1">
                                  <Link
                                    to={`/product/${item.product._id}`}
                                    className="text-decoration-none"
                                  >
                                    <h5 className="card-title fw-semibold mb-2 text-dark">
                                      {item.product.name}
                                    </h5>
                                  </Link>
                                  <p className="card-text text-muted small mb-2">
                                    {item.product.description?.substring(0, 150)}
                                    {item.product.description?.length > 150 ? '...' : ''}
                                  </p>
                                  
                                  {/* Seller Info */}
                                  <div className="d-flex align-items-center gap-3 mb-3">
                                    <div className="d-flex align-items-center">
                                      <div
                                        className="rounded-circle d-flex align-items-center justify-content-center me-2 text-white"
                                        style={{
                                          width: '24px',
                                          height: '24px',
                                          background: 'linear-gradient(135deg, #9333ea, #f97316)'
                                        }}
                                      >
                                        <User size={12} />
                                      </div>
                                      <span className="small text-muted">
                                        by {item.product.seller?.name || 'Unknown Seller'}
                                      </span>
                                    </div>
                                    {item.product.seller?.location && (
                                      <div className="d-flex align-items-center">
                                        <MapPin size={12} className="text-muted me-1" />
                                        <span className="small text-muted">{item.product.seller.location}</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Rating */}
                                  {item.product.rating > 0 && (
                                    <div className="d-flex align-items-center mb-3">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                          key={star}
                                          size={14}
                                          className={star <= Math.round(item.product.rating) ? 'text-warning' : 'text-muted'}
                                          fill={star <= Math.round(item.product.rating) ? 'currentColor' : 'none'}
                                        />
                                      ))}
                                      <span className="ms-2 small text-muted">
                                        {item.product.rating.toFixed(1)} ({item.product.numReviews} reviews)
                                      </span>
                                    </div>
                                  )}
                                </div>
                                
                                <button
                                  onClick={() => removeFromCart(item.product._id)}
                                  disabled={updating[item.product._id]}
                                  className="btn btn-outline-danger btn-sm rounded-circle ms-3"
                                  style={{ width: '36px', height: '36px' }}
                                >
                                  {updating[item.product._id] ? (
                                    <div className="spinner-border spinner-border-sm" role="status">
                                      <span className="visually-hidden">Loading...</span>
                                    </div>
                                  ) : (
                                    <Trash2 size={14} />
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Price and Quantity Controls */}
                            <div className="d-flex justify-content-between align-items-center">
                              <div className="d-flex align-items-center gap-4">
                                <div className="h5 fw-bold mb-0" style={{ color: '#9333ea' }}>
                                  ₹{(item.product.price * item.quantity).toLocaleString()}
                                </div>
                                <div className="small text-muted">
                                  ₹{item.product.price.toLocaleString()} each
                                </div>
                              </div>

                              <div className="d-flex align-items-center gap-3">
                                {/* Chat Button */}
                                <button
                                  onClick={() => handleStartChat(item.product.seller._id, item.product._id)}
                                  className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2"
                                >
                                  <MessageCircle size={14} />
                                  Chat
                                </button>

                                {/* Quantity Controls */}
                                <div className="d-flex align-items-center border rounded">
                                  <button
                                    onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                                    disabled={item.quantity <= 1 || updating[item.product._id]}
                                    className="btn btn-sm border-0"
                                    style={{ width: '36px', height: '36px' }}
                                  >
                                    <Minus size={14} />
                                  </button>
                                  <span className="px-3 py-2 fw-medium" style={{ minWidth: '60px', textAlign: 'center' }}>
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
                                    disabled={
                                      updating[item.product._id] || 
                                      item.quantity >= item.product.countInStock
                                    }
                                    className="btn btn-sm border-0"
                                    style={{ width: '36px', height: '36px' }}
                                  >
                                    <Plus size={14} />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Stock Warning */}
                            {item.quantity >= item.product.countInStock && (
                              <div className="mt-2">
                                <small className="text-warning">
                                  ⚠️ Only {item.product.countInStock} left in stock
                                </small>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="col-lg-4">
              <div className="card border-0 shadow-sm sticky-top" style={{ top: '100px' }}>
                <div className="card-body p-4">
                  <h5 className="fw-semibold mb-4">Order Summary</h5>
                  
                  <div className="d-flex justify-content-between mb-3">
                    <span>Subtotal ({calculateItemCount()} items)</span>
                    <span className="fw-medium">₹{calculateTotal().toLocaleString()}</span>
                  </div>
                  
                  <div className="d-flex justify-content-between mb-3">
                    <span>Shipping</span>
                    <span className="fw-medium text-success">Free</span>
                  </div>
                  
                  <div className="d-flex justify-content-between mb-3">
                    <span>Tax (estimated)</span>
                    <span className="fw-medium">₹{Math.round(calculateTotal() * 0.1).toLocaleString()}</span>
                  </div>
                  
                  <hr />
                  
                  <div className="d-flex justify-content-between mb-4">
                    <span className="h6 fw-semibold">Total</span>
                    <span className="h5 fw-bold" style={{ color: '#9333ea' }}>
                      ₹{Math.round(calculateTotal() * 1.1).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="d-grid gap-3">
                    <button
                      className="btn text-white btn-lg fw-semibold"
                      style={{ background: 'linear-gradient(135deg, #9333ea, #f97316)' }}
                    >
                      <CreditCard size={20} className="me-2" />
                      Proceed to Checkout
                    </button>
                    
                    <Link
                      to="/marketplace"
                      className="btn btn-outline-primary text-decoration-none"
                    >
                      <ShoppingBag size={16} className="me-2" />
                      Continue Shopping
                    </Link>
                  </div>
                  
                  <div className="mt-4 p-3 bg-light rounded">
                    <div className="small text-muted">
                      <div className="d-flex align-items-center mb-2">
                        <CheckCircle size={14} className="text-success me-2" />
                        Free shipping on all orders
                      </div>
                      <div className="d-flex align-items-center mb-2">
                        <CheckCircle size={14} className="text-success me-2" />
                        30-day return policy
                      </div>
                      <div className="d-flex align-items-center">
                        <CheckCircle size={14} className="text-success me-2" />
                        Secure payment processing
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .card:hover {
          transform: translateY(-1px);
          transition: all 0.2s ease;
        }
        
        .btn:hover {
          transform: translateY(-1px);
          transition: all 0.2s ease;
        }
        
        .btn:disabled {
          transform: none;
        }
        
        .quantity-controls .btn {
          transition: all 0.2s ease;
        }
        
        .quantity-controls .btn:hover:not(:disabled) {
          background-color: #f8fafc;
        }
      `}</style>
    </div>
  );
};

export default Cart;
// Create new file: frontend_final/src/PreviousPurchases.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Star,
  User,
  Calendar,
  MessageCircle,
  ChevronRight,
  ShoppingBag,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Filter,
  Search,
  Eye,
  Edit3
} from 'lucide-react';
import { useAuth } from './AuthContext';
import ReviewModal from './ReviewModal';
import 'bootstrap/dist/css/bootstrap.min.css';

const API_BASE_URL = 'http://localhost:5000/api';

const PreviousPurchases = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Fetch user's orders
  const fetchOrders = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/orders/my-orders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      } else {
        throw new Error('Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to load purchase history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  // Filter and sort orders
  const filteredOrders = orders
    .filter(order => {
      const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
      const matchesSearch = order.orderItems.some(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.seller?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      return matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'price_high':
          return b.totalPrice - a.totalPrice;
        case 'price_low':
          return a.totalPrice - b.totalPrice;
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: 'bg-warning', text: 'text-dark', label: 'Pending' },
      confirmed: { bg: 'bg-info', text: 'text-white', label: 'Confirmed' },
      shipped: { bg: 'bg-primary', text: 'text-white', label: 'Shipped' },
      delivered: { bg: 'bg-success', text: 'text-white', label: 'Delivered' },
      cancelled: { bg: 'bg-danger', text: 'text-white', label: 'Cancelled' },
      returned: { bg: 'bg-secondary', text: 'text-white', label: 'Returned' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`badge ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleLeaveReview = (product, order) => {
    setSelectedProduct({ ...product, orderId: order._id });
    setShowReviewModal(true);
  };

  const handleViewOrderDetails = (order) => {
    setSelectedOrder(order);
  };

  if (!user) {
    return (
      <div className="text-center py-5">
        <ShoppingBag size={64} className="text-muted mb-3" />
        <h3>Please log in to view your purchase history</h3>
        <Link to="/login" className="btn btn-primary">Sign In</Link>
      </div>
    );
  }

  return (
    <div className="container-fluid px-0">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1 d-flex align-items-center">
            <ShoppingBag size={24} className="me-2" style={{ color: '#9333ea' }} />
            My Purchases
          </h4>
          <p className="text-muted mb-0">View and manage your order history</p>
        </div>
        <button
          onClick={fetchOrders}
          className="btn btn-outline-secondary d-flex align-items-center gap-2"
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Filters and Search */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3">
          <div className="row g-3 align-items-center">
            <div className="col-md-4">
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <Search size={16} className="text-muted" />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Orders</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price_high">Price: High to Low</option>
                <option value="price_low">Price: Low to High</option>
              </select>
            </div>
            <div className="col-md-2">
              <div className="text-muted small">
                {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mt-3">Loading your purchases...</p>
        </div>
      ) : error ? (
        <div className="alert alert-danger d-flex align-items-center" role="alert">
          <AlertCircle size={20} className="me-2" />
          {error}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-5">
          <ShoppingBag size={80} className="text-muted mb-4" />
          <h3 className="fw-bold text-dark mb-3">No purchases found</h3>
          <p className="text-muted mb-4">
            {searchTerm || filterStatus !== 'all' 
              ? "Try adjusting your search or filters"
              : "You haven't made any purchases yet. Start shopping to see your orders here!"
            }
          </p>
          <Link
            to="/marketplace"
            className="btn text-white px-4 py-2"
            style={{ background: 'linear-gradient(135deg, #9333ea, #f97316)' }}
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        /* Orders List */
        <div className="row g-3">
          {filteredOrders.map((order) => (
            <div key={order._id} className="col-12">
              <div className="card border-0 shadow-sm hover-card">
                <div className="card-body p-4">
                  {/* Order Header */}
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <div className="d-flex align-items-center gap-3 mb-2">
                        <h6 className="fw-semibold mb-0">
                          Order #{order.orderNumber || order._id.slice(-8)}
                        </h6>
                        {getStatusBadge(order.status)}
                      </div>
                      <div className="d-flex align-items-center gap-3 text-muted small">
                        <div className="d-flex align-items-center">
                          <Calendar size={14} className="me-1" />
                          Ordered on {formatDate(order.createdAt)}
                        </div>
                        {order.deliveredAt && (
                          <div className="d-flex align-items-center">
                            <CheckCircle size={14} className="me-1 text-success" />
                            Delivered on {formatDate(order.deliveredAt)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="h6 fw-bold mb-1" style={{ color: '#9333ea' }}>
                        {formatPrice(order.totalPrice)}
                      </div>
                      <div className="small text-muted">
                        {order.orderItems.length} item{order.orderItems.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="border-top pt-3">
                    {order.orderItems.map((item, index) => (
                      <div key={index} className="row align-items-center mb-3">
                        <div className="col-md-2 col-3">
                          <div
                            className="rounded position-relative overflow-hidden"
                            style={{
                              paddingTop: '100%',
                              background: 'linear-gradient(135deg, #ede9fe, #fed7aa)'
                            }}
                          >
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="position-absolute top-0 start-0 w-100 h-100"
                                style={{ objectFit: 'cover' }}
                              />
                            ) : (
                              <div className="position-absolute top-50 start-50 translate-middle">
                                <Package size={24} className="text-muted" />
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="col-md-6 col-9">
                          <div>
                            <h6 className="fw-medium mb-1">{item.name}</h6>
                            <div className="d-flex align-items-center gap-3 mb-2">
                              <span className="text-muted small">Qty: {item.qty}</span>
                              <span className="fw-medium">{formatPrice(item.price)}</span>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                              <User size={14} className="text-muted" />
                              <span className="small text-muted">
                                Sold by {order.seller?.name || 'Seller'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="col-md-4 col-12 mt-3 mt-md-0">
                          <div className="d-flex flex-wrap gap-2 justify-content-md-end">
                            <Link
                              to={`/product/${item.product}`}
                              className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                            >
                              <Eye size={14} />
                              View
                            </Link>
                            
                            {order.status === 'delivered' && (
                              <button
                                onClick={() => handleLeaveReview(item, order)}
                                className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
                              >
                                <Star size={14} />
                                Review
                              </button>
                            )}
                            
                            <Link
                              to={`/chat/${order.seller?._id}/${item.product}`}
                              className="btn btn-outline-success btn-sm d-flex align-items-center gap-1"
                            >
                              <MessageCircle size={14} />
                              Contact
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Footer */}
                  <div className="border-top pt-3 d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-3">
                      <div className="small text-muted">
                        <strong>Payment:</strong> {order.paymentMethod || 'N/A'}
                      </div>
                      {order.isPaid && (
                        <div className="small text-success d-flex align-items-center">
                          <CheckCircle size={14} className="me-1" />
                          Paid
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => handleViewOrderDetails(order)}
                      className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                    >
                      View Details
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedProduct && (
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedProduct(null);
          }}
          productId={selectedProduct.product}
          productName={selectedProduct.name}
          orderId={selectedProduct.orderId}
        />
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Order Details - #{selectedOrder.orderNumber || selectedOrder._id.slice(-8)}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedOrder(null)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row g-4">
                  <div className="col-md-6">
                    <h6 className="fw-semibold mb-3">Order Information</h6>
                    <div className="table-responsive">
                      <table className="table table-borderless">
                        <tbody>
                          <tr>
                            <td className="fw-medium">Status:</td>
                            <td>{getStatusBadge(selectedOrder.status)}</td>
                          </tr>
                          <tr>
                            <td className="fw-medium">Order Date:</td>
                            <td>{formatDate(selectedOrder.createdAt)}</td>
                          </tr>
                          <tr>
                            <td className="fw-medium">Total Amount:</td>
                            <td className="fw-bold">{formatPrice(selectedOrder.totalPrice)}</td>
                          </tr>
                          <tr>
                            <td className="fw-medium">Payment Method:</td>
                            <td>{selectedOrder.paymentMethod}</td>
                          </tr>
                          <tr>
                            <td className="fw-medium">Payment Status:</td>
                            <td>
                              {selectedOrder.isPaid ? (
                                <span className="badge bg-success">Paid</span>
                              ) : (
                                <span className="badge bg-warning">Pending</span>
                              )}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <h6 className="fw-semibold mb-3">Shipping Address</h6>
                    <div className="p-3 bg-light rounded">
                      <div className="fw-medium">{selectedOrder.shippingAddress?.fullName}</div>
                      <div>{selectedOrder.shippingAddress?.addressLine1}</div>
                      {selectedOrder.shippingAddress?.addressLine2 && (
                        <div>{selectedOrder.shippingAddress.addressLine2}</div>
                      )}
                      <div>
                        {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state}
                      </div>
                      <div>{selectedOrder.shippingAddress?.postalCode}</div>
                      <div>{selectedOrder.shippingAddress?.country}</div>
                      <div className="mt-2 text-muted">
                        📞 {selectedOrder.shippingAddress?.phoneNumber}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedOrder(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .hover-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important;
          transition: all 0.3s ease;
        }
        
        .spin {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .btn:hover {
          transform: translateY(-1px);
          transition: all 0.2s ease;
        }
      `}</style>
    </div>
  );
};

export default PreviousPurchases;
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  ShoppingBag,
  Heart,
  MessageCircle,
  Star,
  Settings,
  Package,
  TrendingUp,
  Edit3,
  Save,
  X,
  Camera,
  Mail,
  Phone,
  MapPin,
  Eye,
  Trash2,
  ArrowLeft,
  Leaf,
  Menu,
  LogOut,
  ShoppingCart,
  Calendar,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  Download,
  ExternalLink,
  Plus
} from 'lucide-react';
import { useAuth } from './AuthContext';
import UserProfileReviews from './UserProfileReviews';
import PreviousPurchases from './PreviousPurchases';

const API_BASE_URL = 'http://localhost:5000/api';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // State management
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [editData, setEditData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    location: ''
  });

  const [dashboardData, setDashboardData] = useState({
    stats: {
      activeListings: 0,
      totalSales: 0,
      savedItems: 0,
      unreadMessages: 0
    },
    listings: [],
    purchases: [],
    savedItems: [],
    messages: [],
    reviews: [],
    disputes: []
  });

  const [reviewsSubTab, setReviewsSubTab] = useState('received');

  useEffect(() => {
    if (user) {
      setEditData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
        location: user.location || ''
      });
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      // Fetch all dashboard data
      const responses = await Promise.allSettled([
        fetch(`${API_BASE_URL}/products/my-listings`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/orders/my-orders`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/wishlists`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/messages/conversations`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/tickets/my-tickets`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      let listings = [], purchases = [], savedItems = [], messages = [], disputes = [];

      // Process responses
      if (responses[0].status === 'fulfilled' && responses[0].value.ok) {
        const data = await responses[0].value.json();
        listings = data.products || [];
      }

      if (responses[1].status === 'fulfilled' && responses[1].value.ok) {
        const data = await responses[1].value.json();
        purchases = data.orders || [];
      }

      if (responses[2].status === 'fulfilled' && responses[2].value.ok) {
        const data = await responses[2].value.json();
        savedItems = data.items || [];
      }

      if (responses[3].status === 'fulfilled' && responses[3].value.ok) {
        const data = await responses[3].value.json();
        messages = data.conversations || [];
      }

      if (responses[4].status === 'fulfilled' && responses[4].value.ok) {
        const data = await responses[4].value.json();
        disputes = data.tickets || [];
      }

      // Calculate stats
      const stats = {
        activeListings: listings.filter(l => l.status === 'active').length,
        totalSales: listings.filter(l => l.status === 'sold').length,
        savedItems: savedItems.length,
        unreadMessages: messages.filter(m => m.unreadCount > 0).length
      };

      setDashboardData({
        stats,
        listings,
        purchases,
        savedItems,
        messages,
        disputes
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/users/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(editData)
        });

        const data = await response.json();

        if (response.ok) {
            setSuccess('Profile updated successfully!');
            setIsEditing(false);
            
            // Profile updated successfully - the user data will be refreshed on next login
            // or you can add an updateUser function to your AuthContext if needed
            
            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(''), 3000);
        } else {
            setError(data.message || 'Failed to update profile');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        setError('Failed to update profile. Please try again.');
    } finally {
        setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const formatPrice = (price) => {
    return `₹${parseFloat(price).toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: 'bg-success',
      sold: 'bg-warning text-dark',
      draft: 'bg-secondary',
      pending: 'bg-info',
      delivered: 'bg-success',
      cancelled: 'bg-danger',
      open: 'bg-warning text-dark',
      resolved: 'bg-success',
      closed: 'bg-secondary'
    };
    return `badge ${badges[status] || 'bg-light text-dark'}`;
  };

  const stats = [
    {
      label: 'Active Listings',
      value: dashboardData.stats.activeListings,
      icon: Package,
      color: '#9333ea',
      bgColor: '#ede9fe'
    },
    {
      label: 'Total Sales',
      value: dashboardData.stats.totalSales,
      icon: TrendingUp,
      color: '#059669',
      bgColor: '#d1fae5'
    },
    {
      label: 'Saved Items',
      value: dashboardData.stats.savedItems,
      icon: Heart,
      color: '#dc2626',
      bgColor: '#fee2e2'
    },
    {
      label: 'New Messages',
      value: dashboardData.stats.unreadMessages,
      icon: MessageCircle,
      color: '#2563eb',
      bgColor: '#dbeafe'
    }
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'profile', label: 'Profile Settings', icon: Settings },
    { id: 'listings', label: 'My Listings', icon: Package },
    { id: 'purchases', label: 'My Purchases', icon: ShoppingBag },
    { id: 'saved', label: 'Saved Items', icon: Heart },
    { id: 'messages', label: 'Messages', icon: MessageCircle },
    { id: 'reviews', label: 'Reviews & Ratings', icon: Star },
    { id: 'disputes', label: 'My Disputes', icon: Shield }
  ];

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div>
            <div className="mb-4">
              <h5 className="fw-semibold mb-2">Activity Overview</h5>
              <p className="text-muted">Here's what's happening with your account</p>
            </div>

            <div className="row g-4">
              {/* Recent Listings */}
              <div className="col-md-6">
                <div className="card bg-light border-0 h-100">
                  <div className="card-body">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <h6 className="fw-semibold mb-0">Recent Listings</h6>
                      <Link to="#" onClick={() => setActiveTab('listings')} className="btn btn-sm btn-outline-primary">
                        View All
                      </Link>
                    </div>
                    {dashboardData.listings.slice(0, 3).map(listing => (
                      <div key={listing._id} className="d-flex justify-content-between align-items-center border-bottom py-2 last:border-bottom-0">
                        <div>
                          <div className="fw-medium text-truncate" style={{ maxWidth: '200px' }}>{listing.name}</div>
                          <small className="text-muted">{formatPrice(listing.price)} • {listing.views || 0} views</small>
                        </div>
                        <span className={getStatusBadge(listing.status)}>
                          {listing.status}
                        </span>
                      </div>
                    ))}
                    {dashboardData.listings.length === 0 && (
                      <div className="text-center py-3">
                        <Package size={32} className="text-muted mb-2" />
                        <p className="text-muted small mb-0">No listings yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Messages */}
              <div className="col-md-6">
                <div className="card bg-light border-0 h-100">
                  <div className="card-body">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <h6 className="fw-semibold mb-0">Recent Messages</h6>
                      <Link to="#" onClick={() => setActiveTab('messages')} className="btn btn-sm btn-outline-primary">
                        View All
                      </Link>
                    </div>
                    {dashboardData.messages.slice(0, 3).map(message => (
                      <div key={message._id} className="d-flex justify-content-between align-items-center border-bottom py-2">
                        <div>
                          <div className="fw-medium">{message.subject || 'New Message'}</div>
                          <small className="text-muted">From: {message.participants?.[0]?.name || 'Unknown'}</small>
                        </div>
                        {message.unreadCount > 0 && <span className="badge bg-primary">New</span>}
                      </div>
                    ))}
                    {dashboardData.messages.length === 0 && (
                      <div className="text-center py-3">
                        <MessageCircle size={32} className="text-muted mb-2" />
                        <p className="text-muted small mb-0">No messages yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Purchases */}
              <div className="col-md-6">
                <div className="card bg-light border-0 h-100">
                  <div className="card-body">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <h6 className="fw-semibold mb-0">Recent Purchases</h6>
                      <Link to="#" onClick={() => setActiveTab('purchases')} className="btn btn-sm btn-outline-primary">
                        View All
                      </Link>
                    </div>
                    {dashboardData.purchases.slice(0, 3).map(purchase => (
                      <div key={purchase._id} className="d-flex justify-content-between align-items-center border-bottom py-2">
                        <div>
                          <div className="fw-medium">{purchase.orderItems?.[0]?.name || 'Order'}</div>
                          <small className="text-muted">{formatPrice(purchase.totalPrice)} • {formatDate(purchase.createdAt)}</small>
                        </div>
                        <span className={getStatusBadge(purchase.status)}>
                          {purchase.status}
                        </span>
                      </div>
                    ))}
                    {dashboardData.purchases.length === 0 && (
                      <div className="text-center py-3">
                        <ShoppingBag size={32} className="text-muted mb-2" />
                        <p className="text-muted small mb-0">No purchases yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Saved Items */}
              <div className="col-md-6">
                <div className="card bg-light border-0 h-100">
                  <div className="card-body">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <h6 className="fw-semibold mb-0">Saved Items</h6>
                      <Link to="#" onClick={() => setActiveTab('saved')} className="btn btn-sm btn-outline-primary">
                        View All
                      </Link>
                    </div>
                    {dashboardData.savedItems.slice(0, 3).map(item => (
                      <div key={item._id} className="d-flex justify-content-between align-items-center border-bottom py-2">
                        <div>
                          <div className="fw-medium">{item.product?.name || 'Item'}</div>
                          <small className="text-muted">{formatPrice(item.product?.price)} • {item.product?.seller?.name}</small>
                        </div>
                        <Link
                          to={`/product/${item.product?._id}`}
                          className="btn btn-sm btn-outline-primary"
                        >
                          <ExternalLink size={12} />
                        </Link>
                      </div>
                    ))}
                    {dashboardData.savedItems.length === 0 && (
                      <div className="text-center py-3">
                        <Heart size={32} className="text-muted mb-2" />
                        <p className="text-muted small mb-0">No saved items yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'profile':
        return (
          <div>
            <div className="mb-4">
              <h5 className="fw-semibold mb-2">Profile Settings</h5>
              <p className="text-muted">Manage your account information and preferences</p>
            </div>

            <div className="row">
              <div className="col-md-4 text-center mb-4">
                <div className="position-relative d-inline-block">
                  {user.images?.url ? (
                    <img
                      src={user.images.url}
                      alt={user.images.altText || user.name}
                      className="rounded-circle border border-4 border-white shadow-sm"
                      style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      className="rounded-circle border border-4 border-white shadow-sm d-flex align-items-center justify-content-center text-white"
                      style={{
                        width: '120px',
                        height: '120px',
                        background: 'linear-gradient(135deg, #9333ea, #f97316)'
                      }}
                    >
                      <User size={48} />
                    </div>
                  )}
                  {isEditing && (
                    <button className="btn btn-sm position-absolute bottom-0 end-0 rounded-circle text-white"
                      style={{ background: 'linear-gradient(135deg, #9333ea, #f97316)' }}
                    >
                      <Camera size={14} />
                    </button>
                  )}
                </div>
                <div className="mt-3">
                  <h6 className="fw-semibold">{user.name}</h6>
                  <p className="text-muted small mb-0">
                    Member since {formatDate(user.createdAt)}
                  </p>
                </div>
              </div>

              <div className="col-md-8">
                <form onSubmit={(e) => { e.preventDefault(); handleSaveProfile(); }}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-medium">Full Name</label>
                      <div className="input-group">
                        <span className="input-group-text bg-light border-end-0">
                          <User size={16} className="text-muted" />
                        </span>
                        <input
                          type="text"
                          className="form-control border-start-0"
                          value={editData.name}
                          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                          disabled={!isEditing}
                          required
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-medium">Email Address</label>
                      <div className="input-group">
                        <span className="input-group-text bg-light border-end-0">
                          <Mail size={16} className="text-muted" />
                        </span>
                        <input
                          type="email"
                          className="form-control border-start-0"
                          value={editData.email}
                          onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                          disabled={!isEditing}
                          required
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-medium">Phone Number</label>
                      <div className="input-group">
                        <span className="input-group-text bg-light border-end-0">
                          <Phone size={16} className="text-muted" />
                        </span>
                        <input
                          type="tel"
                          className="form-control border-start-0"
                          value={editData.phone}
                          onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-medium">Location</label>
                      <div className="input-group">
                        <span className="input-group-text bg-light border-end-0">
                          <MapPin size={16} className="text-muted" />
                        </span>
                        <input
                          type="text"
                          className="form-control border-start-0"
                          value={editData.location}
                          onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                          disabled={!isEditing}
                          placeholder="Your city, state"
                        />
                      </div>
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-medium">Bio</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={editData.bio}
                        onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                        disabled={!isEditing}
                        placeholder="Tell others about yourself..."
                      />
                    </div>
                  </div>

                  {isEditing && (
                    <div className="d-flex gap-2 mt-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className="btn text-white"
                        style={{ background: 'linear-gradient(135deg, #9333ea, #f97316)' }}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save size={16} className="me-2" />
                            Save Changes
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => {
                          setIsEditing(false);
                          setEditData({
                            name: user.name || '',
                            email: user.email || '',
                            phone: user.phone || '',
                            bio: user.bio || '',
                            location: user.location || ''
                          });
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        );
      
      case 'listings':
        return (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h5 className="fw-semibold mb-1">My Listings</h5>
                <p className="text-muted mb-0">Manage your product listings</p>
              </div>
              <Link
                to="/productmanager"
                className="btn text-white"
                style={{ background: 'linear-gradient(135deg, #9333ea, #f97316)' }}
              >
                <Plus size={16} className="me-2" />
                Add New Listing
              </Link>
            </div>

            {dashboardData.listings.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>Product</th>
                      <th>Price</th>
                      <th>Views</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.listings.map(listing => (
                      <tr key={listing._id}>
                        <td>
                          <div className="d-flex align-items-center">
                            {listing.images?.[0]?.url && (
                              <img
                                src={listing.images[0].url}
                                alt={listing.name}
                                className="rounded me-2"
                                style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                              />
                            )}
                            <div>
                              <div className="fw-medium">{listing.name}</div>
                              <small className="text-muted">{listing.category}</small>
                            </div>
                          </div>
                        </td>
                        <td className="fw-medium">{formatPrice(listing.price)}</td>
                        <td>{listing.views || 0}</td>
                        <td>
                          <span className={getStatusBadge(listing.status)}>
                            {listing.status}
                          </span>
                        </td>
                        <td>{formatDate(listing.createdAt)}</td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <Link
                              to={`/product/${listing._id}`}
                              className="btn btn-outline-primary"
                              title="View"
                            >
                              <Eye size={14} />
                            </Link>
                            <Link
                              to={`/productmanager/${listing._id}`}
                              className="btn btn-outline-secondary"
                              title="Edit"
                            >
                              <Edit3 size={14} />
                            </Link>
                            <button
                              className="btn btn-outline-danger"
                              title="Delete"
                              onClick={() => {
                                // Add delete confirmation modal
                                if (window.confirm('Are you sure you want to delete this listing?')) {
                                  // Handle delete
                                }
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-5">
                <Package size={64} className="text-muted mb-3" />
                <h6 className="fw-semibold mb-2">No listings yet</h6>
                <p className="text-muted mb-4">Start selling your items on EcoFinds marketplace</p>
                <Link
                  to="/productmanager"
                  className="btn text-white"
                  style={{ background: 'linear-gradient(135deg, #9333ea, #f97316)' }}
                >
                  Create Your First Listing
                </Link>
              </div>
            )}
          </div>
        );
      
      case 'purchases':
        return <PreviousPurchases />;
      
      case 'saved':
        return (
          <div>
            <div className="mb-4">
              <h5 className="fw-semibold mb-1">Saved Items</h5>
              <p className="text-muted mb-0">Items you've bookmarked for later</p>
            </div>

            {dashboardData.savedItems.length > 0 ? (
              <div className="row g-3">
                {dashboardData.savedItems.map(item => (
                  <div key={item._id} className="col-md-6 col-lg-4">
                    <div className="card border-0 shadow-sm h-100">
                      <div
                        className="position-relative overflow-hidden"
                        style={{ paddingTop: '60%', background: 'linear-gradient(135deg, #ede9fe, #fed7aa)' }}
                      >
                        {item.product?.images?.[0]?.url ? (
                          <img
                            src={item.product.images[0].url}
                            alt={item.product.name}
                            className="position-absolute top-0 start-0 w-100 h-100"
                            style={{ objectFit: 'cover' }}
                          />
                        ) : (
                          <div className="position-absolute top-50 start-50 translate-middle">
                            <Package size={32} className="text-muted" />
                          </div>
                        )}
                      </div>
                      <div className="card-body">
                        <h6 className="card-title text-truncate">{item.product?.name}</h6>
                        <p className="text-muted small">By {item.product?.seller?.name}</p>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="fw-bold">{formatPrice(item.product?.price)}</span>
                          <Link
                            to={`/product/${item.product?._id}`}
                            className="btn btn-sm btn-outline-primary"
                          >
                            View Item
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-5">
                <Heart size={64} className="text-muted mb-3" />
                <h6 className="fw-semibold mb-2">No saved items yet</h6>
                <p className="text-muted mb-4">Save items you're interested in for easy access later</p>
                <Link
                  to="/marketplace"
                  className="btn text-white"
                  style={{ background: 'linear-gradient(135deg, #9333ea, #f97316)' }}
                >
                  Browse Products
                </Link>
              </div>
            )}
          </div>
        );
      
      case 'messages':
        return (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h5 className="fw-semibold mb-1">Messages</h5>
                <p className="text-muted mb-0">Your conversation history</p>
              </div>
              <Link
                to="/chat"
                className="btn btn-outline-primary btn-sm"
              >
                View All Chats
              </Link>
            </div>

            {dashboardData.messages.length > 0 ? (
              <div className="list-group list-group-flush">
                {dashboardData.messages.slice(0, 10).map(message => (
                  <div key={message._id} className="list-group-item d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                      <div className="me-3">
                        {message.participants?.[0]?.avatar ? (
                          <img
                            src={message.participants[0].avatar}
                            alt={message.participants[0].name}
                            className="rounded-circle"
                            style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                          />
                        ) : (
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center text-white"
                            style={{
                              width: '40px',
                              height: '40px',
                              background: 'linear-gradient(135deg, #9333ea, #f97316)'
                            }}
                          >
                            <User size={20} />
                          </div>
                        )}
                      </div>
                      <div>
                        <h6 className="mb-1">{message.participants?.[0]?.name || 'Unknown User'}</h6>
                        <p className="mb-1 small text-muted">{message.lastMessage || 'No messages yet'}</p>
                        <small className="text-muted">{formatDate(message.updatedAt)}</small>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      {message.unreadCount > 0 && (
                        <span className="badge bg-primary">{message.unreadCount}</span>
                      )}
                      <Link
                        to={`/chat/${message.participants?.[0]?._id}`}
                        className="btn btn-sm btn-outline-primary"
                      >
                        Open Chat
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-5">
                <MessageCircle size={64} className="text-muted mb-3" />
                <h6 className="fw-semibold mb-2">No messages yet</h6>
                <p className="text-muted mb-4">Start chatting with buyers and sellers</p>
                <Link
                  to="/marketplace"
                  className="btn text-white"
                  style={{ background: 'linear-gradient(135deg, #9333ea, #f97316)' }}
                >
                  Browse Products
                </Link>
              </div>
            )}
          </div>
        );
      
      case 'reviews':
        return (
          <div>
            <div className="mb-4">
              <h5 className="fw-semibold mb-2">Reviews & Ratings</h5>
              <p className="text-muted">Manage your reviews and see what others are saying about you</p>
            </div>

            {/* Tab Navigation for Reviews */}
            <ul className="nav nav-pills mb-4">
              <li className="nav-item">
                <button
                  className={`nav-link ${reviewsSubTab === 'received' ? 'active' : ''}`}
                  onClick={() => setReviewsSubTab('received')}
                  style={reviewsSubTab === 'received' ? {
                    background: 'linear-gradient(135deg, #9333ea, #f97316)',
                    borderColor: 'transparent'
                  } : {}}
                >
                  Reviews Received
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${reviewsSubTab === 'given' ? 'active' : ''}`}
                  onClick={() => setReviewsSubTab('given')}
                  style={reviewsSubTab === 'given' ? {
                    background: 'linear-gradient(135deg, #9333ea, #f97316)',
                    borderColor: 'transparent'
                  } : {}}
                >
                  Reviews Given
                </button>
              </li>
            </ul>

            {/* Reviews Content */}
            {reviewsSubTab === 'received' && (
              <UserProfileReviews
                userId={user._id}
                userType={user.role === 'seller' ? 'seller' : 'buyer'}
              />
            )}

            {reviewsSubTab === 'given' && (
              <div className="card border-0 bg-light">
                <div className="card-body text-center py-5">
                  <Star size={64} className="text-muted mb-3" />
                  <h6 className="fw-semibold mb-2">Reviews You've Written</h6>
                  <p className="text-muted mb-4">You haven't written any reviews yet</p>
                  <Link
                    to="/marketplace"
                    className="btn text-white"
                    style={{ background: 'linear-gradient(135deg, #9333ea, #f97316)' }}
                  >
                    Shop & Review Products
                  </Link>
                </div>
              </div>
            )}
          </div>
        );
      
      case 'disputes':
        return (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h5 className="fw-semibold mb-1">My Disputes</h5>
                <p className="text-muted mb-0">Support tickets and complaint history</p>
              </div>
              <Link
                to="/support"
                className="btn text-white"
                style={{ background: 'linear-gradient(135deg, #9333ea, #f97316)' }}
              >
                <Plus size={16} className="me-2" />
                New Complaint
              </Link>
            </div>

            {dashboardData.disputes.length > 0 ? (
              <div className="row g-3">
                {dashboardData.disputes.map(dispute => (
                  <div key={dispute._id} className="col-12">
                    <div className="card border">
                      <div className="card-body">
                        <div className="row align-items-center">
                          <div className="col-md-2">
                            <div className="fw-medium">#{dispute._id.slice(-6)}</div>
                            <small className="text-muted">{formatDate(dispute.createdAt)}</small>
                          </div>
                          <div className="col-md-4">
                            <div className="fw-medium">{dispute.subject}</div>
                            <small className="text-muted">{dispute.type}</small>
                          </div>
                          <div className="col-md-3">
                            <small className="text-muted">
                              {dispute.relatedProduct?.name || 'General Inquiry'}
                            </small>
                          </div>
                          <div className="col-md-2">
                            <span className={getStatusBadge(dispute.status)}>
                              {dispute.status}
                            </span>
                          </div>
                          <div className="col-md-1 text-end">
                            <button className="btn btn-sm btn-outline-primary">
                              View
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-5">
                <Shield size={64} className="text-muted mb-3" />
                <h6 className="fw-semibold mb-2">No disputes filed</h6>
                <p className="text-muted mb-4">
                  Great! You haven't filed any complaints. If you need help, we're here for you.
                </p>
                <Link
                  to="/support"
                  className="btn text-white"
                  style={{ background: 'linear-gradient(135deg, #9333ea, #f97316)' }}
                >
                  Contact Support
                </Link>
              </div>
            )}
          </div>
        );
    
      default:
        return <PreviousPurchases />;
    }
  };

  if (!user) {
    return (
      <div className="min-vh-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: '#f8fafc' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading your dashboard...</p>
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
              <button className="btn position-relative me-3">
                <Heart size={20} />
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-warning">
                  {dashboardData.stats.savedItems}
                </span>
              </button>
              <button className="btn position-relative me-3">
                <ShoppingCart size={20} />
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-warning">2</span>
              </button>

              <Link to="/cart" className="btn position-relative me-3">
                <ShoppingCart size={20} />
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-warning">2</span>
              </Link>

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
                    Dashboard
                  </h1>
                  <p className="text-muted mb-0">
                    Welcome back, {user.name}! Manage your EcoFinds account.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-6 text-md-end">
              <div className="d-flex align-items-center justify-content-md-end gap-2 mt-3 mt-md-0">
                <button
                  className="btn btn-outline-primary d-flex align-items-center gap-2"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? <X size={16} /> : <Edit3 size={16} />}
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </button>
                <Link
                  to="/productmanager"
                  className="btn text-white d-flex align-items-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #9333ea, #f97316)' }}
                >
                  <Plus size={16} />
                  Add Product
                </Link>
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
            <AlertTriangle className="me-2" size={16} />
            {error}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="container-fluid px-4 py-4">
        <div className="row g-4 mb-4">
          {stats.map((stat, index) => (
            <div key={index} className="col-lg-3 col-md-6">
              <div className="card border-0 shadow-sm h-100" style={{ transition: 'all 0.2s' }}>
                <div className="card-body p-4">
                  <div className="d-flex align-items-center">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center me-3"
                      style={{
                        width: '48px',
                        height: '48px',
                        backgroundColor: stat.bgColor
                      }}
                    >
                      <stat.icon size={24} style={{ color: stat.color }} />
                    </div>
                    <div>
                      <h3 className="h4 fw-bold mb-0">{stat.value}</h3>
                      <p className="text-muted mb-0 small">{stat.label}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="row g-4">
          {/* Sidebar */}
          <div className="col-lg-3">
            <div className="card border-0 shadow-sm sticky-top" style={{ top: '100px' }}>
              <div className="card-body p-0">
                <div className="nav nav-pills flex-column">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      className={`nav-link text-start border-0 rounded-0 d-flex align-items-center gap-3 ${activeTab === tab.id ? 'active' : ''
                        }`}
                      onClick={() => setActiveTab(tab.id)}
                      style={activeTab === tab.id ? {
                        background: 'linear-gradient(135deg, #9333ea, #f97316)',
                        color: 'white'
                      } : {}}
                    >
                      <tab.icon size={18} />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-lg-9">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                {renderTabContent()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .nav-pills .nav-link {
          color: #6c757d;
          border-radius: 0;
          padding: 0.75rem 1rem;
          transition: all 0.2s ease;
          border: none;
        }

        .nav-pills .nav-link:hover {
          background-color: #e9ecef;
          color: #495057;
        }

        .nav-pills .nav-link.active {
          background: linear-gradient(135deg, #9333ea, #f97316) !important;
          color: white !important;
        }

        .card:hover {
          transform: translateY(-1px);
          transition: all 0.2s ease;
        }

        .btn:hover {
          transform: translateY(-1px);
          transition: all 0.2s ease;
        }

        .table-hover tbody tr:hover {
          background-color: rgba(147, 51, 234, 0.05);
        }

        .btn-group-sm .btn {
          padding: 0.25rem 0.5rem;
        }

        .form-control:focus,
        .form-select:focus {
          border-color: #9333ea;
          box-shadow: 0 0 0 0.2rem rgba(147, 51, 234, 0.25);
        }

        .input-group-text {
          background-color: #f8fafc;
          border-color: #e2e8f0;
        }

        .table th {
          border-top: none;
          font-weight: 600;
          color: #374151;
        }

        @media (max-width: 768px) {
          .nav-pills {
            flex-direction: row;
            overflow-x: auto;
            white-space: nowrap;
          }
          
          .nav-pills .nav-link {
            flex-shrink: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
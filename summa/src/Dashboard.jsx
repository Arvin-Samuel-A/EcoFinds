import React, { useState, useEffect } from 'react';
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
  Trash2
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { Link } from 'react-router-dom';
import './Dashboard.css';
import UserProfileReviews from './UserProfileReviews';

const Dashboard = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [dashboardData, setDashboardData] = useState({
    listings: [],
    purchases: [],
    savedItems: [],
    messages: [],
    reviews: []
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
    // Mock data - replace with actual API calls
    setDashboardData({
      listings: [
        { id: 1, title: 'Vintage Leather Jacket', price: 45, views: 23, status: 'active' },
        { id: 2, title: 'Organic Cotton Dress', price: 30, views: 12, status: 'sold' }
      ],
      purchases: [
        { id: 1, title: 'Eco-Friendly Water Bottle', price: 15, date: '2025-05-28', seller: 'GreenStore' }
      ],
      savedItems: [
        { id: 1, title: 'Sustainable Backpack', price: 60, seller: 'EcoGear' }
      ],
      messages: [
        { id: 1, from: 'buyer123', subject: 'Question about jacket', unread: true }
      ],
      reviews: [
        { id: 1, rating: 5, comment: 'Great seller!', from: 'buyer456' }
      ]
    });
  };

  const handleSaveProfile = () => {
    // API call to update profile
    console.log('Saving profile:', editData);
    setIsEditing(false);
  };

  const stats = [
    { label: 'Active Listings', value: dashboardData.listings.filter(l => l.status === 'active').length, icon: Package, color: 'primary' },
    { label: 'Total Sales', value: dashboardData.listings.filter(l => l.status === 'sold').length, icon: TrendingUp, color: 'success' },
    { label: 'Saved Items', value: dashboardData.savedItems.length, icon: Heart, color: 'danger' },
    { label: 'Messages', value: dashboardData.messages.filter(m => m.unread).length, icon: MessageCircle, color: 'info' }
  ];

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="container-xl py-4">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h1 className="h3 mb-1">Dashboard</h1>
                <p className="text-muted">Welcome back, {user?.name || 'User'}!</p>
              </div>
              <button 
                className="btn btn-outline-primary"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? <X size={18} /> : <Edit3 size={18} />}
                <span className="ms-2">{isEditing ? 'Cancel' : 'Edit Profile'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="row mb-4">
          {stats.map((stat, index) => (
            <div key={index} className="col-lg-3 col-md-6 mb-3">
              <div className="card border-0 shadow-sm h-100 stats-card">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className={`me-3 p-2 rounded bg-${stat.color} bg-opacity-10`}>
                      <stat.icon className={`text-${stat.color}`} size={24} />
                    </div>
                    <div>
                      <h3 className="h4 mb-0">{stat.value}</h3>
                      <p className="text-muted mb-0 small">{stat.label}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="row">
          {/* Sidebar */}
          <div className="col-lg-3 mb-4">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-0">
                <div className="nav nav-pills flex-column">
                  {[
                    { id: 'overview', label: 'Overview', icon: User },
                    { id: 'profile', label: 'Profile', icon: Settings },
                    { id: 'listings', label: 'My Listings', icon: Package },
                    { id: 'purchases', label: 'Purchases', icon: ShoppingBag },
                    { id: 'saved', label: 'Saved Items', icon: Heart },
                    { id: 'messages', label: 'Messages', icon: MessageCircle },
                    { id: 'reviews', label: 'Reviews', icon: Star }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      className={`nav-link text-start border-0 rounded-0 ${activeTab === tab.id ? 'active' : ''}`}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      <tab.icon size={18} className="me-2" />
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
              <div className="card-body">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div>
                    <h5 className="card-title mb-4">Activity Overview</h5>
                    <div className="row">
                      <div className="col-md-6 mb-4">
                        <h6>Recent Listings</h6>
                        {dashboardData.listings.slice(0, 3).map(listing => (
                          <div key={listing.id} className="d-flex justify-content-between align-items-center border-bottom py-2">
                            <div>
                              <div className="fw-medium">{listing.title}</div>
                              <small className="text-muted">${listing.price} • {listing.views} views</small>
                            </div>
                            <span className={`badge bg-${listing.status === 'active' ? 'success' : 'secondary'}`}>
                              {listing.status}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="col-md-6 mb-4">
                        <h6>Recent Messages</h6>
                        {dashboardData.messages.slice(0, 3).map(message => (
                          <div key={message.id} className="d-flex justify-content-between align-items-center border-bottom py-2">
                            <div>
                              <div className="fw-medium">{message.subject}</div>
                              <small className="text-muted">From: {message.from}</small>
                            </div>
                            {message.unread && <span className="badge bg-primary">New</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <div>
                    <h5 className="card-title mb-4">Profile Information</h5>
                    <div className="row">
                      <div className="col-md-4 text-center mb-4">
                        <div className="position-relative d-inline-block">
                          <img 
                            src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}&background=28a745&color=fff`}
                            alt="Profile"
                            className="rounded-circle profile-avatar"
                            width="120"
                            height="120"
                          />
                          {isEditing && (
                            <button className="btn btn-sm btn-primary position-absolute bottom-0 end-0 rounded-circle">
                              <Camera size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="col-md-8">
                        <form>
                          <div className="row">
                            <div className="col-md-6 mb-3">
                              <label className="form-label">Full Name</label>
                              <div className="input-group">
                                <span className="input-group-text"><User size={16} /></span>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={editData.name}
                                  onChange={(e) => setEditData({...editData, name: e.target.value})}
                                  disabled={!isEditing}
                                />
                              </div>
                            </div>
                            <div className="col-md-6 mb-3">
                              <label className="form-label">Email</label>
                              <div className="input-group">
                                <span className="input-group-text"><Mail size={16} /></span>
                                <input
                                  type="email"
                                  className="form-control"
                                  value={editData.email}
                                  onChange={(e) => setEditData({...editData, email: e.target.value})}
                                  disabled={!isEditing}
                                />
                              </div>
                            </div>
                            <div className="col-md-6 mb-3">
                              <label className="form-label">Phone</label>
                              <div className="input-group">
                                <span className="input-group-text"><Phone size={16} /></span>
                                <input
                                  type="tel"
                                  className="form-control"
                                  value={editData.phone}
                                  onChange={(e) => setEditData({...editData, phone: e.target.value})}
                                  disabled={!isEditing}
                                />
                              </div>
                            </div>
                            <div className="col-md-6 mb-3">
                              <label className="form-label">Location</label>
                              <div className="input-group">
                                <span className="input-group-text"><MapPin size={16} /></span>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={editData.location}
                                  onChange={(e) => setEditData({...editData, location: e.target.value})}
                                  disabled={!isEditing}
                                />
                              </div>
                            </div>
                            <div className="col-12 mb-3">
                              <label className="form-label">Bio</label>
                              <textarea
                                className="form-control"
                                rows="3"
                                value={editData.bio}
                                onChange={(e) => setEditData({...editData, bio: e.target.value})}
                                disabled={!isEditing}
                                placeholder="Tell us about yourself..."
                              />
                            </div>
                          </div>
                          {isEditing && (
                            <div className="d-flex gap-2">
                              <button 
                                type="button" 
                                className="btn btn-success"
                                onClick={handleSaveProfile}
                              >
                                <Save size={16} className="me-2" />
                                Save Changes
                              </button>
                              <button 
                                type="button" 
                                className="btn btn-outline-secondary"
                                onClick={() => setIsEditing(false)}
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </form>
                      </div>
                    </div>
                  </div>
                )}

                {/* Listings Tab */}
                {activeTab === 'listings' && (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <h5 className="card-title mb-0">My Listings</h5>
                      <button className="btn btn-success">+ Add New Listing</button>
                    </div>
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Item</th>
                            <th>Price</th>
                            <th>Views</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dashboardData.listings.map(listing => (
                            <tr key={listing.id}>
                              <td>{listing.title}</td>
                              <td>${listing.price}</td>
                              <td>{listing.views}</td>
                              <td>
                                <span className={`badge bg-${listing.status === 'active' ? 'success' : 'secondary'}`}>
                                  {listing.status}
                                </span>
                              </td>
                              <td>
                                <div className="btn-group btn-group-sm">
                                  <button className="btn btn-outline-primary" title="View">
                                    <Eye size={14} />
                                  </button>
                                  <button className="btn btn-outline-secondary" title="Edit">
                                    <Edit3 size={14} />
                                  </button>
                                  <button className="btn btn-outline-danger" title="Delete">
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Purchases Tab */}
                {activeTab === 'purchases' && (
                  <div>
                    <h5 className="card-title mb-4">Purchase History</h5>
                    <div className="row">
                      {dashboardData.purchases.map(purchase => (
                        <div key={purchase.id} className="col-md-6 mb-3">
                          <div className="card">
                            <div className="card-body">
                              <h6 className="card-title">{purchase.title}</h6>
                              <p className="card-text">
                                <small className="text-muted">
                                  Purchased from {purchase.seller} on {purchase.date}
                                </small>
                              </p>
                              <div className="d-flex justify-content-between align-items-center">
                                <span className="fw-bold">${purchase.price}</span>
                                <button className="btn btn-sm btn-outline-primary">Leave Review</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Saved Items Tab */}
                {activeTab === 'saved' && (
                  <div>
                    <h5 className="card-title mb-4">Saved Items</h5>
                    <div className="row">
                      {dashboardData.savedItems.map(item => (
                        <div key={item.id} className="col-md-6 mb-3">
                          <div className="card">
                            <div className="card-body">
                              <h6 className="card-title">{item.title}</h6>
                              <p className="card-text">
                                <small className="text-muted">By {item.seller}</small>
                              </p>
                              <div className="d-flex justify-content-between align-items-center">
                                <span className="fw-bold">${item.price}</span>
                                <button className="btn btn-sm btn-success">View Item</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Messages Tab */}
                {activeTab === 'messages' && (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <h5 className="card-title mb-0">Messages</h5>
                      <Link 
                        to="/messages" 
                        className="btn btn-outline-primary btn-sm"
                      >
                        View All Messages
                      </Link>
                    </div>
                    <div className="list-group">
                      {dashboardData.messages.slice(0, 5).map(message => (
                        <div key={message.id} className="list-group-item d-flex justify-content-between align-items-center">
                          <div>
                            <h6 className="mb-1">{message.subject}</h6>
                            <p className="mb-1 small text-muted">From: {message.from}</p>
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            {message.unread && <span className="badge bg-primary">New</span>}
                            <Link 
                              to={`/chat/${message.userId}`}
                              className="btn btn-sm btn-outline-primary"
                            >
                              Reply
                            </Link>
                          </div>
                        </div>
                      ))}
                      {dashboardData.messages.length === 0 && (
                        <div className="text-center py-4">
                          <MessageCircle size={48} className="text-muted mb-3" />
                          <p className="text-muted">No messages yet</p>
                          <Link to="/marketplace" className="btn btn-primary btn-sm">
                            Browse Products
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Reviews Tab */}
                {activeTab === 'reviews' && (
                  <div>
                    <div className="mb-4">
                      <h5 className="card-title">Your Reviews & Ratings</h5>
                      <p className="text-muted">Manage your reviews and see what others are saying about you.</p>
                    </div>
                    
                    {/* Tab Navigation for Reviews */}
                    <ul className="nav nav-pills mb-4">
                      <li className="nav-item">
                        <button 
                          className={`nav-link ${reviewsSubTab === 'received' ? 'active' : ''}`}
                          onClick={() => setReviewsSubTab('received')}
                        >
                          Reviews Received
                        </button>
                      </li>
                      <li className="nav-item">
                        <button 
                          className={`nav-link ${reviewsSubTab === 'given' ? 'active' : ''}`}
                          onClick={() => setReviewsSubTab('given')}
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
                      <div className="card">
                        <div className="card-body">
                          <h6>Reviews You've Written</h6>
                          {/* This would show reviews the user has written about others */}
                          <div className="text-center py-4">
                            <MessageCircle size={48} className="text-muted mb-3" />
                            <p className="text-muted">You haven't written any reviews yet.</p>
                            <Link to="/marketplace" className="btn btn-primary btn-sm">
                              Shop & Review Products
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
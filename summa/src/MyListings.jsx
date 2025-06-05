import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Edit3,
  Trash2,
  Heart,
  ShoppingCart,
  Leaf,
  Menu,
  X,
  User,
  LogOut,
  Grid3X3,
  List,
  Package,
  Gavel,
  Clock,
  Eye,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Calendar,
} from 'lucide-react';
import { useAuth } from './AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';

const API_BASE_URL = 'http://localhost:5000/api';

const MyListings = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // State management
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [filterType, setFilterType] = useState('all'); // all, active, sold, auction
  const [error, setError] = useState('');
  const [deleteModal, setDeleteModal] = useState({ show: false, product: null });

  // Fetch user's listings
  const fetchMyListings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');

      // Fetch both products and auctions
      const [productsResponse, auctionsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/products/my-listings`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/auctions/my-auctions`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const productsData = await productsResponse.json();
      const auctionsData = await auctionsResponse.json();

      if (productsResponse.ok && auctionsResponse.ok) {
        // Combine and mark the type
        const allListings = [
          ...(productsData.products || []).map(p => ({ ...p, type: 'product' })),
          ...(auctionsData.auctions || []).map(a => ({ ...a, type: 'auction' }))
        ];

        setListings(allListings);
      } else {
        setError('Failed to fetch your listings');
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
      setError('Failed to fetch your listings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchMyListings();
    }
  }, [user, fetchMyListings]);

  // Filter listings based on type
  const filteredListings = listings.filter(listing => {
    switch (filterType) {
      case 'active':
        return listing.status === 'active' && !listing.isAuction;
      case 'auction':
        return listing.isAuction && new Date(listing.auctionEndDate) > new Date();
      case 'sold':
        return listing.status === 'sold';
      case 'expired':
        return listing.isAuction && new Date(listing.auctionEndDate) <= new Date();
      default:
        return true;
    }
  });

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleDelete = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setListings(prev => prev.filter(listing => listing._id !== productId));
        setDeleteModal({ show: false, product: null });
      } else {
        setError('Failed to delete listing');
      }
    } catch (error) {
      console.error('Error deleting listing:', error);
      setError('Failed to delete listing');
    }
  };

  const formatTimeRemaining = (endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStatusBadge = (listing) => {
    if (listing.isAuction) {
      const isExpired = new Date(listing.auctionEndDate) <= new Date();
      if (isExpired) {
        return <span className="badge bg-secondary">Auction Ended</span>;
      }
      return <span className="badge bg-primary">Active Auction</span>;
    }

    switch (listing.status) {
      case 'active':
        return <span className="badge bg-success">Active</span>;
      case 'sold':
        return <span className="badge bg-warning">Sold</span>;
      case 'draft':
        return <span className="badge bg-secondary">Draft</span>;
      default:
        return <span className="badge bg-light text-dark">Unknown</span>;
    }
  };

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
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-warning">3</span>
              </button>
              <button className="btn position-relative me-3">
                <ShoppingCart size={20} />
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-warning">2</span>
              </button>

              {user ? (
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
                      <User size={32} className="text-muted me-2" />
                    )}
                    <span className="small fw-medium">{user.name}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="btn"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              ) : (
                <div className="d-flex gap-2">
                  <Link
                    to="/login"
                    className="btn btn-outline-primary rounded-pill px-4 text-decoration-none"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    className="btn text-white rounded-pill px-4 text-decoration-none"
                    style={{ background: 'linear-gradient(135deg, #9333ea, #f97316)' }}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="container-fluid d-lg-none">
              <div className="border-top pt-3 mt-3">
                <div className="d-flex flex-column gap-2">
                  {user ? (
                    <div className="mt-2">
                      <div className="small text-muted mb-2">Welcome, {user.name}</div>
                      <button
                        onClick={handleLogout}
                        className="btn btn-danger w-100 rounded-pill"
                      >
                        Logout
                      </button>
                    </div>
                  ) : (
                    <div className="mt-2 d-flex flex-column gap-2">
                      <Link
                        to="/login"
                        className="btn btn-outline-primary w-100 rounded-pill text-decoration-none"
                      >
                        Sign In
                      </Link>
                      <Link
                        to="/signup"
                        className="btn w-100 rounded-pill text-decoration-none text-white"
                        style={{ background: 'linear-gradient(135deg, #9333ea, #f97316)' }}
                      >
                        Sign Up
                      </Link>
                    </div>
                  )}
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
                    My Listings
                  </h1>
                  <p className="text-muted mb-0">
                    Manage your products and auctions
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-6 text-md-end">
              <div className="d-flex align-items-center justify-content-md-end gap-2 mt-3 mt-md-0">
                <div className="btn-group" role="group">
                  <button
                    type="button"
                    className={`btn ${viewMode === 'grid' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3X3 size={16} />
                  </button>
                  <button
                    type="button"
                    className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setViewMode('list')}
                  >
                    <List size={16} />
                  </button>
                </div>

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

      {/* Filter Pills */}
      <div className="bg-white border-bottom">
        <div className="container-fluid px-4 py-3">
          <div className="d-flex gap-2 overflow-auto pb-2">
            {[
              { key: 'all', label: 'All Listings', icon: Package },
              { key: 'active', label: 'Active', icon: CheckCircle },
              { key: 'auction', label: 'Auctions', icon: Gavel },
              { key: 'sold', label: 'Sold', icon: TrendingUp },
              { key: 'expired', label: 'Expired', icon: AlertCircle }
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setFilterType(filter.key)}
                className={`btn btn-sm rounded-pill text-nowrap d-flex align-items-center gap-2 ${filterType === filter.key
                    ? 'btn-primary'
                    : 'btn-outline-secondary'
                  }`}
                style={{ minWidth: 'fit-content' }}
              >
                <filter.icon size={14} />
                <span>{filter.label}</span>
                <span className="badge bg-light text-dark ms-1">
                  {listings.filter(listing => {
                    switch (filter.key) {
                      case 'active':
                        return listing.status === 'active' && !listing.isAuction;
                      case 'auction':
                        return listing.isAuction && new Date(listing.auctionEndDate) > new Date();
                      case 'sold':
                        return listing.status === 'sold';
                      case 'expired':
                        return listing.isAuction && new Date(listing.auctionEndDate) <= new Date();
                      default:
                        return true;
                    }
                  }).length}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-fluid px-4 py-4">
        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
            <AlertCircle className="me-2" size={16} />
            {error}
          </div>
        )}

        {/* Results Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h5 className="mb-1">
              {filterType === 'all' ? 'All Listings' :
                filterType === 'active' ? 'Active Listings' :
                  filterType === 'auction' ? 'Active Auctions' :
                    filterType === 'sold' ? 'Sold Items' :
                      'Expired Auctions'}
            </h5>
            <p className="text-muted small mb-0">
              {filteredListings.length} {filteredListings.length === 1 ? 'item' : 'items'} found
            </p>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted mt-3">Loading your listings...</p>
          </div>
        ) : (
          <>
            {/* Listings Grid/List */}
            <div className={viewMode === 'grid' ? 'row g-4' : 'row g-3'}>
              {filteredListings.length > 0 ? filteredListings.map((listing) => (
                <div
                  key={listing._id}
                  className={viewMode === 'grid' ? 'col-6 col-md-4 col-lg-3' : 'col-12'}
                >
                  {viewMode === 'grid' ? (
                    // Grid View Card
                    <div className="card h-100 border-0 shadow-sm" style={{ transition: 'all 0.2s' }}>
                      <div
                        className="position-relative overflow-hidden"
                        style={{ paddingTop: '75%', background: 'linear-gradient(135deg, #ede9fe, #fed7aa)' }}
                      >
                        {listing.images && listing.images.length > 0 ? (
                          <img
                            src={listing.images[0].url}
                            alt={listing.images[0].altText || listing.name}
                            className="position-absolute top-0 start-0 w-100 h-100"
                            style={{ objectFit: 'cover' }}
                          />
                        ) : (
                          <div className="position-absolute top-50 start-50 translate-middle">
                            <div className="display-6">📦</div>
                          </div>
                        )}

                        {/* Status Badge */}
                        <div className="position-absolute top-0 start-0 m-2">
                          {getStatusBadge(listing)}
                        </div>

                        {/* Auction Timer */}
                        {listing.isAuction && (
                          <div className="position-absolute bottom-0 start-0 end-0 bg-dark bg-opacity-75 text-white p-2">
                            <div className="d-flex align-items-center justify-content-between">
                              <div className="d-flex align-items-center">
                                <Clock size={12} className="me-1" />
                                <small>{formatTimeRemaining(listing.auctionEndDate)}</small>
                              </div>
                              <div className="d-flex align-items-center">
                                <Gavel size={12} className="me-1" />
                                <small>₹{listing.currentBid || listing.minimumBid}</small>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="card-body p-3">
                        <h6 className="card-title fw-medium mb-2 text-truncate">{listing.name}</h6>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="h6 fw-bold mb-0" style={{ color: '#9333ea' }}>
                            ₹{listing.price?.toLocaleString()}
                          </span>
                          <div className="d-flex align-items-center">
                            <Eye size={12} className="text-muted me-1" />
                            <span className="small text-muted">{listing.views || 0}</span>
                          </div>
                        </div>

                        {listing.isAuction && (
                          <div className="mb-2">
                            <small className="text-muted">
                              Current Bid: <span className="fw-medium">₹{listing.currentBid || listing.minimumBid}</span>
                            </small>
                          </div>
                        )}

                        <div className="d-flex gap-2">
                          <Link
                            to={`/productmanager/${listing._id}`}
                            className="btn btn-outline-primary btn-sm flex-fill"
                          >
                            <Edit3 size={12} className="me-1" />
                            Edit
                          </Link>
                          <button
                            onClick={() => setDeleteModal({ show: true, product: listing })}
                            className="btn btn-outline-danger btn-sm flex-fill"
                          >
                            <Trash2 size={12} className="me-1" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // List View Card
                    <div className="card border-0 shadow-sm">
                      <div className="row g-0">
                        <div className="col-3">
                          <div
                            className="h-100 d-flex align-items-center justify-content-center position-relative"
                            style={{
                              minHeight: '120px',
                              background: 'linear-gradient(135deg, #ede9fe, #fed7aa)'
                            }}
                          >
                            {listing.images && listing.images.length > 0 ? (
                              <img
                                src={listing.images[0].url}
                                alt={listing.images[0].altText || listing.name}
                                className="w-100 h-100"
                                style={{ objectFit: 'cover' }}
                              />
                            ) : (
                              <div className="display-6">📦</div>
                            )}

                            {/* Status Badge */}
                            <div className="position-absolute top-0 start-0 m-2">
                              {getStatusBadge(listing)}
                            </div>
                          </div>
                        </div>
                        <div className="col-9">
                          <div className="card-body">
                            <div className="d-flex justify-content-between align-items-start">
                              <div className="flex-grow-1">
                                <h6 className="card-title fw-medium mb-1">{listing.name}</h6>
                                <p className="card-text small text-muted mb-2 text-truncate">
                                  {listing.description}
                                </p>

                                <div className="row g-3 mb-3">
                                  <div className="col-auto">
                                    <span className="h6 fw-bold mb-0" style={{ color: '#9333ea' }}>
                                      ₹{listing.price?.toLocaleString()}
                                    </span>
                                  </div>

                                  {listing.isAuction && (
                                    <>
                                      <div className="col-auto">
                                        <small className="text-muted">
                                          Current Bid: <span className="fw-medium">₹{listing.currentBid || listing.minimumBid}</span>
                                        </small>
                                      </div>
                                      <div className="col-auto">
                                        <small className="text-muted d-flex align-items-center">
                                          <Clock size={10} className="me-1" />
                                          {formatTimeRemaining(listing.auctionEndDate)}
                                        </small>
                                      </div>
                                    </>
                                  )}

                                  <div className="col-auto">
                                    <small className="text-muted d-flex align-items-center">
                                      <Eye size={10} className="me-1" />
                                      {listing.views || 0} views
                                    </small>
                                  </div>

                                  <div className="col-auto">
                                    <small className="text-muted d-flex align-items-center">
                                      <Calendar size={10} className="me-1" />
                                      {new Date(listing.createdAt).toLocaleDateString()}
                                    </small>
                                  </div>
                                </div>

                                <div className="d-flex gap-2">
                                  <Link
                                    to={`/productmanager/${listing._id}`}
                                    className="btn btn-outline-primary btn-sm"
                                  >
                                    <Edit3 size={12} className="me-1" />
                                    Edit
                                  </Link>
                                  <button
                                    onClick={() => setDeleteModal({ show: true, product: listing })}
                                    className="btn btn-outline-danger btn-sm"
                                  >
                                    <Trash2 size={12} className="me-1" />
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )) : (
                <div className="col-12 text-center py-5">
                  <div className="display-1 mb-3">📝</div>
                  <h3 className="fw-bold text-dark mb-2">No listings found</h3>
                  <p className="text-muted mb-4">
                    {filterType === 'all'
                      ? "You haven't created any listings yet. Start selling your items today!"
                      : `No ${filterType} listings found. Try adjusting your filter.`
                    }
                  </p>
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
          </>
        )}
      </div>

      {/* Floating Add Button for Mobile */}
      <Link
        to="/productmanager"
        className="btn text-white rounded-circle shadow-lg position-fixed d-md-none"
        style={{
          background: 'linear-gradient(135deg, #9333ea, #f97316)',
          bottom: '20px',
          right: '20px',
          width: '56px',
          height: '56px',
          zIndex: 1000
        }}
      >
        <Plus size={24} />
      </Link>

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Deletion</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setDeleteModal({ show: false, product: null })}
                ></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete "<strong>{deleteModal.product?.name}</strong>"?</p>
                <p className="text-muted">This action cannot be undone.</p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setDeleteModal({ show: false, product: null })}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => handleDelete(deleteModal.product._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important;
        }
        
        .btn:hover {
          transform: translateY(-1px);
          transition: all 0.2s ease;
        }
        
        .overflow-auto::-webkit-scrollbar {
          height: 4px;
        }
        
        .overflow-auto::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        
        .overflow-auto::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;
        }
        
        .overflow-auto::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
      `}</style>
    </div>
  );
};

export default MyListings;
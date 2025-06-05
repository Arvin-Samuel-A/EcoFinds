import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Heart,
  Share2,
  MessageCircle,
  ShoppingCart,
  Star,
  MapPin,
  Calendar,
  Package,
  Shield,
  Truck,
  User,
  Clock,
  Gavel,
  TrendingUp,
  Award,
  Eye,
  Leaf,
  Plus
} from 'lucide-react';
import { useAuth } from './AuthContext';
import ReviewsComponent from './ReviewsComponent';
import UserProfileReviews from './UserProfileReviews';

const API_BASE_URL = 'http://localhost:5000/api';

const ProductDetailPage = () => {
  const { productId, auctionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [item, setItem] = useState(null);
  const [isAuction, setIsAuction] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('details');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [bidAmount, setBidAmount] = useState('');
  const [timeRemaining, setTimeRemaining] = useState('');
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Calculate time remaining for auctions
  const calculateTimeRemaining = (endTime) => { // Changed from endDate
    const now = new Date();
    const end = new Date(endTime); // Changed from endDate
    const diff = end - now;

    if (diff <= 0) return 'Auction ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true);
        let response;
        let endpoint;

        if (auctionId) {
          endpoint = `${API_BASE_URL}/auctions/${auctionId}`;
          setIsAuction(true);
        } else {
          endpoint = `${API_BASE_URL}/products/${productId}`;
          setIsAuction(false);
        }

        response = await fetch(endpoint);
        
        if (response.ok) {
          const data = await response.json();
          setItem(data);
          
          if (isAuction && data.endTime) { // Changed from endDate
            setTimeRemaining(calculateTimeRemaining(data.endTime)); // Changed from endDate
            setBidAmount((parseFloat(data.currentPrice) + 50).toString()); // Changed from currentBid
          }
        } else {
          setError('Item not found');
          setTimeout(() => navigate('/marketplace'), 2000);
        }
      } catch (error) {
        console.error('Error fetching item:', error);
        setError('Failed to load item');
        setTimeout(() => navigate('/marketplace'), 2000);
      } finally {
        setLoading(false);
      }
    };

    if (productId || auctionId) {
      fetchItem();
    }
  }, [productId, auctionId, navigate, isAuction]);

  // Update time remaining every minute for auctions
  useEffect(() => {
    if (isAuction && item?.endTime) { // Changed from endDate
      const interval = setInterval(() => {
        setTimeRemaining(calculateTimeRemaining(item.endTime)); // Changed from endDate
      }, 60000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [isAuction, item?.endTime]); // Changed from endDate

  const handleStartChat = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate(`/chat/${item.seller._id}/${item._id}`);
  };

  const handlePlaceBid = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!bidAmount || parseFloat(bidAmount) <= parseFloat(item.currentPrice)) { // Changed from currentBid
      setError('Bid must be higher than current bid');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/auctions/${item._id}/bid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: parseFloat(bidAmount) }) // Changed from bidAmount
      });

      if (response.ok) {
        const data = await response.json();
        setItem(prev => ({
          ...prev,
          currentPrice: data.currentPrice, // Changed from currentBid
          bids: data.bids
        }));
        setBidAmount((parseFloat(data.currentPrice) + 50).toString()); // Changed from currentBid
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to place bid');
      }
    } catch (error) {
      console.error('Error placing bid:', error);
      setError('Failed to place bid');
    }
  };

  const handleAddToWishlist = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const endpoint = isAuction
        ? `${API_BASE_URL}/wishlists/auction/${item._id}`
        : `${API_BASE_URL}/wishlists/product/${item._id}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setIsWishlisted(!isWishlisted);
      }
    } catch (error) {
      console.error('Error updating wishlist:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: '#f8fafc' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading {isAuction ? 'auction' : 'product'} details...</p>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-vh-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: '#f8fafc' }}>
        <div className="text-center">
          <div className="display-1 mb-3">😕</div>
          <h3 className="fw-bold text-dark mb-2">{error || 'Item not found'}</h3>
          <p className="text-muted mb-4">The {isAuction ? 'auction' : 'product'} you're looking for doesn't exist or has been removed.</p>
          <Link
            to="/marketplace"
            className="btn text-white px-4 py-2"
            style={{ background: 'linear-gradient(135deg, #9333ea, #f97316)' }}
          >
            Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100" style={{ backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <div className="bg-white border-bottom sticky-top">
        <div className="container-fluid px-4 py-3">
          <div className="d-flex align-items-center">
            <button
              onClick={() => navigate(-1)}
              className="btn btn-light rounded-circle me-3 d-flex align-items-center justify-content-center"
              style={{ width: '40px', height: '40px' }}
            >
              <ArrowLeft size={20} />
            </button>

            <div className="d-flex align-items-center">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center me-3"
                style={{
                  width: '40px',
                  height: '40px',
                  background: 'linear-gradient(135deg, #9333ea, #f97316)'
                }}
              >
                {isAuction ? <Gavel className="text-white" size={20} /> : <Leaf className="text-white" size={20} />}
              </div>
              <div>
                <h1 className="h5 fw-bold mb-0" style={{ color: '#1e293b' }}>
                  {isAuction ? item.title : item.name}
                </h1>
                <p className="text-muted small mb-0">
                  {isAuction ? 'Auction Details' : 'Product Details'}
                </p>
              </div>
            </div>

            <div className="ms-auto d-flex gap-2">
              <button
                onClick={handleAddToWishlist}
                className={`btn btn-sm rounded-circle ${isWishlisted ? 'btn-danger' : 'btn-outline-secondary'}`}
                style={{ width: '40px', height: '40px' }}
              >
                <Heart size={16} fill={isWishlisted ? 'currentColor' : 'none'} />
              </button>
              <button className="btn btn-outline-secondary btn-sm rounded-circle" style={{ width: '40px', height: '40px' }}>
                <Share2 size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container-fluid px-4 py-4">
        <div className="row g-4">
          {/* Product Images */}
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm">
              <div className="position-relative overflow-hidden" style={{ paddingTop: '75%', borderRadius: '0.5rem 0.5rem 0 0' }}>
                {item.images && item.images.length > 0 ? (
                  <img
                    src={item.images[currentImageIndex]?.url}
                    alt={item.images[currentImageIndex]?.altText || (isAuction ? item.title : item.name)}
                    className="position-absolute top-0 start-0 w-100 h-100"
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                    style={{ background: 'linear-gradient(135deg, #ede9fe, #fed7aa)' }}
                  >
                    <Package size={64} className="text-muted" />
                  </div>
                )}

                {/* Auction Badge */}
                {isAuction && (
                  <div className="position-absolute top-0 start-0 m-3">
                    <span className="badge bg-warning text-dark d-flex align-items-center gap-1">
                      <Gavel size={12} />
                      Live Auction
                    </span>
                  </div>
                )}
              </div>

              {/* Image Thumbnails */}
              {item.images && item.images.length > 1 && (
                <div className="card-footer bg-white border-0 p-3">
                  <div className="d-flex gap-2 overflow-auto">
                    {item.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`btn p-0 border rounded ${currentImageIndex === index ? 'border-primary' : 'border-light'
                          }`}
                        style={{ width: '60px', height: '60px', flexShrink: 0 }}
                      >
                        <img
                          src={image.url}
                          alt={`${isAuction ? item.title : item.name} ${index + 1}`}
                          className="w-100 h-100 rounded"
                          style={{ objectFit: 'cover' }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Product/Auction Info */}
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body p-4">
                {/* Header */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="flex-grow-1">
                      <h1 className="h3 fw-bold mb-2" style={{ color: '#1e293b' }}>
                        {isAuction ? item.title : item.name}
                      </h1>
                      <div className="d-flex align-items-center gap-3 mb-3">
                        {/* Rating */}
                        {!isAuction && item.rating > 0 ? (
                          <div className="d-flex align-items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={16}
                                className={star <= Math.round(item.rating) ? 'text-warning' : 'text-muted'}
                                fill={star <= Math.round(item.rating) ? 'currentColor' : 'none'}
                              />
                            ))}
                            <span className="ms-2 text-muted small">
                              {item.rating.toFixed(1)} ({item.numReviews} review{item.numReviews !== 1 ? 's' : ''})
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted small">
                            {isAuction ? `${item.bids?.length || 0} bid${item.bids?.length !== 1 ? 's' : ''}` : 'No reviews yet'}
                          </span>
                        )}

                        {/* Category Badge */}
                        <span className="badge bg-light text-dark">
                          {item.category || 'Uncategorized'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Price Section */}
                  <div className="mb-4">
                    {isAuction ? (
                      <div className="row g-3">
                        <div className="col-md-6">
                          <div className="p-3 bg-light rounded">
                            <div className="small text-muted mb-1">Current Bid</div>
                            <div className="h4 fw-bold mb-0" style={{ color: '#9333ea' }}>
                              ₹{parseFloat(item.currentPrice)?.toLocaleString()} {/* Changed from currentBid */}
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="p-3 bg-light rounded">
                            <div className="small text-muted mb-1 d-flex align-items-center">
                              <Clock size={14} className="me-1" />
                              Time Remaining
                            </div>
                            <div className={`h6 fw-bold mb-0 ${timeRemaining === 'Auction ended' ? 'text-danger' : 'text-success'}`}>
                              {timeRemaining}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div className="h2 fw-bold mb-0" style={{ color: '#9333ea' }}>
                          ₹{item.price?.toLocaleString()}
                        </div>
                        <div className="text-end">
                          <div className="small text-muted">Stock</div>
                          <div className="fw-medium">{item.countInStock} available</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Seller Info */}
                <div className="border rounded-3 p-3 mb-4" style={{ backgroundColor: '#f8fafc' }}>
                  <div className="d-flex align-items-center">
                    <div className="me-3">
                      {item.seller?.images?.url ? (
                        <img
                          src={item.seller.images.url}
                          alt={item.seller.name}
                          className="rounded-circle"
                          style={{ width: '48px', height: '48px', objectFit: 'cover' }}
                        />
                      ) : (
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center text-white"
                          style={{
                            width: '48px',
                            height: '48px',
                            background: 'linear-gradient(135deg, #9333ea, #f97316)'
                          }}
                        >
                          <User size={24} />
                        </div>
                      )}
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="fw-semibold mb-1">{item.seller?.name}</h6>
                      <div className="d-flex align-items-center gap-3 text-muted small">
                        <div className="d-flex align-items-center">
                          <MapPin size={12} className="me-1" />
                          {item.seller?.location || 'Location not specified'}
                        </div>
                        {item.seller?.rating && (
                          <div className="d-flex align-items-center">
                            <Star size={12} className="me-1 text-warning" fill="currentColor" />
                            {item.seller.rating.toFixed(1)} seller rating
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={handleStartChat}
                      className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2"
                    >
                      <MessageCircle size={14} />
                      Chat
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="d-grid gap-3">
                  {isAuction ? (
                    <>
                      {timeRemaining !== 'Auction ended' && user?._id !== item.seller._id && (
                        <>
                          <div className="input-group">
                            <span className="input-group-text">₹</span>
                            <input
                              type="number"
                              className="form-control"
                              placeholder={`Min: ${parseFloat(item.currentPrice) + 1}`}
                              value={bidAmount}
                              onChange={(e) => setBidAmount(e.target.value)}
                              min={parseFloat(item.currentPrice) + 1}
                            />
                            <button 
                              onClick={handlePlaceBid}
                              className="btn text-white"
                              style={{ background: 'linear-gradient(135deg, #9333ea, #f97316)' }}
                              disabled={!bidAmount || parseFloat(bidAmount) <= parseFloat(item.currentPrice)}
                            >
                              <Gavel size={16} className="me-2" />
                              Place Bid
                            </button>
                          </div>
                          {error && (
                            <div className="alert alert-danger py-2 mb-0" role="alert">
                              <small>{error}</small>
                            </div>
                          )}
                        </>
                      )}
                      <button
                        onClick={handleStartChat}
                        className="btn btn-outline-primary btn-lg"
                      >
                        <MessageCircle size={20} className="me-2" />
                        Chat with Seller
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="btn text-white btn-lg"
                        style={{ background: 'linear-gradient(135deg, #9333ea, #f97316)' }}
                        disabled={item.countInStock === 0}
                      >
                        <ShoppingCart size={20} className="me-2" />
                        {item.countInStock === 0 ? 'Out of Stock' : 'Add to Cart'}
                      </button>
                      <button
                        onClick={handleStartChat}
                        className="btn btn-outline-primary"
                      >
                        <MessageCircle size={16} className="me-2" />
                        Contact Seller
                      </button>
                    </>
                  )}
                </div>

                {/* Stats */}
                <div className="row mt-4 text-center">
                  <div className="col-4">
                    <div className="border-end">
                      <div className="fw-bold">
                        {isAuction ? item.bids?.length || 0 : item.countInStock}
                      </div>
                      <small className="text-muted">
                        {isAuction ? 'Bids' : 'In Stock'}
                      </small>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="border-end">
                      <div className="fw-bold">
                        {isAuction ? (item.views || 0) : item.numReviews}
                      </div>
                      <small className="text-muted">
                        {isAuction ? 'Views' : 'Reviews'}
                      </small>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="fw-bold">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                    <small className="text-muted">Listed</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="row">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              {/* Tab Navigation */}
              <div className="card-header bg-white border-0">
                <ul className="nav nav-tabs card-header-tabs border-0">
                  <li className="nav-item">
                    <button
                      className={`nav-link border-0 ${activeTab === 'details' ? 'active' : ''}`}
                      onClick={() => setActiveTab('details')}
                      style={activeTab === 'details' ? {
                        borderBottom: '3px solid #9333ea !important',
                        color: '#9333ea'
                      } : {}}
                    >
                      <Package size={16} className="me-2" />
                      Details
                    </button>
                  </li>
                  {!isAuction && (
                    <li className="nav-item">
                      <button
                        className={`nav-link border-0 ${activeTab === 'reviews' ? 'active' : ''}`}
                        onClick={() => setActiveTab('reviews')}
                        style={activeTab === 'reviews' ? {
                          borderBottom: '3px solid #9333ea !important',
                          color: '#9333ea'
                        } : {}}
                      >
                        <Star size={16} className="me-2" />
                        Reviews ({item.numReviews})
                      </button>
                    </li>
                  )}
                  {isAuction && (
                    <li className="nav-item">
                      <button
                        className={`nav-link border-0 ${activeTab === 'bids' ? 'active' : ''}`}
                        onClick={() => setActiveTab('bids')}
                        style={activeTab === 'bids' ? {
                          borderBottom: '3px solid #9333ea !important',
                          color: '#9333ea'
                        } : {}}
                      >
                        <TrendingUp size={16} className="me-2" />
                        Bid History ({item.bids?.length || 0})
                      </button>
                    </li>
                  )}
                  <li className="nav-item">
                    <button
                      className={`nav-link border-0 ${activeTab === 'seller' ? 'active' : ''}`}
                      onClick={() => setActiveTab('seller')}
                      style={activeTab === 'seller' ? {
                        borderBottom: '3px solid #9333ea !important',
                        color: '#9333ea'
                      } : {}}
                    >
                      <User size={16} className="me-2" />
                      Seller Info
                    </button>
                  </li>
                </ul>
              </div>

              {/* Tab Content */}
              <div className="card-body p-4">
                {activeTab === 'details' && (
                  <div>
                    <h5 className="fw-semibold mb-3">Description</h5>
                    <p className="text-muted mb-4">{item.description}</p>

                    {!isAuction && item.specifications && item.specifications.length > 0 && (
                      <div className="mb-4">
                        <h6 className="fw-semibold mb-3">Specifications</h6>
                        <div className="table-responsive">
                          <table className="table table-borderless">
                            <tbody>
                              {item.specifications.map((spec, index) => (
                                <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#f8fafc' : 'transparent' }}>
                                  <td className="fw-medium py-2" style={{ width: '30%' }}>{spec.key}</td>
                                  <td className="py-2">{spec.value}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {!isAuction && item.features && item.features.length > 0 && (
                      <div>
                        <h6 className="fw-semibold mb-3">Key Features</h6>
                        <div className="row">
                          {item.features.map((feature, index) => (
                            <div key={index} className="col-md-6 mb-2">
                              <div className="d-flex align-items-center">
                                <div
                                  className="rounded-circle d-flex align-items-center justify-content-center me-2"
                                  style={{
                                    width: '20px',
                                    height: '20px',
                                    background: 'linear-gradient(135deg, #9333ea, #f97316)'
                                  }}
                                >
                                  <span className="text-white" style={{ fontSize: '10px' }}>✓</span>
                                </div>
                                <span>{feature}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {isAuction && (
                      <div className="row g-4">
                        <div className="col-md-6">
                          <h6 className="fw-semibold mb-3">Auction Details</h6>
                          <div className="table-responsive">
                            <table className="table table-borderless">
                              <tbody>
                                <tr>
                                  <td className="fw-medium">Starting Bid</td>
                                  <td>₹{parseFloat(item.startPrice)?.toLocaleString()}</td> {/* Changed from startingBid */}
                                </tr>
                                <tr>
                                  <td className="fw-medium">Current Bid</td>
                                  <td>₹{parseFloat(item.currentPrice)?.toLocaleString()}</td> {/* Changed from currentBid */}
                                </tr>
                                {item.reservePrice && (
                                  <tr>
                                    <td className="fw-medium">Reserve Price</td>
                                    <td>₹{parseFloat(item.reservePrice)?.toLocaleString()}</td>
                                  </tr>
                                )}
                                <tr>
                                  <td className="fw-medium">Condition</td>
                                  <td className="text-capitalize">{item.condition}</td>
                                </tr>
                                <tr>
                                  <td className="fw-medium">Auction Ends</td>
                                  <td>{new Date(item.endTime).toLocaleString()}</td> {/* Changed from endDate */}
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'reviews' && !isAuction && (
                  <ReviewsComponent
                    productId={item._id}
                    sellerId={item.seller._id}
                    showAddReview={user && user._id !== item.seller._id}
                  />
                )}

                {activeTab === 'bids' && isAuction && (
                  <div>
                    <h5 className="fw-semibold mb-3">Bid History</h5>
                    {item.bids && item.bids.length > 0 ? (
                      <div className="table-responsive">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Bidder</th>
                              <th>Amount</th>
                              <th>Time</th>
                            </tr>
                          </thead>
                          <tbody>
                            {item.bids
                              .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                              .map((bid, index) => (
                                <tr key={index}>
                                  <td>{bid.bidder?.name || 'Anonymous'}</td>
                                  <td className="fw-bold">₹{parseFloat(bid.amount)?.toLocaleString()}</td>
                                  <td className="text-muted">
                                    {new Date(bid.timestamp).toLocaleString()}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <Gavel size={48} className="text-muted mb-3" />
                        <p className="text-muted">No bids placed yet. Be the first to bid!</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'seller' && (
                  <div>
                    <div className="row">
                      <div className="col-md-4">
                        <div className="text-center mb-4">
                          {item.seller?.images?.url ? (
                            <img
                              src={item.seller.images.url}
                              alt={item.seller.name}
                              className="rounded-circle mb-3"
                              style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                            />
                          ) : (
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center text-white mx-auto mb-3"
                              style={{
                                width: '120px',
                                height: '120px',
                                background: 'linear-gradient(135deg, #9333ea, #f97316)'
                              }}
                            >
                              <User size={48} />
                            </div>
                          )}
                          <h5 className="fw-semibold">{item.seller?.name}</h5>
                          <p className="text-muted">
                            Member since {new Date(item.seller?.createdAt).toLocaleDateString()}
                          </p>
                          {item.seller?.rating && (
                            <div className="d-flex align-items-center justify-content-center mb-3">
                              <Star size={16} className="text-warning me-1" fill="currentColor" />
                              <span className="fw-medium">{item.seller.rating.toFixed(1)}</span>
                              <span className="text-muted ms-1">seller rating</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="col-md-8">
                        <UserProfileReviews
                          userId={item.seller._id}
                          userType="seller"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .nav-tabs .nav-link.active {
          border-bottom: 3px solid #9333ea !important;
          color: #9333ea !important;
          background: none !important;
        }
        
        .nav-tabs .nav-link:hover {
          border-color: transparent !important;
          color: #9333ea !important;
        }
        
        .card:hover {
          transform: translateY(-1px);
          transition: all 0.2s ease;
        }
        
        .btn:hover {
          transform: translateY(-1px);
          transition: all 0.2s ease;
        }
      `}</style>
    </div>
  );
};

export default ProductDetailPage;
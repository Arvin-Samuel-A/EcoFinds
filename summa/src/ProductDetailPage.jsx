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
  User
} from 'lucide-react';
import { useAuth } from './AuthContext';
import ReviewsComponent from './ReviewsComponent';
import UserProfileReviews from './UserProfileReviews';

const API_BASE_URL = 'http://localhost:5000/api';

const ProductDetailPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/products/${productId}`);
        
        if (response.ok) {
          const data = await response.json();
          setProduct(data);
        } else {
          navigate('/marketplace');
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        navigate('/marketplace');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId, navigate]);

  const handleStartChat = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate(`/chat/${product.seller._id}/${product._id}`);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container text-center py-5">
        <h3>Product not found</h3>
        <Link to="/marketplace" className="btn btn-primary">
          Back to Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-light">
      {/* Header */}
      <div className="bg-white border-bottom">
        <div className="container-fluid px-4 py-3">
          <div className="row align-items-center">
            <div className="col-auto">
              <button 
                onClick={() => navigate(-1)}
                className="btn btn-light rounded-circle me-3"
                style={{ width: '40px', height: '40px' }}
              >
                <ArrowLeft size={20} />
              </button>
            </div>
            <div className="col">
              <h1 className="h5 mb-0">{product.name}</h1>
            </div>
            <div className="col-auto">
              <div className="d-flex gap-2">
                <button className="btn btn-outline-secondary btn-sm">
                  <Heart size={16} />
                </button>
                <button className="btn btn-outline-secondary btn-sm">
                  <Share2 size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container-fluid px-4 py-4">
        <div className="row">
          {/* Product Images */}
          <div className="col-lg-6 mb-4">
            <div className="card border-0 shadow-sm">
              <div className="position-relative" style={{ paddingTop: '75%' }}>
                {product.images && product.images.length > 0 ? (
                  <img 
                    src={product.images[currentImageIndex]?.url} 
                    alt={product.images[currentImageIndex]?.altText || product.name}
                    className="position-absolute top-0 start-0 w-100 h-100"
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <div className="position-absolute top-50 start-50 translate-middle">
                    <Package size={64} className="text-muted" />
                  </div>
                )}
              </div>
              
              {/* Image Thumbnails */}
              {product.images && product.images.length > 1 && (
                <div className="card-footer bg-white border-0">
                  <div className="d-flex gap-2 overflow-auto">
                    {product.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`btn p-0 border ${
                          currentImageIndex === index ? 'border-primary' : 'border-light'
                        }`}
                        style={{ width: '60px', height: '60px' }}
                      >
                        <img 
                          src={image.url} 
                          alt={`${product.name} ${index + 1}`}
                          className="w-100 h-100"
                          style={{ objectFit: 'cover' }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <h1 className="h4 fw-bold mb-2">{product.name}</h1>
                    <div className="d-flex align-items-center mb-2">
                      {product.rating > 0 ? (
                        <>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={16}
                              className={star <= Math.round(product.rating) ? 'text-warning' : 'text-muted'}
                              fill={star <= Math.round(product.rating) ? 'currentColor' : 'none'}
                            />
                          ))}
                          <span className="ms-2 text-muted">
                            {product.rating.toFixed(1)} ({product.numReviews} review{product.numReviews !== 1 ? 's' : ''})
                          </span>
                        </>
                      ) : (
                        <span className="text-muted">No reviews yet</span>
                      )}
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="h3 fw-bold text-primary mb-0">
                      ₹{product.price?.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Seller Info */}
                <div className="border rounded p-3 mb-3">
                  <div className="d-flex align-items-center">
                    <div className="me-3">
                      {product.seller?.images?.url ? (
                        <img 
                          src={product.seller.images.url} 
                          alt={product.seller.name}
                          className="rounded-circle"
                          style={{ width: '48px', height: '48px', objectFit: 'cover' }}
                        />
                      ) : (
                        <div 
                          className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white"
                          style={{ width: '48px', height: '48px' }}
                        >
                          <User size={24} />
                        </div>
                      )}
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="mb-1">{product.seller?.name}</h6>
                      <div className="d-flex align-items-center text-muted small">
                        <MapPin size={12} className="me-1" />
                        {product.seller?.location || 'Location not specified'}
                      </div>
                    </div>
                    <button 
                      onClick={handleStartChat}
                      className="btn btn-outline-primary btn-sm"
                    >
                      <MessageCircle size={14} className="me-1" />
                      Chat
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="d-grid gap-2">
                  <button className="btn btn-primary btn-lg">
                    <ShoppingCart size={20} className="me-2" />
                    Add to Cart
                  </button>
                  <button 
                    onClick={handleStartChat}
                    className="btn btn-outline-primary"
                  >
                    <MessageCircle size={16} className="me-2" />
                    Contact Seller
                  </button>
                </div>

                {/* Product Stats */}
                <div className="row mt-4 text-center">
                  <div className="col-4">
                    <div className="border-end">
                      <div className="fw-bold">{product.countInStock}</div>
                      <small className="text-muted">In Stock</small>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="border-end">
                      <div className="fw-bold">{product.numReviews}</div>
                      <small className="text-muted">Reviews</small>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="fw-bold">
                      {new Date(product.createdAt).toLocaleDateString()}
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
              <div className="card-header bg-white">
                <ul className="nav nav-tabs card-header-tabs">
                  <li className="nav-item">
                    <button 
                      className={`nav-link ${activeTab === 'details' ? 'active' : ''}`}
                      onClick={() => setActiveTab('details')}
                    >
                      Details
                    </button>
                  </li>
                  <li className="nav-item">
                    <button 
                      className={`nav-link ${activeTab === 'reviews' ? 'active' : ''}`}
                      onClick={() => setActiveTab('reviews')}
                    >
                      Reviews ({product.numReviews})
                    </button>
                  </li>
                  <li className="nav-item">
                    <button 
                      className={`nav-link ${activeTab === 'seller' ? 'active' : ''}`}
                      onClick={() => setActiveTab('seller')}
                    >
                      Seller Info
                    </button>
                  </li>
                </ul>
              </div>

              {/* Tab Content */}
              <div className="card-body">
                {activeTab === 'details' && (
                  <div>
                    <h5>Description</h5>
                    <p>{product.description}</p>
                    
                    {product.specifications && product.specifications.length > 0 && (
                      <div className="mt-4">
                        <h6>Specifications</h6>
                        <div className="table-responsive">
                          <table className="table table-striped">
                            <tbody>
                              {product.specifications.map((spec, index) => (
                                <tr key={index}>
                                  <td className="fw-medium">{spec.key}</td>
                                  <td>{spec.value}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {product.features && product.features.length > 0 && (
                      <div className="mt-4">
                        <h6>Features</h6>
                        <ul className="list-unstyled">
                          {product.features.map((feature, index) => (
                            <li key={index} className="mb-1">
                              <i className="text-success me-2">✓</i>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <ReviewsComponent 
                    productId={product._id} 
                    sellerId={product.seller._id}
                    showAddReview={user && user._id !== product.seller._id}
                  />
                )}

                {activeTab === 'seller' && (
                  <div>
                    <div className="row">
                      <div className="col-md-4">
                        <div className="text-center mb-4">
                          {product.seller?.images?.url ? (
                            <img 
                              src={product.seller.images.url} 
                              alt={product.seller.name}
                              className="rounded-circle mb-3"
                              style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                            />
                          ) : (
                            <div 
                              className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white mx-auto mb-3"
                              style={{ width: '120px', height: '120px' }}
                            >
                              <User size={48} />
                            </div>
                          )}
                          <h5>{product.seller?.name}</h5>
                          <p className="text-muted">
                            Member since {new Date(product.seller?.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="col-md-8">
                        <UserProfileReviews 
                          userId={product.seller._id} 
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
    </div>
  );
};

export default ProductDetailPage;
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Plus, 
  Heart, 
  ShoppingCart, 
  Star, 
  Leaf, 
  Menu, 
  X, 
  User, 
  LogOut,
  Grid3X3,
  List,
  SlidersHorizontal,
  MapPin,
  Clock,
  TrendingUp
} from 'lucide-react';
import { useAuth } from './AuthContext'; // Updated import path
import ReviewsComponent from './ReviewsComponent';

const API_BASE_URL = 'http://localhost:5000/api';

const ProductListingFeed = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // State management
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    rating: '',
    inStock: false,
    sortBy: 'newest'
  });

  // Default categories if backend doesn't provide them
  const defaultCategories = [
    { _id: 'all', name: "All Categories", icon: "🏪" },
    { _id: 'electronics', name: "Electronics", icon: "📱" },
    { _id: 'fashion', name: "Fashion", icon: "👗" },
    { _id: 'furniture', name: "Furniture", icon: "🪑" },
    { _id: 'books', name: "Books & Media", icon: "📚" },
    { _id: 'sports', name: "Sports & Outdoors", icon: "⚽" },
    { _id: 'home', name: "Home & Garden", icon: "🏡" },
    { _id: 'toys', name: "Toys & Games", icon: "🧸" },
    { _id: 'automotive', name: "Automotive", icon: "🚗" }
  ];

  // Fetch products with filters
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('keyword', searchTerm);
      if (selectedCategory && selectedCategory !== 'all') params.append('category', selectedCategory);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      if (filters.rating) params.append('rating', filters.rating);
      if (filters.inStock) params.append('inStock', 'true');
      params.append('sortBy', filters.sortBy);
      params.append('limit', '20');
      
      const response = await fetch(`${API_BASE_URL}/products?${params}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategory, filters]);

  // Fetch categories (if available from backend)
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories`);
      if (response.ok) {
        const data = await response.json();
        setCategories([{ _id: 'all', name: "All Categories", icon: "🏪" }, ...data]);
      } else {
        setCategories(defaultCategories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories(defaultCategories);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleCategoryFilter = (categoryId) => {
    setSelectedCategory(categoryId);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const applyFilters = () => {
    setFilterOpen(false);
    fetchProducts();
  };

  const clearFilters = () => {
    setFilters({
      minPrice: '',
      maxPrice: '',
      rating: '',
      inStock: false,
      sortBy: 'newest'
    });
    setSelectedCategory('all');
    setSearchTerm('');
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
                        style={{width: '32px', height: '32px', objectFit: 'cover'}}
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
              <h1 className="h3 fw-bold mb-2" style={{ color: '#1e293b' }}>
                Marketplace
              </h1>
              <p className="text-muted mb-0">
                Discover amazing second-hand treasures from our community
              </p>
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
                
                {user && ['seller', 'admin'].includes(user.role) && (
                  <Link
                    to="/productmanager"
                    className="btn text-white d-flex align-items-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #9333ea, #f97316)' }}
                  >
                    <Plus size={16} />
                    Add Product
                  </Link>
                )}
                {user && ['seller', 'admin'].includes(user.role) && (
                  <Link 
                    to="/my-listings"
                    className="btn btn-outline-primary me-2"
                  >
                    My Listings
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white border-bottom">
        <div className="container-fluid px-4 py-3">
          <form onSubmit={handleSearch} className="row g-3 align-items-center">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <Search size={18} className="text-muted" />
                </span>
                <input 
                  type="text" 
                  className="form-control border-start-0"
                  placeholder="Search products..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button 
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>
            <div className="col-md-6">
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary d-flex align-items-center gap-2"
                  onClick={() => setFilterOpen(!filterOpen)}
                >
                  <SlidersHorizontal size={16} />
                  Filters
                </button>
                <select
                  className="form-select"
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  style={{ maxWidth: '200px' }}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
            </div>
          </form>

          {/* Advanced Filters Panel */}
          {filterOpen && (
            <div className="row mt-3 pt-3 border-top">
              <div className="col-md-2">
                <label className="form-label small fw-medium">Min Price</label>
                <input
                  type="number"
                  className="form-control form-control-sm"
                  placeholder="₹0"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                />
              </div>
              <div className="col-md-2">
                <label className="form-label small fw-medium">Max Price</label>
                <input
                  type="number"
                  className="form-control form-control-sm"
                  placeholder="₹999999"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                />
              </div>
              <div className="col-md-2">
                <label className="form-label small fw-medium">Min Rating</label>
                <select
                  className="form-select form-select-sm"
                  value={filters.rating}
                  onChange={(e) => handleFilterChange('rating', e.target.value)}
                >
                  <option value="">Any Rating</option>
                  <option value="4">4+ Stars</option>
                  <option value="3">3+ Stars</option>
                  <option value="2">2+ Stars</option>
                  <option value="1">1+ Stars</option>
                </select>
              </div>
              <div className="col-md-2 d-flex align-items-end">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="inStock"
                    checked={filters.inStock}
                    onChange={(e) => handleFilterChange('inStock', e.target.checked)}
                  />
                  <label className="form-check-label small" htmlFor="inStock">
                    In Stock Only
                  </label>
                </div>
              </div>
              <div className="col-md-4 d-flex align-items-end gap-2">
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={applyFilters}
                >
                  Apply Filters
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={clearFilters}
                >
                  Clear All
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="bg-white border-bottom">
        <div className="container-fluid px-4 py-3">
          <div className="d-flex gap-2 overflow-auto pb-2">
            {categories.map((category) => (
              <button
                key={category._id}
                onClick={() => handleCategoryFilter(category._id)}
                className={`btn btn-sm rounded-pill text-nowrap d-flex align-items-center gap-2 ${
                  selectedCategory === category._id 
                    ? 'btn-primary' 
                    : 'btn-outline-secondary'
                }`}
                style={{ minWidth: 'fit-content' }}
              >
                <span>{category.icon}</span>
                <span>{category.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="container-fluid px-4 py-4">
        {/* Results Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h5 className="mb-1">
              {searchTerm ? `Search results for "${searchTerm}"` : 'All Products'}
            </h5>
            <p className="text-muted small mb-0">
              {products.length} products found
            </p>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted mt-3">Loading products...</p>
          </div>
        ) : (
          <>
            {/* Products Grid/List */}
            <div className={viewMode === 'grid' ? 'row g-4' : 'row g-3'}>
              {products.length > 0 ? products.map((product) => (
                <div 
                  key={product._id} 
                  className={viewMode === 'grid' ? 'col-6 col-md-4 col-lg-3' : 'col-12'}
                >
                  <Link 
                    to={product.type === 'auction' ? `/auction/${product._id}` : `/product/${product._id}`} 
                    className="text-decoration-none text-dark"
                  >
                    {viewMode === 'grid' ? (
                      // Grid View Card
                      <div className="card h-100 border-0 shadow-sm" style={{ transition: 'all 0.2s' }}>
                        <div 
                          className="position-relative overflow-hidden"
                          style={{ paddingTop: '75%', background: 'linear-gradient(135deg, #ede9fe, #fed7aa)' }}
                        >
                          {product.images && product.images.length > 0 ? (
                            <img 
                              src={product.images[0].url} 
                              alt={product.images[0].altText || product.name}
                              className="position-absolute top-0 start-0 w-100 h-100"
                              style={{ objectFit: 'cover' }}
                            />
                          ) : (
                            <div className="position-absolute top-50 start-50 translate-middle">
                              <div className="display-6">📦</div>
                            </div>
                          )}
                        </div>
                        <div className="card-body p-3">
                          <h6 className="card-title fw-medium mb-2 text-truncate">{product.name}</h6>
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="h6 fw-bold mb-0" style={{ color: '#9333ea' }}>
                              ₹{product.price?.toLocaleString()}
                            </span>
                            <div className="d-flex align-items-center">
                              <Star size={12} className="text-warning me-1" fill="currentColor" />
                              <span className="small text-muted">
                                {product.rating ? product.rating.toFixed(1) : 'New'}
                                {product.numReviews > 0 && (
                                  <span className="ms-1">({product.numReviews})</span>
                                )}
                              </span>
                            </div>
                          </div>
                          <div className="d-flex justify-content-between align-items-center">
                            <small className="text-muted">by {product.seller?.name || 'Seller'}</small>
                            <small className="text-muted d-flex align-items-center">
                              <MapPin size={10} className="me-1" />
                              {product.seller?.location || 'Location'}
                            </small>
                          </div>
                          
                          {/* Add quick rating display */}
                          {product.rating > 0 && (
                            <div className="d-flex align-items-center mt-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  size={10}
                                  className={star <= Math.round(product.rating) ? 'text-warning' : 'text-muted'}
                                  fill={star <= Math.round(product.rating) ? 'currentColor' : 'none'}
                                />
                              ))}
                              <span className="ms-1 small text-muted">
                                ({product.numReviews} review{product.numReviews !== 1 ? 's' : ''})
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      // List View Card
                      <div className="card border-0 shadow-sm">
                        <div className="row g-0">
                          <div className="col-3">
                            <div 
                              className="h-100 d-flex align-items-center justify-content-center"
                              style={{ 
                                minHeight: '120px',
                                background: 'linear-gradient(135deg, #ede9fe, #fed7aa)' 
                              }}
                            >
                              {product.images && product.images.length > 0 ? (
                                <img 
                                  src={product.images[0].url} 
                                  alt={product.images[0].altText || product.name}
                                  className="w-100 h-100"
                                  style={{ objectFit: 'cover' }}
                                />
                              ) : (
                                <div className="display-6">📦</div>
                              )}
                            </div>
                          </div>
                          <div className="col-9">
                            <div className="card-body">
                              <div className="d-flex justify-content-between align-items-start">
                                <div>
                                  <h6 className="card-title fw-medium mb-1">{product.name}</h6>
                                  <p className="card-text small text-muted mb-2 text-truncate">
                                    {product.description}
                                  </p>
                                  <div className="d-flex align-items-center gap-3 mb-2">
                                    <span className="h6 fw-bold mb-0" style={{ color: '#9333ea' }}>
                                      ₹{product.price?.toLocaleString()}
                                    </span>
                                    <div className="d-flex align-items-center">
                                      <Star size={12} className="text-warning me-1" fill="currentColor" />
                                      <span className="small text-muted">{product.rating || 'New'}</span>
                                    </div>
                                  </div>
                                  <div className="d-flex align-items-center gap-3">
                                    <small className="text-muted">by {product.seller?.name || 'Seller'}</small>
                                    <small className="text-muted d-flex align-items-center">
                                      <Clock size={10} className="me-1" />
                                      {new Date(product.createdAt).toLocaleDateString()}
                                    </small>
                                  </div>
                                </div>
                                <button className="btn btn-light btn-sm rounded-circle">
                                  <Heart size={14} />
                                </button>
                              </div>

                              {/* Rating display for list view */}
                              {product.rating > 0 && (
                                <div className="d-flex align-items-center mt-2">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      size={12}
                                      className={star <= Math.round(product.rating) ? 'text-warning' : 'text-muted'}
                                      fill={star <= Math.round(product.rating) ? 'currentColor' : 'none'}
                                    />
                                  ))}
                                  <span className="ms-2 small text-muted">
                                    {product.rating.toFixed(1)} ({product.numReviews} review{product.numReviews !== 1 ? 's' : ''})
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </Link>
                </div>
              )) : (
                <div className="col-12 text-center py-5">
                  <div className="display-1 mb-3">🔍</div>
                  <h3 className="fw-bold text-dark mb-2">No products found</h3>
                  <p className="text-muted mb-4">
                    Try adjusting your search terms or filters to find what you're looking for.
                  </p>
                  {user && ['seller', 'admin'].includes(user.role) && (
                    <Link
                      to="/productmanager"
                      className="btn text-white"
                      style={{ background: 'linear-gradient(135deg, #9333ea, #f97316)' }}
                    >
                      List Your First Product
                    </Link>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Floating Add Button for Mobile */}
      {user && ['seller', 'admin'].includes(user.role) && (
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

export default ProductListingFeed;
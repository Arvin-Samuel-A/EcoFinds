import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Search, Heart, ShoppingCart, Star, Leaf, Recycle, Users, Award, ArrowRight, Menu, X, User, LogOut } from 'lucide-react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { AuthProvider, useAuth } from './AuthContext'; // Updated import path
import Login from './Login';
import Signup from './Signup';
import ProductListingFeed from './ProductListingFeed';
import ProductManager from './ProductManager'; // Updated to match your file name
import MyListings from './MyListings';
import CartPage from './CartPage';
import Dashboard from './Dashboard';
import ChatScreen from './ChatScreen';
import MessagesList from './MessagesList';
import ProductDetailPage from './ProductDetailPage';
import ReviewsComponent from './ReviewsComponent';

const API_BASE_URL = 'http://localhost:5000/api';

// Main Home Component
const Home = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const heroSlides = [
    {
      title: "Discover Unique Treasures",
      subtitle: "Find amazing second-hand items while saving the planet",
      image: "🛍️"
    },
    {
      title: "Sell with Purpose",
      subtitle: "Turn your unused items into someone else's treasure",
      image: "♻️"
    },
    {
      title: "Build Community",
      subtitle: "Connect with conscious consumers in your area",
      image: "🤝"
    }
  ];

  const fetchProducts = useCallback(async (search = '', category = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('keyword', search);
      if (category) params.append('category', category);
      params.append('limit', '8');
      
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
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts(searchTerm);
  };

  const defaultCategories = [
    { name: "Electronics", icon: "📱", count: "2.5k+" },
    { name: "Fashion", icon: "👗", count: "8.2k+" },
    { name: "Furniture", icon: "🪑", count: "1.8k+" },
    { name: "Books & Media", icon: "📚", count: "3.1k+" },
    { name: "Sports & Outdoors", icon: "⚽", count: "1.2k+" },
    { name: "Home & Garden", icon: "🏡", count: "2.9k+" }
  ];

  return (
    <div className="min-vh-100 gradient-bg">
      {/* Navigation */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white bg-opacity-90 backdrop-blur shadow-lg sticky-top">
        <div className="container-xl">
          <Link to="/" className="navbar-brand d-flex align-items-center text-decoration-none">
            <div className="rounded-circle d-flex align-items-center justify-content-center me-2 gradient-btn" style={{width: '40px', height: '40px'}}>
              <Leaf className="text-white" size={24} />
            </div>
            <span className="fs-3 fw-bold gradient-text">EcoFinds</span>
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
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item me-4">
                <Link to="/marketplace" className="nav-link fw-medium text-dark text-decoration-none">Browse</Link>
              </li>
              <li className="nav-item me-4">
                <Link to="/productmanager" className="nav-link fw-medium text-dark text-decoration-none">Sell</Link>
              </li>
              <li className="nav-item me-4">
                <button className="btn nav-link fw-medium text-dark">About</button>
              </li>
              <li className="nav-item me-4">
                <button className="btn nav-link fw-medium text-dark">Contact</button>
              </li>
            </ul>

            <div className="d-flex align-items-center">
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
                    className="btn gradient-btn text-white rounded-pill px-4 text-decoration-none"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="container-xl d-lg-none">
            <div className="border-top pt-3 mt-3">
              <div className="d-flex flex-column gap-2">
                <Link to="/marketplace" className="btn text-start text-decoration-none">Browse</Link>
                <Link to="/productmanager" className="btn text-start text-decoration-none">Sell</Link>
                <button className="btn text-start">About</button>
                <button className="btn text-start">Contact</button>
                
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
                      className="btn gradient-btn text-white w-100 rounded-pill text-decoration-none"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="py-5">
        <div className="container-xl py-5">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <div className="mb-4">
                <h1 className="display-3 fw-bold lh-1 mb-3">
                  <span className="gradient-text">
                    {heroSlides[currentSlide].title}
                  </span>
                </h1>
                <p className="fs-5 text-muted mb-4">
                  {heroSlides[currentSlide].subtitle}
                </p>
              </div>

              {/* Search Bar */}
              <form onSubmit={handleSearch} className="mb-4">
                <div className="input-group shadow-lg rounded-4 overflow-hidden">
                  <span className="input-group-text bg-white border-0">
                    <Search size={20} className="text-muted" />
                  </span>
                  <input 
                    type="text" 
                    className="form-control border-0 py-3"
                    placeholder="Search for treasures..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button 
                    type="submit"
                    disabled={loading}
                    className="btn gradient-btn text-white px-4"
                  >
                    <span className="me-2">
                      {loading ? 'Searching...' : 'Search'}
                    </span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </form>

              {/* CTA Buttons */}
              <div className="d-flex flex-column flex-sm-row gap-3">
                <Link
                  to="/marketplace"
                  className="btn gradient-btn text-white px-4 py-3 rounded-4 fw-semibold d-flex align-items-center justify-content-center text-decoration-none"
                >
                  <span className="me-2">Start Shopping</span>
                  <ArrowRight size={20} />
                </Link>
                <Link to="/productmanager" className="btn btn-outline-primary px-4 py-3 rounded-4 fw-semibold text-decoration-none">
                  List Your Items 
                </Link>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="col-lg-6 mt-5 mt-lg-0">
              <div className="text-center">
                <div className="hero-visual rounded-4 p-5">
                  <div className="display-1 bounce mb-4">
                    {heroSlides[currentSlide].image}
                  </div>
                  <div className="row">
                    {[0, 1, 2].map((index) => (
                      <div key={index} className="col-4">
                        <div 
                          className={`rounded-pill mx-auto ${
                            index === currentSlide ? 'bg-primary' : 'bg-light'
                          }`}
                          style={{height: '8px', transition: 'all 0.3s'}}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-5 bg-white">
        <div className="container-xl">
          <div className="row g-4">
            {[
              { icon: Users, label: "Active Users", value: "50K+" },
              { icon: Recycle, label: "Items Sold", value: "2M+" },
              { icon: Star, label: "Avg Rating", value: "4.8" },
              { icon: Award, label: "CO2 Saved", value: "100T+" }
            ].map((stat, index) => (
              <div key={index} className="col-6 col-lg-3 text-center">
                <div className="rounded-4 d-inline-flex align-items-center justify-content-center mb-3"
                     style={{width: '64px', height: '64px', background: 'linear-gradient(135deg, #ede9fe, #fed7aa)'}}>
                  <stat.icon size={32} style={{color: '#9333ea'}} />
                </div>
                <div className="display-6 fw-bold text-dark mb-2">{stat.value}</div>
                <div className="text-muted">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-5" style={{background: 'linear-gradient(135deg, #faf5ff, #fef3c7)'}}>
        <div className="container-xl">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold text-dark mb-3">
              Explore Popular Categories
            </h2>
            <p className="fs-5 text-muted mx-auto" style={{maxWidth: '600px'}}>
              Discover amazing finds across various categories, from vintage electronics to designer fashion
            </p>
          </div>

          <div className="row g-4">
            {defaultCategories.map((category, index) => (
              <div key={index} className="col-6 col-md-4 col-lg-2">
                <div 
                  onClick={() => navigate('/marketplace')}
                  className="card h-100 text-center border-0 shadow-sm card-hover"
                  style={{cursor: 'pointer'}}
                >
                  <div className="card-body p-4">
                    <div className="display-6 mb-3">{category.icon}</div>
                    <h6 className="card-title fw-semibold">{category.name}</h6>
                    <p className="card-text small text-muted">{category.count} items</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-5 bg-white">
        <div className="container-xl">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold text-dark mb-3">
              {searchTerm ? `Search Results for "${searchTerm}"` : 'Featured Finds'}
            </h2>
            <p className="fs-5 text-muted mx-auto" style={{maxWidth: '600px'}}>
              {searchTerm ? 'Products matching your search' : 'Handpicked treasures from our community of conscious sellers'}
            </p>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-muted mt-3">Loading products...</p>
            </div>
          ) : (
            <div className="row g-4">
              {products.length > 0 ? products.map((product) => (
                <div key={product._id} className="col-md-6 col-lg-3">
                  <div className="card h-100 border-0 shadow-lg card-hover">
                    <div className="p-4 text-center" style={{background: 'linear-gradient(135deg, #ede9fe, #fed7aa)'}}>
                      {product.images && product.images.length > 0 ? (
                        <img 
                          src={product.images[0].url} 
                          alt={product.images[0].altText || product.name}
                          className="img-fluid rounded"
                          style={{height: '128px', width: '100%', objectFit: 'cover'}}
                        />
                      ) : (
                        <div className="display-4">📦</div>
                      )}
                    </div>
                    <div className="card-body">
                      <h6 className="card-title fw-semibold">{product.name}</h6>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <span className="h5 fw-bold" style={{color: '#9333ea'}}>
                          ₹{product.price.toLocaleString()}
                        </span>
                        <div className="d-flex align-items-center">
                          <Star size={16} className="text-warning me-1" fill="currentColor" />
                          <span className="small text-muted">{product.rating || 'New'}</span>
                        </div>
                      </div>
                      <p className="small text-muted mb-3">by {product.seller?.name || 'Seller'}</p>
                      <button className="btn gradient-btn text-white w-100">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="col-12 text-center py-5">
                  <div className="display-1 mb-3">🔍</div>
                  <h3 className="fw-bold text-dark mb-2">No products found</h3>
                  <p className="text-muted">Try searching with different keywords or browse our categories</p>
                </div>
              )}
            </div>
          )}

          {/* View All Products Button */}
          <div className="text-center mt-5">
            <Link 
              to="/marketplace"
              className="btn btn-outline-primary px-5 py-3 rounded-4 fw-semibold text-decoration-none"
            >
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-5 text-white" style={{background: 'linear-gradient(135deg, #9333ea, #f97316)'}}>
        <div className="container-xl text-center">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <h2 className="display-4 fw-bold mb-3">
                Ready to Make a Difference?
              </h2>
              <p className="fs-5 mb-4" style={{color: 'rgba(255,255,255,0.9)'}}>
                Join thousands of eco-conscious users who are transforming the way we shop and sell
              </p>
              <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center">
                <Link
                  to="/marketplace"
                  className="btn btn-light text-primary px-4 py-3 rounded-4 fw-semibold text-decoration-none"
                >
                  Start Shopping Now
                </Link>
                <Link 
                  to={user ? "/productmanager" : "/signup"}
                  className="btn btn-outline-light px-4 py-3 rounded-4 fw-semibold text-decoration-none"
                >
                  {user && user.role === 'seller' ? 'Add Product' : 'Become a Seller'}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-5 bg-dark text-white">
        <div className="container-xl">
          <div className="row g-4">
            <div className="col-md-3">
              <div className="d-flex align-items-center mb-3">
                <div className="rounded-circle d-flex align-items-center justify-content-center me-2 gradient-btn" 
                     style={{width: '32px', height: '32px'}}>
                  <Leaf size={20} className="text-white" />
                </div>
                <span className="fs-5 fw-bold">EcoFinds</span>
              </div>
              <p className="text-muted">
                Building a sustainable future, one transaction at a time.
              </p>
            </div>
            
            <div className="col-md-3">
              <h6 className="fw-semibold mb-3">Marketplace</h6>
              <div className="d-flex flex-column gap-2">
                <Link to="/marketplace" className="btn btn-link text-muted text-start p-0 text-decoration-none">Browse Items</Link>
                <Link to="/productmanager" className="btn btn-link text-muted text-start p-0 text-decoration-none">Sell Items</Link>
                <button className="btn btn-link text-muted text-start p-0">Categories</button>
                <button className="btn btn-link text-muted text-start p-0">Featured</button>
              </div>
            </div>
            
            <div className="col-md-3">
              <h6 className="fw-semibold mb-3">Support</h6>
              <div className="d-flex flex-column gap-2">
                <button className="btn btn-link text-muted text-start p-0">Help Center</button>
                <button className="btn btn-link text-muted text-start p-0">Safety Tips</button>
                <button className="btn btn-link text-muted text-start p-0">Community</button>
                <button className="btn btn-link text-muted text-start p-0">Contact Us</button>
              </div>
            </div>
            
            <div className="col-md-3">
              <h6 className="fw-semibold mb-3">Company</h6>
              <div className="d-flex flex-column gap-2">
                <button className="btn btn-link text-muted text-start p-0">About Us</button>
                <button className="btn btn-link text-muted text-start p-0">Sustainability</button>
                <button className="btn btn-link text-muted text-start p-0">Privacy Policy</button>
                <button className="btn btn-link text-muted text-start p-0">Terms of Service</button>
              </div>
            </div>
          </div>
          
          <hr className="my-4" />
          <div className="text-center text-muted">
            <p>&copy; 2025 EcoFinds. All rights reserved. Built with 💚 for a sustainable future.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Main App Component with Router
const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/marketplace" element={<ProductListingFeed />} />
          <Route path="/productmanager" element={<ProductManager />} />
          <Route path="/my-listings" element={<MyListings />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/messages" element={<MessagesList />} />
          <Route path="/chat/:otherUserId" element={<ChatScreen />} />
          <Route path="/chat/:otherUserId/:productId" element={<ChatScreen />} />
          <Route path="/product/:productId" element={<ProductDetailPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
// filepath: c:\Users\dell\OneDrive\Desktop\IITM\EcoFinds\summa\src\Login.jsx
import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, Leaf } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const Login = () => {
  const { login, loading, error, setError } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    const result = await login(formData.email, formData.password);
    if (result.success) {
      navigate('/');
    }
  };

  return (
    <div className="container-fluid p-0">
      <div className="row g-0 min-vh-100">
        {/* Left side - Login Form */}
        <div className="col-lg-6 d-flex align-items-center justify-content-center p-4">
          <div className="w-100" style={{ maxWidth: '400px' }}>
            {/* Header */}
            <div className="text-center mb-4">
              <Link to="/" className="d-flex align-items-center justify-content-center mb-3 text-decoration-none">
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center me-2"
                  style={{
                    width: '48px', 
                    height: '48px',
                    background: 'linear-gradient(135deg, #9333ea, #f97316)'
                  }}
                >
                  <Leaf className="text-white" size={24} />
                </div>
                <h2 className="mb-0 fw-bold" style={{ color: '#9333ea' }}>EcoFinds</h2>
              </Link>
              <h3 className="fw-bold text-dark mb-2">Welcome Back</h3>
              <p className="text-muted">Sign in to continue your sustainable shopping journey</p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
                <div>
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {error}
                </div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="email" className="form-label fw-medium">Email Address</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <Mail size={18} className="text-muted" />
                  </span>
                  <input
                    type="email"
                    className="form-control border-start-0 py-3"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    required
                    style={{ borderLeft: 'none' }}
                  />
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="password" className="form-label fw-medium">Password</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <Lock size={18} className="text-muted" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control border-start-0 border-end-0 py-3"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    required
                    style={{ borderLeft: 'none', borderRight: 'none' }}
                  />
                  <button
                    type="button"
                    className="btn border bg-light border-start-0"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ borderLeft: 'none' }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn text-white w-100 py-3 fw-semibold rounded-3 mb-3"
                style={{ 
                  background: 'linear-gradient(135deg, #9333ea, #f97316)',
                  border: 'none'
                }}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>

              <div className="text-center">
                <Link
                  to="/signup"
                  className="btn btn-link text-decoration-none p-0"
                  style={{ color: '#9333ea' }}
                >
                  Don't have an account? <span className="fw-semibold">Sign Up</span>
                </Link>
              </div>
            </form>

            {/* Back to Home */}
            <div className="text-center mt-4">
              <Link 
                to="/" 
                className="btn btn-outline-secondary"
              >
                ← Back to Home
              </Link>
            </div>

            {/* Divider */}
            <div className="position-relative my-4">
              <hr className="text-muted" />
              <span 
                className="position-absolute top-50 start-50 translate-middle bg-white px-3 text-muted small"
              >
                or continue with
              </span>
            </div>

            {/* Social Login Placeholder */}
            <div className="d-grid gap-2">
              <button 
                type="button" 
                className="btn btn-outline-secondary py-3 fw-medium"
                disabled
              >
                <i className="bi bi-google me-2"></i>
                Continue with Google
              </button>
            </div>
          </div>
        </div>

        {/* Right side - Visual */}
        <div 
          className="col-lg-6 d-none d-lg-flex align-items-center justify-content-center text-white position-relative"
          style={{ 
            background: 'linear-gradient(135deg, #9333ea, #f97316)',
            minHeight: '100vh'
          }}
        >
          <div className="text-center px-5">
            <div className="display-1 mb-4">🌱</div>
            <h2 className="display-5 fw-bold mb-4">
              Join the Sustainable Revolution
            </h2>
            <p className="fs-5 mb-4" style={{ opacity: 0.9 }}>
              Discover unique treasures while making a positive impact on the environment. 
              Every purchase helps build a more sustainable future.
            </p>
            
            {/* Stats */}
            <div className="row text-center mt-5">
              <div className="col-4">
                <div className="h3 fw-bold">50K+</div>
                <div className="small" style={{ opacity: 0.8 }}>Happy Users</div>
              </div>
              <div className="col-4">
                <div className="h3 fw-bold">2M+</div>
                <div className="small" style={{ opacity: 0.8 }}>Items Sold</div>
              </div>
              <div className="col-4">
                <div className="h3 fw-bold">100T+</div>
                <div className="small" style={{ opacity: 0.8 }}>CO2 Saved</div>
              </div>
            </div>
          </div>

          {/* Decorative Elements */}
          <div 
            className="position-absolute"
            style={{
              top: '10%',
              left: '10%',
              width: '100px',
              height: '100px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '50%',
              animation: 'float 6s ease-in-out infinite'
            }}
          ></div>
          <div 
            className="position-absolute"
            style={{
              bottom: '20%',
              right: '15%',
              width: '150px',
              height: '150px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '50%',
              animation: 'float 8s ease-in-out infinite reverse'
            }}
          ></div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        .form-control:focus {
          border-color: #9333ea;
          box-shadow: 0 0 0 0.2rem rgba(147, 51, 234, 0.25);
        }
        
        .input-group-text {
          border-color: #dee2e6;
        }
        
        .btn:hover {
          transform: translateY(-1px);
          transition: all 0.2s ease;
        }
      `}</style>
    </div>
  );
};

export default Login;
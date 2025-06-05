import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, Phone, Leaf, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import ImageUpload from './ImageUpload';

const Signup = () => {
  const { register, loading, error, setError } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'buyer',
  });

  const steps = [
    { number: 1, title: 'Personal Info', description: 'Basic information' },
    { number: 2, title: 'Account Setup', description: 'Email and password' },
    { number: 3, title: 'Profile Picture', description: 'Upload your photo' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleImageUploaded = (imageData) => {
    setUploadedImage(imageData);
    if (error) setError('');
  };

  const validateStep = () => {
    switch (currentStep) {
      case 1:
        if (!formData.name.trim()) {
          setError('Name is required');
          return false;
        }
        if (!formData.phone.trim()) {
          setError('Phone number is required');
          return false;
        }
        break;
      case 2:
        if (!formData.email.trim()) {
          setError('Email is required');
          return false;
        }
        if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
          setError('Please enter a valid email address');
          return false;
        }
        if (!formData.password) {
          setError('Password is required');
          return false;
        }
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters long');
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          return false;
        }
        break;
      case 3:
        // Profile picture is optional, so no validation needed
        break;
      default:
        return true;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep(prev => prev + 1);
      setError('');
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep()) return;

    const userData = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
      role: formData.role,
      // Only include images if uploaded
      ...(uploadedImage && {
        images: {
          url: uploadedImage.url,
          gcpStoragePath: uploadedImage.gcpStoragePath,
          altText: uploadedImage.altText || formData.name,
          isPrimary: true
        }
      })
    };

    const result = await register(userData);
    if (result.success) {
      navigate('/marketplace'); // Changed from '/' to '/marketplace'
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            <div className="mb-3">
              <label htmlFor="name" className="form-label fw-medium">Full Name</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <User size={18} className="text-muted" />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 py-3"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="phone" className="form-label fw-medium">Phone Number</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <Phone size={18} className="text-muted" />
                </span>
                <input
                  type="tel"
                  className="form-control border-start-0 py-3"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter your phone number"
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="role" className="form-label fw-medium">Account Type</label>
              <select
                className="form-select py-3"
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
              >
                <option value="buyer">Buyer - I want to purchase items</option>
                <option value="seller">Seller - I want to sell items</option>
              </select>
            </div>
          </>
        );

      case 2:
        return (
          <>
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
                />
              </div>
            </div>

            <div className="mb-3">
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
                  placeholder="Create a password"
                  required
                />
                <button
                  type="button"
                  className="btn border bg-light border-start-0"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="confirmPassword" className="form-label fw-medium">Confirm Password</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <Lock size={18} className="text-muted" />
                </span>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="form-control border-start-0 border-end-0 py-3"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  className="btn border bg-light border-start-0"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </>
        );

      case 3:
        return (
          <div className="text-center">
            <ImageUpload
              onImageUploaded={handleImageUploaded}
              altText={formData.name}
              folder="profiles"
            />
            <div className="mt-3">
              <small className="text-muted">
                Profile picture is optional. You can add it now or later from your profile settings.
              </small>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container-fluid p-0">
      <div className="row g-0 min-vh-100">
        {/* Left side - Signup Form */}
        <div className="col-lg-6 d-flex align-items-center justify-content-center p-4">
          <div className="w-100" style={{ maxWidth: '500px' }}>
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
              <h3 className="fw-bold text-dark mb-2">Create Your Account</h3>
              <p className="text-muted">Join the sustainable marketplace community</p>
            </div>

            {/* Progress Steps */}
            <div className="mb-4">
              <div className="d-flex justify-content-between mb-3">
                {steps.map((step) => (
                  <div key={step.number} className="text-center flex-fill">
                    <div
                      className={`rounded-circle mx-auto mb-2 d-flex align-items-center justify-content-center ${currentStep >= step.number
                          ? 'text-white'
                          : 'bg-light text-muted'
                        }`}
                      style={{
                        width: '40px',
                        height: '40px',
                        background: currentStep >= step.number
                          ? 'linear-gradient(135deg, #9333ea, #f97316)'
                          : undefined
                      }}
                    >
                      {currentStep > step.number ? (
                        <Check size={18} />
                      ) : (
                        step.number
                      )}
                    </div>
                    <div className="small fw-medium">{step.title}</div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                      {step.description}
                    </div>
                  </div>
                ))}
              </div>

              {/* Progress Bar */}
              <div className="progress" style={{ height: '4px' }}>
                <div
                  className="progress-bar"
                  style={{
                    width: `${(currentStep / steps.length) * 100}%`,
                    background: 'linear-gradient(135deg, #9333ea, #f97316)'
                  }}
                ></div>
              </div>
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

            {/* Form */}
            <form onSubmit={currentStep === 3 ? handleSubmit : (e) => e.preventDefault()}>
              {renderStepContent()}

              {/* Navigation Buttons */}
              <div className="d-flex justify-content-between">
                {currentStep === 1 ? (
                  <Link
                    to="/login"
                    className="btn btn-outline-secondary d-flex align-items-center px-4 py-3 text-decoration-none"
                  >
                    <ArrowLeft size={18} className="me-2" />
                    Sign In Instead
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="btn btn-outline-secondary d-flex align-items-center px-4 py-3"
                  >
                    <ArrowLeft size={18} className="me-2" />
                    Back
                  </button>
                )}

                <button
                  type={currentStep === 3 ? 'submit' : 'button'}
                  onClick={currentStep === 3 ? undefined : handleNext}
                  disabled={loading}
                  className="btn text-white d-flex align-items-center px-4 py-3"
                  style={{
                    background: 'linear-gradient(135deg, #9333ea, #f97316)',
                    border: 'none'
                  }}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Creating Account...
                    </>
                  ) : (
                    <>
                      {currentStep === 3 ? 'Create Account' : 'Next'}
                      {currentStep !== 3 && <ArrowRight size={18} className="ms-2" />}
                    </>
                  )}
                </button>
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
            <div className="display-1 mb-4">♻️</div>
            <h2 className="display-5 fw-bold mb-4">
              Start Your Eco Journey
            </h2>
            <p className="fs-5 mb-4" style={{ opacity: 0.9 }}>
              Join thousands of eco-conscious users making a difference through sustainable shopping.
              Every purchase contributes to a greener planet.
            </p>

            {/* Stats */}
            <div className="row text-center mt-5">
              <div className="col-4">
                <div className="h3 fw-bold">50K+</div>
                <div className="small" style={{ opacity: 0.8 }}>Eco Warriors</div>
              </div>
              <div className="col-4">
                <div className="h3 fw-bold">1M+</div>
                <div className="small" style={{ opacity: 0.8 }}>Sustainable Items</div>
              </div>
              <div className="col-4">
                <div className="h3 fw-bold">75T+</div>
                <div className="small" style={{ opacity: 0.8 }}>CO2 Reduced</div>
              </div>
            </div>
          </div>

          {/* Decorative Elements */}
          <div
            className="position-absolute"
            style={{
              top: '15%',
              left: '15%',
              width: '80px',
              height: '80px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '50%',
              animation: 'float 6s ease-in-out infinite'
            }}
          ></div>
          <div
            className="position-absolute"
            style={{
              bottom: '25%',
              right: '20%',
              width: '120px',
              height: '120px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '50%',
              animation: 'float 8s ease-in-out infinite reverse'
            }}
          ></div>
          <div
            className="position-absolute"
            style={{
              top: '60%',
              left: '5%',
              width: '60px',
              height: '60px',
              background: 'rgba(255,255,255,0.08)',
              borderRadius: '50%',
              animation: 'float 10s ease-in-out infinite'
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
        
        .form-select:focus {
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
        
        .progress-bar {
          transition: width 0.3s ease;
        }
        
        .alert {
          animation: slideIn 0.3s ease;
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default Signup;
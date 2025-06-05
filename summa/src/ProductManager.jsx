import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  X, 
  Image as ImageIcon, 
  Package, 
  DollarSign, 
  Tag, 
  FileText, 
  Clock, 
  Gavel,
  Plus,
  Leaf
} from 'lucide-react';
import { useAuth } from './AuthContext';
import ImageUpload from './ImageUpload';
import 'bootstrap/dist/css/bootstrap.min.css';

const API_BASE_URL = 'http://localhost:5000/api';

const ProductManager = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadedImages, setUploadedImages] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    price: '',
    countInStock: '1',
    condition: 'good',
    isAuction: false,
    // Auction specific fields
    minimumBid: '',
    reservePrice: '',
    auctionDuration: '7', // in days
  });

  const categories = [
    { value: '', label: 'Select Category' },
    { value: 'electronics', label: 'Electronics' },
    { value: 'fashion', label: 'Fashion & Clothing' },
    { value: 'furniture', label: 'Furniture & Home' },
    { value: 'books', label: 'Books & Media' },
    { value: 'sports', label: 'Sports & Outdoors' },
    { value: 'toys', label: 'Toys & Games' },
    { value: 'automotive', label: 'Automotive' },
    { value: 'collectibles', label: 'Collectibles & Art' },
    { value: 'other', label: 'Other' }
  ];

  const conditions = [
    { value: 'new', label: 'Brand New' },
    { value: 'like-new', label: 'Like New' },
    { value: 'excellent', label: 'Excellent' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
    { value: 'poor', label: 'Poor' }
  ];

  // Generate slug from name
  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (error) setError('');
  };

  const handleImageUploaded = (imageData) => {
    if (imageData) {
      setUploadedImages(prev => [...prev, imageData]);
    }
    if (error) setError('');
  };

  const removeImage = (index) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Product title is required');
      return false;
    }
    if (!formData.category) {
      setError('Please select a category');
      return false;
    }
    if (!formData.description.trim()) {
      setError('Product description is required');
      return false;
    }
    
    // Fix validation logic for auction vs product
    if (formData.isAuction) {
      if (!formData.minimumBid || formData.minimumBid <= 0) {
        setError('Please enter a valid minimum bid price');
        return false;
      }
      if (formData.reservePrice && formData.reservePrice < formData.minimumBid) {
        setError('Reserve price must be greater than minimum bid');
        return false;
      }
    } else {
      if (!formData.price || formData.price <= 0) {
        setError('Please enter a valid price');
        return false;
      }
      if (!formData.countInStock || formData.countInStock < 0) {
        setError('Please enter a valid quantity');
        return false;
      }
    }
    
    if (uploadedImages.length === 0) {
      setError('Please add at least one product image');
      return false;
    }
    return true;
  };

  const calculateAuctionEndDate = (duration) => {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + parseInt(duration));
    return endDate.toISOString();
  };

  const createProduct = async (productData) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(productData)
    });
    return response;
  };

  const createAuction = async (auctionData) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/auctions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(auctionData)
    });
    return response;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const slug = generateSlug(formData.name);
      
      if (formData.isAuction) {
        // Create auction item
        const auctionData = {
          title: formData.name.trim(),
          description: formData.description.trim(),
          startingBid: parseFloat(formData.minimumBid),
          reservePrice: formData.reservePrice ? parseFloat(formData.reservePrice) : undefined,
          endDate: calculateAuctionEndDate(formData.auctionDuration),
          category: formData.category,
          condition: formData.condition,
          images: uploadedImages.map((img, index) => ({
            url: img.url,
            gcpStoragePath: img.gcpStoragePath,
            altText: img.altText || formData.name,
            isPrimary: index === 0
          })),
          seller: user._id,
          status: 'active'
        };

        const response = await createAuction(auctionData);
        const data = await response.json();

        if (response.ok) {
          setSuccess('Auction created successfully!');
          setTimeout(() => {
            navigate('/my-listings');
          }, 2000);
        } else {
          setError(data.message || 'Failed to create auction');
        }
      } else {
        // Create regular product
        const productData = {
          name: formData.name.trim(),
          slug: slug,
          description: formData.description.trim(),
          price: parseFloat(formData.price),
          countInStock: parseInt(formData.countInStock),
          categoryIds: formData.category ? [formData.category] : [],
          images: uploadedImages.map((img, index) => ({
            url: img.url,
            gcpStoragePath: img.gcpStoragePath,
            altText: img.altText || formData.name,
            isPrimary: index === 0
          })),
          features: [`Condition: ${conditions.find(c => c.value === formData.condition)?.label || formData.condition}`],
        };

        const response = await createProduct(productData);
        const data = await response.json();

        if (response.ok) {
          setSuccess('Product listed successfully!');
          setTimeout(() => {
            navigate('/my-listings');
          }, 2000);
        } else {
          setError(data.message || 'Failed to create product listing');
        }
      }
    } catch (error) {
      console.error('Error creating listing:', error);
      setError('Failed to create listing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100" style={{ backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <div className="bg-white border-bottom sticky-top">
        <div className="container-fluid px-4 py-3">
          <div className="d-flex align-items-center">
            <button 
              onClick={() => navigate('/marketplace')}
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
                <Leaf className="text-white" size={20} />
              </div>
              <div>
                <h1 className="h4 fw-bold mb-0" style={{ color: '#1e293b' }}>
                  {formData.isAuction ? 'Create Auction' : 'Add New Product'}
                </h1>
                <p className="text-muted small mb-0">
                  {formData.isAuction ? 'Set up your auction listing' : 'Create a listing for your item'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="container-fluid px-4 py-4">
        <div className="row justify-content-center">
          <div className="col-lg-8 col-xl-6">
            {/* Success Alert */}
            {success && (
              <div className="alert alert-success d-flex align-items-center mb-4" role="alert">
                <div>✅ {success}</div>
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
                <div>⚠️ {error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Listing Type Selection */}
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-body p-4">
                  <div className="form-check form-switch d-flex align-items-center">
                    <input
                      className="form-check-input me-3"
                      type="checkbox"
                      id="isAuction"
                      name="isAuction"
                      checked={formData.isAuction}
                      onChange={handleInputChange}
                      style={{ transform: 'scale(1.2)' }}
                    />
                    <div>
                      <label className="form-check-label fw-semibold" htmlFor="isAuction">
                        <Gavel size={20} className="me-2" style={{ color: '#9333ea' }} />
                        {formData.isAuction ? 'Auction Listing' : 'Fixed Price Listing'}
                      </label>
                      <div className="small text-muted">
                        {formData.isAuction 
                          ? 'Let buyers compete with bids for your item'
                          : 'Sell your item at a fixed price'
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Basic Information Card */}
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-header bg-white border-0 py-3">
                  <div className="d-flex align-items-center">
                    <Package className="me-2" size={20} style={{ color: '#9333ea' }} />
                    <h5 className="mb-0 fw-semibold">Basic Information</h5>
                  </div>
                </div>
                <div className="card-body p-4">
                  <div className="row g-3">
                    <div className="col-12">
                      <label htmlFor="name" className="form-label fw-medium">
                        {formData.isAuction ? 'Auction Title' : 'Product Title'} <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-light border-end-0">
                          <Tag size={18} className="text-muted" />
                        </span>
                        <input
                          type="text"
                          className="form-control border-start-0 py-3"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder={formData.isAuction ? "Enter auction title" : "Enter product title"}
                          required
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label htmlFor="category" className="form-label fw-medium">
                        Category <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select py-3"
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        required
                      >
                        {categories.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label htmlFor="condition" className="form-label fw-medium">
                        Condition <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select py-3"
                        id="condition"
                        name="condition"
                        value={formData.condition}
                        onChange={handleInputChange}
                        required
                      >
                        {conditions.map((cond) => (
                          <option key={cond.value} value={cond.value}>
                            {cond.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-12">
                      <label htmlFor="description" className="form-label fw-medium">
                        Description <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-light border-end-0 align-items-start pt-3">
                          <FileText size={18} className="text-muted" />
                        </span>
                        <textarea
                          className="form-control border-start-0"
                          id="description"
                          name="description"
                          rows="4"
                          value={formData.description}
                          onChange={handleInputChange}
                          placeholder={formData.isAuction ? "Describe the item for auction..." : "Describe your product in detail..."}
                          required
                        />
                      </div>
                      <div className="form-text">
                        Include details about condition, features, and any defects
                      </div>
                    </div>

                    {!formData.isAuction && (
                      <div className="col-md-6">
                        <label htmlFor="countInStock" className="form-label fw-medium">
                          Quantity Available <span className="text-danger">*</span>
                        </label>
                        <input
                          type="number"
                          className="form-control py-3"
                          id="countInStock"
                          name="countInStock"
                          value={formData.countInStock}
                          onChange={handleInputChange}
                          placeholder="1"
                          min="1"
                          required
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Pricing Card */}
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-header bg-white border-0 py-3">
                  <div className="d-flex align-items-center">
                    {formData.isAuction ? (
                      <Gavel className="me-2" size={20} style={{ color: '#9333ea' }} />
                    ) : (
                      <DollarSign className="me-2" size={20} style={{ color: '#9333ea' }} />
                    )}
                    <h5 className="mb-0 fw-semibold">
                      {formData.isAuction ? 'Auction Settings' : 'Pricing'}
                    </h5>
                  </div>
                </div>
                <div className="card-body p-4">
                  <div className="row g-3">
                    {formData.isAuction ? (
                      <>
                        <div className="col-md-6">
                          <label htmlFor="minimumBid" className="form-label fw-medium">
                            Starting Bid <span className="text-danger">*</span>
                          </label>
                          <div className="input-group">
                            <span className="input-group-text bg-light border-end-0">₹</span>
                            <input
                              type="number"
                              className="form-control border-start-0 py-3"
                              id="minimumBid"
                              name="minimumBid"
                              value={formData.minimumBid}
                              onChange={handleInputChange}
                              placeholder="0.00"
                              min="0"
                              step="0.01"
                              required
                            />
                          </div>
                        </div>

                        <div className="col-md-6">
                          <label htmlFor="reservePrice" className="form-label fw-medium">
                            Reserve Price <span className="text-muted">(Optional)</span>
                          </label>
                          <div className="input-group">
                            <span className="input-group-text bg-light border-end-0">₹</span>
                            <input
                              type="number"
                              className="form-control border-start-0 py-3"
                              id="reservePrice"
                              name="reservePrice"
                              value={formData.reservePrice}
                              onChange={handleInputChange}
                              placeholder="0.00"
                              min="0"
                              step="0.01"
                            />
                          </div>
                          <div className="form-text">
                            Minimum price you'll accept (hidden from bidders)
                          </div>
                        </div>

                        <div className="col-md-6">
                          <label htmlFor="auctionDuration" className="form-label fw-medium">
                            Auction Duration <span className="text-danger">*</span>
                          </label>
                          <div className="input-group">
                            <span className="input-group-text bg-light border-end-0">
                              <Clock size={18} className="text-muted" />
                            </span>
                            <select
                              className="form-select border-start-0 py-3"
                              id="auctionDuration"
                              name="auctionDuration"
                              value={formData.auctionDuration}
                              onChange={handleInputChange}
                              required
                            >
                              <option value="1">1 Day</option>
                              <option value="3">3 Days</option>
                              <option value="5">5 Days</option>
                              <option value="7">7 Days</option>
                              <option value="10">10 Days</option>
                              <option value="14">14 Days</option>
                            </select>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="col-md-6">
                        <label htmlFor="price" className="form-label fw-medium">
                          Price <span className="text-danger">*</span>
                        </label>
                        <div className="input-group">
                          <span className="input-group-text bg-light border-end-0">₹</span>
                          <input
                            type="number"
                            className="form-control border-start-0 py-3"
                            id="price"
                            name="price"
                            value={formData.price}
                            onChange={handleInputChange}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            required
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Images Card */}
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-header bg-white border-0 py-3">
                  <div className="d-flex align-items-center">
                    <ImageIcon className="me-2" size={20} style={{ color: '#9333ea' }} />
                    <h5 className="mb-0 fw-semibold">
                      {formData.isAuction ? 'Auction Images' : 'Product Images'}
                    </h5>
                  </div>
                </div>
                <div className="card-body p-4">
                  <div className="row g-3">
                    <div className="col-12">
                      <ImageUpload
                        onImageUploaded={handleImageUploaded}
                        altText={formData.name}
                        folder={formData.isAuction ? "auctions" : "products"}
                      />
                    </div>

                    {/* Uploaded Images Preview */}
                    {uploadedImages.length > 0 && (
                      <div className="col-12">
                        <label className="form-label fw-medium">Uploaded Images</label>
                        <div className="row g-3">
                          {uploadedImages.map((image, index) => (
                            <div key={index} className="col-6 col-md-4 col-lg-3">
                              <div className="position-relative">
                                <img
                                  src={image.url}
                                  alt={`${formData.isAuction ? 'Auction' : 'Product'} ${index + 1}`}
                                  className="img-fluid rounded"
                                  style={{ height: '120px', width: '100%', objectFit: 'cover' }}
                                />
                                <button
                                  type="button"
                                  onClick={() => removeImage(index)}
                                  className="btn btn-danger btn-sm position-absolute top-0 end-0 rounded-circle p-1"
                                  style={{ transform: 'translate(50%, -50%)' }}
                                >
                                  <X size={12} />
                                </button>
                                {index === 0 && (
                                  <span className="badge bg-primary position-absolute bottom-0 start-0 m-2">
                                    Primary
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="form-text mt-2">
                          First image will be used as the primary image
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="d-flex gap-3 justify-content-end">
                <Link
                  to="/marketplace"
                  className="btn btn-outline-secondary px-4 py-3 text-decoration-none"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn text-white px-5 py-3 fw-semibold"
                  style={{ background: 'linear-gradient(135deg, #9333ea, #f97316)' }}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      {formData.isAuction ? 'Creating Auction...' : 'Creating Listing...'}
                    </>
                  ) : (
                    <>
                      <Plus size={18} className="me-2" />
                      {formData.isAuction ? 'Start Auction' : 'Submit Listing'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <style jsx>{`
        .form-control:focus,
        .form-select:focus {
          border-color: #9333ea;
          box-shadow: 0 0 0 0.2rem rgba(147, 51, 234, 0.25);
        }
        
        .form-switch .form-check-input:checked {
          background-color: #9333ea;
          border-color: #9333ea;
        }
      `}</style>
    </div>
  );
};

export default ProductManager;
import { useState } from 'react';
import { ArrowLeft, Upload, Loader } from 'lucide-react';
import '../styles/HomePage.css';

export default function AddNewProduct() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    stock: 0,
    role: 'seller',
    images: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [imagePreview, setImagePreview] = useState([]);
  
  const categories = [
    'Electronics',
    'Clothing',
    'Home & Kitchen',
    'Books',
    'Toys & Games',
    'Beauty',
    'Sports',
    'Automotive',
    'Other'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'price' || name === 'stock' ? Number(value) : value
    });
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    // In a real app, you'd upload these files to a server/cloud storage
    // For now, we'll just create URLs for preview
    const newPreviews = files.map(file => URL.createObjectURL(file));
    
    setImagePreview([...imagePreview, ...newPreviews]);
    // In this demo, we'll just store file names
    setFormData({
      ...formData,
      images: [...formData.images, ...files.map(file => file.name)]
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    
    // Basic form validation matching the server schema requirements
    if (!formData.title || formData.title.trim() === '') {
      setError('Product title is required');
      setLoading(false);
      return;
    }
    
    if (formData.price === '' || formData.price <= 0) {
      setError('Price must be a positive number');
      setLoading(false);
      return;
    }
    
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('Authentication required. Please login.');
      }
      
      // Ensure data structure matches schema expectations
      const productData = {
        title: formData.title.trim(),
        description: formData.description?.trim() || '',
        price: Number(formData.price),
        category: formData.category || 'Other',
        stock: Number(formData.stock) || 0,
        images: formData.images || [],
        user: {role:"seller"}
        // Note: seller will be added by the backend from the JWT token
      };
      
      const response = await fetch('http://localhost:6080/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // JWT for authenticateJWT middleware
        },
        body: JSON.stringify(productData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        // Handle specific validation errors that might be returned
        if (errorData.errors) {
          const errorMessages = Object.values(errorData.errors)
            .map(err => err.message || err)
            .join(', ');
          throw new Error(errorMessages || 'Validation failed');
        }
        
        // Handle authorization errors
        if (response.status === 401) {
          throw new Error('Authentication expired. Please login again.');
        }
        
        if (response.status === 403) {
          throw new Error('You do not have permission to create products. Seller or admin role required.');
        }
        
        throw new Error(errorData.message || 'Failed to create product');
      }
      
      const createdProduct = await response.json();
      
      setSuccess(true);
      console.log('Product created successfully:', createdProduct);
      
      // Reset form after successful submission
      setFormData({
        title: '',
        description: '',
        price: '',
        category: '',
        stock: 0,
        images: []
      });
      setImagePreview([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const removeImage = (index) => {
    const newPreviews = [...imagePreview];
    const newImages = [...formData.images];
    
    newPreviews.splice(index, 1);
    newImages.splice(index, 1);
    
    setImagePreview(newPreviews);
    setFormData({
      ...formData,
      images: newImages
    });
  };

  return (
    <div className="home-container">
      {/* Background Elements */}
      <div className="grid-pattern"></div>
      <div className="gradient-orbs">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
        <div className="orb orb-4"></div>
      </div>
      <div className="grid-lines"></div>
      <div className="wave-animation"></div>
      <div className="eco-leaves"></div>

      <div className="min-h-screen text-white p-6 relative z-10 max-w-3xl mx-auto">
        {/* Header with back button */}
        <div className="flex items-center mb-8">
          <button 
            className="flex items-center text-cyan-400 hover:text-cyan-300 transition-colors"
            type="button"
            onClick={() => window.history.back()}
          >
            <ArrowLeft size={24} className="mr-2" />
            <span className="text-lg">Back</span>
          </button>
        </div>
        
        {/* Title */}
        <div className="mb-8 border-2 border-pink-500 bg-gradient-to-r from-purple-800/30 to-pink-600/30 p-4 rounded-lg">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500">
            Add New Product
          </h1>
        </div>

        {/* Success message */}
        {success && (
          <div className="mb-6 p-4 bg-gradient-to-r from-green-900/50 to-green-700/50 border border-green-500 rounded-lg">
            <p className="text-green-300">Product successfully created!</p>
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-gradient-to-r from-red-900/50 to-red-700/50 border border-red-500 rounded-lg">
            <p className="text-red-300">{error}</p>
          </div>
        )}
        
        {/* Form Fields */}
        <div className="space-y-6">
          {/* Product Title */}
          <div className="space-y-2">
            <label htmlFor="title" className="block text-cyan-300">Product Title</label>
            <input
              type="text"
              id="title"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-800/80 border-2 border-cyan-700 rounded-lg focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30 transition-all"
            />
          </div>
          
          {/* Category */}
          <div className="space-y-2">
            <label htmlFor="category" className="block text-cyan-300">Category</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-800/80 border-2 border-cyan-700 rounded-lg focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30 transition-all appearance-none"
              style={{ 
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2381e6d9' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 1rem center',
                backgroundSize: '1.5em'
              }}
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          
          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="description" className="block text-cyan-300">Description</label>
            <textarea
              id="description"
              name="description"
              rows="4"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-800/80 border-2 border-cyan-700 rounded-lg focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30 transition-all"
            ></textarea>
          </div>
          
          {/* Price and Stock in a row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="price" className="block text-cyan-300">Price ($)</label>
              <input
                type="number"
                id="price"
                name="price"
                min="0"
                step="0.01"
                required
                value={formData.price}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-800/80 border-2 border-cyan-700 rounded-lg focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30 transition-all"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="stock" className="block text-cyan-300">Stock</label>
              <input
                type="number"
                id="stock"
                name="stock"
                min="0"
                value={formData.stock}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-800/80 border-2 border-cyan-700 rounded-lg focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30 transition-all"
              />
            </div>
          </div>
          
          {/* Image Upload */}
          <div className="space-y-4">
            <label className="block text-cyan-300">Product Images</label>
            <div className="flex items-center justify-center w-full">
              <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-cyan-700 rounded-lg cursor-pointer bg-gray-800/50 hover:bg-gray-800 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-10 h-10 mb-3 text-pink-500" />
                  <p className="mb-2 text-sm text-cyan-300"><span className="font-bold">Click to upload</span> or drag and drop</p>
                  <p className="text-xs text-gray-400">PNG, JPG, WEBP (MAX. 5MB)</p>
                </div>
                <input 
                  id="dropzone-file" 
                  type="file" 
                  className="hidden" 
                  multiple 
                  onChange={handleImageUpload}
                  accept="image/*"
                />
              </label>
            </div>
            
            {/* Image Preview */}
            {imagePreview.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {imagePreview.map((src, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={src} 
                      alt={`Preview ${index}`} 
                      className="h-24 w-full object-cover rounded-lg border-2 border-cyan-700"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Submit Button */}
          <button
            type="button"
            disabled={loading}
            onClick={handleSubmit}
            className="w-full py-4 bg-gradient-to-r from-cyan-500 to-pink-500 text-white font-bold rounded-lg hover:from-cyan-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-50 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <Loader className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                Processing...
              </span>
            ) : 'Submit Listing'}
          </button>
        </div>
      </div>
    </div>
  );
}

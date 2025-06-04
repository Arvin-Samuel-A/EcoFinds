import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader } from 'lucide-react';

const ImageUpload = ({ onImageUploaded, currentImage, altText, folder = 'profiles' }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentImage || null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setError('');
    setUploading(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);

      // Upload to backend
      const formData = new FormData();
      formData.append('image', file);
      if (altText) formData.append('altText', altText);

      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/upload/image?folder=${folder}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        onImageUploaded(data.image);
      } else {
        setError(data.message || 'Upload failed');
        setPreview(currentImage); // Reset preview on error
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError('Upload failed. Please try again.');
      setPreview(currentImage); // Reset preview on error
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreview(null);
    onImageUploaded(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="image-upload">
      <div className="mb-3">
        <label className="form-label fw-medium">Profile Image</label>
        
        {preview ? (
          <div className="position-relative d-inline-block">
            <img
              src={preview}
              alt="Profile preview"
              className="rounded"
              style={{
                width: '120px',
                height: '120px',
                objectFit: 'cover',
                border: '2px solid #dee2e6'
              }}
            />
            {!uploading && (
              <button
                type="button"
                onClick={handleRemoveImage}
                className="btn btn-danger btn-sm position-absolute top-0 end-0 rounded-circle p-1"
                style={{ transform: 'translate(50%, -50%)' }}
              >
                <X size={14} />
              </button>
            )}
            {uploading && (
              <div 
                className="position-absolute top-50 start-50 translate-middle bg-dark bg-opacity-50 rounded d-flex align-items-center justify-content-center"
                style={{ width: '120px', height: '120px' }}
              >
                <Loader className="text-white" size={24} />
              </div>
            )}
          </div>
        ) : (
          <div
            onClick={() => !uploading && fileInputRef.current?.click()}
            className="d-flex flex-column align-items-center justify-content-center border border-2 border-dashed rounded p-4"
            style={{
              width: '120px',
              height: '120px',
              cursor: uploading ? 'not-allowed' : 'pointer',
              borderColor: '#dee2e6',
              backgroundColor: '#f8f9fa'
            }}
          >
            {uploading ? (
              <Loader className="text-muted mb-2" size={24} />
            ) : (
              <>
                <ImageIcon className="text-muted mb-2" size={24} />
                <Upload className="text-muted mb-2" size={16} />
              </>
            )}
            <small className="text-muted text-center">
              {uploading ? 'Uploading...' : 'Click to upload'}
            </small>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        disabled={uploading}
      />

      {error && (
        <div className="alert alert-danger alert-sm mb-3">
          {error}
        </div>
      )}

      <div className="form-text">
        Upload a profile image (JPG, PNG, GIF). Max size: 5MB
      </div>
    </div>
  );
};

export default ImageUpload;
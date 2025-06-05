// Create new file: frontend_final/src/ReviewModal.jsx

import React, { useState } from 'react';
import { Star, X, CheckCircle, AlertCircle } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

const ReviewModal = ({ isOpen, onClose, productId, productName, orderId }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmitReview = async () => {
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/products/${productId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          rating,
          comment: comment.trim(),
          orderId
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Review submitted successfully!');
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(data.message || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      setError('Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStarClick = (starRating) => {
    setRating(starRating);
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Leave a Review</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              disabled={loading}
            ></button>
          </div>
          <div className="modal-body">
            <h6 className="fw-semibold mb-3">{productName}</h6>
            
            {/* Success Message */}
            {success && (
              <div className="alert alert-success d-flex align-items-center mb-3" role="alert">
                <CheckCircle size={20} className="me-2" />
                {success}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="alert alert-danger d-flex align-items-center mb-3" role="alert">
                <AlertCircle size={20} className="me-2" />
                {error}
              </div>
            )}

            {/* Rating */}
            <div className="mb-4">
              <label className="form-label fw-medium">Your Rating *</label>
              <div className="d-flex align-items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleStarClick(star)}
                    className="btn p-0 border-0 bg-transparent"
                    disabled={loading}
                  >
                    <Star
                      size={32}
                      className={star <= rating ? 'text-warning' : 'text-muted'}
                      fill={star <= rating ? 'currentColor' : 'none'}
                      style={{ cursor: 'pointer' }}
                    />
                  </button>
                ))}
                <span className="ms-2 text-muted">
                  {rating > 0 && (
                    <>
                      {rating} star{rating !== 1 ? 's' : ''}
                      {rating === 1 && ' - Poor'}
                      {rating === 2 && ' - Fair'}
                      {rating === 3 && ' - Good'}
                      {rating === 4 && ' - Very Good'}
                      {rating === 5 && ' - Excellent'}
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Comment */}
            <div className="mb-3">
              <label htmlFor="reviewComment" className="form-label fw-medium">
                Your Review (Optional)
              </label>
              <textarea
                id="reviewComment"
                className="form-control"
                rows="4"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience with this product..."
                disabled={loading}
                maxLength={500}
              />
              <div className="form-text text-end">
                {comment.length}/500 characters
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmitReview}
              disabled={loading || rating === 0}
              className="btn text-white"
              style={{ background: 'linear-gradient(135deg, #9333ea, #f97316)' }}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Submitting...
                </>
              ) : (
                'Submit Review'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
import React, { useState, useEffect } from 'react';
import { 
  Star, 
  MessageSquare, 
  ThumbsUp, 
  Flag, 
  User,
  Filter,
  Search,
  AlertTriangle 
} from 'lucide-react';
import { useAuth } from './AuthContext';

const API_BASE_URL = 'http://localhost:5000/api';

const ReviewsComponent = ({ productId, sellerId, showAddReview = true, compact = false }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/products/${productId}/reviews`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setReviews(data.reviews || []);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchReviews();
    }
  }, [productId]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/products/${productId}/reviews`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rating: newReview.rating,
          comment: newReview.comment.trim()
        })
      });

      if (response.ok) {
        // Refresh reviews
        const reviewsResponse = await fetch(`${API_BASE_URL}/products/${productId}/reviews`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (reviewsResponse.ok) {
          const data = await reviewsResponse.json();
          setReviews(data.reviews || []);
        }
        
        setShowReviewForm(false);
        setNewReview({ rating: 5, comment: '' });
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReportReview = async (reviewId) => {
    try {
      const reason = prompt('Please provide a reason for reporting this review:');
      if (!reason) return;

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}/report`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        alert('Review reported successfully');
      }
    } catch (error) {
      console.error('Error reporting review:', error);
    }
  };

  const renderStars = (rating, size = 16, interactive = false, onRatingChange = null) => {
    return (
      <div className="d-flex align-items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            className={`${
              star <= rating 
                ? 'text-warning' 
                : 'text-muted'
            } ${interactive ? 'cursor-pointer' : ''}`}
            fill={star <= rating ? 'currentColor' : 'none'}
            onClick={interactive ? () => onRatingChange?.(star) : undefined}
            style={{ cursor: interactive ? 'pointer' : 'default' }}
          />
        ))}
        <span className="ms-2 small text-muted">({rating})</span>
      </div>
    );
  };

  const filteredAndSortedReviews = reviews
    .filter(review => {
      if (filter === 'all') return true;
      if (filter === '5') return review.rating === 5;
      if (filter === '4') return review.rating === 4;
      if (filter === '3') return review.rating === 3;
      if (filter === '2') return review.rating === 2;
      if (filter === '1') return review.rating === 1;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'highest') return b.rating - a.rating;
      if (sortBy === 'lowest') return a.rating - b.rating;
      return 0;
    });

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading reviews...</span>
        </div>
      </div>
    );
  }

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <div className={`reviews-component ${compact ? 'compact' : ''}`}>
      {/* Reviews Summary */}
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card border-0 bg-light h-100">
            <div className="card-body text-center">
              <div className="display-4 fw-bold text-primary">{averageRating}</div>
              {renderStars(Math.round(averageRating), 20)}
              <p className="text-muted mb-0 mt-2">
                Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
        
        <div className="col-md-8">
          <div className="card border-0 bg-light h-100">
            <div className="card-body">
              <h6 className="card-title">Rating Breakdown</h6>
              {[5, 4, 3, 2, 1].map(rating => {
                const count = reviews.filter(r => r.rating === rating).length;
                const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                return (
                  <div key={rating} className="d-flex align-items-center mb-2">
                    <span className="me-2">{rating}</span>
                    <Star size={14} className="text-warning me-2" fill="currentColor" />
                    <div className="progress flex-grow-1 me-2" style={{ height: '8px' }}>
                      <div 
                        className="progress-bar bg-warning" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <small className="text-muted">{count}</small>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Add Review Button/Form */}
      {showAddReview && user && user._id !== sellerId && (
        <div className="mb-4">
          {!showReviewForm ? (
            <button 
              onClick={() => setShowReviewForm(true)}
              className="btn btn-primary"
            >
              <MessageSquare size={16} className="me-2" />
              Write a Review
            </button>
          ) : (
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h6 className="mb-0">Write Your Review</h6>
                <button 
                  onClick={() => setShowReviewForm(false)}
                  className="btn btn-sm btn-outline-secondary"
                >
                  Cancel
                </button>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmitReview}>
                  <div className="mb-3">
                    <label className="form-label">Rating</label>
                    {renderStars(newReview.rating, 24, true, (rating) => 
                      setNewReview(prev => ({ ...prev, rating }))
                    )}
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Comment (Optional)</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      placeholder="Share your experience with this product..."
                      value={newReview.comment}
                      onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                    />
                  </div>
                  
                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="btn btn-primary"
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Review'
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters and Sort */}
      <div className="row mb-3">
        <div className="col-md-6">
          <div className="d-flex gap-2">
            <select 
              className="form-select form-select-sm"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Reviews</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
            <select 
              className="form-select form-select-sm"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Rated</option>
              <option value="lowest">Lowest Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="reviews-list">
        {filteredAndSortedReviews.length === 0 ? (
          <div className="text-center py-5">
            <MessageSquare size={48} className="text-muted mb-3" />
            <h5>No Reviews Yet</h5>
            <p className="text-muted">Be the first to review this product!</p>
          </div>
        ) : (
          filteredAndSortedReviews.map((review) => (
            <div key={review._id} className="card mb-3">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className="d-flex align-items-center">
                    <div className="me-3">
                      {review.user?.images?.url ? (
                        <img 
                          src={review.user.images.url} 
                          alt={review.user.name}
                          className="rounded-circle"
                          style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                        />
                      ) : (
                        <div 
                          className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white"
                          style={{ width: '40px', height: '40px' }}
                        >
                          <User size={20} />
                        </div>
                      )}
                    </div>
                    <div>
                      <h6 className="mb-1">{review.user?.name || 'Anonymous'}</h6>
                      {renderStars(review.rating, 14)}
                    </div>
                  </div>
                  
                  <div className="d-flex align-items-center gap-2">
                    <small className="text-muted">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </small>
                    {user && user._id !== review.user?._id && (
                      <button 
                        onClick={() => handleReportReview(review._id)}
                        className="btn btn-sm btn-outline-danger"
                        title="Report Review"
                      >
                        <Flag size={12} />
                      </button>
                    )}
                  </div>
                </div>
                
                {review.comment && (
                  <p className="mb-0">{review.comment}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReviewsComponent;
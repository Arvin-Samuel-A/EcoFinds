import React, { useState, useEffect } from 'react';
import { Star, User, MessageSquare, TrendingUp, TrendingDown } from 'lucide-react';
import { useAuth } from './AuthContext';

const API_BASE_URL = 'http://localhost:5000/api';

const UserProfileReviews = ({ userId, userType = 'seller' }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });

  useEffect(() => {
    const fetchUserReviews = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        // Fetch reviews for the user's products (if seller) or purchases (if buyer)
        const response = await fetch(`${API_BASE_URL}/users/${userId}/reviews?type=${userType}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setReviews(data.reviews || []);
          
          // Calculate stats
          if (data.reviews && data.reviews.length > 0) {
            const total = data.reviews.length;
            const average = data.reviews.reduce((sum, review) => sum + review.rating, 0) / total;
            const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
            
            data.reviews.forEach(review => {
              distribution[review.rating]++;
            });

            setStats({
              averageRating: average,
              totalReviews: total,
              ratingDistribution: distribution
            });
          }
        }
      } catch (error) {
        console.error('Error fetching user reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserReviews();
    }
  }, [userId, userType]);

  const renderStars = (rating, size = 16) => {
    return (
      <div className="d-flex align-items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            className={star <= rating ? 'text-warning' : 'text-muted'}
            fill={star <= rating ? 'currentColor' : 'none'}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading reviews...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="user-profile-reviews">
      {/* Stats Summary */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <div className="display-5 fw-bold text-primary mb-2">
                {stats.averageRating.toFixed(1)}
              </div>
              {renderStars(Math.round(stats.averageRating), 20)}
              <p className="text-muted mb-0 mt-2">
                {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''} as {userType}
              </p>
            </div>
          </div>
        </div>
        
        <div className="col-md-6">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h6 className="card-title mb-3">Rating Distribution</h6>
              {[5, 4, 3, 2, 1].map(rating => {
                const count = stats.ratingDistribution[rating];
                const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                return (
                  <div key={rating} className="d-flex align-items-center mb-2">
                    <span className="me-2">{rating}</span>
                    <Star size={14} className="text-warning me-2" fill="currentColor" />
                    <div className="progress flex-grow-1 me-2" style={{ height: '6px' }}>
                      <div 
                        className="progress-bar bg-warning" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <small className="text-muted" style={{ minWidth: '30px' }}>
                      {count}
                    </small>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Reviews */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white">
          <h6 className="mb-0">Recent Reviews</h6>
        </div>
        <div className="card-body">
          {reviews.length === 0 ? (
            <div className="text-center py-4">
              <MessageSquare size={48} className="text-muted mb-3" />
              <h6>No Reviews Yet</h6>
              <p className="text-muted">No reviews available for this {userType}.</p>
            </div>
          ) : (
            <div className="reviews-list">
              {reviews.slice(0, 5).map((review) => (
                <div key={review._id} className="border-bottom pb-3 mb-3 last:border-0">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center">
                      <div className="me-3">
                        {review.user?.images?.url ? (
                          <img 
                            src={review.user.images.url} 
                            alt={review.user.name}
                            className="rounded-circle"
                            style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                          />
                        ) : (
                          <div 
                            className="rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white"
                            style={{ width: '32px', height: '32px' }}
                          >
                            <User size={16} />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="fw-medium">{review.user?.name || 'Anonymous'}</div>
                        {renderStars(review.rating, 12)}
                      </div>
                    </div>
                    <small className="text-muted">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </small>
                  </div>
                  
                  {review.comment && (
                    <p className="mb-2 small">{review.comment}</p>
                  )}
                  
                  {review.product && (
                    <div className="d-flex align-items-center">
                      <small className="text-muted">
                        Product: <span className="fw-medium">{review.product.name}</span>
                      </small>
                    </div>
                  )}
                </div>
              ))}
              
              {reviews.length > 5 && (
                <div className="text-center mt-3">
                  <button className="btn btn-outline-primary btn-sm">
                    View All Reviews ({reviews.length})
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileReviews;
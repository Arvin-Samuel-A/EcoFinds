import { useState, useEffect } from 'react';
import { Camera, Edit2, LogOut } from 'lucide-react';
import axios from 'axios';
import '../styles/ProfilePage.css';

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    location: ''
  });
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('Authentication required');
        }
        
        const response = await axios.get('/api/users/me', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        setUser(response.data);
        setFormData({
          name: response.data.name || '',
          email: response.data.email || '',
          bio: response.data.bio || '',
          location: response.data.location || ''
        });
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to fetch user data');
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Handle form field changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle profile image change
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit form to update user profile
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Update user data
      const response = await axios.put('/api/users/me', formData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      
      // If there's a new profile image, upload it
      if (profileImage) {
        const formData = new FormData();
        formData.append('profileImage', profileImage);
        
        // This would be a separate endpoint for image upload
        await axios.post('/api/users/me/profile-image', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        });
      }
      
      setUser(response.data);
      setIsEditing(false);
      // Show success message
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    }
  };

  // Toggle edit mode
  const toggleEdit = () => {
    setIsEditing(!isEditing);
    // Reset form data when canceling edit
    if (isEditing) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        bio: user.bio || '',
        location: user.location || ''
      });
      setProfileImage(null);
      setImagePreview(null);
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    // Redirect to login page
    window.location.href = '/login';
  };

  // Loading state
  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="profile-container">
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="grid-pattern"></div>
      <div className="gradient-orbs">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
      </div>
      
      <div className="profile-content">
        <header className="app-header">
          <div className="logo">
            <div className="logo-text">EcoFinds</div>
            <div className="logo-accent"></div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
          </button>
        </header>

        <div className="profile-card">
          <div className="profile-header">
            <h1>User Profile</h1>
            <div className="neon-underline"></div>
          </div>

          <div className="profile-body">
            <div className="profile-image-container">
              <div className="profile-image">
                {imagePreview ? (
                  <img src={imagePreview} alt="Profile preview" />
                ) : user?.profileImage ? (
                  <img src={user.profileImage} alt={user.name} />
                ) : (
                  <div className="default-avatar">
                    <span>{user?.name?.charAt(0) || '?'}</span>
                  </div>
                )}
                {isEditing && (
                  <label className="change-photo-btn">
                    <Camera size={20} />
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageChange} 
                      hidden 
                    />
                  </label>
                )}
              </div>
              {!isEditing && (
                <button className="edit-profile-btn" onClick={toggleEdit}>
                  <Edit2 size={16} />
                  Edit Profile
                </button>
              )}
            </div>

            <div className="profile-details">
              {isEditing ? (
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="name">Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="bio">Bio</label>
                    <textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      rows="3"
                    ></textarea>
                  </div>

                  <div className="form-group">
                    <label htmlFor="location">Location</label>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-actions">
                    <button type="button" className="cancel-btn" onClick={toggleEdit}>
                      Cancel
                    </button>
                    <button type="submit" className="save-btn">
                      Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                <div className="user-info">
                  <div className="info-item">
                    <span className="info-label">Name</span>
                    <span className="info-value">{user?.name || 'Not set'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Email</span>
                    <span className="info-value">{user?.email || 'Not set'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Bio</span>
                    <span className="info-value">{user?.bio || 'Not set'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Location</span>
                    <span className="info-value">{user?.location || 'Not set'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="navigation-card">
          <h2>Navigations</h2>
          <div className="nav-buttons">
            <a href="/listings" className="nav-btn">
              My Listings
            </a>
            <a href="/purchases" className="nav-btn">
              My Purchases
            </a>
          </div>
        </div>
      </div>

      <div className="wave-animation"></div>
      <div className="grid-lines"></div>
    </div>
  );
};

export default ProfilePage;
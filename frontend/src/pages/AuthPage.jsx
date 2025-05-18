import { useState } from 'react';
import '../styles/AuthPage.css';
import { X, Leaf, Shield, Globe } from 'lucide-react';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({
    email: '',
    password: '',
    fullName: '',
    username: '',
    confirmPassword: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  const endpoint = isLogin ? 'http://localhost:6000/api/auth/login' : 'http://localhost:6080/api/auth/register';

  const payload = isLogin
    ? {
        email: form.email,
        password: form.password,
      }
    : {
        name: form.fullName,
        email: form.email,
        password: form.password,
      };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || 'Authentication failed.');
      return;
    }

    // Handle token (e.g., save to localStorage, redirect, etc.)
    localStorage.setItem('authToken', data.token);
    alert(`${isLogin ? 'Login' : 'Registration'} successful!`);
    // redirect logic here if needed
  } catch (error) {
    console.error('Error during authentication:', error);
    alert('An unexpected error occurred.');
  }
};


  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
  };

  return (
    <div className="auth-container">
      <div className="grid-pattern"></div>
      <div className="gradient-orbs">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
        <div className="orb orb-4"></div>
      </div>
      <div className="eco-leaves"></div>
      <div className="eco-icon eco-icon-1"></div>
      <div className="eco-icon eco-icon-2"></div>

      <div className="auth-content">
        <div className="left-panel">
          <div className="branding">
            <div className="logo">
              <div className="logo-text">EcoFinds</div>
              <div className="logo-accent"></div>
            </div>
            <h1 className="tagline">Sustainable Discoveries</h1>
          </div>
          
          <div style={{ marginTop: "4rem" }}>
            <div className="feature-item">
              <div className="feature-icon">
                <Leaf size={20} color="white" />
              </div>
              <div className="feature-text">Discover eco-friendly products from verified suppliers</div>
            </div>
            
            <div className="feature-item">
              <div className="feature-icon">
                <Shield size={20} color="white" />
              </div>
              <div className="feature-text">Trusted by thousands of environmentally conscious shoppers</div>
            </div>
            
            <div className="feature-item">
              <div className="feature-icon">
                <Globe size={20} color="white" />
              </div>
              <div className="feature-text">Join our community and make a positive impact on the planet</div>
            </div>
          </div>
        </div>

        <div className="right-panel">
          <div className="auth-card">
            <div className="card-header">
              <h2>{isLogin ? 'Login' : 'Sign Up'}</h2>
              <div className="neon-underline"></div>
            </div>

            <form onSubmit={handleSubmit}>
              {!isLogin && (
                <>
                  <div className="form-group">
                    <label htmlFor="fullName">Full Name</label>
                    <div className="input-wrapper">
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        placeholder="Enter your full name"
                        value={form.fullName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <div className="input-wrapper">
                      <input
                        type="text"
                        id="username"
                        name="username"
                        placeholder="Create a username"
                        value={form.username}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <div className="input-wrapper">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="Enter your email"
                    value={form.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-wrapper">
                  <input
                    type="password"
                    id="password"
                    name="password"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              {!isLogin && (
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <div className="input-wrapper">
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      placeholder="Confirm your password"
                      value={form.confirmPassword}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              )}

              <button type="submit" className="submit-btn">
                {isLogin ? 'Login' : 'Sign Up'}
                <span className="btn-glow"></span>
              </button>
            </form>

            <div className="auth-footer">
              <p>
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button className="toggle-auth" onClick={toggleAuthMode}>
                  {isLogin ? 'Sign Up' : 'Login'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="wave-animation"></div>
      <div className="grid-lines"></div>
    </div>
  );
};

export default AuthPage;
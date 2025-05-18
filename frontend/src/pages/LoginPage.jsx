import React, { useState } from 'react';
import '../styles/LoginPage.css';

const LoginPage = () => {
  const [form, setForm] = useState({
    email: '',
    password: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle login logic here
    console.log('Login submitted:', form);
  };

  return (
    <div className="login-container">
      <div className="background-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
        <div className="shape shape-4"></div>
      </div>

      <div className="login-card">
        <div className="logo">
          <h1>EcoFinds</h1>
          <div className="logo-accent"></div>
        </div>
        <h2 className="tagline">Sustainable Discoveries</h2>

        <form onSubmit={handleSubmit} className="login-form">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="Enter your email"
            value={form.email}
            onChange={handleInputChange}
            required
          />

          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            placeholder="Enter your password"
            value={form.password}
            onChange={handleInputChange}
            required
          />

          <button type="submit" className="login-btn">Login</button>
        </form>

        <div className="signup-link">
          <p>Don't have an account? <button className="link-btn">Sign Up</button></p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

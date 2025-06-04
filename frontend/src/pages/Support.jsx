import React from 'react';
import '../styles/HomePage.css';

const Support = () => {
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

      <section className="company-overview enhanced-overview">
        <h1>Support</h1>
        <p>If you have any questions or need assistance, we are here to help!</p>
        <h2>Common Support Topics</h2>
        <ul>
          <li>Order Tracking</li>
          <li>Returns and Refunds</li>
          <li>Product Information</li>
          <li>Account Management</li>
          <li>Technical Issues</li>
        </ul>
        <p>
          For further assistance, please <a href="/contact">contact our support team</a>.
        </p>
      </section>
    </div>
  );
};

export default Support;

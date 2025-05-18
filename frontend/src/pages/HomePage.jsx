import React from 'react';
import '../styles/HomePage.css';

const HomePage = () => {
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

      {/* Header */}
      

      {/* Company Overview Section */}
      <section className="company-overview enhanced-overview">
        <h1 className="company-title">Welcome to EcoFinds</h1>
        <p className="company-description">
          At EcoFinds, we are dedicated to connecting eco-conscious consumers with sustainable products that make a positive impact on our planet. Our mission is to promote environmentally friendly alternatives and support sellers who share our commitment to sustainability.
        </p>
        <p className="company-description">
          Join our growing community of mindful shoppers and sellers who believe in making responsible choices for a greener future. Together, we can make a difference—one product at a time.
        </p>
        <div className="company-values enhanced-values">
          <div className="value-card">
            <h3>🌱 Sustainability</h3>
            <p>We prioritize products that are kind to the environment and promote sustainable living.</p>
          </div>
          <div className="value-card">
            <h3>🤝 Community</h3>
            <p>Building a supportive network of consumers and sellers who care about the planet.</p>
          </div>
          <div className="value-card">
            <h3>🌍 Impact</h3>
            <p>Encouraging responsible consumption to create a lasting positive impact worldwide.</p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="cta-section">
        <div className="cta-card">
          <h2>Ready to Make a Difference?</h2>
          <p>Join EcoFinds today and start your sustainable shopping journey.</p>
          <a href="/login"><button className="cta-btn">Create Account</button></a>
        </div>
      </section>

      {/* Footer */}

    </div>
  );
};

export default HomePage;

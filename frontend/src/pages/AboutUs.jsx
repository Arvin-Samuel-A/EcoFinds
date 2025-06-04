import React from 'react';
import '../styles/HomePage.css';

const AboutUs = () => {
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
        <h1>About Us</h1>
        <p>
          Welcome to EcoFinds! We are dedicated to providing eco-friendly and sustainable products to help you live a greener lifestyle. Our mission is to connect conscious consumers with responsible brands.
        </p>
        <p>
          Founded in 2024, EcoFinds has grown into a trusted marketplace for environmentally conscious shoppers. We believe in transparency, quality, and making a positive impact on the planet.
        </p>
      </section>
    </div>
  );
};

export default AboutUs;

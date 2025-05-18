import React from 'react';
import '../styles/HomePage.css';

const OurMission = () => {
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
        <h1>Our Mission</h1>
        <p>
          At EcoFinds, our mission is to promote sustainable living by offering a curated selection of eco-friendly products that reduce environmental impact.
        </p>
        <p>
          We strive to educate and empower consumers to make responsible choices that contribute to a healthier planet for future generations.
        </p>
        <p>
          Through innovation, transparency, and community engagement, we aim to lead the way in sustainable commerce.
        </p>
      </section>
    </div>
  );
};

export default OurMission;

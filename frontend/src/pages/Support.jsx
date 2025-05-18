import React from 'react';
import '../styles/Support.css';

const Support = () => {
  return (
    <div className="support-container">
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
    </div>
  );
};

export default Support;

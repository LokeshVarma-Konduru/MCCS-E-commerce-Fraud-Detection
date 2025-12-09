import React from 'react';
import logo from '../assets/logo.jpg';
import '../styles/Contact.css';
import { FaEnvelope, FaPhone, FaClock, FaMapMarkerAlt } from 'react-icons/fa';

const Contact = () => {
  return (
    <div className="contact-container">
      <div className="contact-content">
        {/* Page Header */}
        <div className="contact-header">
          <h1 className="contact-page-title">Contact Us</h1>
        </div>
          
        <div className="contact-grid">
          {/* Logo Section */}
          <div className="contact-logo-card">
            <img src={logo} alt="MCCS Logo" className="contact-logo" />
            <h2 className="contact-logo-title">Marine Corps Community Services</h2>
            <p className="contact-logo-subtitle">"Serving Those Who Serve"</p>
          </div>

          {/* Contact Details Section */}
          <div className="contact-details-card">
            <div className="contact-item">
              <FaEnvelope className="contact-icon" />
              <div className="contact-text">
                <h3 className="contact-item-title">Email</h3>
                <p className="contact-item-text">support@mccs.com</p>
                <p className="contact-item-text">info@mccs.com</p>
              </div>
            </div>

            <div className="contact-item">
              <FaPhone className="contact-icon" />
              <div className="contact-text">
                <h3 className="contact-item-title">Phone</h3>
                <p className="contact-item-text">Main: (555) 123-4567</p>
                <p className="contact-item-text">Support: (555) 987-6543</p>
              </div>
            </div>

            <div className="contact-item">
              <FaClock className="contact-icon" />
              <div className="contact-text">
                <h3 className="contact-item-title">Hours of Operation</h3>
                <p className="contact-item-text">24/7 Support Available</p>
                <p className="contact-item-text">Office: Mon-Fri, 8:00 AM - 5:00 PM EST</p>
              </div>
            </div>

            <div className="contact-item">
              <FaMapMarkerAlt className="contact-icon" />
              <div className="contact-text">
                <h3 className="contact-item-title">Location</h3>
                <p className="contact-item-text">Marine Corps Base Quantico</p>
                <p className="contact-item-text">3094 Upshur Ave, Quantico, VA 22134</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;

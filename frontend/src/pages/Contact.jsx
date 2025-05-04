import React from 'react';
import Footer from '../components/Footer';
import logo from '../assets/logo.jpg';
import '../styles/Contact.css';
import { FaEnvelope, FaPhone, FaClock, FaMapMarkerAlt } from 'react-icons/fa';

const Contact = () => {
  return (
    <div className="contact-container">
      <div className="contact-content">
        <div className="contact-section">
          <h1 className="text-3xl font-bold mb-4 text-gray-900 text-center">Contact Us</h1>
          
          <div className="contact-grid">
            {/* Logo Section */}
            <div className="logo-section">
              <img src={logo} alt="MCCS Logo" />
              <h2 className="text-xl text-gray-900 font-semibold mb-2">Marine Corps Community Services</h2>
              <p className="text-gray-600 text-center italic">"Serving Those Who Serve"</p>
            </div>

            {/* Contact Details Section */}
            <div className="contact-details">
              <div className="contact-item">
                <FaEnvelope className="contact-icon" />
                <div className="contact-text">
                  <h3 className="text-gray-900 font-semibold mb-2">Email</h3>
                  <p className="text-gray-600">support@mccs.com</p>
                  <p className="text-gray-600">info@mccs.com</p>
                </div>
              </div>

              <div className="contact-item">
                <FaPhone className="contact-icon" />
                <div className="contact-text">
                  <h3 className="text-gray-900 font-semibold mb-2">Phone</h3>
                  <p className="text-gray-600">Main: (555) 123-4567</p>
                  <p className="text-gray-600">Support: (555) 987-6543</p>
                </div>
              </div>

              <div className="contact-item">
                <FaClock className="contact-icon" />
                <div className="contact-text">
                  <h3 className="text-gray-900 font-semibold mb-2">Hours of Operation</h3>
                  <p className="text-gray-600">24/7 Support Available</p>
                  <p className="text-gray-600">Office: Mon-Fri, 8:00 AM - 5:00 PM EST</p>
                </div>
              </div>

              <div className="contact-item">
                <FaMapMarkerAlt className="contact-icon" />
                <div className="contact-text">
                  <h3 className="text-gray-900 font-semibold mb-2">Location</h3>
                  <p className="text-gray-600">Marine Corps Base Quantico</p>
                  <p className="text-gray-600">3094 Upshur Ave, Quantico, VA 22134</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Contact;

import React from 'react';
import logo from '../assets/logo.jpg';
import '../styles/AboutUs.css';

const AboutUs = () => {
  return (
    <div className="about-container">
      <div className="about-content">
        {/* Hero Section with Logo */}
        <div className="about-hero">
          <div className="about-hero-content">
            <img src={logo} alt="MCCS Logo" className="about-logo" />
            <h1 className="about-title">Welcome to MCCS</h1>
            <p className="about-subtitle">Marine Corps Community Services</p>
            <p className="about-motto">"Semper Fidelis"</p>
          </div>
        </div>

        {/* Mission Section */}
        <section className="about-section">
          <div className="about-section-inner">
            <h2 className="about-section-title">Our Mission</h2>
            <div className="about-card">
              <p className="about-text">
                MCCS is a comprehensive network of quality of life programs and services designed to support 
                and enhance the lives of Marines, their families, and the military community.
              </p>
              <p className="about-text">
                Our mission is to provide the highest quality programs, services, and facilities to support 
                the readiness and retention of Marines, while enhancing their quality of life and that of their families.
              </p>
            </div>
          </div>
        </section>

        {/* Core Values Section */}
        <section className="about-section about-section-alt">
          <div className="about-section-inner">
            <h2 className="about-section-title">Core Values</h2>
            <div className="about-values-grid">
              {[
                { title: 'Excellence', desc: 'in Service' },
                { title: 'Commitment', desc: 'to Our Community' },
                { title: 'Innovation', desc: 'in Solutions' },
                { title: 'Integrity', desc: 'in Operations' }
              ].map((value, index) => (
                <div key={index} className="about-value-card">
                  <h3 className="about-value-title">{value.title}</h3>
                  <p className="about-value-desc">{value.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Commitment Section */}
        <section className="about-section">
          <div className="about-section-inner">
            <h2 className="about-section-title">Our Commitment</h2>
            <div className="about-card">
              <p className="about-text about-text-center">
                In line with our motto "Semper Fidelis" (Always Faithful), we are committed to maintaining 
                the highest standards of security and reliability in our e-commerce fraud detection system, 
                protecting our community while ensuring seamless service delivery.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AboutUs;

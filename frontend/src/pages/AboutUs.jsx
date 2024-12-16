import React from 'react';
import Footer from '../components/Footer';
import logo from '../assets/logo.jpg';
import '../styles/AboutUs.css';

const AboutUs = () => {
  return (
    <div className="about-container bg-[#1a1a1a] text-gray-300">
      <div className="about-content">
        {/* Hero Section with Smaller Logo */}
        <div className="relative bg-[#222222] py-12 mt-16">
          <div className="container mx-auto px-6">
            <div className="flex flex-col items-center text-center">
              <img src={logo} alt="MCCS Logo" className="w-48 h-48 object-contain mb-6" />
              <h1 className="text-4xl font-bold mb-4 text-white">Welcome to MCCS</h1>
              <p className="text-xl text-gray-400">Marine Corps Community Services</p>
              <p className="text-lg text-gray-500 mt-2 italic">"Semper Fidelis"</p>
            </div>
          </div>
        </div>

        {/* Mission Section */}
        <section className="bg-[#1a1a1a] py-12">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold mb-8 text-center text-white">Our Mission</h2>
            <div className="bg-[#222222] p-6 rounded-lg shadow-lg">
              <p className="text-lg leading-relaxed">
                MCCS is a comprehensive network of quality of life programs and services designed to support 
                and enhance the lives of Marines, their families, and the military community.
              </p>
              <p className="text-lg leading-relaxed mt-4">
                Our mission is to provide the highest quality programs, services, and facilities to support 
                the readiness and retention of Marines, while enhancing their quality of life and that of their families.
              </p>
            </div>
          </div>
        </section>

        {/* Core Values Section */}
        <section className="bg-[#222222] py-12">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold mb-8 text-center text-white">Core Values</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { title: 'Excellence', desc: 'in Service' },
                { title: 'Commitment', desc: 'to Our Community' },
                { title: 'Innovation', desc: 'in Solutions' },
                { title: 'Integrity', desc: 'in Operations' }
              ].map((value, index) => (
                <div 
                  key={index} 
                  className="bg-[#1a1a1a] p-6 rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300 border border-gray-800"
                >
                  <h3 className="text-xl font-bold mb-2 text-white">{value.title}</h3>
                  <p className="text-gray-400">{value.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Commitment Section */}
        <section className="bg-[#1a1a1a] py-12">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold mb-8 text-center text-white">Our Commitment</h2>
            <div className="bg-[#222222] p-6 rounded-lg shadow-lg border border-gray-800">
              <p className="text-lg leading-relaxed text-center">
                In line with our motto "Semper Fidelis" (Always Faithful), we are committed to maintaining 
                the highest standards of security and reliability in our e-commerce fraud detection system, 
                protecting our community while ensuring seamless service delivery.
              </p>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
};

export default AboutUs;

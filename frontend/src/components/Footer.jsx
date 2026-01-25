import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-[#111111] border-t border-gray-800">
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* MCCS Info */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4">MCCS</h3>
            <p className="text-gray-400 mb-4">
              Marine Corps Community Services - Supporting our military community.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/developer" className="text-gray-400 hover:text-white transition-colors">
                  Developer Dashboard
                </Link>
              </li>
              <li>
                <Link to="/store-manager" className="text-gray-400 hover:text-white transition-colors">
                  Store Manager
                </Link>
              </li>
              <li>
                <Link to="/admin" className="text-gray-400 hover:text-white transition-colors">
                  Admin Dashboard
                </Link>
              </li>
              <li>
                <Link to="/reports" className="text-gray-400 hover:text-white transition-colors">
                  Reports
                </Link>
              </li>
              <li>
                <Link to="/help" className="text-gray-400 hover:text-white transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/chatbot" className="text-gray-400 hover:text-white transition-colors">
                  AI Assistant
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/api-integration" className="text-gray-400 hover:text-white transition-colors">
                  API Integration
                </Link>
              </li>
              <li>
                <Link to="/model-performance" className="text-gray-400 hover:text-white transition-colors">
                  Model Performance
                </Link>
              </li>
              <li>
                <Link to="/transaction-monitoring" className="text-gray-400 hover:text-white transition-colors">
                  Transaction Monitoring
                </Link>
              </li>
              <li>
                <Link to="/admin-panel" className="text-gray-400 hover:text-white transition-colors">
                  Admin Panel
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-400 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4">Contact Us</h3>
            <ul className="space-y-2 text-gray-400">
              <li>Email: support@mccs.com</li>
              <li>Phone: (555) 123-4567</li>
              <li>Hours: 24/7 Support</li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-500">
            &copy; {new Date().getFullYear()} MCCS. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

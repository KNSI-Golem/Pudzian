// components/footer/Footer.jsx
import React from 'react';
import { FaFacebook, FaLinkedin, FaYoutube, FaInstagram } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="w-full bg-white text-gray-800 py-8">
      <div className="container mx-auto px-60 border-t pt-8 border-gray-300">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          
          {/* Left side (Logo / Text) */}
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-medium">GolemVR</h2>
            <p className="text-sm text-gray-500">KNSI &quot;Golem&quot;</p>

            {/* Social icons */}
            <div className="flex gap-4 mt-4 text-xl text-gray-400">
              <a
                href="https://www.facebook.com/knsigolem"
                className="hover:text-gray-600"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaFacebook />
              </a>
              <a
                href="https://www.linkedin.com/company/artificial-intelligence-society-golem"
                className="hover:text-gray-600"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaLinkedin />
              </a>
              <a
                href="https://www.youtube.com/@knsigolem4058"
                className="hover:text-gray-600"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaYoutube />
              </a>
              <a
                href="https://www.instagram.com/knsi_golem/"
                className="hover:text-gray-600"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaInstagram />
              </a>
            </div>
          </div>

          {/* Right side (Authors) */}
          <div className="flex flex-col items-end">
            <h3 className="text-sm font-medium">Authors</h3>
            <ul className="mt-2 text-sm text-gray-500 flex flex-col gap-1">
              <li>Author</li>
              <li>Author</li>
              <li>Author</li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, 
  Github, 
  Linkedin, 
  Instagram, 
  Facebook, 
  MessageCircle,
  Globe,
  Mail,
  Phone,
  MapPin,
  Heart
} from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    {
      name: 'GitHub',
      icon: Github,
      url: 'https://github.com/abraralis',
      color: 'hover:text-gray-900',
      bgColor: 'hover:bg-gray-100'
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      url: 'https://linkedin.com/in/abraralis',
      color: 'hover:text-blue-600',
      bgColor: 'hover:bg-blue-50'
    },
    {
      name: 'Portfolio',
      icon: Globe,
      url: 'https://abrarali-porfolio.vercel.app/',
      color: 'hover:text-purple-600',
      bgColor: 'hover:bg-purple-50'
    },
    {
      name: 'Instagram',
      icon: Instagram,
      url: 'https://instagram.com/abrar00429',
      color: 'hover:text-pink-600',
      bgColor: 'hover:bg-pink-50'
    },
    {
      name: 'Facebook',
      icon: Facebook,
      url: 'https://www.facebook.com/share/171eyKNhn6/',
      color: 'hover:text-blue-700',
      bgColor: 'hover:bg-blue-50'
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      url: 'https://wa.me/916353346123',
      color: 'hover:text-green-600',
      bgColor: 'hover:bg-green-50'
    }
  ];

  // 🔥 UPDATED: Removed Analytics and ML Insights
  const quickLinks = [
    { name: 'Home', path: '/' },
    { name: 'Create Survey', path: '/create' },
    { name: 'My Surveys', path: '/surveys' }
  ];

  return (
    <footer className="bg-white border-t border-gray-200">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Brand Section - 5 columns */}
          <div className="md:col-span-5">
            {/* Logo & Brand */}
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  SurveySense
                </h3>
                <p className="text-xs text-gray-500">AI-Powered Surveys</p>
              </div>
            </div>
            
            {/* Description */}
            <p className="text-gray-600 text-sm leading-relaxed mb-6 max-w-sm">
              Transform your data collection with intelligent survey creation and AI-powered insights.
            </p>

            {/* Contact - Horizontal Layout */}
            <div className="flex flex-wrap gap-4 text-sm">
              <a 
                href="mailto:abrarali.sunasara28@gmail.com" 
                className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span>abrarali.sunasara28@gmail.com</span>
              </a>
              <a 
                href="tel:+916353346123" 
                className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span>+91 6353346123</span>
              </a>
            </div>
          </div>

          {/* Quick Links - 3 columns */}
          <div className="md:col-span-3">
            <h4 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wide">
              Quick Links
            </h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-gray-600 hover:text-blue-600 transition-colors text-sm group"
                  >
                    <span className="group-hover:translate-x-1 transition-transform duration-200 inline-block">
                      {link.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Media - 4 columns */}
          <div className="md:col-span-4">
            <h4 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wide">
              Connect
            </h4>
            <div className="grid grid-cols-6 gap-2 mb-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-2 rounded-lg border border-gray-200 bg-gray-50 transition-all duration-200 ${social.color} ${social.bgColor} hover:border-gray-300 transform hover:-translate-y-0.5`}
                    title={social.name}
                  >
                    <Icon className="w-4 h-4 mx-auto" />
                  </a>
                );
              })}
            </div>
            <div className="flex items-center space-x-2 text-gray-500">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">Bangaluru, KA, India</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-100 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
            
            {/* Copyright */}
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>© {currentYear} SurveySense</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">Made with</span>
              <Heart className="w-3 h-3 text-red-500" />
              <span className="hidden sm:inline">for researchers</span>
            </div>
            
            {/* Status & Tech Stack */}
            <div className="flex items-center space-x-4 text-sm">
              {/* System Status */}
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-gray-600">Operational</span>
              </div>
              
              {/* Tech Stack */}
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded font-medium">React</span>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded font-medium">Node.js</span>
                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded font-medium">AI</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart3, Plus, List } from 'lucide-react';

const Header: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">SurveySense</span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center space-x-6">
            <Link
              to="/"
              className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
            >
              Home
            </Link>
            <Link
              to="/surveys"
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 font-medium transition-colors"
            >
              <List className="w-4 h-4" />
              <span>Your Surveys</span>
            </Link>
            <Link
              to="/create"
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Survey</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
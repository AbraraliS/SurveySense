import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart3, PlusCircle, Home } from 'lucide-react';

export default function Header() {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="bg-white shadow-lg border-b border-gray-100">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2 text-2xl font-bold text-gray-800 hover:text-blue-600 transition-colors">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            <span>SurveyAI</span>
          </Link>

          <nav className="flex items-center space-x-6">
            <Link
              to="/"
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                isActive('/') 
                  ? 'bg-blue-100 text-blue-700 font-medium' 
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Link>
            
            <Link
              to="/create"
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                isActive('/create') 
                  ? 'bg-blue-100 text-blue-700 font-medium' 
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              <PlusCircle className="h-4 w-4" />
              <span>Create Survey</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
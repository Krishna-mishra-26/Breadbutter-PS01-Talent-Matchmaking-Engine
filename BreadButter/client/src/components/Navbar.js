import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Users, Briefcase, Plus } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">🍞</span>
              </div>
              <span className="text-xl font-bold text-gray-900">BreadButter</span>
              <span className="text-sm text-gray-500 bg-orange-100 px-2 py-1 rounded-full">
                Talent Engine
              </span>
            </Link>
          </div>

          <div className="flex items-center space-x-6">
            <Link 
              to="/" 
              className="flex items-center space-x-1 text-gray-700 hover:text-orange-600 transition-colors"
            >
              <Search size={18} />
              <span>Dashboard</span>
            </Link>
            
            <Link 
              to="/talent" 
              className="flex items-center space-x-1 text-gray-700 hover:text-orange-600 transition-colors"
            >
              <Users size={18} />
              <span>Talent</span>
            </Link>
            
            <Link 
              to="/create-gig" 
              className="flex items-center space-x-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Plus size={18} />
              <span>Create Gig</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

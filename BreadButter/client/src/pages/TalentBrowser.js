import React, { useState, useEffect } from 'react';
import { Search, MapPin, Star, Briefcase, Filter, Instagram, ExternalLink } from 'lucide-react';
import api from '../services/api';

const TalentBrowser = () => {
  const [talents, setTalents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    city: '',
    minExperience: '',
    maxBudget: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchTalents();
  }, [filters]);

  const fetchTalents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await api.get(`/talent?${params.toString()}`);
      setTalents(response.data.talents);
    } catch (error) {
      console.error('Error fetching talents:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTalents = talents.filter(talent =>
    talent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    talent.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase())) ||
    talent.categories.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      city: '',
      minExperience: '',
      maxBudget: ''
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow h-64"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          👥 Talent Directory
        </h1>
        <p className="text-gray-600">
          Browse and discover creative professionals in our network
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name, skills, or categories..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 text-gray-600 hover:text-orange-600 transition-colors"
          >
            <Filter size={18} />
            <span>Filters</span>
          </button>
          
          {Object.values(filters).some(v => v) && (
            <button
              onClick={clearFilters}
              className="text-sm text-orange-600 hover:text-orange-700 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                <option value="Photography">Photography</option>
                <option value="Design">Design</option>
                <option value="Videography">Videography</option>
                <option value="Writing">Writing</option>
                <option value="Film">Film</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <select
                value={filters.city}
                onChange={(e) => handleFilterChange('city', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">All Cities</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Delhi">Delhi</option>
                <option value="Bangalore">Bangalore</option>
                <option value="Hyderabad">Hyderabad</option>
                <option value="Chennai">Chennai</option>
                <option value="Pune">Pune</option>
                <option value="Goa">Goa</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Experience</label>
              <select
                value={filters.minExperience}
                onChange={(e) => handleFilterChange('minExperience', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Any Experience</option>
                <option value="1">1+ years</option>
                <option value="2">2+ years</option>
                <option value="3">3+ years</option>
                <option value="5">5+ years</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Budget</label>
              <select
                value={filters.maxBudget}
                onChange={(e) => handleFilterChange('maxBudget', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Any Budget</option>
                <option value="50000">Up to ₹50k</option>
                <option value="100000">Up to ₹1L</option>
                <option value="150000">Up to ₹1.5L</option>
                <option value="200000">Up to ₹2L</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="mb-6">
        <p className="text-gray-600">
          Showing {filteredTalents.length} of {talents.length} talents
        </p>
      </div>

      {/* Talents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTalents.map((talent) => (
          <div key={talent.id} className="bg-white rounded-lg shadow card-hover p-6">
            <div className="flex items-start space-x-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {talent.name.charAt(0)}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{talent.name}</h3>
                <p className="text-gray-600 flex items-center space-x-1">
                  <MapPin size={14} />
                  <span>{talent.city}</span>
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="flex items-center space-x-1">
                    <Star size={14} className="text-yellow-500" />
                    <span className="text-sm text-gray-600">{talent.rating || 'New'}</span>
                  </div>
                  <span className="text-gray-400">•</span>
                  <div className="flex items-center space-x-1">
                    <Briefcase size={14} className="text-gray-500" />
                    <span className="text-sm text-gray-600">{talent.experienceYears} years</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bio */}
            {talent.bio && (
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">{talent.bio}</p>
            )}

            {/* Categories */}
            <div className="mb-4">
              <div className="flex flex-wrap gap-1">
                {talent.categories.map((category, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div className="mb-4">
              <div className="flex flex-wrap gap-1">
                {talent.skills.slice(0, 4).map((skill, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    {skill}
                  </span>
                ))}
                {talent.skills.length > 4 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                    +{talent.skills.length - 4} more
                  </span>
                )}
              </div>
            </div>

            {/* Budget */}
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Budget: </span>
                {talent.budgetRange}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {talent.portfolioLinks?.length > 0 && (
                  <a
                    href={talent.portfolioLinks[0]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <ExternalLink size={16} />
                  </a>
                )}
                {talent.instagramHandle && (
                  <a
                    href={`https://instagram.com/${talent.instagramHandle.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-pink-600 transition-colors"
                  >
                    <Instagram size={16} />
                  </a>
                )}
              </div>
              <button className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-700 transition-colors">
                View Profile
              </button>
            </div>

            {/* Availability Status */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  talent.availabilityStatus === 'available' ? 'bg-green-500' :
                  talent.availabilityStatus === 'partially_available' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <span className="text-xs text-gray-600 capitalize">
                  {talent.availabilityStatus.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTalents.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No talents found</h3>
          <p className="text-gray-600">
            {searchTerm || Object.values(filters).some(v => v) 
              ? 'Try adjusting your search terms or filters' 
              : 'No talents available at the moment'}
          </p>
        </div>
      )}
    </div>
  );
};

export default TalentBrowser;

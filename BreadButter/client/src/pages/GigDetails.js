import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, DollarSign, Clock, Calendar, Search, ArrowLeft, Zap } from 'lucide-react';
import api from '../services/api';

const GigDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [gig, setGig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);

  useEffect(() => {
    fetchGig();
  }, [id]);

  const fetchGig = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/gigs/${id}`);
      setGig(response.data.gig);
    } catch (error) {
      console.error('Error fetching gig:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFindMatches = async () => {
    try {
      setMatching(true);
      await api.post('/matching/find-matches', {
        gigId: parseInt(id),
        limit: 10
      });
      navigate(`/gigs/${id}/matches`);
    } catch (error) {
      console.error('Error finding matches:', error);
      alert('Error finding matches. Please try again.');
    } finally {
      setMatching(false);
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="bg-white rounded-lg shadow p-8">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!gig) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Gig not found</h2>
          <button
            onClick={() => navigate('/')}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center space-x-1 hover:text-orange-600 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Dashboard</span>
        </button>
        <span>/</span>
        <span className="text-gray-900">Gig Details</span>
      </div>

      {/* Header */}
      <div className="bg-white rounded-lg shadow p-8 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{gig.title}</h1>
              <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getUrgencyColor(gig.urgencyLevel)}`}>
                {gig.urgencyLevel} priority
              </span>
            </div>
            <p className="text-gray-600 mb-4">{gig.description}</p>
            
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <MapPin size={16} />
                <span>{gig.isRemote ? 'Remote' : gig.location}</span>
              </div>
              <div className="flex items-center space-x-1">
                <DollarSign size={16} />
                <span>
                  ₹{gig.budget.min?.toLocaleString()} - ₹{gig.budget.max?.toLocaleString()}
                </span>
              </div>
              {gig.durationDays && (
                <div className="flex items-center space-x-1">
                  <Clock size={16} />
                  <span>{gig.durationDays} days</span>
                </div>
              )}
              {gig.startDate && (
                <div className="flex items-center space-x-1">
                  <Calendar size={16} />
                  <span>{new Date(gig.startDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleFindMatches}
            disabled={matching}
            className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            {matching ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Finding Matches...</span>
              </>
            ) : (
              <>
                <Search size={20} />
                <span>Find Talent Matches</span>
              </>
            )}
          </button>
        </div>

        {/* Client Info */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Client Information</h3>
          <div className="flex items-center space-x-4">
            <div>
              <p className="font-medium text-gray-900">{gig.client.name}</p>
              {gig.client.company && (
                <p className="text-gray-600">{gig.client.company}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Required Skills */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Required Skills</h3>
          <div className="flex flex-wrap gap-2">
            {gig.requiredSkills.map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Category */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Category</h3>
          <div className="flex items-center space-x-2">
            <span className="px-4 py-2 bg-purple-100 text-purple-800 rounded-lg font-medium">
              {gig.category}
            </span>
          </div>
        </div>

        {/* Style Preferences */}
        {gig.stylePreferences && gig.stylePreferences.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Style Preferences</h3>
            <div className="flex flex-wrap gap-2">
              {gig.stylePreferences.map((style, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                >
                  {style}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Additional Requirements */}
        {gig.additionalRequirements && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Requirements</h3>
            <p className="text-gray-600">{gig.additionalRequirements}</p>
          </div>
        )}
      </div>

      {/* AI Matching Info */}
      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-6 mt-6 border border-orange-200">
        <div className="flex items-center space-x-3 mb-3">
          <Zap className="text-orange-600" size={24} />
          <h3 className="text-lg font-semibold text-gray-900">AI-Powered Matching</h3>
        </div>
        <p className="text-gray-700 mb-4">
          Our advanced matching engine will analyze this gig against our talent database using:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span>Skill Matching (25%)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span>Location Compatibility (15%)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span>Budget Analysis (20%)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span>Experience Level (15%)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span>Availability (10%)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span>Semantic Similarity (15%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GigDetails;

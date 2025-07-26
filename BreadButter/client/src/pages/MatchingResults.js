import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, MapPin, Briefcase, Instagram, ExternalLink, Award, TrendingUp } from 'lucide-react';
import api from '../services/api';

const MatchingResults = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState(null);

  useEffect(() => {
    fetchMatches();
  }, [id]);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/matching/matches/${id}`);
      setResults(response.data);
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getOverallScoreColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6 h-48"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!results || results.matches.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No matches found</h2>
          <p className="text-gray-600 mb-6">
            No suitable talent found for this gig. Try adjusting the requirements.
          </p>
          <button
            onClick={() => navigate(`/gigs/${id}`)}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
          >
            Back to Gig Details
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
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
        <button
          onClick={() => navigate(`/gigs/${id}`)}
          className="hover:text-orange-600 transition-colors"
        >
          Gig Details
        </button>
        <span>/</span>
        <span className="text-gray-900">Matching Results</span>
      </div>

      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              🎯 Talent Matching Results
            </h1>
            <p className="text-gray-600">
              Found {results.totalMatches} matching talents for Gig #{results.gigId}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-orange-600">{results.totalMatches}</div>
            <div className="text-sm text-gray-500">Total Matches</div>
          </div>
        </div>
      </div>

      {/* Matches Grid */}
      <div className="space-y-6">
        {results.matches.map((match, index) => (
          <div
            key={match.talent.id}
            className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {match.talent.name.charAt(0)}
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    #{match.rank}
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{match.talent.name}</h3>
                  <p className="text-gray-600 flex items-center space-x-1">
                    <MapPin size={14} />
                    <span>{match.talent.city}</span>
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="flex items-center space-x-1">
                      <Star size={14} className="text-yellow-500" />
                      <span className="text-sm text-gray-600">{match.talent.rating || 'New'}</span>
                    </div>
                    <span className="text-gray-400">•</span>
                    <div className="flex items-center space-x-1">
                      <Briefcase size={14} className="text-gray-500" />
                      <span className="text-sm text-gray-600">{match.talent.experienceYears} years</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-2xl font-bold text-gray-900">{match.scores.overall}%</span>
                  <div className={`w-3 h-3 rounded-full ${getOverallScoreColor(match.scores.overall)}`}></div>
                </div>
                <div className="text-sm text-gray-500">Overall Match</div>
              </div>
            </div>

            {/* Bio */}
            {match.talent.bio && (
              <p className="text-gray-600 mb-4 leading-relaxed">{match.talent.bio}</p>
            )}

            {/* Skills */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Skills & Expertise</h4>
              <div className="flex flex-wrap gap-2">
                {match.talent.skills?.slice(0, 6).map((skill, skillIndex) => (
                  <span
                    key={skillIndex}
                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                  >
                    {skill}
                  </span>
                ))}
                {match.talent.skills?.length > 6 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                    +{match.talent.skills.length - 6} more
                  </span>
                )}
              </div>
            </div>

            {/* Detailed Scores */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Matching Breakdown</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {Object.entries(match.scores).filter(([key]) => key !== 'overall').map(([criterion, score]) => (
                  <div key={criterion} className="text-center">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(score)}`}>
                      {score}%
                    </div>
                    <div className="text-xs text-gray-500 mt-1 capitalize">{criterion}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Explanation */}
            <div className="mb-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <h4 className="text-sm font-medium text-gray-900 mb-1">Why this match?</h4>
                <p className="text-sm text-gray-600">{match.explanation}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {match.talent.portfolioLinks?.length > 0 && (
                  <a
                    href={match.talent.portfolioLinks[0]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors text-sm"
                  >
                    <ExternalLink size={14} />
                    <span>Portfolio</span>
                  </a>
                )}
                {match.talent.instagramHandle && (
                  <a
                    href={`https://instagram.com/${match.talent.instagramHandle.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 text-gray-600 hover:text-pink-600 transition-colors text-sm"
                  >
                    <Instagram size={14} />
                    <span>Instagram</span>
                  </a>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setSelectedMatch(match)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  View Details
                </button>
                <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm">
                  Contact Talent
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Algorithm Info */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mt-8 border border-blue-200">
        <div className="flex items-center space-x-3 mb-4">
          <TrendingUp className="text-blue-600" size={24} />
          <h3 className="text-lg font-semibold text-gray-900">How We Calculate Matches</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white rounded-lg p-3">
            <div className="font-medium text-gray-900 mb-1">Skills (25%)</div>
            <div className="text-gray-600">Direct skill matching with semantic analysis</div>
          </div>
          <div className="bg-white rounded-lg p-3">
            <div className="font-medium text-gray-900 mb-1">Budget (20%)</div>
            <div className="text-gray-600">Budget range compatibility analysis</div>
          </div>
          <div className="bg-white rounded-lg p-3">
            <div className="font-medium text-gray-900 mb-1">Location (15%)</div>
            <div className="text-gray-600">Geographic proximity and remote capability</div>
          </div>
          <div className="bg-white rounded-lg p-3">
            <div className="font-medium text-gray-900 mb-1">Experience (15%)</div>
            <div className="text-gray-600">Years of experience and project history</div>
          </div>
          <div className="bg-white rounded-lg p-3">
            <div className="font-medium text-gray-900 mb-1">Semantic (15%)</div>
            <div className="text-gray-600">AI-powered content similarity analysis</div>
          </div>
          <div className="bg-white rounded-lg p-3">
            <div className="font-medium text-gray-900 mb-1">Availability (10%)</div>
            <div className="text-gray-600">Current availability status</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchingResults;

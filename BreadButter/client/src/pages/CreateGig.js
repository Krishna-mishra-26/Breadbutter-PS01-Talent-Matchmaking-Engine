import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Calendar, MapPin, DollarSign } from 'lucide-react';
import api from '../services/api';

const CreateGig = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Client data
    clientName: '',
    clientEmail: '',
    clientCompany: '',
    clientPhone: '',
    clientCity: '',
    clientIndustry: '',
    
    // Gig data
    title: '',
    description: '',
    category: '',
    requiredSkills: [''],
    location: '',
    isRemote: false,
    startDate: '',
    endDate: '',
    durationDays: '',
    minBudget: '',
    maxBudget: '',
    stylePreferences: [''],
    additionalRequirements: '',
    urgencyLevel: 'medium'
  });

  const categories = [
    'Photography', 'Videography', 'Design', 'Writing', 'Film', 'Animation', 'Music', 'Voice Over'
  ];

  const urgencyLevels = [
    { value: 'low', label: 'Low Priority', color: 'green' },
    { value: 'medium', label: 'Medium Priority', color: 'yellow' },
    { value: 'high', label: 'High Priority', color: 'orange' },
    { value: 'urgent', label: 'Urgent', color: 'red' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayInputChange = (field, index, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // First create client
      const clientResponse = await api.post('/gigs/clients', {
        name: formData.clientName,
        email: formData.clientEmail,
        company: formData.clientCompany,
        phone: formData.clientPhone,
        city: formData.clientCity,
        industry: formData.clientIndustry
      });

      const clientId = clientResponse.data.client.id;

      // Then create gig
      const gigData = {
        clientId,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        requiredSkills: formData.requiredSkills.filter(skill => skill.trim()),
        location: formData.location,
        isRemote: formData.isRemote,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        durationDays: formData.durationDays ? parseInt(formData.durationDays) : null,
        minBudget: formData.minBudget ? parseInt(formData.minBudget) : null,
        maxBudget: formData.maxBudget ? parseInt(formData.maxBudget) : null,
        stylePreferences: formData.stylePreferences.filter(pref => pref.trim()),
        additionalRequirements: formData.additionalRequirements,
        urgencyLevel: formData.urgencyLevel
      };

      const gigResponse = await api.post('/gigs', gigData);
      const gigId = gigResponse.data.gig.id;

      navigate(`/gigs/${gigId}`);
    } catch (error) {
      console.error('Error creating gig:', error);
      alert('Error creating gig. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
        <span className="text-gray-900">Create Gig</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          📋 Create New Gig
        </h1>
        <p className="text-gray-600">
          Post a new creative project and find the perfect talent
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Client Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Client Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Name *
              </label>
              <input
                type="text"
                required
                value={formData.clientName}
                onChange={(e) => handleInputChange('clientName', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Enter client name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={formData.clientEmail}
                onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="client@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company
              </label>
              <input
                type="text"
                value={formData.clientCompany}
                onChange={(e) => handleInputChange('clientCompany', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Company name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={formData.clientPhone}
                onChange={(e) => handleInputChange('clientPhone', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="+91 98765 43210"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <input
                type="text"
                value={formData.clientCity}
                onChange={(e) => handleInputChange('clientCity', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Mumbai"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Industry
              </label>
              <input
                type="text"
                value={formData.clientIndustry}
                onChange={(e) => handleInputChange('clientIndustry', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Fashion, Technology, etc."
              />
            </div>
          </div>
        </div>

        {/* Gig Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Gig Details</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gig Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Sustainable Fashion Campaign Shoot"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                required
                rows={4}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Detailed description of the project requirements..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Urgency Level
                </label>
                <select
                  value={formData.urgencyLevel}
                  onChange={(e) => handleInputChange('urgencyLevel', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  {urgencyLevels.map(level => (
                    <option key={level.value} value={level.value}>{level.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Required Skills */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Required Skills</h2>
          
          <div className="space-y-3">
            {formData.requiredSkills.map((skill, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={skill}
                  onChange={(e) => handleArrayInputChange('requiredSkills', index, e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Travel Photography"
                />
                {formData.requiredSkills.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayItem('requiredSkills', index)}
                    className="text-red-600 hover:text-red-700 px-2"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem('requiredSkills')}
              className="flex items-center space-x-1 text-orange-600 hover:text-orange-700 transition-colors"
            >
              <Plus size={16} />
              <span>Add Skill</span>
            </button>
          </div>
        </div>

        {/* Location & Timeline */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Location & Timeline</h2>
          
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <input
                type="checkbox"
                id="isRemote"
                checked={formData.isRemote}
                onChange={(e) => handleInputChange('isRemote', e.target.checked)}
                className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
              />
              <label htmlFor="isRemote" className="text-sm font-medium text-gray-700">
                This is a remote project
              </label>
            </div>

            {!formData.isRemote && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Goa, India"
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.durationDays}
                  onChange={(e) => handleInputChange('durationDays', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="3"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Budget */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Budget Range</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Budget (₹)
              </label>
              <input
                type="number"
                min="0"
                value={formData.minBudget}
                onChange={(e) => handleInputChange('minBudget', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="70000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Budget (₹)
              </label>
              <input
                type="number"
                min="0"
                value={formData.maxBudget}
                onChange={(e) => handleInputChange('maxBudget', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="90000"
              />
            </div>
          </div>
        </div>

        {/* Style Preferences */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Style Preferences (Optional)</h2>
          
          <div className="space-y-3">
            {formData.stylePreferences.map((pref, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={pref}
                  onChange={(e) => handleArrayInputChange('stylePreferences', index, e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Pastel Tones"
                />
                {formData.stylePreferences.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayItem('stylePreferences', index)}
                    className="text-red-600 hover:text-red-700 px-2"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem('stylePreferences')}
              className="flex items-center space-x-1 text-orange-600 hover:text-orange-700 transition-colors"
            >
              <Plus size={16} />
              <span>Add Style Preference</span>
            </button>
          </div>
        </div>

        {/* Additional Requirements */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Additional Requirements</h2>
          
          <textarea
            rows={4}
            value={formData.additionalRequirements}
            onChange={(e) => handleInputChange('additionalRequirements', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="Any specific requirements, portfolio needs, or special considerations..."
          />
        </div>

        {/* Submit Button */}
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Creating Gig...</span>
              </>
            ) : (
              <>
                <Plus size={20} />
                <span>Create Gig</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateGig;

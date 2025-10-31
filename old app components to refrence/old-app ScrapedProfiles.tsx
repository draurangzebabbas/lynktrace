import React, { useState, useEffect } from 'react';
import { Search, Filter, Users, MapPin, Eye, EyeOff, Settings, Save, CheckSquare } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

interface ScrapedProfile {
  id: string;
  linkedin_url: string;
  full_name: string;
  headline: string;
  job_title?: string;
  location: string;
  scraped_at: string;
  // Database fields (using actual column names)
  first_name?: string;
  last_name?: string;
  email?: string;
  mobile_number?: string;
  phone?: string;
  company_name?: string;
  company_website?: string;
  website?: string;
  about?: string;
  public_identifier?: string;
  open_connection?: boolean;
  company_industry?: string;
  company_linkedin?: string;
  company_founded_in?: number;
  company_size?: string;
  current_job_duration?: string;
  current_job_duration_in_yrs?: number;
  address_country_only?: string;
  address_with_country?: string;
  address_without_country?: string;
  profile_pic?: string;
  profile_pic_high_quality?: string;
  profile_image_url?: string;
  profile_pic_all_dimensions?: any;
  experiences?: any;
  experience?: any;
  educations?: any;
  education?: any;
  skills?: any;
  top_skills_by_endorsements?: any;
  license_and_certificates?: any;
  honors_and_awards?: any;
  languages?: any;
  volunteer_and_awards?: any;
  verifications?: any;
  promos?: any;
  highlights?: any;
  projects?: any;
  publications?: any;
  patents?: any;
  courses?: any;
  test_scores?: any;
  organizations?: any;
  volunteer_causes?: any;
  interests?: any;
  recommendations?: any;
  creator_website?: any;
  updates?: any;
  urn?: string;
  connections?: number;
  connection_count?: number;
  followers?: number;
  follower_count?: number;
  created_at?: string;
  updated_at?: string;
}

interface ScrapedProfilesProps {
  profiles?: ScrapedProfile[];
  onProfilesSaved?: () => void;
  viewMode?: 'list' | 'table' | 'grid';
  selectedProfiles?: Set<string>;
  onProfileSelect?: (profileId: string) => void;
}

export const ScrapedProfiles: React.FC<ScrapedProfilesProps> = ({ 
  profiles: externalProfiles, 
  onProfilesSaved,
  viewMode = 'table',
  selectedProfiles: externalSelectedProfiles,
  onProfileSelect
}) => {
  const { user } = useAuth();
  const [scrapedProfiles, setScrapedProfiles] = useState<ScrapedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfiles, setSelectedProfiles] = useState<Set<string>>(new Set());
  
  // UI state for collapsible sections
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showColumnControls, setShowColumnControls] = useState(false);
  const [showRangeSelector, setShowRangeSelector] = useState(false);
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');
  
  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState({
    select: true,
    picture: true,
    name: true,
    headline: true,
    location: true,
    connections: true,
    company: true,
    jobTitle: true,
    email: true,
    phone: true,
    website: true,
    about: true,
    industry: true,
    companySize: true,
    openConnection: true,
    scrapedAt: true,
    actions: true,
  });

  // Advanced filtering state
  const [advancedFilters, setAdvancedFilters] = useState({
    hasEmail: false,
    hasPhone: false,
    hasWebsite: false,
    hasAbout: false,
    hasSkills: false,
    hasExperience: false,
    hasEducation: false,
    hasProfilePic: false,

    openConnection: false,
    minConnections: '',
    maxConnections: '',
    minFollowers: '',
    maxFollowers: '',
    countrySearch: '',
  });

  useEffect(() => {
    if (externalProfiles) {
      // Use external profiles (from LinkedInScraper)
      setScrapedProfiles(externalProfiles);
      setLoading(false);
    } else {
      // Load profiles from database (standalone mode)
      loadScrapedProfiles();
    }
  }, [user, externalProfiles]);

  const loadScrapedProfiles = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('linkedin_profiles')
        .select('*')
        .order('scraped_at', { ascending: false });

      if (error) {
        throw error;
      }

      setScrapedProfiles(data || []);
    } catch (err) {
      setError('Failed to load scraped profiles');
      console.error('Error loading scraped profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const handleSelectProfile = (profileId: string) => {
    if (onProfileSelect) {
      onProfileSelect(profileId);
    } else {
      setSelectedProfiles(prev => {
        const newSet = new Set(prev);
        if (newSet.has(profileId)) {
          newSet.delete(profileId);
        } else {
          newSet.add(profileId);
        }
        return newSet;
      });
    }
  };

  const handleSelectAll = () => {
    const currentSelectedProfiles = externalSelectedProfiles || selectedProfiles;
    if (currentSelectedProfiles.size === filteredProfiles.length) {
      if (externalSelectedProfiles) {
        // External mode - clear all
        filteredProfiles.forEach(p => onProfileSelect?.(p.id));
      } else {
        setSelectedProfiles(new Set());
      }
    } else {
      if (externalSelectedProfiles) {
        // External mode - select all
        filteredProfiles.forEach(p => onProfileSelect?.(p.id));
      } else {
        setSelectedProfiles(new Set(filteredProfiles.map(p => p.id)));
      }
    }
  };

  const handleRangeSelect = () => {
    const start = parseInt(rangeStart) - 1; // Convert to 0-based index
    const end = parseInt(rangeEnd);
    
    if (isNaN(start) || isNaN(end) || start < 0 || end > filteredProfiles.length || start >= end) {
      setError('Invalid range. Please enter valid numbers.');
      return;
    }

    const rangeProfiles = filteredProfiles.slice(start, end).map(p => p.id);
    if (externalSelectedProfiles) {
      // External mode - select range
      rangeProfiles.forEach(id => onProfileSelect?.(id));
    } else {
      setSelectedProfiles(new Set(rangeProfiles));
    }
    setShowRangeSelector(false);
    setRangeStart('');
    setRangeEnd('');
  };

  const toggleColumn = (column: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  const saveSelectedProfiles = async () => {
    if (selectedProfiles.size === 0) return;

    try {
      setLoading(true);
      
      // Get the profiles to save
      const currentSelectedProfiles = externalSelectedProfiles || selectedProfiles;
      const profilesToSave = filteredProfiles.filter(p => currentSelectedProfiles.has(p.id));
      
      // Check which profiles are already saved
      const { data: existingSaved, error: checkError } = await supabase
        .from('user_saved_profiles')
        .select('profile_id')
        .eq('user_id', user?.id)
        .in('profile_id', Array.from(currentSelectedProfiles));

      if (checkError) throw checkError;

      const existingProfileIds = new Set(existingSaved?.map(p => p.profile_id) || []);
      const newProfilesToSave = profilesToSave.filter(p => !existingProfileIds.has(p.id));

      if (newProfilesToSave.length === 0) {
        setSuccess('All selected profiles are already saved!');
        return;
      }

      // Save new profiles
      const { error: saveError } = await supabase
        .from('user_saved_profiles')
        .insert(
          newProfilesToSave.map(profile => ({
            user_id: user?.id,
            profile_id: profile.id,
            tags: []
          }))
        );

      if (saveError) throw saveError;

      setSuccess(`${newProfilesToSave.length} profiles saved successfully!`);
      if (!externalSelectedProfiles) {
        setSelectedProfiles(new Set());
      }
      
      // Call the callback if provided
      onProfilesSaved?.();
    } catch (error) {
      setError('Failed to save profiles');
      console.error('Error saving profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter profiles based on search and advanced filters
  const filteredProfiles = scrapedProfiles.filter(profile => {
    // Basic search filter
    const matchesSearch = !searchTerm || 
      profile.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.headline?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Advanced filters
    const matchesAdvancedFilters = 
      (!advancedFilters.hasEmail || (profile.email && profile.email.trim() !== '')) &&
      (!advancedFilters.hasPhone || ((profile.mobile_number || profile.phone) && (profile.mobile_number || profile.phone)?.trim() !== '')) &&
      (!advancedFilters.hasWebsite || ((profile.company_website || profile.website) && (profile.company_website || profile.website)?.trim() !== '')) &&
      (!advancedFilters.hasAbout || (profile.about && profile.about.trim() !== '')) &&
      (!advancedFilters.hasSkills || (profile.skills && Object.keys(profile.skills).length > 0)) &&
      (!advancedFilters.hasExperience || ((profile.experience || profile.experiences) && Object.keys(profile.experience || profile.experiences).length > 0)) &&
      (!advancedFilters.hasEducation || ((profile.education || profile.educations) && Object.keys(profile.education || profile.educations).length > 0)) &&
      (!advancedFilters.hasProfilePic || ((profile.profile_image_url || profile.profile_pic_high_quality) && (profile.profile_image_url || profile.profile_pic_high_quality)?.trim() !== '')) &&

      (!advancedFilters.openConnection || profile.open_connection === true) &&
      (!advancedFilters.minConnections || (profile.connection_count || profile.connections || 0) >= parseInt(advancedFilters.minConnections)) &&
      (!advancedFilters.maxConnections || (profile.connection_count || profile.connections || 0) <= parseInt(advancedFilters.maxConnections)) &&
      (!advancedFilters.minFollowers || (profile.follower_count || profile.followers || 0) >= parseInt(advancedFilters.minFollowers)) &&
      (!advancedFilters.maxFollowers || (profile.follower_count || profile.followers || 0) <= parseInt(advancedFilters.maxFollowers)) &&
      (!advancedFilters.countrySearch || (profile.location && profile.location.toLowerCase().includes(advancedFilters.countrySearch.toLowerCase())));
    
    return matchesSearch && matchesAdvancedFilters;
  });

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4">
              <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-600">Loading scraped profiles...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Scraped Profiles ({scrapedProfiles.length})</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={(externalSelectedProfiles || selectedProfiles).size === filteredProfiles.length && filteredProfiles.length > 0}
              onChange={handleSelectAll}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <span className="text-sm text-gray-600">
              {(externalSelectedProfiles || selectedProfiles).size} of {filteredProfiles.length} selected
            </span>
          </div>
        </div>
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <div className="flex-1">
            <p className="text-red-800">{error}</p>
            <button onClick={clearMessages} className="text-red-600 hover:text-red-800 text-sm mt-1">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
          <div className="flex-1">
            <p className="text-green-800">{success}</p>
            <button onClick={clearMessages} className="text-green-600 hover:text-green-800 text-sm mt-1">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Top Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter profiles..."
                className="w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button 
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-200 flex items-center"
            >
              <Filter className="w-4 h-4 mr-2" />
              Data Filters
            </button>
            <button 
              onClick={() => setShowRangeSelector(!showRangeSelector)}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-200 flex items-center"
            >
              <CheckSquare className="w-4 h-4 mr-2" />
              Range Select
            </button>
            {(externalSelectedProfiles || selectedProfiles).size > 0 && (
              <button 
                onClick={saveSelectedProfiles}
                disabled={loading}
                className="px-3 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Selected ({(externalSelectedProfiles || selectedProfiles).size})
              </button>
            )}
          </div>
        </div>
        
        {/* Range Selector */}
        {showRangeSelector && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-700 mb-2">Select Range</h4>
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">From</label>
                <input
                  type="number"
                  value={rangeStart}
                  onChange={(e) => setRangeStart(e.target.value)}
                  placeholder="1"
                  min="1"
                  max={filteredProfiles.length}
                  className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">To</label>
                <input
                  type="number"
                  value={rangeEnd}
                  onChange={(e) => setRangeEnd(e.target.value)}
                  placeholder={String(filteredProfiles.length)}
                  min="1"
                  max={filteredProfiles.length}
                  className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={handleRangeSelect}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                Select Range
              </button>
              <span className="text-sm text-gray-600">
                Total: {filteredProfiles.length} profiles
              </span>
            </div>
          </div>
        )}
        
        {/* Column Visibility Controls */}
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setShowColumnControls(!showColumnControls)}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors duration-200 flex items-center"
          >
            <Settings className="w-3 h-3 mr-1" />
            Actions
          </button>
          
          {/* Visible Columns */}
          {showColumnControls && Object.entries(visibleColumns).map(([key, visible]) => {
            if (!visible) return null;
            const columnNames: Record<keyof typeof visibleColumns, string> = {
              select: 'Select',
              picture: 'Picture',
              name: 'Name',
              headline: 'Headline',
              location: 'Location',
              connections: 'Connections',
              company: 'Company',
              jobTitle: 'Job Title',
              email: 'Email',
              phone: 'Phone',
              website: 'Website',
              about: 'About',
              industry: 'Industry',
              companySize: 'Company Size',
              openConnection: 'Open Connection',
              scrapedAt: 'Scraped At',
              actions: 'Actions',
            };
            
            return (
              <button
                key={key}
                onClick={() => toggleColumn(key as keyof typeof visibleColumns)}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors duration-200 flex items-center"
              >
                {columnNames[key as keyof typeof visibleColumns]}
                <EyeOff className="w-3 h-3 ml-1" />
              </button>
            );
          })}
          
          {/* Hidden Columns */}
          {showColumnControls && Object.entries(visibleColumns).map(([key, visible]) => {
            if (visible) return null;
            const columnNames: Record<keyof typeof visibleColumns, string> = {
              select: 'Select',
              picture: 'Picture',
              name: 'Name',
              headline: 'Headline',
              location: 'Location',
              connections: 'Connections',
              company: 'Company',
              jobTitle: 'Job Title',
              email: 'Email',
              phone: 'Phone',
              website: 'Website',
              about: 'About',
              industry: 'Industry',
              companySize: 'Company Size',
              openConnection: 'Open Connection',
              scrapedAt: 'Scraped At',
              actions: 'Actions',
            };
            
            return (
              <button
                key={key}
                onClick={() => toggleColumn(key as keyof typeof visibleColumns)}
                className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm hover:bg-gray-200 transition-colors duration-200 flex items-center"
              >
                {columnNames[key as keyof typeof visibleColumns]}
                <Eye className="w-3 h-3 ml-1" />
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Advanced Filters Section */}
      {showAdvancedFilters && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Data Availability Filters */}
            <div className="space-y-2">
              <h4 className="font-medium text-gray-700">Data Availability</h4>
              <div className="space-y-1">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={advancedFilters.hasEmail}
                    onChange={(e) => setAdvancedFilters(prev => ({ ...prev, hasEmail: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Has Email</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={advancedFilters.hasPhone}
                    onChange={(e) => setAdvancedFilters(prev => ({ ...prev, hasPhone: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Has Phone</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={advancedFilters.hasWebsite}
                    onChange={(e) => setAdvancedFilters(prev => ({ ...prev, hasWebsite: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Has Website</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={advancedFilters.hasAbout}
                    onChange={(e) => setAdvancedFilters(prev => ({ ...prev, hasAbout: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Has About</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={advancedFilters.hasSkills}
                    onChange={(e) => setAdvancedFilters(prev => ({ ...prev, hasSkills: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Has Skills</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={advancedFilters.hasExperience}
                    onChange={(e) => setAdvancedFilters(prev => ({ ...prev, hasExperience: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Has Experience</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={advancedFilters.hasEducation}
                    onChange={(e) => setAdvancedFilters(prev => ({ ...prev, hasEducation: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Has Education</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={advancedFilters.hasProfilePic}
                    onChange={(e) => setAdvancedFilters(prev => ({ ...prev, hasProfilePic: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Has Profile Picture</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={advancedFilters.openConnection}
                    onChange={(e) => setAdvancedFilters(prev => ({ ...prev, openConnection: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Open to Connection</span>
                </label>

              </div>
            </div>

            {/* Numeric Range Filters */}
            <div className="space-y-2">
              <h4 className="font-medium text-gray-700">Numeric Ranges</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Connections</label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={advancedFilters.minConnections}
                      onChange={(e) => setAdvancedFilters(prev => ({ ...prev, minConnections: e.target.value }))}
                      className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={advancedFilters.maxConnections}
                      onChange={(e) => setAdvancedFilters(prev => ({ ...prev, maxConnections: e.target.value }))}
                      className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Followers</label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={advancedFilters.minFollowers}
                      onChange={(e) => setAdvancedFilters(prev => ({ ...prev, minFollowers: e.target.value }))}
                      className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={advancedFilters.maxFollowers}
                      onChange={(e) => setAdvancedFilters(prev => ({ ...prev, maxFollowers: e.target.value }))}
                      className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Country Search */}
            <div className="space-y-2">
              <h4 className="font-medium text-gray-700">Location Filter</h4>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Search by Country/Location</label>
                <input
                  type="text"
                  placeholder="e.g., United States, India, London..."
                  value={advancedFilters.countrySearch}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, countrySearch: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            {/* Filter Actions */}
            <div className="space-y-2">
              <h4 className="font-medium text-gray-700">Actions</h4>
              <div className="space-y-2">
                <button
                  onClick={() => setAdvancedFilters({
                    hasEmail: false,
                    hasPhone: false,
                    hasWebsite: false,
                    hasAbout: false,
                    hasSkills: false,
                    hasExperience: false,
                    hasEducation: false,
                    hasProfilePic: false,
                
                    openConnection: false,
                    minConnections: '',
                    maxConnections: '',
                    minFollowers: '',
                    maxFollowers: '',
                    countrySearch: '',
                  })}
                  className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-200 text-sm"
                >
                  Clear All Filters
                </button>
                <div className="text-sm text-gray-600">
                  <p>Showing {filteredProfiles.length} of {scrapedProfiles.length} profiles</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Display */}
      {filteredProfiles.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-12 h-12 text-gray-400 mx-auto mb-4">
            <Users className="w-12 h-12" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {scrapedProfiles.length === 0 ? 'No scraped profiles yet' : 'No profiles match your filters'}
          </h3>
          <p className="text-gray-600">
            {scrapedProfiles.length === 0 
              ? 'Start scraping LinkedIn profiles to see them here.'
              : 'Try adjusting your search terms or filters.'
            }
          </p>
        </div>
      ) : (
        <>
          {viewMode === 'table' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {visibleColumns.select && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SELECT
                    </th>
                  )}
                  {visibleColumns.picture && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      PICTURE
                    </th>
                  )}
                  {visibleColumns.name && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      NAME
                    </th>
                  )}
                  {visibleColumns.headline && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      HEADLINE
                    </th>
                  )}
                  {visibleColumns.location && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      LOCATION
                    </th>
                  )}
                  {visibleColumns.connections && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CONNECTIONS
                    </th>
                  )}
                  {visibleColumns.company && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      COMPANY
                    </th>
                  )}
                  {visibleColumns.jobTitle && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      JOB TITLE
                    </th>
                  )}
                  {visibleColumns.email && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      EMAIL
                    </th>
                  )}
                  {visibleColumns.phone && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      PHONE
                    </th>
                  )}
                  {visibleColumns.website && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      WEBSITE
                    </th>
                  )}
                  {visibleColumns.about && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ABOUT
                    </th>
                  )}
                  {visibleColumns.industry && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      INDUSTRY
                    </th>
                  )}
                  {visibleColumns.companySize && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      COMPANY SIZE
                    </th>
                  )}
                  {visibleColumns.openConnection && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      OPEN CONNECTION
                    </th>
                  )}
                  {visibleColumns.scrapedAt && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SCRAPED AT
                    </th>
                  )}
                  {visibleColumns.actions && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ACTIONS
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProfiles.map((profile) => (
                  <tr key={profile.id} className="hover:bg-gray-50">
                    {visibleColumns.select && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={(externalSelectedProfiles || selectedProfiles).has(profile.id)}
                          onChange={() => handleSelectProfile(profile.id)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                      </td>
                    )}
                    {visibleColumns.picture && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        {profile.profile_image_url || profile.profile_pic_high_quality ? (
                          <img
                            src={profile.profile_image_url || profile.profile_pic_high_quality}
                            alt={profile.full_name}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
                            No Photo
                          </div>
                        )}
                      </td>
                    )}
                    {visibleColumns.name && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{profile.full_name}</div>
                          <a
                            href={profile.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            View Profile
                          </a>
                        </div>
                      </td>
                    )}
                    {visibleColumns.headline && (
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {profile.headline}
                        </div>
                      </td>
                    )}
                    {visibleColumns.location && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <MapPin className="w-3 h-3 mr-1 text-gray-400" />
                          {profile.location || 'N/A'}
                        </div>
                      </td>
                    )}
                    {visibleColumns.connections && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Users className="w-3 h-3 mr-1 text-gray-400" />
                          {profile.connection_count?.toLocaleString() || 'N/A'}
                        </div>
                      </td>
                    )}
                    {visibleColumns.company && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {profile.company_name || 'N/A'}
                        </div>
                      </td>
                    )}
                    {visibleColumns.jobTitle && (
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {profile.job_title || 'N/A'}
                        </div>
                      </td>
                    )}
                    {visibleColumns.email && (
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {profile.email || 'N/A'}
                        </div>
                      </td>
                    )}
                    {visibleColumns.phone && (
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {profile.mobile_number || profile.phone || 'N/A'}
                        </div>
                      </td>
                    )}
                    {visibleColumns.website && (
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {profile.company_website || profile.website ? (
                            <a href={profile.company_website || profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                              {profile.company_website || profile.website}
                            </a>
                          ) : 'N/A'}
                        </div>
                      </td>
                    )}
                    {visibleColumns.about && (
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-md truncate">
                          {profile.about || 'N/A'}
                        </div>
                      </td>
                    )}
                    {visibleColumns.industry && (
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {profile.company_industry || 'N/A'}
                        </div>
                      </td>
                    )}
                    {visibleColumns.companySize && (
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {profile.company_size || 'N/A'}
                        </div>
                      </td>
                    )}
                    {visibleColumns.openConnection && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {profile.open_connection ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                              Yes
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                              No
                            </span>
                          )}
                        </div>
                      </td>
                    )}
                    {visibleColumns.scrapedAt && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {profile.scraped_at ? new Date(profile.scraped_at).toLocaleDateString() : 'N/A'}
                        </div>
                      </td>
                    )}
                    {visibleColumns.actions && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleSelectProfile(profile.id)}
                            className="inline-flex items-center px-2 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                          >
                            {(externalSelectedProfiles || selectedProfiles).has(profile.id) ? 'Deselect' : 'Select'}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
                </table>
              </div>
            </div>
          )}

          {viewMode === 'list' && (
            <div className="space-y-4">
              {filteredProfiles.map((profile) => (
                <div key={profile.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-start space-x-4">
                    {visibleColumns.select && (
                      <div className="flex-shrink-0 pt-1">
                        <input
                          type="checkbox"
                          checked={(externalSelectedProfiles || selectedProfiles).has(profile.id)}
                          onChange={() => handleSelectProfile(profile.id)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                      </div>
                    )}
                    
                    {visibleColumns.picture && (
                      <div className="flex-shrink-0">
                        {profile.profile_image_url || profile.profile_pic_high_quality ? (
                          <img
                            src={profile.profile_image_url || profile.profile_pic_high_quality}
                            alt={profile.full_name}
                            className="w-16 h-16 rounded-full"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                            No Photo
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {visibleColumns.name && (
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{profile.full_name}</h3>
                              <a
                                href={profile.linkedin_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                View Profile
                              </a>
                            </div>
                          )}
                          
                          {visibleColumns.headline && (
                            <p className="text-gray-600 mb-2">{profile.headline}</p>
                          )}
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            {visibleColumns.location && (
                              <div className="flex items-center text-gray-600">
                                <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                                {profile.location || 'N/A'}
                              </div>
                            )}
                            
                            {visibleColumns.connections && (
                              <div className="flex items-center text-gray-600">
                                <Users className="w-4 h-4 mr-2 text-gray-400" />
                                {(profile.connection_count || profile.connections || 0).toLocaleString()} connections
                              </div>
                            )}
                            
                            {visibleColumns.company && (
                              <div className="flex items-center text-gray-600">
                                <span className="font-medium">Company:</span>
                                <span className="ml-2">{profile.company_name || 'N/A'}</span>
                              </div>
                            )}
                            
                            {visibleColumns.email && profile.email && (
                              <div className="flex items-center text-gray-600">
                                <span className="font-medium">Email:</span>
                                <span className="ml-2">{profile.email}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {visibleColumns.actions && (
                          <div className="flex-shrink-0">
                            <button
                              onClick={() => handleSelectProfile(profile.id)}
                              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors duration-200"
                            >
                              {(externalSelectedProfiles || selectedProfiles).has(profile.id) ? 'Deselect' : 'Select'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProfiles.map((profile) => (
                <div key={profile.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
                  <div className="text-center">
                    {visibleColumns.select && (
                      <div className="flex justify-end mb-2">
                        <input
                          type="checkbox"
                          checked={(externalSelectedProfiles || selectedProfiles).has(profile.id)}
                          onChange={() => handleSelectProfile(profile.id)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                      </div>
                    )}
                    
                    {visibleColumns.picture && (
                      <div className="flex justify-center mb-4">
                        {profile.profile_image_url || profile.profile_pic_high_quality ? (
                          <img
                            src={profile.profile_image_url || profile.profile_pic_high_quality}
                            alt={profile.full_name}
                            className="w-20 h-20 rounded-full"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                            No Photo
                          </div>
                        )}
                      </div>
                    )}

                    {visibleColumns.name && (
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{profile.full_name}</h3>
                    )}
                    
                    {visibleColumns.headline && (
                      <p className="text-gray-600 text-sm mb-3">{profile.headline}</p>
                    )}
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      {visibleColumns.location && (
                        <div className="flex items-center justify-center">
                          <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                          {profile.location || 'N/A'}
                        </div>
                      )}
                      
                      {visibleColumns.connections && (
                        <div className="flex items-center justify-center">
                          <Users className="w-4 h-4 mr-1 text-gray-400" />
                          {(profile.connection_count || profile.connections || 0).toLocaleString()} connections
                        </div>
                      )}
                      
                      {visibleColumns.company && (
                        <div className="text-center">
                          <span className="font-medium">Company:</span>
                          <div>{profile.company_name || 'N/A'}</div>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 space-y-2">
                      <a
                        href={profile.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors duration-200"
                      >
                        View Profile
                      </a>
                      
                      {visibleColumns.actions && (
                        <button
                          onClick={() => handleSelectProfile(profile.id)}
                          className="w-full px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-200"
                        >
                          {(externalSelectedProfiles || selectedProfiles).has(profile.id) ? 'Deselect' : 'Select'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

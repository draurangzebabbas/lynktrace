import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Users, 
  AlertCircle, 
  CheckCircle, 
  Loader2, 
  MessageSquare, 
  UserCheck,
  Filter,
  Download,
  Upload,
  Settings,
  RefreshCw,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Zap,
  Target,
  Clock,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { ScrapedProfiles } from './ScrapedProfiles';

interface LinkedInScraperProps {
  onSuccess?: () => void;
}

type ScrapingType = 'post-comments' | 'profile-details' | 'mixed';
type ViewMode = 'list' | 'table' | 'grid';
type FilterType = 'all' | 'with-email' | 'with-phone' | 'high-connections' | 'recent';

interface ScrapedProfile {
  id: string;
  linkedin_url: string;
  full_name: string;
  headline: string;
  location: string;
  job_title?: string;
  about: string;
  email: string;
  mobile_number?: string;
  phone?: string;
  company_website?: string;
  website?: string;
  profile_image_url?: string;
  profile_pic_high_quality?: string;
  connection_count?: number;
  connections?: number;
  follower_count?: number;
  followers?: number;
  scraped_at: string;
  // Additional fields from database
  first_name?: string;
  last_name?: string;
  company_name?: string;
  company_industry?: string;
  company_linkedin?: string;
  company_founded_in?: number; // decimal(6,2) in database
  company_size?: string;
  current_job_duration?: string;
  current_job_duration_in_yrs?: number; // decimal(5,2) in database
  address_country_only?: string;
  address_with_country?: string;
  address_without_country?: string;
  profile_pic?: string;
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
  public_identifier?: string;
  open_connection?: boolean;
  urn?: string;
  created_at?: string;
  updated_at?: string;
}

interface CommentData {
  id: string;
  linkedinUrl: string;
  commentary: string;
  createdAt: string;
  createdAtTimestamp: number;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    impressions: number;
    reactions: Array<{
      type: string;
      count: number;
    }>;
  };
  postId: string;
  pinned: boolean;
  contributed: boolean;
  edited: boolean;
  actor: {
    id: string;
    name: string;
    linkedinUrl: string;
    position: string;
    pictureUrl: string;
    picture: {
      url: string;
      width: number;
      height: number;
      expiresAt: number;
    };
    author: boolean;
  };
  query: {
    post: string;
  };
  selected?: boolean; // For checkbox selection
}

export const LinkedInScraper: React.FC<LinkedInScraperProps> = ({ onSuccess }) => {
  const { user } = useAuth();
  const [scrapingType, setScrapingType] = useState<ScrapingType>('post-comments');
  const [postUrls, setPostUrls] = useState<string>('');
  const [profileUrls, setProfileUrls] = useState<string>('');
  const [isScraping, setIsScraping] = useState(false);
  const [scrapedProfiles, setScrapedProfiles] = useState<ScrapedProfile[]>([]);
  const [commentData, setCommentData] = useState<CommentData[]>([]);
  const [selectedCommenters, setSelectedCommenters] = useState<Set<string>>(new Set());
  const [selectedProfiles, setSelectedProfiles] = useState<Set<string>>(new Set());
  const [isScrapingProfiles, setIsScrapingProfiles] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [saveAllProfiles, setSaveAllProfiles] = useState<boolean>(false);
  
  // Advanced features
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'connections' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [batchSize, setBatchSize] = useState(10);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, percentage: 0 });
  const [showPreview, setShowPreview] = useState(false);

  // Reset saveAllProfiles when switching to post-comments scraper
  useEffect(() => {
    if (scrapingType === 'post-comments') {
      setSaveAllProfiles(false);
    }
  }, [scrapingType]);

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh && isScraping) {
      const interval = setInterval(() => {
        // Refresh progress or status
        updateProgress();
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, isScraping]);

  // Update progress tracking
  const updateProgress = () => {
    if (progress.total > 0) {
      setProgress(prev => ({
        ...prev,
        percentage: Math.round((prev.current / prev.total) * 100)
      }));
    }
  };

  const handleScrape = async () => {
    let urls: string[] = [];
    let inputType = '';

    // Validate input based on scraping type
    if (scrapingType === 'post-comments' || scrapingType === 'mixed') {
      if (!postUrls.trim()) {
        setError('Please enter at least one LinkedIn post URL');
        return;
      }
      urls = postUrls
        .split('\n')
        .map(url => url.trim())
        .filter(url => url && url.includes('linkedin.com/posts/'));
      inputType = 'post';
    }

    if (scrapingType === 'profile-details') {
    if (!profileUrls.trim()) {
      setError('Please enter at least one LinkedIn profile URL');
      return;
    }
      urls = profileUrls
      .split('\n')
      .map(url => url.trim())
      .filter(url => url && url.includes('linkedin.com/in/'));
      inputType = 'profile';
    }

    // Mixed scraper only uses post URLs (no additional profile URLs needed)

    if (urls.length === 0) {
      setError(`Please enter valid LinkedIn ${inputType} URLs`);
      return;
    }

    // Initialize progress tracking
    setProgress({ current: 0, total: urls.length, percentage: 0 });
    setIsScraping(true);
    setError('');
    setSuccess('');

    try {
      // Call the appropriate backend API based on scraping type
      let endpoint, body;
      
      if (scrapingType === 'profile-details') {
        endpoint = '/api/scrape-linkedin';
        body = { profileUrls: urls, saveAllProfiles };
      } else if (scrapingType === 'post-comments') {
        endpoint = '/api/scrape-post-comments';
        body = { postUrls: urls, scrapingType };
      } else if (scrapingType === 'mixed') {
        endpoint = '/api/scrape-mixed';
        body = { 
          postUrls: postUrls.split('\n').map(url => url.trim()).filter(url => url && url.includes('linkedin.com/posts/')),
          saveAllProfiles
        };
      }

      // Use the API base URL from environment variable, fallback to current origin for development
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || window.location.origin;
      const fullEndpoint = `${apiBaseUrl}${endpoint}`;
      
      const response = await fetch(fullEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.webhook_token}`
        },
        body: JSON.stringify(body)
      });

      // Check if response is ok first
      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } else {
            const errorText = await response.text();
            if (errorText) {
              errorMessage = errorText;
            }
          }
        } catch (parseError) {
          console.warn('Could not parse error response:', parseError);
        }
        throw new Error(errorMessage);
      }

      // Validate response content type before parsing JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        throw new Error(`Expected JSON response but got: ${contentType || 'unknown content type'}. Response: ${responseText.substring(0, 200)}...`);
      }

      // Parse JSON response
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        const responseText = await response.text();
        const errorMessage = jsonError instanceof Error ? jsonError.message : 'Unknown JSON parsing error';
        throw new Error(`Invalid JSON response: ${errorMessage}. Response: ${responseText.substring(0, 200)}...`);
      }

      setSuccess(`Scraping initiated for ${urls.length} ${inputType}(s). Check the results below.`);
      
      // Update progress
      setProgress({ current: urls.length, total: urls.length, percentage: 100 });
      
      // Handle different response types
      if (data.profiles && data.profiles.length > 0) {
        setScrapedProfiles(data.profiles);
        
        // Auto-save all profiles if option is enabled
        if (saveAllProfiles) {
          try {
            const savePromises = data.profiles.map((profile: ScrapedProfile) => handleSaveProfile(profile));
            await Promise.allSettled(savePromises);
            setSuccess(`Scraping completed! ${data.profiles.length} profiles have been automatically saved to your collection.`);
          } catch (saveError) {
            console.error('Error auto-saving profiles:', saveError);
            setSuccess(`Scraping completed! However, there was an issue auto-saving some profiles. You can save them manually from the results below.`);
          }
        }
      }
      if (data.comments && data.comments.length > 0) {
        setCommentData(data.comments);
      }

      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during scraping');
    } finally {
      setIsScraping(false);
    }
  };

  const handleSaveProfile = async (profile: ScrapedProfile) => {
    try {
      const { error } = await supabase
        .from('user_saved_profiles')
        .insert({
          user_id: user?.id,
          profile_id: profile.id
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          setError('Profile already saved');
        } else {
          throw error;
        }
      } else {
        setSuccess('Profile saved successfully!');
      }
    } catch (err) {
      setError('Failed to save profile');
    }
  };



  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const handleSelectCommenter = (linkedinUrl: string) => {
    setSelectedCommenters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(linkedinUrl)) {
        newSet.delete(linkedinUrl);
      } else {
        newSet.add(linkedinUrl);
      }
      return newSet;
    });
  };

  const handleSelectAllCommenters = () => {
    const allUrls = commentData.map(comment => comment.actor?.linkedinUrl).filter(Boolean);
    setSelectedCommenters(new Set(allUrls));
  };

  const handleDeselectAllCommenters = () => {
    setSelectedCommenters(new Set());
  };

  // New bulk operations for profiles
  const handleSelectAllProfiles = () => {
    const allIds = scrapedProfiles.map(profile => profile.id);
    setSelectedProfiles(new Set(allIds));
  };

  const handleDeselectAllProfiles = () => {
    setSelectedProfiles(new Set());
  };

  const handleSelectProfile = (profileId: string) => {
    setSelectedProfiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(profileId)) {
        newSet.delete(profileId);
      } else {
        newSet.add(profileId);
      }
      return newSet;
    });
  };

  // Filter and sort functions
  const getFilteredProfiles = () => {
    let filtered = [...scrapedProfiles];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(profile => 
        profile.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.headline?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.location?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply type filter
    switch (filterType) {
      case 'with-email':
        filtered = filtered.filter(profile => profile.email);
        break;
      case 'with-phone':
        filtered = filtered.filter(profile => profile.mobile_number || profile.phone);
        break;
      case 'high-connections':
        filtered = filtered.filter(profile => (profile.connections || profile.connection_count || 0) > 500);
        break;
      case 'recent':
        filtered = filtered.filter(profile => {
          const scrapedDate = new Date(profile.scraped_at);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return scrapedDate > weekAgo;
        });
        break;
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case 'name':
          aValue = a.full_name.toLowerCase();
          bValue = b.full_name.toLowerCase();
          break;
        case 'connections':
          aValue = a.connections || a.connection_count || 0;
          bValue = b.connections || b.connection_count || 0;
          break;
        case 'date':
          aValue = new Date(a.scraped_at).getTime();
          bValue = new Date(b.scraped_at).getTime();
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  };

  // Export functions
  const exportToCSV = () => {
    const filteredProfiles = getFilteredProfiles();
    const headers = [
      'ID', 'LinkedIn URL', 'Full Name', 'First Name', 'Last Name', 'Headline', 'Location', 
      'Job Title', 'About', 'Email', 'Mobile Number', 'Phone', 'Company Website', 'Website',
      'Profile Image URL', 'Profile Pic High Quality', 'Connection Count', 'Connections',
      'Follower Count', 'Followers', 'Company Name', 'Company Industry', 'Company LinkedIn',
      'Company Founded In', 'Company Size', 'Current Job Duration', 'Current Job Duration In Years',
      'Address Country Only', 'Address With Country', 'Address Without Country', 'Profile Pic',
      'Public Identifier', 'Open Connection', 'URN', 'Scraped At', 'Created At', 'Updated At',
      'Experiences', 'Education', 'Skills', 'Top Skills By Endorsements', 'License And Certificates',
      'Honors And Awards', 'Languages', 'Volunteer And Awards', 'Verifications', 'Promos',
      'Highlights', 'Projects', 'Publications', 'Patents', 'Courses', 'Test Scores',
      'Organizations', 'Volunteer Causes', 'Interests', 'Recommendations', 'Creator Website', 'Updates'
    ];
    
    const csvContent = [
      headers.join(','),
      ...filteredProfiles.map(profile => [
        `"${profile.id || ''}"`,
        `"${profile.linkedin_url || ''}"`,
        `"${profile.full_name || ''}"`,
        `"${profile.first_name || ''}"`,
        `"${profile.last_name || ''}"`,
        `"${profile.headline || ''}"`,
        `"${profile.location || ''}"`,
        `"${profile.job_title || ''}"`,
        `"${profile.about || ''}"`,
        `"${profile.email || ''}"`,
        `"${profile.mobile_number || ''}"`,
        `"${profile.phone || ''}"`,
        `"${profile.company_website || ''}"`,
        `"${profile.website || ''}"`,
        `"${profile.profile_image_url || ''}"`,
        `"${profile.profile_pic_high_quality || ''}"`,
        profile.connection_count || 0,
        profile.connections || 0,
        profile.follower_count || 0,
        profile.followers || 0,
        `"${profile.company_name || ''}"`,
        `"${profile.company_industry || ''}"`,
        `"${profile.company_linkedin || ''}"`,
        profile.company_founded_in || '',
        `"${profile.company_size || ''}"`,
        `"${profile.current_job_duration || ''}"`,
        profile.current_job_duration_in_yrs || '',
        `"${profile.address_country_only || ''}"`,
        `"${profile.address_with_country || ''}"`,
        `"${profile.address_without_country || ''}"`,
        `"${profile.profile_pic || ''}"`,
        `"${profile.public_identifier || ''}"`,
        profile.open_connection || false,
        `"${profile.urn || ''}"`,
        `"${profile.scraped_at || ''}"`,
        `"${profile.created_at || ''}"`,
        `"${profile.updated_at || ''}"`,
        `"${JSON.stringify(profile.experiences || profile.experience || {})}"`,
        `"${JSON.stringify(profile.educations || profile.education || {})}"`,
        `"${JSON.stringify(profile.skills || {})}"`,
        `"${JSON.stringify(profile.top_skills_by_endorsements || {})}"`,
        `"${JSON.stringify(profile.license_and_certificates || {})}"`,
        `"${JSON.stringify(profile.honors_and_awards || {})}"`,
        `"${JSON.stringify(profile.languages || {})}"`,
        `"${JSON.stringify(profile.volunteer_and_awards || {})}"`,
        `"${JSON.stringify(profile.verifications || {})}"`,
        `"${JSON.stringify(profile.promos || {})}"`,
        `"${JSON.stringify(profile.highlights || {})}"`,
        `"${JSON.stringify(profile.projects || {})}"`,
        `"${JSON.stringify(profile.publications || {})}"`,
        `"${JSON.stringify(profile.patents || {})}"`,
        `"${JSON.stringify(profile.courses || {})}"`,
        `"${JSON.stringify(profile.test_scores || {})}"`,
        `"${JSON.stringify(profile.organizations || {})}"`,
        `"${JSON.stringify(profile.volunteer_causes || {})}"`,
        `"${JSON.stringify(profile.interests || {})}"`,
        `"${JSON.stringify(profile.recommendations || {})}"`,
        `"${JSON.stringify(profile.creator_website || {})}"`,
        `"${JSON.stringify(profile.updates || {})}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `linkedin-profiles-complete-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToJSON = () => {
    const filteredProfiles = getFilteredProfiles();
    // Ensure all fields are included in the JSON export
    const completeProfiles = filteredProfiles.map(profile => ({
      id: profile.id,
      linkedin_url: profile.linkedin_url,
      full_name: profile.full_name,
      first_name: profile.first_name,
      last_name: profile.last_name,
      headline: profile.headline,
      location: profile.location,
      job_title: profile.job_title,
      about: profile.about,
      email: profile.email,
      mobile_number: profile.mobile_number,
      phone: profile.phone,
      company_website: profile.company_website,
      website: profile.website,
      profile_image_url: profile.profile_image_url,
      profile_pic_high_quality: profile.profile_pic_high_quality,
      connection_count: profile.connection_count,
      connections: profile.connections,
      follower_count: profile.follower_count,
      followers: profile.followers,
      company_name: profile.company_name,
      company_industry: profile.company_industry,
      company_linkedin: profile.company_linkedin,
      company_founded_in: profile.company_founded_in,
      company_size: profile.company_size,
      current_job_duration: profile.current_job_duration,
      current_job_duration_in_yrs: profile.current_job_duration_in_yrs,
      address_country_only: profile.address_country_only,
      address_with_country: profile.address_with_country,
      address_without_country: profile.address_without_country,
      profile_pic: profile.profile_pic,
      profile_pic_all_dimensions: profile.profile_pic_all_dimensions,
      public_identifier: profile.public_identifier,
      open_connection: profile.open_connection,
      urn: profile.urn,
      scraped_at: profile.scraped_at,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      experiences: profile.experiences || profile.experience,
      education: profile.educations || profile.education,
      skills: profile.skills,
      top_skills_by_endorsements: profile.top_skills_by_endorsements,
      license_and_certificates: profile.license_and_certificates,
      honors_and_awards: profile.honors_and_awards,
      languages: profile.languages,
      volunteer_and_awards: profile.volunteer_and_awards,
      verifications: profile.verifications,
      promos: profile.promos,
      highlights: profile.highlights,
      projects: profile.projects,
      publications: profile.publications,
      patents: profile.patents,
      courses: profile.courses,
      test_scores: profile.test_scores,
      organizations: profile.organizations,
      volunteer_causes: profile.volunteer_causes,
      interests: profile.interests,
      recommendations: profile.recommendations,
      creator_website: profile.creator_website,
      updates: profile.updates
    }));
    
    const jsonContent = JSON.stringify(completeProfiles, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `linkedin-profiles-complete-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleScrapeSelectedProfiles = async () => {
    if (selectedCommenters.size === 0) {
      setError('Please select at least one commenter to scrape their profile');
      return;
    }

    setIsScrapingProfiles(true);
    setError('');
    setSuccess('');

    try {
      const profileUrls = Array.from(selectedCommenters);
      
      // Use the API base URL from environment variable, fallback to current origin for development
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || window.location.origin;
      const fullEndpoint = `${apiBaseUrl}/api/scrape-linkedin`;
      
      const response = await fetch(fullEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.webhook_token}`
        },
        body: JSON.stringify({ profileUrls })
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } else {
            const errorText = await response.text();
            if (errorText) {
              errorMessage = errorText;
            }
          }
        } catch (parseError) {
          console.warn('Could not parse error response:', parseError);
        }
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        throw new Error(`Expected JSON response but got: ${contentType || 'unknown content type'}. Response: ${responseText.substring(0, 200)}...`);
      }

      const data = await response.json();
      
      setSuccess(`Successfully scraped ${data.profiles?.length || 0} profiles from selected commenters!`);
      
      if (data.profiles && data.profiles.length > 0) {
        setScrapedProfiles(prev => [...prev, ...data.profiles]);
      }

      // Clear selection after successful scraping
      setSelectedCommenters(new Set());

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during profile scraping');
    } finally {
      setIsScrapingProfiles(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">LinkedIn Scraper</h1>
        <p className="text-gray-600">
          Scrape LinkedIn posts, profiles, or both using our advanced scraping technology. Choose your scraping type below.
        </p>
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
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
          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-green-800">{success}</p>
            <button onClick={clearMessages} className="text-green-600 hover:text-green-800 text-sm mt-1">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {isScraping && progress.total > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">Scraping Progress</h3>
            <span className="text-sm text-gray-600">{progress.percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between mt-2 text-sm text-gray-600">
            <span>{progress.current} of {progress.total} processed</span>
            {autoRefresh && (
              <div className="flex items-center">
                <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                Auto-refreshing
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scraping Type Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Scraping Type</h2>
          <button
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-200"
          >
            <Settings className="w-4 h-4 mr-2" />
            Advanced Options
            {showAdvancedOptions ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button
            onClick={() => setScrapingType('post-comments')}
            className={`p-4 rounded-lg border-2 transition-all duration-200 ${
              scrapingType === 'post-comments'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex flex-col items-center text-center">
              <MessageSquare className={`w-8 h-8 mb-2 ${
                scrapingType === 'post-comments' ? 'text-blue-600' : 'text-gray-400'
              }`} />
              <h3 className="font-semibold text-gray-900">Post Comments</h3>
              <p className="text-sm text-gray-600">Scrape post engagers</p>
            </div>
          </button>

          <button
            onClick={() => setScrapingType('profile-details')}
            className={`p-4 rounded-lg border-2 transition-all duration-200 ${
              scrapingType === 'profile-details'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex flex-col items-center text-center">
              <UserCheck className={`w-8 h-8 mb-2 ${
                scrapingType === 'profile-details' ? 'text-blue-600' : 'text-gray-400'
              }`} />
              <h3 className="font-semibold text-gray-900">Profile Details</h3>
              <p className="text-sm text-gray-600">Scrape profile info</p>
            </div>
          </button>

          <button
            onClick={() => setScrapingType('mixed')}
            className={`p-4 rounded-lg border-2 transition-all duration-200 ${
              scrapingType === 'mixed'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex flex-col items-center text-center">
              <Users className={`w-8 h-8 mb-2 ${
                scrapingType === 'mixed' ? 'text-blue-600' : 'text-gray-400'
              }`} />
              <h3 className="font-semibold text-gray-900">Mixed</h3>
              <p className="text-sm text-gray-600">Post + Profiles</p>
            </div>
          </button>
        </div>

        {/* URL Input Section */}
        {(scrapingType === 'post-comments' || scrapingType === 'mixed') && (
          <div className="mb-4">
            <label htmlFor="postUrls" className="block text-sm font-medium text-gray-700 mb-2">
              LinkedIn Post URLs (one per line)
            </label>
            <textarea
              id="postUrls"
              value={postUrls}
              onChange={(e) => setPostUrls(e.target.value)}
              placeholder="https://www.linkedin.com/posts/..."
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isScraping}
            />
            <p className="text-sm text-gray-500 mt-1">
              Enter one LinkedIn post URL per line. Maximum 10 posts per request.
            </p>
          </div>
        )}

        {scrapingType === 'profile-details' && (
        <div className="mb-4">
          <label htmlFor="profileUrls" className="block text-sm font-medium text-gray-700 mb-2">
            LinkedIn Profile URLs (one per line)
          </label>
          <textarea
            id="profileUrls"
            value={profileUrls}
            onChange={(e) => setProfileUrls(e.target.value)}
            placeholder="https://linkedin.com/in/username1&#10;https://linkedin.com/in/username2&#10;https://linkedin.com/in/username3"
            className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isScraping}
          />
          <p className="text-sm text-gray-500 mt-1">
            Enter one LinkedIn profile URL per line. Maximum 10 profiles per request.
          </p>
        </div>
        )}

        {/* Advanced Options */}
        {showAdvancedOptions && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Batch Size
                </label>
                <select
                  value={batchSize}
                  onChange={(e) => setBatchSize(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isScraping}
                >
                  <option value={5}>5 profiles per batch</option>
                  <option value={10}>10 profiles per batch</option>
                  <option value={20}>20 profiles per batch</option>
                  <option value={50}>50 profiles per batch</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Auto Refresh
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    disabled={isScraping}
                  />
                  <span className="text-sm text-gray-700">
                    Enable real-time progress updates
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Save All Profiles Option - Only for Profile Details and Mixed scrapers */}
        {(scrapingType === 'profile-details' || scrapingType === 'mixed') && (
          <div className="mb-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={saveAllProfiles}
                onChange={(e) => setSaveAllProfiles(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                disabled={isScraping}
              />
              <span className="text-sm font-medium text-gray-700">
                Save all scraped profiles to my collection automatically
              </span>
            </label>
            <p className="text-sm text-gray-500 mt-1 ml-6">
              When enabled, all scraped profiles will be automatically saved to your "My Profiles" section. 
              You can turn off your device and let the system work in the background.
          </p>
        </div>
        )}

        <button
          onClick={handleScrape}
          disabled={isScraping || (scrapingType === 'mixed' ? !postUrls.trim() : (!postUrls.trim() && !profileUrls.trim()))}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {isScraping ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Scraping...
            </>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              Start Scraping
            </>
          )}
        </button>
      </div>

      {/* Comment Results Section */}
      {commentData.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Post Comments ({commentData.length})</h2>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 bg-gray-100 rounded-md p-1">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1 text-sm rounded transition-colors duration-200 ${
                    viewMode === 'table' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Table
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 text-sm rounded transition-colors duration-200 ${
                    viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  List
                </button>
              </div>
              <button
                onClick={handleSelectAllCommenters}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors duration-200"
              >
                Select All
              </button>
              <button
                onClick={handleDeselectAllCommenters}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-200"
              >
                Deselect All
              </button>
              {selectedCommenters.size > 0 && (
                <button
                  onClick={handleScrapeSelectedProfiles}
                  disabled={isScrapingProfiles}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
                >
                  {isScrapingProfiles ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Scraping {selectedCommenters.size} Profiles...
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4 mr-2" />
                      Scrape Selected ({selectedCommenters.size})
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
          
          {viewMode === 'table' ? (
            /* Table View */
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SELECT
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      PICTURE
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      NAME
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      POSITION
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      COMMENT
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ENGAGEMENT
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      DATE
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {commentData.map((comment, index) => (
                    <tr key={comment.id || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedCommenters.has(comment.actor?.linkedinUrl || '')}
                          onChange={() => handleSelectCommenter(comment.actor?.linkedinUrl || '')}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {comment.actor?.pictureUrl ? (
                          <img
                            src={comment.actor.pictureUrl}
                            alt={comment.actor.name}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
                            No Photo
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{comment.actor?.name}</div>
                          <a
                            href={comment.actor?.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            View Profile
                          </a>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {comment.actor?.position || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-md truncate">
                          {comment.commentary}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          {comment.engagement?.likes > 0 && (
                            <span>{comment.engagement.likes} likes</span>
                          )}
                          {comment.engagement?.reactions && comment.engagement.reactions.length > 0 && (
                            <span>{comment.engagement.reactions.reduce((sum, r) => sum + r.count, 0)} reactions</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* List View */
          <div className="space-y-4">
            {commentData.map((comment, index) => (
              <div key={comment.id || index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-start space-x-3">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedCommenters.has(comment.actor?.linkedinUrl || '')}
                        onChange={() => handleSelectCommenter(comment.actor?.linkedinUrl || '')}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                  {comment.actor?.pictureUrl && (
                    <img
                      src={comment.actor.pictureUrl}
                      alt={comment.actor.name}
                      className="w-10 h-10 rounded-full flex-shrink-0"
                    />
                  )}
                    </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-gray-900 truncate">{comment.actor?.name}</h3>
                      <a
                        href={comment.actor?.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View Profile
                      </a>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{comment.actor?.position}</p>
                    <p className="text-gray-800 mb-2">{comment.commentary}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                      {comment.engagement?.likes > 0 && (
                        <span>{comment.engagement.likes} likes</span>
                      )}
                      {comment.engagement?.reactions && comment.engagement.reactions.length > 0 && (
                        <span>{comment.engagement.reactions.reduce((sum, r) => sum + r.count, 0)} reactions</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      )}

      {/* Profile Results Section */}
      {scrapedProfiles.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Scraped Profiles ({getFilteredProfiles().length})
            </h2>
            <div className="flex items-center space-x-2">
              {/* View Mode Toggle */}
              <div className="flex items-center space-x-1 bg-gray-100 rounded-md p-1">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1 text-sm rounded transition-colors duration-200 ${
                    viewMode === 'table' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Table
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 text-sm rounded transition-colors duration-200 ${
                    viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  List
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1 text-sm rounded transition-colors duration-200 ${
                    viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Grid
                </button>
              </div>

              {/* Export Options */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={exportToCSV}
                  className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors duration-200 flex items-center"
                >
                  <Download className="w-4 h-4 mr-1" />
                  CSV
                </button>
                <button
                  onClick={exportToJSON}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors duration-200 flex items-center"
                >
                  <Download className="w-4 h-4 mr-1" />
                  JSON
                </button>
              </div>
            </div>
          </div>

          {/* Search and Filter Controls */}
          <div className="mb-6 space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search profiles by name, company, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as FilterType)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Profiles</option>
                <option value="with-email">With Email</option>
                <option value="with-phone">With Phone</option>
                <option value="high-connections">High Connections (500+)</option>
                <option value="recent">Recent (Last 7 days)</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Sort by:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'name' | 'connections' | 'date')}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="date">Date</option>
                    <option value="name">Name</option>
                    <option value="connections">Connections</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-2 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-200"
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSelectAllProfiles}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors duration-200"
                >
                  Select All
                </button>
                <button
                  onClick={handleDeselectAllProfiles}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-200"
                >
                  Deselect All
                </button>
                {selectedProfiles.size > 0 && (
                  <button
                    onClick={() => {
                      const selectedProfilesData = scrapedProfiles.filter(p => selectedProfiles.has(p.id));
                      selectedProfilesData.forEach(profile => handleSaveProfile(profile));
                      setSelectedProfiles(new Set());
                      setSuccess(`Saved ${selectedProfiles.size} profiles successfully!`);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 flex items-center"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Save Selected ({selectedProfiles.size})
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Profile Display */}
          <ScrapedProfiles 
            profiles={getFilteredProfiles()}
            viewMode={viewMode}
            selectedProfiles={selectedProfiles}
            onProfileSelect={handleSelectProfile}
            onProfilesSaved={() => {
              setSuccess('Profiles saved successfully!');
              onSuccess?.();
            }}
          />
        </div>
      )}

      {/* Keep the old section commented out for reference
      {scrapedProfiles.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Scraped Profiles ({scrapedProfiles.length})</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PICTURE
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    NAME
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    HEADLINE
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    LOCATION
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CONNECTIONS
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    COMPANY
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    EMAIL
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
            {scrapedProfiles.map((profile) => (
                  <tr key={profile.id} className="hover:bg-gray-50">
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
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {profile.headline}
                </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <MapPin className="w-3 h-3 mr-1 text-gray-400" />
                        {profile.location || 'N/A'}
                </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Users className="w-3 h-3 mr-1 text-gray-400" />
                        {(profile.connection_count || profile.connections)?.toLocaleString() || 'N/A'}
                  </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {profile.company_name || 'N/A'}
                </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {profile.email || 'N/A'}
                </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleSaveProfile(profile)}
                          className="inline-flex items-center px-2 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                  >
                    <Save className="w-3 h-3 mr-1" />
                    Save
                  </button>
                  <button
                          onClick={() => copyToClipboard(profile.linkedin_url)}
                          className="inline-flex items-center px-2 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                    title="Copy profile URL"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  <a
                          href={profile.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                          className="inline-flex items-center px-2 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                    title="Open profile"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                    </td>
                  </tr>
            ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      */}

      {/* Instructions */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">How it works</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p>• <strong>Post Comments:</strong> Enter LinkedIn post URLs to scrape commenters and their profiles</p>
          <p>• <strong>Profile Details:</strong> Enter LinkedIn profile URLs to scrape detailed profile information</p>
          <p>• <strong>Mixed:</strong> Enter LinkedIn post URLs to scrape both comments and commenter profiles</p>
          <p>• Save interesting profiles to your personal collection</p>
          <p>• View analytics and track your scraping history</p>
        </div>
      </div>
    </div>
  );
};

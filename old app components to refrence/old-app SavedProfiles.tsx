import React, { useState, useEffect, useRef } from 'react';
import { Bookmark, Search, Filter, Users, MapPin, Eye, EyeOff, Download, Settings, RefreshCw, Trash2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

interface SavedProfile {
  saved_profile_id: string;
  profile_id: string;
  profile_url: string;
  full_name: string;
  headline: string;
  company_name: string;
  job_title: string;
  location: string;
  profile_image_url: string;
  notes: string;
  tags: string[];
  saved_at: string;
  scraped_at: string;
  connection_count?: number;
  follower_count?: number;
  // Additional fields from database
  first_name?: string;
  last_name?: string;
  email?: string;
  mobile_number?: string;
  phone?: string;
  company_website?: string;
  website?: string;
  about?: string;
  public_identifier?: string;
  open_connection?: boolean;
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
  profile_pic_high_quality?: string;
  profile_pic_all_dimensions?: any;
  experience?: any;
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
  created_at?: string;
  updated_at?: string;
}

export const SavedProfiles: React.FC = () => {
  const { user } = useAuth();
  const [savedProfiles, setSavedProfiles] = useState<SavedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [success, setSuccess] = useState<string>('');
  const [selectedProfiles, setSelectedProfiles] = useState<Set<string>>(new Set());
  
  // UI state for collapsible sections
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showColumnControls, setShowColumnControls] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [showEditTagsModal, setShowEditTagsModal] = useState(false);
  const [editTagsValue, setEditTagsValue] = useState('');
  
  // Ref for export dropdown
  const exportDropdownRef = useRef<HTMLDivElement>(null);
  
  // Column visibility state - all database columns
  const [visibleColumns, setVisibleColumns] = useState({
    select: true,
    picture: true,
    name: true,
    headline: true,
    location: true,
    connections: true,
    company: true,
    tags: true,
    lastUpdated: true,

    // Basic Info
    followers: false,
    jobTitle: false,
    email: false,
    phone: false,
    website: false,
    about: false,
    publicIdentifier: false,
    openConnection: false,
    // Company Details
    companyIndustry: false,
    companyLinkedin: false,
    companyFoundedIn: false,
    companySize: false,
    currentJobDuration: false,
    currentJobDurationInYrs: false,
    // Address/Location
    addressCountryOnly: false,
    addressWithCountry: false,
    addressWithoutCountry: false,
    // Profile Images
    profilePic: false,
    profilePicHighQuality: false,
    profilePicAllDimensions: false,
    // Experience & Education
    experience: false,
    education: false,
    skills: false,
    topSkills: false,
    // Certifications & Awards
    certifications: false,
    honorsAndAwards: false,
    languages: false,
    volunteerAndAwards: false,
    verifications: false,
    // Additional Data
    promos: false,
    highlights: false,
    projects: false,
    publications: false,
    patents: false,
    courses: false,
    testScores: false,
    organizations: false,
    volunteerCauses: false,
    interests: false,
    recommendations: false,
    creatorWebsite: false,
    updates: false,
    urn: false,
    // Timestamps
    scrapedAt: false,
    createdAt: false,
    updatedAt: false,
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
    hasCertifications: false,
    hasProjects: false,
    hasPublications: false,
    hasPatents: false,
    hasCourses: false,
    hasRecommendations: false,
    hasTag: false,
    hasProfilePicture: false,
    hasCompany: false,
    hasLocation: false,
    hasJobTitle: false,
    hasHeadline: false,
    // Negative filters (Has NOT)
    hasNotEmail: false,
    hasNotPhone: false,
    hasNotWebsite: false,
    hasNotAbout: false,
    hasNotSkills: false,
    hasNotExperience: false,
    hasNotEducation: false,
    hasNotCertifications: false,
    hasNotProjects: false,
    hasNotPublications: false,
    hasNotPatents: false,
    hasNotCourses: false,
    hasNotRecommendations: false,
    hasNotTag: false,
    hasNotProfilePicture: false,
    hasNotCompany: false,
    hasNotLocation: false,
    hasNotJobTitle: false,
    hasNotHeadline: false,
    openConnection: false,
    minConnections: '',
    maxConnections: '',
    minFollowers: '',
    maxFollowers: '',
    companyFoundedAfter: '',
    companyFoundedBefore: '',
    jobDurationMin: '',
    jobDurationMax: '',
    countrySearch: '',
  });

  useEffect(() => {
    loadSavedProfiles();
  }, [user]);

  // Handle click outside to close export dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setShowExportDropdown(false);
      }
    };

    if (showExportDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportDropdown]);

  const loadSavedProfiles = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await fetch('/api/saved-profiles', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
          'Authorization': `Bearer ${user?.webhook_token || ''}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load saved profiles');
      }

      const result = await response.json();
      setSavedProfiles(result.profiles || []);
    } catch (err) {
      setError('Failed to load saved profiles');
      console.error('Error loading saved profiles:', err);
    } finally {
      setLoading(false);
    }
  };



  const clearMessages = () => {
    setError('');
    setSuccess('');
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

  const handleSelectAll = () => {
    if (selectedProfiles.size === filteredProfiles.length) {
      setSelectedProfiles(new Set());
    } else {
      setSelectedProfiles(new Set(filteredProfiles.map(p => p.saved_profile_id)));
    }
  };

  const toggleColumn = (column: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  // Helper function to format last updated date with color coding
  const formatLastUpdated = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return { text: 'Today', color: 'bg-green-100 text-green-800' };
    } else if (diffDays <= 7) {
      return { text: 'This Week', color: 'bg-green-50 text-green-700' };
    } else if (diffDays <= 30) {
      return { text: 'This Month', color: 'bg-orange-100 text-orange-700' };
    } else {
      return { text: date.toLocaleDateString(), color: 'bg-orange-200 text-orange-800' };
    }
  };



  // Function to update multiple selected profiles
  const updateSelectedProfiles = async () => {
    if (selectedProfiles.size === 0) return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/update-profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
          'Authorization': `Bearer ${user?.webhook_token || ''}`,
        },
        body: JSON.stringify({ profileIds: Array.from(selectedProfiles) }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profiles');
      }

      const result = await response.json();
      setSuccess(`${result.updated} profiles updated successfully!`);
      
      // Refresh the profiles list
      await loadSavedProfiles();
    } catch (error) {
      setError('Failed to update profiles');
    } finally {
      setLoading(false);
    }
  };

  // Function to delete a profile from user's saved profiles


  // Function to delete multiple selected profiles
  const deleteSelectedProfiles = async () => {
    if (selectedProfiles.size === 0) return;
    
    if (!confirm(`Are you sure you want to remove ${selectedProfiles.size} profiles from your saved profiles?`)) {
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('user_saved_profiles')
        .delete()
        .in('id', Array.from(selectedProfiles))
        .eq('user_id', user?.id);

      if (error) throw error;

      setSuccess(`${selectedProfiles.size} profiles removed from your saved profiles`);
      setSelectedProfiles(new Set());
      await loadSavedProfiles();
    } catch (error) {
      setError('Failed to remove profiles');
    } finally {
      setLoading(false);
    }
  };

  // Function to edit tags for selected profiles
  const editTagsForSelected = async () => {
    if (selectedProfiles.size === 0) return;

    try {
      setLoading(true);
      const tagsArray = editTagsValue.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      
      const { error } = await supabase
        .from('user_saved_profiles')
        .update({ tags: tagsArray })
        .in('id', Array.from(selectedProfiles))
        .eq('user_id', user?.id);

      if (error) throw error;

      setSuccess(`Tags updated for ${selectedProfiles.size} profiles`);
      setShowEditTagsModal(false);
      setEditTagsValue('');
      setSelectedProfiles(new Set());
      await loadSavedProfiles();
    } catch (error) {
      setError('Failed to update tags');
    } finally {
      setLoading(false);
    }
  };

  const exportProfiles = (format: 'csv' | 'json') => {
    const selectedData = filteredProfiles.filter(p => selectedProfiles.has(p.saved_profile_id));
    
    if (format === 'csv') {
      // Get visible columns for CSV export
      const visibleColumnKeys = Object.entries(visibleColumns)
        .filter(([key, visible]) => visible && key !== 'select')
        .map(([key]) => key);
      
      // Create headers
      const headers = visibleColumnKeys.map(key => {
        const columnNames: Record<string, string> = {
          picture: 'Profile Picture',
          name: 'Name',
          headline: 'Headline',
          location: 'Location',
          connections: 'Connections',
          company: 'Company',
          tags: 'Tags',
          lastUpdated: 'Last Updated',
          followers: 'Followers',
          jobTitle: 'Job Title',
          email: 'Email',
          phone: 'Phone',
          website: 'Website',
          about: 'About',
          publicIdentifier: 'Public Identifier',
          openConnection: 'Open Connection',
          companyIndustry: 'Company Industry',
          companyLinkedin: 'Company LinkedIn',
          companyFoundedIn: 'Company Founded In',
          companySize: 'Company Size',
          currentJobDuration: 'Current Job Duration',
          currentJobDurationInYrs: 'Current Job Duration (Years)',
          addressCountryOnly: 'Country',
          addressWithCountry: 'Address With Country',
          addressWithoutCountry: 'Address Without Country',
          profilePic: 'Profile Picture URL',
          profilePicHighQuality: 'High Quality Profile Picture',
          profilePicAllDimensions: 'All Profile Picture Dimensions',
          experience: 'Experience',
          education: 'Education',
          skills: 'Skills',
          topSkills: 'Top Skills',
          certifications: 'Certifications',
          honorsAndAwards: 'Honors and Awards',
          languages: 'Languages',
          volunteerAndAwards: 'Volunteer and Awards',
          verifications: 'Verifications',
          promos: 'Promos',
          highlights: 'Highlights',
          projects: 'Projects',
          publications: 'Publications',
          patents: 'Patents',
          courses: 'Courses',
          testScores: 'Test Scores',
          organizations: 'Organizations',
          volunteerCauses: 'Volunteer Causes',
          interests: 'Interests',
          recommendations: 'Recommendations',
          creatorWebsite: 'Creator Website',
          updates: 'Updates',
          urn: 'URN',
          scrapedAt: 'Scraped At',
          createdAt: 'Created At',
          updatedAt: 'Updated At',
        };
        return columnNames[key] || key;
      });
      
      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...selectedData.map(profile => {
          return visibleColumnKeys.map(key => {
            let value = '';
            switch (key) {
              case 'picture':
                value = profile.profile_image_url || '';
                break;
              case 'name':
                value = profile.full_name || '';
                break;
              case 'headline':
                value = profile.headline || '';
                break;
              case 'location':
                value = profile.location || '';
                break;
              case 'connections':
                value = String(profile.connection_count || 0);
                break;
              case 'company':
                value = profile.company_name || '';
                break;
              case 'tags':
                value = profile.tags ? profile.tags.join('; ') : '';
                break;
              case 'lastUpdated':
                value = new Date(profile.saved_at).toLocaleDateString();
                break;
              case 'followers':
                value = String(profile.follower_count || 0);
                break;
              case 'jobTitle':
                value = profile.job_title || '';
                break;
              case 'email':
                value = profile.email || '';
                break;
              case 'phone':
                value = profile.phone || '';
                break;
              case 'website':
                value = profile.website || '';
                break;
              case 'about':
                value = profile.about || '';
                break;
              case 'publicIdentifier':
                value = profile.public_identifier || '';
                break;
              case 'openConnection':
                value = profile.open_connection ? 'Yes' : 'No';
                break;
              case 'companyIndustry':
                value = profile.company_industry || '';
                break;
              case 'companyLinkedin':
                value = profile.company_linkedin || '';
                break;
              case 'companyFoundedIn':
                value = String(profile.company_founded_in || '');
                break;
              case 'companySize':
                value = profile.company_size || '';
                break;
              case 'currentJobDuration':
                value = profile.current_job_duration || '';
                break;
              case 'currentJobDurationInYrs':
                value = String(profile.current_job_duration_in_yrs || '');
                break;
              case 'addressCountryOnly':
                value = profile.address_country_only || '';
                break;
              case 'addressWithCountry':
                value = profile.address_with_country || '';
                break;
              case 'addressWithoutCountry':
                value = profile.address_without_country || '';
                break;
              case 'profilePic':
                value = profile.profile_pic || '';
                break;
              case 'profilePicHighQuality':
                value = profile.profile_pic_high_quality || '';
                break;
              case 'profilePicAllDimensions':
                value = profile.profile_pic_all_dimensions ? JSON.stringify(profile.profile_pic_all_dimensions) : '';
                break;
              case 'experience':
                value = profile.experience ? JSON.stringify(profile.experience) : '';
                break;
              case 'education':
                value = profile.education ? JSON.stringify(profile.education) : '';
                break;
              case 'skills':
                value = profile.skills ? JSON.stringify(profile.skills) : '';
                break;
              case 'topSkills':
                value = profile.top_skills_by_endorsements ? JSON.stringify(profile.top_skills_by_endorsements) : '';
                break;
              case 'certifications':
                value = profile.license_and_certificates ? JSON.stringify(profile.license_and_certificates) : '';
                break;
              case 'honorsAndAwards':
                value = profile.honors_and_awards ? JSON.stringify(profile.honors_and_awards) : '';
                break;
              case 'languages':
                value = profile.languages ? JSON.stringify(profile.languages) : '';
                break;
              case 'volunteerAndAwards':
                value = profile.volunteer_and_awards ? JSON.stringify(profile.volunteer_and_awards) : '';
                break;
              case 'verifications':
                value = profile.verifications ? JSON.stringify(profile.verifications) : '';
                break;
              case 'promos':
                value = profile.promos ? JSON.stringify(profile.promos) : '';
                break;
              case 'highlights':
                value = profile.highlights ? JSON.stringify(profile.highlights) : '';
                break;
              case 'projects':
                value = profile.projects ? JSON.stringify(profile.projects) : '';
                break;
              case 'publications':
                value = profile.publications ? JSON.stringify(profile.publications) : '';
                break;
              case 'patents':
                value = profile.patents ? JSON.stringify(profile.patents) : '';
                break;
              case 'courses':
                value = profile.courses ? JSON.stringify(profile.courses) : '';
                break;
              case 'testScores':
                value = profile.test_scores ? JSON.stringify(profile.test_scores) : '';
                break;
              case 'organizations':
                value = profile.organizations ? JSON.stringify(profile.organizations) : '';
                break;
              case 'volunteerCauses':
                value = profile.volunteer_causes ? JSON.stringify(profile.volunteer_causes) : '';
                break;
              case 'interests':
                value = profile.interests ? JSON.stringify(profile.interests) : '';
                break;
              case 'recommendations':
                value = profile.recommendations ? JSON.stringify(profile.recommendations) : '';
                break;
              case 'creatorWebsite':
                value = profile.creator_website ? JSON.stringify(profile.creator_website) : '';
                break;
              case 'updates':
                value = profile.updates ? JSON.stringify(profile.updates) : '';
                break;
              case 'urn':
                value = profile.urn || '';
                break;
              case 'scrapedAt':
                value = profile.scraped_at ? new Date(profile.scraped_at).toLocaleString() : '';
                break;
              case 'createdAt':
                value = profile.created_at ? new Date(profile.created_at).toLocaleString() : '';
                break;
              case 'updatedAt':
                value = profile.updated_at ? new Date(profile.updated_at).toLocaleString() : '';
                break;
              default:
                value = '';
            }
            return `"${String(value).replace(/"/g, '""')}"`;
          }).join(',');
        })
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `linkedin-profiles-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } else if (format === 'json') {
      // Export as JSON
      const jsonData = selectedData.map(profile => ({
        id: profile.saved_profile_id,
        profile_url: profile.profile_url,
        full_name: profile.full_name,
        headline: profile.headline,
        company: profile.company_name,
        location: profile.location,
        connection_count: profile.connection_count,
        follower_count: profile.follower_count,
        email: profile.email,
        phone: profile.phone,
        website: profile.website,
        about: profile.about,
        job_title: profile.job_title,
        company_industry: profile.company_industry,
        company_size: profile.company_size,
        company_founded_in: profile.company_founded_in,
        current_job_duration: profile.current_job_duration,
        current_job_duration_in_yrs: profile.current_job_duration_in_yrs,
        open_connection: profile.open_connection,
        profile_image_url: profile.profile_image_url,
        tags: profile.tags,
        saved_at: profile.saved_at,
        scraped_at: profile.scraped_at,
        // Include all other fields
        first_name: profile.first_name,
        last_name: profile.last_name,
        public_identifier: profile.public_identifier,
        address_country_only: profile.address_country_only,
        address_with_country: profile.address_with_country,
        address_without_country: profile.address_without_country,
        profile_pic: profile.profile_pic,
        profile_pic_high_quality: profile.profile_pic_high_quality,
        company_linkedin: profile.company_linkedin,
        company_website: profile.website,
        urn: profile.urn,
        creator_website: profile.creator_website,
        experience: profile.experience,
        education: profile.education,
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
        updates: profile.updates,
        profile_pic_all_dimensions: profile.profile_pic_all_dimensions,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      }));
      
      const jsonContent = JSON.stringify(jsonData, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `linkedin-profiles-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
    
    setSuccess(`Profiles exported as ${format.toUpperCase()} successfully!`);
  };

  // Filter profiles based on search and advanced filters
  const filteredProfiles = savedProfiles.filter(profile => {
    // Basic search filter
    const matchesSearch = !searchTerm || 
      profile.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.headline.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Advanced filters
    const matchesAdvancedFilters = 
      // Positive filters (Has)
      (!advancedFilters.hasEmail || (profile.email && profile.email.trim() !== '')) &&
      (!advancedFilters.hasPhone || (profile.phone && profile.phone.trim() !== '')) &&
      (!advancedFilters.hasWebsite || (profile.website && profile.website.trim() !== '')) &&
      (!advancedFilters.hasAbout || (profile.about && profile.about.trim() !== '')) &&
      (!advancedFilters.hasSkills || (profile.skills && Object.keys(profile.skills).length > 0)) &&
      (!advancedFilters.hasExperience || (profile.experience && Object.keys(profile.experience).length > 0)) &&
      (!advancedFilters.hasEducation || (profile.education && Object.keys(profile.education).length > 0)) &&
      (!advancedFilters.hasCertifications || (profile.license_and_certificates && Object.keys(profile.license_and_certificates).length > 0)) &&
      (!advancedFilters.hasProjects || (profile.projects && Object.keys(profile.projects).length > 0)) &&
      (!advancedFilters.hasPublications || (profile.publications && Object.keys(profile.publications).length > 0)) &&
      (!advancedFilters.hasPatents || (profile.patents && Object.keys(profile.patents).length > 0)) &&
      (!advancedFilters.hasCourses || (profile.courses && Object.keys(profile.courses).length > 0)) &&
      (!advancedFilters.hasRecommendations || (profile.recommendations && Object.keys(profile.recommendations).length > 0)) &&
      (!advancedFilters.hasTag || (profile.tags && profile.tags.length > 0)) &&
      (!advancedFilters.hasProfilePicture || ((profile.profile_image_url || profile.profile_pic_high_quality) && (profile.profile_image_url || profile.profile_pic_high_quality)?.trim() !== '')) &&
      (!advancedFilters.hasCompany || (profile.company_name && profile.company_name.trim() !== '')) &&
      (!advancedFilters.hasLocation || (profile.location && profile.location.trim() !== '')) &&
      (!advancedFilters.hasJobTitle || (profile.job_title && profile.job_title.trim() !== '')) &&
      (!advancedFilters.hasHeadline || (profile.headline && profile.headline.trim() !== '')) &&
      // Negative filters (Has NOT)
      (!advancedFilters.hasNotEmail || !(profile.email && profile.email.trim() !== '')) &&
      (!advancedFilters.hasNotPhone || !(profile.phone && profile.phone.trim() !== '')) &&
      (!advancedFilters.hasNotWebsite || !(profile.website && profile.website.trim() !== '')) &&
      (!advancedFilters.hasNotAbout || !(profile.about && profile.about.trim() !== '')) &&
      (!advancedFilters.hasNotSkills || !(profile.skills && Object.keys(profile.skills).length > 0)) &&
      (!advancedFilters.hasNotExperience || !(profile.experience && Object.keys(profile.experience).length > 0)) &&
      (!advancedFilters.hasNotEducation || !(profile.education && Object.keys(profile.education).length > 0)) &&
      (!advancedFilters.hasNotCertifications || !(profile.license_and_certificates && Object.keys(profile.license_and_certificates).length > 0)) &&
      (!advancedFilters.hasNotProjects || !(profile.projects && Object.keys(profile.projects).length > 0)) &&
      (!advancedFilters.hasNotPublications || !(profile.publications && Object.keys(profile.publications).length > 0)) &&
      (!advancedFilters.hasNotPatents || !(profile.patents && Object.keys(profile.patents).length > 0)) &&
      (!advancedFilters.hasNotCourses || !(profile.courses && Object.keys(profile.courses).length > 0)) &&
      (!advancedFilters.hasNotRecommendations || !(profile.recommendations && Object.keys(profile.recommendations).length > 0)) &&
      (!advancedFilters.hasNotTag || !(profile.tags && profile.tags.length > 0)) &&
      (!advancedFilters.hasNotProfilePicture || !((profile.profile_image_url || profile.profile_pic_high_quality) && (profile.profile_image_url || profile.profile_pic_high_quality)?.trim() !== '')) &&
      (!advancedFilters.hasNotCompany || !(profile.company_name && profile.company_name.trim() !== '')) &&
      (!advancedFilters.hasNotLocation || !(profile.location && profile.location.trim() !== '')) &&
      (!advancedFilters.hasNotJobTitle || !(profile.job_title && profile.job_title.trim() !== '')) &&
      (!advancedFilters.hasNotHeadline || !(profile.headline && profile.headline.trim() !== '')) &&
      // Other filters
      (!advancedFilters.openConnection || profile.open_connection === true) &&
      (!advancedFilters.minConnections || (profile.connection_count || 0) >= parseInt(advancedFilters.minConnections)) &&
      (!advancedFilters.maxConnections || (profile.connection_count || 0) <= parseInt(advancedFilters.maxConnections)) &&
      (!advancedFilters.minFollowers || (profile.follower_count || 0) >= parseInt(advancedFilters.minFollowers)) &&
      (!advancedFilters.maxFollowers || (profile.follower_count || 0) <= parseInt(advancedFilters.maxFollowers)) &&
      (!advancedFilters.companyFoundedAfter || (profile.company_founded_in || 0) >= parseInt(advancedFilters.companyFoundedAfter)) &&
      (!advancedFilters.companyFoundedBefore || (profile.company_founded_in || 0) <= parseInt(advancedFilters.companyFoundedBefore)) &&
      (!advancedFilters.jobDurationMin || (profile.current_job_duration_in_yrs || 0) >= parseFloat(advancedFilters.jobDurationMin)) &&
      (!advancedFilters.jobDurationMax || (profile.current_job_duration_in_yrs || 0) <= parseFloat(advancedFilters.jobDurationMax)) &&
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
            <p className="text-gray-600">Loading your saved profiles...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Saved Profiles ({savedProfiles.length})</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={selectedProfiles.size === filteredProfiles.length && filteredProfiles.length > 0}
              onChange={handleSelectAll}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <span className="text-sm text-gray-600">
              {selectedProfiles.size} of {filteredProfiles.length} selected
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
            {selectedProfiles.size > 0 && (
              <>
              <button 
                onClick={updateSelectedProfiles}
                disabled={loading}
                className="px-3 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Update Selected ({selectedProfiles.size})
              </button>
                <button 
                  onClick={() => setShowEditTagsModal(true)}
                  disabled={loading}
                  className="px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Edit Tags ({selectedProfiles.size})
                </button>
                <button 
                  onClick={deleteSelectedProfiles}
                  disabled={loading}
                  className="px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected ({selectedProfiles.size})
                </button>
              </>
            )}
            <div className="relative" ref={exportDropdownRef}>
              <button 
                onClick={() => setShowExportDropdown(!showExportDropdown)}
                disabled={selectedProfiles.size === 0}
                className="px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Export ({selectedProfiles.size})
              </button>
              {showExportDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                <button
                    onClick={() => {
                      exportProfiles('csv');
                      setShowExportDropdown(false);
                    }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Export as CSV
                </button>
                <button
                    onClick={() => {
                      exportProfiles('json');
                      setShowExportDropdown(false);
                    }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Export as JSON
                </button>
              </div>
              )}
            </div>
            </div>
          </div>
          
        {/* Column Visibility Controls */}
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setShowColumnControls(!showColumnControls)}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors duration-200 flex items-center"
          >
            <Settings className="w-3 h-3 mr-1" />
            Actions
          </button>
          
          {/* Visible Columns - Only show when column controls are open */}
          {showColumnControls && Object.entries(visibleColumns).map(([key, visible]) => {
            if (!visible) return null;
            const columnNames: Record<keyof typeof visibleColumns, string> = {
              select: 'Select',
              picture: 'Picture',
              name: 'Name',
              headline: 'Headline',
              location: 'Location',
              connections: 'Connections',
              company: 'Current Company',
              tags: 'Tags',
              lastUpdated: 'Last Updated',

              // Basic Info
              followers: 'Followers',
              jobTitle: 'Job Title',
              email: 'Email',
              phone: 'Phone',
              website: 'Website',
              about: 'About',
              publicIdentifier: 'Public Identifier',
              openConnection: 'Open Connection',
              // Company Details
              companyIndustry: 'Company Industry',
              companyLinkedin: 'Company LinkedIn',
              companyFoundedIn: 'Company Founded In',
              companySize: 'Company Size',
              currentJobDuration: 'Current Job Duration',
              currentJobDurationInYrs: 'Current Job Duration (Years)',
              // Address/Location
              addressCountryOnly: 'Country',
              addressWithCountry: 'Address With Country',
              addressWithoutCountry: 'Address Without Country',
              // Profile Images
              profilePic: 'Profile Picture URL',
              profilePicHighQuality: 'High Quality Profile Picture',
              profilePicAllDimensions: 'All Profile Picture Dimensions',
              // Experience & Education
              experience: 'Experience',
              education: 'Education',
              skills: 'Skills',
              topSkills: 'Top Skills',
              // Certifications & Awards
              certifications: 'Certifications',
              honorsAndAwards: 'Honors and Awards',
              languages: 'Languages',
              volunteerAndAwards: 'Volunteer and Awards',
              verifications: 'Verifications',
              // Additional Data
              promos: 'Promos',
              highlights: 'Highlights',
              projects: 'Projects',
              publications: 'Publications',
              patents: 'Patents',
              courses: 'Courses',
              testScores: 'Test Scores',
              organizations: 'Organizations',
              volunteerCauses: 'Volunteer Causes',
              interests: 'Interests',
              recommendations: 'Recommendations',
              creatorWebsite: 'Creator Website',
              updates: 'Updates',
              urn: 'URN',
              // Timestamps
              scrapedAt: 'Scraped At',
              createdAt: 'Created At',
              updatedAt: 'Updated At',
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
          
          {/* Hidden Columns - Only show when column controls are open */}
          {showColumnControls && Object.entries(visibleColumns).map(([key, visible]) => {
            if (visible) return null;
            const columnNames: Record<keyof typeof visibleColumns, string> = {
              select: 'Select',
              picture: 'Picture',
              name: 'Name',
              headline: 'Headline',
              location: 'Location',
              connections: 'Connections',
              company: 'Current Company',
              tags: 'Tags',
              lastUpdated: 'Last Updated',

              // Basic Info
              followers: 'Followers',
              jobTitle: 'Job Title',
              email: 'Email',
              phone: 'Phone',
              website: 'Website',
              about: 'About',
              publicIdentifier: 'Public Identifier',
              openConnection: 'Open Connection',
              // Company Details
              companyIndustry: 'Company Industry',
              companyLinkedin: 'Company LinkedIn',
              companyFoundedIn: 'Company Founded In',
              companySize: 'Company Size',
              currentJobDuration: 'Current Job Duration',
              currentJobDurationInYrs: 'Current Job Duration (Years)',
              // Address/Location
              addressCountryOnly: 'Country',
              addressWithCountry: 'Address With Country',
              addressWithoutCountry: 'Address Without Country',
              // Profile Images
              profilePic: 'Profile Picture URL',
              profilePicHighQuality: 'High Quality Profile Picture',
              profilePicAllDimensions: 'All Profile Picture Dimensions',
              // Experience & Education
              experience: 'Experience',
              education: 'Education',
              skills: 'Skills',
              topSkills: 'Top Skills',
              // Certifications & Awards
              certifications: 'Certifications',
              honorsAndAwards: 'Honors and Awards',
              languages: 'Languages',
              volunteerAndAwards: 'Volunteer and Awards',
              verifications: 'Verifications',
              // Additional Data
              promos: 'Promos',
              highlights: 'Highlights',
              projects: 'Projects',
              publications: 'Publications',
              patents: 'Patents',
              courses: 'Courses',
              testScores: 'Test Scores',
              organizations: 'Organizations',
              volunteerCauses: 'Volunteer Causes',
              interests: 'Interests',
              recommendations: 'Recommendations',
              creatorWebsite: 'Creator Website',
              updates: 'Updates',
              urn: 'URN',
              // Timestamps
              scrapedAt: 'Scraped At',
              createdAt: 'Created At',
              updatedAt: 'Updated At',
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
          
      {/* Advanced Filters Section - Only show when filters are open */}
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
                  checked={advancedFilters.hasCertifications}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, hasCertifications: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">Has Certifications</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={advancedFilters.hasProjects}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, hasProjects: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">Has Projects</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={advancedFilters.hasPublications}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, hasPublications: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">Has Publications</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={advancedFilters.hasPatents}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, hasPatents: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">Has Patents</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={advancedFilters.hasCourses}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, hasCourses: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">Has Courses</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={advancedFilters.hasRecommendations}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, hasRecommendations: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">Has Recommendations</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={advancedFilters.hasTag}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, hasTag: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">Has Tags</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={advancedFilters.hasProfilePicture}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, hasProfilePicture: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">Has Profile Picture</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={advancedFilters.hasCompany}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, hasCompany: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">Has Company</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={advancedFilters.hasLocation}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, hasLocation: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">Has Location</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={advancedFilters.hasJobTitle}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, hasJobTitle: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">Has Job Title</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={advancedFilters.hasHeadline}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, hasHeadline: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">Has Headline</span>
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

          {/* Negative Filters (Has NOT) */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-700">Exclude Profiles (Has NOT)</h4>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={advancedFilters.hasNotEmail}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, hasNotEmail: e.target.checked }))}
                  className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="ml-2 text-sm text-gray-600">Has NOT Email</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={advancedFilters.hasNotPhone}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, hasNotPhone: e.target.checked }))}
                  className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="ml-2 text-sm text-gray-600">Has NOT Phone</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={advancedFilters.hasNotWebsite}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, hasNotWebsite: e.target.checked }))}
                  className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="ml-2 text-sm text-gray-600">Has NOT Website</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={advancedFilters.hasNotAbout}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, hasNotAbout: e.target.checked }))}
                  className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="ml-2 text-sm text-gray-600">Has NOT About</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={advancedFilters.hasNotSkills}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, hasNotSkills: e.target.checked }))}
                  className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="ml-2 text-sm text-gray-600">Has NOT Skills</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={advancedFilters.hasNotExperience}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, hasNotExperience: e.target.checked }))}
                  className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="ml-2 text-sm text-gray-600">Has NOT Experience</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={advancedFilters.hasNotEducation}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, hasNotEducation: e.target.checked }))}
                  className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="ml-2 text-sm text-gray-600">Has NOT Education</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={advancedFilters.hasNotCertifications}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, hasNotCertifications: e.target.checked }))}
                  className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="ml-2 text-sm text-gray-600">Has NOT Certifications</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={advancedFilters.hasNotProjects}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, hasNotProjects: e.target.checked }))}
                  className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="ml-2 text-sm text-gray-600">Has NOT Projects</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={advancedFilters.hasNotPublications}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, hasNotPublications: e.target.checked }))}
                  className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="ml-2 text-sm text-gray-600">Has NOT Publications</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={advancedFilters.hasNotPatents}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, hasNotPatents: e.target.checked }))}
                  className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="ml-2 text-sm text-gray-600">Has NOT Patents</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={advancedFilters.hasNotCourses}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, hasNotCourses: e.target.checked }))}
                  className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="ml-2 text-sm text-gray-600">Has NOT Courses</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={advancedFilters.hasNotRecommendations}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, hasNotRecommendations: e.target.checked }))}
                  className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="ml-2 text-sm text-gray-600">Has NOT Recommendations</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={advancedFilters.hasNotTag}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, hasNotTag: e.target.checked }))}
                  className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="ml-2 text-sm text-gray-600">Has NOT Tags</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={advancedFilters.hasNotProfilePicture}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, hasNotProfilePicture: e.target.checked }))}
                  className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="ml-2 text-sm text-gray-600">Has NOT Profile Picture</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={advancedFilters.hasNotCompany}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, hasNotCompany: e.target.checked }))}
                  className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="ml-2 text-sm text-gray-600">Has NOT Company</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={advancedFilters.hasNotLocation}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, hasNotLocation: e.target.checked }))}
                  className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="ml-2 text-sm text-gray-600">Has NOT Location</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={advancedFilters.hasNotJobTitle}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, hasNotJobTitle: e.target.checked }))}
                  className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="ml-2 text-sm text-gray-600">Has NOT Job Title</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={advancedFilters.hasNotHeadline}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, hasNotHeadline: e.target.checked }))}
                  className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="ml-2 text-sm text-gray-600">Has NOT Headline</span>
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
              <div>
                <label className="block text-sm text-gray-600 mb-1">Company Founded</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="After"
                    value={advancedFilters.companyFoundedAfter}
                    onChange={(e) => setAdvancedFilters(prev => ({ ...prev, companyFoundedAfter: e.target.value }))}
                    className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Before"
                    value={advancedFilters.companyFoundedBefore}
                    onChange={(e) => setAdvancedFilters(prev => ({ ...prev, companyFoundedBefore: e.target.value }))}
                    className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Job Duration (Years)</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Min"
                    value={advancedFilters.jobDurationMin}
                    onChange={(e) => setAdvancedFilters(prev => ({ ...prev, jobDurationMin: e.target.value }))}
                    className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Max"
                    value={advancedFilters.jobDurationMax}
                    onChange={(e) => setAdvancedFilters(prev => ({ ...prev, jobDurationMax: e.target.value }))}
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
                  hasCertifications: false,
                  hasProjects: false,
                  hasPublications: false,
                  hasPatents: false,
                  hasCourses: false,
                  hasRecommendations: false,
                  hasTag: false,
                  hasProfilePicture: false,
                  hasCompany: false,
                  hasLocation: false,
                  hasJobTitle: false,
                  hasHeadline: false,
                  // Negative filters (Has NOT)
                  hasNotEmail: false,
                  hasNotPhone: false,
                  hasNotWebsite: false,
                  hasNotAbout: false,
                  hasNotSkills: false,
                  hasNotExperience: false,
                  hasNotEducation: false,
                  hasNotCertifications: false,
                  hasNotProjects: false,
                  hasNotPublications: false,
                  hasNotPatents: false,
                  hasNotCourses: false,
                  hasNotRecommendations: false,
                  hasNotTag: false,
                  hasNotProfilePicture: false,
                  hasNotCompany: false,
                  hasNotLocation: false,
                  hasNotJobTitle: false,
                  hasNotHeadline: false,
                  openConnection: false,
                  minConnections: '',
                  maxConnections: '',
                  minFollowers: '',
                  maxFollowers: '',
                  companyFoundedAfter: '',
                  companyFoundedBefore: '',
                  jobDurationMin: '',
                  jobDurationMax: '',
                  countrySearch: '',
                })}
                className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-200 text-sm"
              >
                Clear All Filters
            </button>
              <div className="text-sm text-gray-600">
                <p>Showing {filteredProfiles.length} of {savedProfiles.length} profiles</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Table View */}
      {filteredProfiles.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Bookmark className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {savedProfiles.length === 0 ? 'No saved profiles yet' : 'No profiles match your filters'}
          </h3>
          <p className="text-gray-600">
            {savedProfiles.length === 0 
              ? 'Start scraping LinkedIn profiles to save them here for easy access.'
              : 'Try adjusting your search terms or filters.'
            }
          </p>
        </div>
      ) : (
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
                  {visibleColumns.followers && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      FOLLOWERS
                    </th>
                  )}
                  {visibleColumns.company && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CURRENT COMPANY
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
                  {visibleColumns.companyIndustry && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      INDUSTRY
                    </th>
                  )}
                  {visibleColumns.companyFoundedIn && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      FOUNDED
                    </th>
                  )}
                  {visibleColumns.companySize && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      COMPANY SIZE
                    </th>
                  )}
                  {visibleColumns.currentJobDuration && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      JOB DURATION
                    </th>
                  )}
                  {visibleColumns.currentJobDurationInYrs && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      JOB DURATION (YRS)
                    </th>
                  )}
                  {visibleColumns.openConnection && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      OPEN CONNECTION
                    </th>
                  )}
                  {visibleColumns.tags && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      TAGS
                    </th>
                  )}
                  {visibleColumns.lastUpdated && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      LAST UPDATED
                    </th>
                  )}

                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
          {filteredProfiles.map((profile) => (
                  <tr key={profile.saved_profile_id} className="hover:bg-gray-50">
                    {visibleColumns.select && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedProfiles.has(profile.saved_profile_id)}
                          onChange={() => handleSelectProfile(profile.saved_profile_id)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                      </td>
                    )}
                    {visibleColumns.picture && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        {profile.profile_image_url ? (
                  <img
                    src={profile.profile_image_url}
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
                  href={profile.profile_url}
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
                    {visibleColumns.followers && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {profile.follower_count?.toLocaleString() || 'N/A'}
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
                          {profile.phone || 'N/A'}
          </div>
                      </td>
                    )}
                    {visibleColumns.website && (
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {profile.website ? (
                            <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                              {profile.website}
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
                    {visibleColumns.companyIndustry && (
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {profile.company_industry || 'N/A'}
                        </div>
                      </td>
                    )}
                    {visibleColumns.companyFoundedIn && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {profile.company_founded_in || 'N/A'}
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
                    {visibleColumns.currentJobDuration && (
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {profile.current_job_duration || 'N/A'}
                        </div>
                      </td>
                    )}
                    {visibleColumns.currentJobDurationInYrs && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {profile.current_job_duration_in_yrs || 'N/A'}
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
                    {visibleColumns.tags && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {profile.tags && profile.tags.length > 0 ? (
                            profile.tags.slice(0, 2).map((tag, index) => (
                              <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500">No tags</span>
                          )}
                        </div>
                      </td>
                    )}
                    {visibleColumns.lastUpdated && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${formatLastUpdated(profile.scraped_at).color}`}>
                          {formatLastUpdated(profile.scraped_at).text}
                        </span>
                      </td>
                    )}

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Tags Modal */}
      {showEditTagsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Edit Tags for {selectedProfiles.size} Profiles
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={editTagsValue}
                onChange={(e) => setEditTagsValue(e.target.value)}
                placeholder="e.g., developer, remote, startup"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex justify-end space-x-3">
                          <button
                onClick={() => {
                  setShowEditTagsModal(false);
                  setEditTagsValue('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors duration-200"
              >
                Cancel
                          </button>
                          <button
                onClick={editTagsForSelected}
                            disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                          >
                {loading ? 'Updating...' : 'Update Tags'}
                          </button>
                        </div>
          </div>
        </div>
      )}
    </div>
  );
};
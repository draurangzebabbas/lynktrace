import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Download,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Users,
  Target,
  Zap,
  Calendar,
  PieChart,
  Activity,
  Globe,
  Building,
  MapPin,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface ScrapingLog {
  id: string;
  user_id: string;
  input_type: string;
  input_data: string;
  status: string;
  processing_time: number;
  api_key_used: string;
  created_at: string;
  completed_at: string;
  error_message: string;
  results_summary: string;
}

export const AnalyticsView: React.FC = () => {
  const [logs, setLogs] = useState<ScrapingLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ScrapingLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('7d');
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'charts'>('overview');
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [profileStats, setProfileStats] = useState({
    totalProfiles: 0,
    profilesWithEmail: 0,
    profilesWithPhone: 0,
    profilesWithWebsite: 0,
    topCompanies: [] as { company: string; count: number }[],
    topLocations: [] as { location: string; count: number }[],
    avgConnections: 0,
    avgFollowers: 0
  });
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchLogs();
      fetchProfileStats();
    }
  }, [user]);

  useEffect(() => {
    filterLogs();
  }, [logs, statusFilter, dateRange]);

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchLogs();
        fetchProfileStats();
      }, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, user]);

  // Fetch logs from Supabase
  const fetchLogs = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('scraping_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch profile statistics
  const fetchProfileStats = async () => {
    if (!user) return;

    try {
      // Get user's saved profiles
      const { data: savedProfiles, error: savedError } = await supabase
        .from('user_saved_profiles')
        .select(`
          linkedin_profiles (
            company_name,
            location,
            email,
            mobile_number,
            phone,
            company_website,
            website,
            connections,
            connection_count,
            followers,
            follower_count
          )
        `)
        .eq('user_id', user.id);

      if (savedError) throw savedError;

      const profiles = savedProfiles?.map(p => p.linkedin_profiles).filter(Boolean) || [];

      // Calculate statistics
      const totalProfiles = profiles.length;
      const profilesWithEmail = profiles.filter(p => p.email).length;
      const profilesWithPhone = profiles.filter(p => p.mobile_number || p.phone).length;
      const profilesWithWebsite = profiles.filter(p => p.company_website || p.website).length;

      // Top companies
      const companyCounts = profiles.reduce((acc: any, profile: any) => {
        if (profile.company_name) {
          acc[profile.company_name] = (acc[profile.company_name] || 0) + 1;
        }
        return acc;
      }, {});

      const topCompanies = Object.entries(companyCounts)
        .map(([company, count]) => ({ company, count: count as number }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Top locations
      const locationCounts = profiles.reduce((acc: any, profile: any) => {
        if (profile.location) {
          acc[profile.location] = (acc[profile.location] || 0) + 1;
        }
        return acc;
      }, {});

      const topLocations = Object.entries(locationCounts)
        .map(([location, count]) => ({ location, count: count as number }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Average connections and followers
      const avgConnections = profiles.length > 0 
        ? profiles.reduce((sum, p) => sum + (p.connections || p.connection_count || 0), 0) / profiles.length
        : 0;
      
      const avgFollowers = profiles.length > 0
        ? profiles.reduce((sum, p) => sum + (p.followers || p.follower_count || 0), 0) / profiles.length
        : 0;

      setProfileStats({
        totalProfiles,
        profilesWithEmail,
        profilesWithPhone,
        profilesWithWebsite,
        topCompanies,
        topLocations,
        avgConnections: Math.round(avgConnections),
        avgFollowers: Math.round(avgFollowers)
      });
    } catch (error) {
      console.error('Error fetching profile stats:', error);
    }
  };

  const filterLogs = () => {
    let filtered = [...logs];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(log => log.status === statusFilter);
    }

    // Filter by date range
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (dateRange) {
      case '24h':
        cutoffDate.setHours(now.getHours() - 24);
        break;
      case '7d':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        cutoffDate.setDate(now.getDate() - 90);
        break;
      default:
        cutoffDate.setFullYear(2020); // Show all
    }

    filtered = filtered.filter(log => new Date(log.created_at) >= cutoffDate);
    setFilteredLogs(filtered);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateStats = () => {
    const total = filteredLogs.length;
    const completed = filteredLogs.filter(log => log.status === 'completed').length;
    const failed = filteredLogs.filter(log => log.status === 'failed').length;
    const pending = filteredLogs.filter(log => log.status === 'pending').length;
    const avgProcessingTime = filteredLogs
      .filter(log => log.processing_time)
      .reduce((sum, log) => sum + log.processing_time, 0) / 
      filteredLogs.filter(log => log.processing_time).length || 0;

    return { total, completed, failed, pending, avgProcessingTime };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-sm">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Monitor your LinkedIn scraping performance and usage</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 rounded-lg transition-colors duration-200 flex items-center ${
              autoRefresh 
                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </button>
          <button 
            onClick={() => {
              // Create CSV data
              const csvContent = logs.map(log => 
                `${log.input_type},${log.status},${log.created_at},${log.processing_time || 0}`
              ).join('\n');
              
              const csvHeader = 'Input Type,Status,Created At,Processing Time (ms)\n';
              const blob = new Blob([csvHeader + csvContent], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `scraping-analytics-${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
              window.URL.revokeObjectURL(url);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
          >
            <Download className="w-5 h-5 mr-2" />
            Export Data
          </button>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center space-x-1 bg-gray-100 rounded-md p-1">
        <button
          onClick={() => setViewMode('overview')}
          className={`px-3 py-1 text-sm rounded transition-colors duration-200 ${
            viewMode === 'overview' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setViewMode('detailed')}
          className={`px-3 py-1 text-sm rounded transition-colors duration-200 ${
            viewMode === 'detailed' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Detailed
        </button>
        <button
          onClick={() => setViewMode('charts')}
          className={`px-3 py-1 text-sm rounded transition-colors duration-200 ${
            viewMode === 'charts' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Charts
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Overview Mode */}
      {viewMode === 'overview' && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Failed Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.failed}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Processing</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(stats.avgProcessingTime)}ms
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Profile Statistics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Statistics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{profileStats.totalProfiles}</p>
                  <p className="text-sm text-gray-600">Total Profiles</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Mail className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{profileStats.profilesWithEmail}</p>
                  <p className="text-sm text-gray-600">With Email</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Target className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{profileStats.profilesWithPhone}</p>
                  <p className="text-sm text-gray-600">With Phone</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <Globe className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{profileStats.profilesWithWebsite}</p>
                  <p className="text-sm text-gray-600">With Website</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Companies</h3>
              {profileStats.topCompanies.length > 0 ? (
                <div className="space-y-3">
                  {profileStats.topCompanies.slice(0, 5).map((company, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Building className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">{company.company}</span>
                      </div>
                      <span className="text-sm text-gray-600">{company.count} profiles</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No company data yet</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Detailed Mode */}
      {viewMode === 'detailed' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">Total Requests</p>
                    <p className="text-xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">Success Rate</p>
                    <p className="text-xl font-bold text-gray-900">
                      {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                    </p>
                  </div>
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">Failed Requests</p>
                    <p className="text-xl font-bold text-gray-900">{stats.failed}</p>
                  </div>
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">Avg Processing</p>
                    <p className="text-xl font-bold text-gray-900">
                      {Math.round(stats.avgProcessingTime)}ms
                    </p>
                  </div>
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Locations</h3>
            {profileStats.topLocations.length > 0 ? (
              <div className="space-y-3">
                {profileStats.topLocations.slice(0, 8).map((location, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">{location.location}</span>
                    </div>
                    <span className="text-sm text-gray-600">{location.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No location data yet</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Charts Mode */}
      {viewMode === 'charts' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Status Distribution</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  <span className="text-sm font-medium text-gray-900">Completed</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600">{stats.completed}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <XCircle className="w-5 h-5 text-red-500 mr-2" />
                  <span className="text-sm font-medium text-gray-900">Failed</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{ width: `${stats.total > 0 ? (stats.failed / stats.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600">{stats.failed}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-yellow-500 mr-2" />
                  <span className="text-sm font-medium text-gray-900">Pending</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full" 
                      style={{ width: `${stats.total > 0 ? (stats.pending / stats.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600">{stats.pending}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Data Quality</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">Email Coverage</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${profileStats.totalProfiles > 0 ? (profileStats.profilesWithEmail / profileStats.totalProfiles) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600">
                    {profileStats.totalProfiles > 0 ? Math.round((profileStats.profilesWithEmail / profileStats.totalProfiles) * 100) : 0}%
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">Phone Coverage</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${profileStats.totalProfiles > 0 ? (profileStats.profilesWithPhone / profileStats.totalProfiles) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600">
                    {profileStats.totalProfiles > 0 ? Math.round((profileStats.profilesWithPhone / profileStats.totalProfiles) * 100) : 0}%
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">Website Coverage</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full" 
                      style={{ width: `${profileStats.totalProfiles > 0 ? (profileStats.profilesWithWebsite / profileStats.totalProfiles) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600">
                    {profileStats.totalProfiles > 0 ? Math.round((profileStats.profilesWithWebsite / profileStats.totalProfiles) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Requests */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Recent Scraping Requests</h2>
          <p className="text-sm text-gray-600">Latest LinkedIn scraping requests and their details</p>
        </div>

        <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log) => (
              <div key={log.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(log.status)}
                    <div>
                      <p className="font-medium text-gray-900">
                        {log.input_type} - {log.input_data}
                      </p>
                      <p className="text-sm text-gray-600">
                        Request ID: {log.id}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(log.status)}`}>
                      {log.status}
                    </span>
                    {log.processing_time && (
                      <span className="text-sm text-gray-500">
                        {log.processing_time}ms
                      </span>
                    )}
                  </div>
                </div>
                
                {log.error_message && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{log.error_message}</p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No data available</h3>
              <p className="text-gray-600">
                {statusFilter !== 'all' || dateRange !== 'all'
                  ? 'No requests match your current filters'
                  : 'Start scraping LinkedIn profiles to see analytics data'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
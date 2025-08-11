/**
 * Services Manager Dashboard
 * 
 * Comprehensive management dashboard for service managers to oversee
 * all community services from a unified interface.
 * 
 * @license MIT
 */

import React, { useState, useEffect } from 'react';
import {
  OrganizationDashboard as DashboardData,
  ServiceMetrics,
  StaffMetrics,
  ResourceMetrics,
  ClientMetrics,
  FinancialMetrics,
  OrganizationAlert,
  CommunityServiceType,
  COMMUNITY_SERVICE_TYPE_VALUES,
  CommunityConfiguration
} from '../types/CommunityServices';
import { FacilitiesMap } from './FacilitiesMap';
import { HMISFacility, hmisAPIService } from '../services/hmisAPIService';
import { PersonRegistrationModal, PersonType, PersonRegistrationData } from './PersonRegistrationModal';
import { solidPodService } from '../services/solidPodService';
import { solidAuthService } from '../services/solidAuthService';
import { OpenMapsComponent } from './OpenMapsComponent';
import { ShelterList } from './ShelterList';
import { shelterDataService, ShelterFacility } from '../services/shelterDataService';

interface ServicesManagerProps {
  managerId: string;
  organizationId: string;
}

interface ServiceOverview {
  serviceType: CommunityServiceType;
  serviceName: string;
  status: 'active' | 'maintenance' | 'offline';
  currentCapacity: number;
  maxCapacity: number;
  activeClients: number;
  staffOnDuty: number;
  alerts: number;
  todayServed: number;
}

export const ServicesManager: React.FC<ServicesManagerProps> = ({
  managerId,
  organizationId
}) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'staff' | 'resources' | 'clients' | 'reports' | 'alerts' | 'facilities' | 'configuration' | 'shelters'>('overview');
  const [selectedTimeRange, setSelectedTimeRange] = useState<'today' | 'week' | 'month'>('today');

  // Configuration state
  const [showSolidModal, setShowSolidModal] = useState(false);
  const [showHATModal, setShowHATModal] = useState(false);
  const [solidConfig, setSolidConfig] = useState({
    connected: false,
    provider: '',
    webId: '',
    status: 'disconnected' as 'connected' | 'disconnected' | 'error'
  });
  const [hatConfig, setHatConfig] = useState({
    connected: false,
    domain: '',
    status: 'disconnected' as 'connected' | 'disconnected' | 'error'
  });
  const [healthConfig, setHealthConfig] = useState({
    authorized: false,
    categories: {
      vitals: false,
      fitness: false,
      nutrition: false,
      sleep: false,
      mental_health: false,
      medical_records: false
    },
    lastSync: null as Date | null
  });

  // HMIS facilities state
  const [hmisStats, setHmisStats] = useState<{
    totalFacilities: number;
    shelterCount: number;
    availableBeds: number;
    supportServices: number;
  }>({
    totalFacilities: 0,
    shelterCount: 0,
    availableBeds: 0,
    supportServices: 0
  });

  // Registration modal state
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [registrationType, setRegistrationType] = useState<PersonType>('client');
  const [registeredPersons, setRegisteredPersons] = useState<{
    clients: PersonRegistrationData[];
    staff: PersonRegistrationData[];
    managers: PersonRegistrationData[];
  }>({
    clients: [],
    staff: [],
    managers: []
  });

  // Shelter management state
  const [shelters, setShelters] = useState<ShelterFacility[]>([]);
  const [selectedShelter, setSelectedShelter] = useState<ShelterFacility | null>(null);
  const [shelterViewMode, setShelterViewMode] = useState<'list' | 'map'>('list');
  const [spatialNavigationEnabled, setSpatialNavigationEnabled] = useState(true);

  useEffect(() => {
    loadDashboardData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, [managerId, organizationId]);

  // Load HMIS stats when facilities tab is active
  useEffect(() => {
    if (activeTab === 'facilities') {
      loadHMISStats();
    }
  }, [activeTab]);

  // Load registered persons when configuration tab is active
  useEffect(() => {
    if (activeTab === 'configuration') {
      loadRegisteredPersons();
    }
  }, [activeTab]);

  // Load shelter data when shelters tab is active
  useEffect(() => {
    if (activeTab === 'shelters') {
      loadShelterData();
    }
  }, [activeTab]);

  // Initialize persistent Solid Pod configuration on component mount
  useEffect(() => {
    const initializePersistentConfig = async () => {
      try {
        const persistedConfig = await solidAuthService.getPersistentSessionInfo();
        if (persistedConfig && persistedConfig.connected) {
          setSolidConfig({
            connected: true,
            provider: persistedConfig.provider,
            webId: persistedConfig.webId,
            status: 'connected'
          });
          console.log('✅ Restored persistent Solid Pod configuration');
        }
      } catch (error) {
        console.error('Failed to initialize persistent configuration:', error);
      }
    };

    initializePersistentConfig();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Mock data - in real implementation, fetch from API
      const mockData = createMockManagerData();
      setDashboardData(mockData);
    } catch (error) {
      console.error('Failed to load manager dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadHMISStats = async () => {
    try {
      console.log('Loading HMIS stats...');
      const stats = await hmisAPIService.getHMISStats();
      const facilities = await hmisAPIService.getAllFacilities();
      
      const shelterCount = facilities.filter(f => f.type === 'shelter').length;
      const supportServices = facilities.filter(f => f.type === 'community_support').length;
      const totalAvailableBeds = facilities.reduce((sum, f) => sum + (f.availableBeds || 0), 0);

      const newStats = {
        totalFacilities: stats.totalFacilities,
        shelterCount,
        availableBeds: totalAvailableBeds,
        supportServices
      };

      setHmisStats(newStats);

      // Update DOM elements if they exist (for immediate visual feedback)
      setTimeout(() => {
        const totalEl = document.getElementById('total-facilities');
        const shelterEl = document.getElementById('shelter-count');
        const bedsEl = document.getElementById('available-beds');
        const servicesEl = document.getElementById('support-services');

        if (totalEl) totalEl.textContent = newStats.totalFacilities.toString();
        if (shelterEl) shelterEl.textContent = newStats.shelterCount.toString();
        if (bedsEl) bedsEl.textContent = newStats.availableBeds.toString();
        if (servicesEl) servicesEl.textContent = newStats.supportServices.toString();
      }, 100);

      console.log('HMIS stats loaded:', newStats);
    } catch (error) {
      console.error('Failed to load HMIS stats:', error);
    }
  };

  const loadRegisteredPersons = async () => {
    try {
      console.log('Loading registered persons...');
      
      // Load from Solid Pod
      const clients = await solidPodService.getPersonsByRole('client');
      const staff = await solidPodService.getPersonsByRole('staff');
      const managers = await solidPodService.getPersonsByRole('manager');

      setRegisteredPersons({
        clients: clients as PersonRegistrationData[],
        staff: staff as PersonRegistrationData[],
        managers: managers as PersonRegistrationData[]
      });

      console.log('Registered persons loaded:', {
        clients: clients.length,
        staff: staff.length,
        managers: managers.length
      });
    } catch (error) {
      console.error('Failed to load registered persons:', error);
    }
  };

  const loadShelterData = async () => {
    try {
      console.log('Loading shelter data with spatial navigation...');
      
      // Load shelters from the shelter data service
      const shelterData = await shelterDataService.getAllShelters();
      setShelters(shelterData);
      
      console.log('Shelter data loaded:', {
        count: shelterData.length,
        spatialNavigation: spatialNavigationEnabled
      });
    } catch (error) {
      console.error('Failed to load shelter data:', error);
    }
  };

  const handleOpenRegistration = (type: PersonType) => {
    setRegistrationType(type);
    setShowRegistrationModal(true);
  };

  const handleRegistrationSuccess = async (person: PersonRegistrationData) => {
    console.log(`✅ ${person.role} registered successfully:`, person);
    
    // Update the local state
    setRegisteredPersons(prev => ({
      ...prev,
      [person.role === 'client' ? 'clients' : person.role === 'staff' ? 'staff' : 'managers']: [
        ...prev[person.role === 'client' ? 'clients' : person.role === 'staff' ? 'staff' : 'managers'],
        person
      ]
    }));

    // Show success message
    alert(`${person.firstName} ${person.lastName} has been successfully registered as a ${person.role}.`);
  };

  const handleSolidConnect = async (provider: string, webId: string) => {
    try {
      // Update Solid configuration
      setSolidConfig({
        connected: true,
        provider,
        webId,
        status: 'connected'
      });
      
      // Save persistent session
      await solidAuthService.savePersistentSession(provider);
      
      setShowSolidModal(false);
      console.log('Solid Pod connected and saved persistently:', { provider, webId });
    } catch (error) {
      setSolidConfig(prev => ({ ...prev, status: 'error' }));
      console.error('Solid Pod connection failed:', error);
    }
  };

  const createMockManagerData = (): DashboardData => {
    const mockConfig: CommunityConfiguration = {
      communityName: 'Idaho Community Services Hub',
      locations: [{
        locationId: '1',
        name: 'Main Community Center',
        address: {
          street: '123 Community Way',
          city: 'Boise',
          state: 'Idaho',
          zipCode: '83702'
        },
        serviceTypes: ['shelter', 'food_water', 'sanitation', 'transportation'],
        capacity: {
          shelter: 150,
          food_water: 300,
          sanitation: 50,
          transportation: 100
        },
        accessibility: [{ feature: 'wheelchair_accessible', available: true }],
        contactInfo: {
          phone: '(208) 555-0123',
          email: 'info@idahocommunityservices.org',
          languages: ['English', 'Spanish']
        }
      }],
      services: [],
      contactInfo: {
        phone: '(208) 555-0123',
        email: 'admin@idahocommunityservices.org',
        languages: ['English', 'Spanish']
      },
      operatingHours: {
        timezone: 'America/Boise',
        schedule: {
          monday: { isOpen: true, openTime: '06:00', closeTime: '22:00', breaks: [] },
          tuesday: { isOpen: true, openTime: '06:00', closeTime: '22:00', breaks: [] },
          wednesday: { isOpen: true, openTime: '06:00', closeTime: '22:00', breaks: [] },
          thursday: { isOpen: true, openTime: '06:00', closeTime: '22:00', breaks: [] },
          friday: { isOpen: true, openTime: '06:00', closeTime: '22:00', breaks: [] },
          saturday: { isOpen: true, openTime: '08:00', closeTime: '20:00', breaks: [] },
          sunday: { isOpen: true, openTime: '08:00', closeTime: '20:00', breaks: [] }
        },
        holidays: [],
        emergencyAvailability: true
      },
      emergencyProtocols: []
    };

    return {
      organizationId,
      communityConfig: mockConfig,
      serviceMetrics: createMockServiceMetrics(),
      staffMetrics: createMockStaffMetrics(),
      resourceMetrics: createMockResourceMetrics(),
      clientMetrics: createMockClientMetrics(),
      financialMetrics: createMockFinancialMetrics(),
      alerts: createMockAlerts(),
      reports: []
    };
  };

  const createMockServiceMetrics = (): ServiceMetrics[] => {
    return COMMUNITY_SERVICE_TYPE_VALUES.map(serviceType => ({
      serviceType,
      totalRequests: Math.floor(Math.random() * 200) + 50,
      completedRequests: Math.floor(Math.random() * 180) + 40,
      pendingRequests: Math.floor(Math.random() * 20) + 5,
      averageWaitTime: Math.floor(Math.random() * 30) + 10,
      averageServiceTime: Math.floor(Math.random() * 45) + 15,
      clientSatisfactionRating: Math.floor(Math.random() * 2) + 4, // 4-5 rating
      capacityUtilization: Math.floor(Math.random() * 40) + 60,
      trends: []
    }));
  };

  const createMockStaffMetrics = (): StaffMetrics => ({
    totalStaff: 45,
    activeStaff: 32,
    staffUtilization: 85,
    averageServiceTime: 25,
    trainingCompletionRate: 92,
    staffSatisfactionRating: 4.2,
    certificationExpirations: []
  });

  const createMockResourceMetrics = (): ResourceMetrics => ({
    totalResources: 500,
    lowStockItems: 8,
    expiredItems: 2,
    totalInventoryValue: 125000,
    monthlyConsumption: [],
    wasteMetrics: {
      foodWaste: 12,
      supplyWaste: 5,
      costOfWaste: 2500,
      wasteReductionGoals: []
    }
  });

  const createMockClientMetrics = (): ClientMetrics => ({
    totalActiveClients: 287,
    newClientsThisMonth: 45,
    returningClients: 125,
    averageServicesPerClient: 2.3,
    clientRetentionRate: 78,
    demographicBreakdown: {
      ageGroups: [],
      genderDistribution: [],
      ethnicityDistribution: [],
      languagePreferences: [],
      specialNeeds: []
    },
    serviceUtilization: []
  });

  const createMockFinancialMetrics = (): FinancialMetrics => ({
    totalBudget: 255000,
    budgetUtilization: 73.3,
    costPerClient: 29.50,
    costPerService: [],
    fundingSources: [],
    grants: [],
    donations: {
      totalDonations: 45000,
      averageDonation: 250,
      donorCount: 180,
      recurringDonors: 45,
      inKindDonations: []
    }
  });

  const createMockAlerts = (): OrganizationAlert[] => [
    {
      alertId: '1',
      alertType: 'resource_shortage',
      severity: 'high',
      title: 'Low Food Supply',
      description: 'Food inventory is running low. Only 2 days supply remaining.',
      affectedServices: ['food_water'],
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      followUpRequired: true
    },
    {
      alertId: '2',
      alertType: 'staff_shortage',
      severity: 'medium',
      title: 'Night Shift Understaffed',
      description: '2 staff members called in sick for tonight shift.',
      affectedServices: ['shelter'],
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      followUpRequired: true
    },
    {
      alertId: '3',
      alertType: 'equipment_failure',
      severity: 'medium',
      title: 'Shower Facility Maintenance',
      description: 'Shower facility #3 requires maintenance - hot water issue.',
      affectedServices: ['sanitation'],
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      followUpRequired: false,
      resolvedAt: new Date()
    }
  ];

  const getServiceOverview = (): ServiceOverview[] => {
    if (!dashboardData) return [];
    
    return dashboardData.serviceMetrics.map(metric => ({
      serviceType: metric.serviceType,
      serviceName: getServiceDisplayName(metric.serviceType),
      status: Math.random() > 0.1 ? 'active' : 'maintenance',
      currentCapacity: Math.floor(metric.capacityUtilization),
      maxCapacity: 100,
      activeClients: metric.pendingRequests,
      staffOnDuty: Math.floor(Math.random() * 8) + 3,
      alerts: dashboardData.alerts.filter(alert => 
        alert.affectedServices?.includes(metric.serviceType)).length,
      todayServed: metric.completedRequests
    }));
  };

  const getServiceDisplayName = (serviceType: CommunityServiceType): string => {
    const names = {
      shelter: 'Shelter Services',
      food_water: 'Food & Water',
      sanitation: 'Sanitation',
      transportation: 'Transportation'
    };
    return names[serviceType] || serviceType;
  };

  const getHighPriorityAlerts = () => {
    return dashboardData?.alerts.filter(alert => 
      alert.severity === 'high' || alert.severity === 'critical'
    ) || [];
  };

  const getOverallStatus = () => {
    if (!dashboardData) return 'loading';
    const highAlerts = getHighPriorityAlerts().length;
    if (highAlerts > 2) return 'critical';
    if (highAlerts > 0) return 'warning';
    return 'operational';
  };

  // Configuration handlers (updated to use the persistent version above)

  const handleHATConnect = async (domain: string) => {
    try {
      // Simulate HAT connection process
      setHatConfig({
        connected: true,
        domain,
        status: 'connected'
      });
      setShowHATModal(false);
      console.log('HAT connected:', domain);
    } catch (error) {
      setHatConfig(prev => ({ ...prev, status: 'error' }));
      console.error('HAT connection failed:', error);
    }
  };

  const handleHealthKitRequest = async () => {
    try {
      // Simulate HealthKit permission request
      const granted = window.confirm(
        'This app would like to access your health data from Apple Health.\n\n' +
        'Data types: Heart rate, blood pressure, weight, activity, sleep data\n\n' +
        'Allow access?'
      );
      
      if (granted) {
        setHealthConfig(prev => ({
          ...prev,
          authorized: true,
          lastSync: new Date()
        }));
        console.log('HealthKit access granted');
      }
    } catch (error) {
      console.error('HealthKit request failed:', error);
    }
  };

  const toggleHealthCategory = (category: string) => {
    setHealthConfig(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: !prev.categories[category as keyof typeof prev.categories]
      }
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-lg">Loading Services Manager Dashboard...</span>
      </div>
    );
  }

  return (
    <div className="services-manager-dashboard p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Services Manager Dashboard</h1>
            <p className="text-gray-600 mt-1">Unified management for all community services</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              getOverallStatus() === 'operational' ? 'bg-green-100 text-green-800' :
              getOverallStatus() === 'warning' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {getOverallStatus() === 'operational' ? '🟢 Operational' :
               getOverallStatus() === 'warning' ? '🟡 Attention Needed' :
               '🔴 Critical Issues'}
            </div>
            <select 
              value={selectedTimeRange} 
              onChange={(e) => setSelectedTimeRange(e.target.value as 'today' | 'week' | 'month')}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {[
              { key: 'overview', label: 'Overview', icon: '📊' },
              { key: 'services', label: 'Services', icon: '🏢' },
              { key: 'staff', label: 'Staff', icon: '👥' },
              { key: 'resources', label: 'Resources', icon: '📦' },
              { key: 'clients', label: 'Clients', icon: '👤' },
              { key: 'shelters', label: 'Shelter Services', icon: '🏠' },
              { key: 'facilities', label: 'Facilities Map', icon: '🗺️' },
              { key: 'reports', label: 'Reports', icon: '📈' },
              { key: 'alerts', label: `Alerts (${dashboardData?.alerts.filter(a => !a.acknowledgedAt).length || 0})`, icon: '🚨' },
              { key: 'configuration', label: 'Configuration', icon: '⚙️' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600">{dashboardData?.clientMetrics.totalActiveClients}</div>
                  <div className="text-sm text-blue-800">Active Clients</div>
                  <div className="text-xs text-blue-600 mt-1">+{dashboardData?.clientMetrics.newClientsThisMonth} this month</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">{dashboardData?.staffMetrics.activeStaff}/{dashboardData?.staffMetrics.totalStaff}</div>
                  <div className="text-sm text-green-800">Staff On Duty</div>
                  <div className="text-xs text-green-600 mt-1">{dashboardData?.staffMetrics.staffUtilization}% utilization</div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-yellow-600">{getHighPriorityAlerts().length}</div>
                  <div className="text-sm text-yellow-800">Priority Alerts</div>
                  <div className="text-xs text-yellow-600 mt-1">Require attention</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-600">${dashboardData?.financialMetrics.totalBudget.toLocaleString()}</div>
                  <div className="text-sm text-purple-800">Total Budget</div>
                  <div className="text-xs text-purple-600 mt-1">${dashboardData?.financialMetrics.costPerClient}/client</div>
                </div>
              </div>

              {/* Services Overview */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Services Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getServiceOverview().map(service => (
                    <div key={service.serviceType} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">{service.serviceName}</h4>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          service.status === 'active' ? 'bg-green-100 text-green-800' :
                          service.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {service.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-gray-500">Capacity</div>
                          <div className="font-medium">{service.currentCapacity}%</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Active Clients</div>
                          <div className="font-medium">{service.activeClients}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Staff On Duty</div>
                          <div className="font-medium">{service.staffOnDuty}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Served Today</div>
                          <div className="font-medium">{service.todayServed}</div>
                        </div>
                      </div>
                      {service.alerts > 0 && (
                        <div className="mt-2 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                          {service.alerts} alert{service.alerts > 1 ? 's' : ''} pending
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Current Alerts</h3>
              {dashboardData?.alerts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">✅</div>
                  <div>No active alerts</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {dashboardData?.alerts.map(alert => (
                    <div key={alert.alertId} className={`border-l-4 p-4 rounded-r-lg ${
                      alert.severity === 'high' || alert.severity === 'critical' ? 'border-red-500 bg-red-50' :
                      alert.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                      'border-blue-500 bg-blue-50'
                    } ${!alert.acknowledgedAt ? 'border-l-8' : ''}`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              alert.severity === 'high' || alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                              alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {alert.severity}
                            </span>
                            <h4 className="font-medium">{alert.title}</h4>
                            {!alert.acknowledgedAt && <span className="w-2 h-2 bg-blue-500 rounded-full"></span>}
                          </div>
                          <p className="text-sm text-gray-600 mt-2">{alert.description}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>{alert.createdAt.toLocaleTimeString()}</span>
                            {alert.affectedServices && (
                              <span>Affects: {alert.affectedServices.join(', ')}</span>
                            )}
                          </div>
                        </div>
                        {alert.followUpRequired && (
                          <button className="ml-4 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">
                            Take Action
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Other tab contents can be expanded similarly */}
          {activeTab === 'services' && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🏢</div>
              <div>Detailed services management interface</div>
              <div className="text-sm mt-1">Individual service controls and monitoring</div>
            </div>
          )}

          {activeTab === 'staff' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Staff Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-xl font-bold">{dashboardData?.staffMetrics.totalStaff}</div>
                  <div className="text-sm text-gray-600">Total Staff</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-xl font-bold text-green-600">{dashboardData?.staffMetrics.activeStaff}</div>
                  <div className="text-sm text-gray-600">On Duty Now</div>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <div className="text-xl font-bold text-red-600">{dashboardData?.staffMetrics.certificationExpirations.length}</div>
                  <div className="text-sm text-gray-600">Expiring Certs</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'resources' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Resource Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Total Resources</h4>
                  <div className="text-2xl font-bold text-blue-600">{dashboardData?.resourceMetrics.totalResources}</div>
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Low Stock Items</h4>
                  <div className="text-2xl font-bold text-yellow-600">{dashboardData?.resourceMetrics.lowStockItems}</div>
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Expired Items</h4>
                  <div className="text-2xl font-bold text-red-600">{dashboardData?.resourceMetrics.expiredItems}</div>
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Inventory Value</h4>
                  <div className="text-2xl font-bold text-green-600">${dashboardData?.resourceMetrics.totalInventoryValue.toLocaleString()}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'facilities' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">HMIS Facilities Map</h3>
                  <p className="text-gray-600 text-sm mt-1">
                    Interactive map showing shelter and support facilities in the Portland metro area
                  </p>
                </div>
                <button
                  onClick={async () => {
                    await hmisAPIService.refreshFacilities();
                    await loadHMISStats();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center gap-2"
                >
                  🔄 Refresh Data
                </button>
              </div>

              {/* HMIS Stats Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">Total Facilities</h4>
                  <div className="text-2xl font-bold text-blue-600" id="total-facilities">
                    {hmisStats.totalFacilities || 'Loading...'}
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 mb-2">Emergency Shelters</h4>
                  <div className="text-2xl font-bold text-green-600" id="shelter-count">
                    {hmisStats.shelterCount || 'Loading...'}
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="font-medium text-purple-800 mb-2">Available Beds</h4>
                  <div className="text-2xl font-bold text-purple-600" id="available-beds">
                    {hmisStats.availableBeds || 'Loading...'}
                  </div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <h4 className="font-medium text-orange-800 mb-2">Support Services</h4>
                  <div className="text-2xl font-bold text-orange-600" id="support-services">
                    {hmisStats.supportServices || 'Loading...'}
                  </div>
                </div>
              </div>

              {/* Facilities Map */}
              <div className="bg-white border rounded-lg overflow-hidden">
                <FacilitiesMap 
                  height="600px"
                  showFilters={true}
                  onFacilitySelect={(facility: HMISFacility) => {
                    console.log('Selected facility:', facility);
                  }}
                />
              </div>

              {/* Quick Actions */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium mb-3">Quick Actions</h4>
                <div className="flex flex-wrap gap-3">
                  <button className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                    📊 Generate Capacity Report
                  </button>
                  <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                    📋 Export Facility List
                  </button>
                  <button className="px-4 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700">
                    🔄 Sync with HMIS
                  </button>
                  <button className="px-4 py-2 bg-orange-600 text-white text-sm rounded hover:bg-orange-700">
                    📍 Add New Facility
                  </button>
                </div>
              </div>

              {/* Data Source Info */}
              <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium">Data Source:</span>
                  <a 
                    href="https://hmis.opencommons.org/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    HMIS OpenCommons MediaWiki
                  </a>
                </div>
                <div>
                  Real-time facility data from the Homeless Management Information System (HMIS) 
                  OpenCommons platform, providing comprehensive information about shelters, 
                  recovery centers, health services, and community support facilities in the Portland area.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'configuration' && (
            <div className="space-y-8">
              <h3 className="text-lg font-semibold">System Configuration</h3>
              
              {/* Data Store Configuration */}
              <div className="border rounded-lg p-6">
                <h4 className="text-lg font-medium mb-4 flex items-center">
                  <span className="mr-2">🗄️</span>
                  Data Store Configuration
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Solid Pod Configuration */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium flex items-center">
                        <span className={`w-3 h-3 rounded-full mr-2 ${
                          solidConfig.status === 'connected' ? 'bg-green-500' :
                          solidConfig.status === 'error' ? 'bg-red-500' : 'bg-gray-400'
                        }`}></span>
                        Solid Pod
                      </h5>
                      <button 
                        onClick={() => setShowSolidModal(true)}
                        className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                      >
                        {solidConfig.connected ? 'Reconfigure' : 'Configure'}
                      </button>
                    </div>
                    <div className="text-sm text-gray-600 space-y-2">
                      <div>Status: <span className={`${
                        solidConfig.status === 'connected' ? 'text-green-600' :
                        solidConfig.status === 'error' ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {solidConfig.status === 'connected' ? 'Connected' :
                         solidConfig.status === 'error' ? 'Connection Error' : 'Not Connected'}
                      </span></div>
                      <div>Provider: <span className="text-gray-500">
                        {solidConfig.provider || 'None selected'}
                      </span></div>
                      {solidConfig.webId && (
                        <div>WebID: <span className="text-xs text-blue-600 break-all">{solidConfig.webId}</span></div>
                      )}
                      <div>Data Types: Personal Identity, Health Records</div>
                    </div>
                  </div>

                  {/* HAT Configuration */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium flex items-center">
                        <span className={`w-3 h-3 rounded-full mr-2 ${
                          hatConfig.status === 'connected' ? 'bg-green-500' :
                          hatConfig.status === 'error' ? 'bg-red-500' : 'bg-gray-400'
                        }`}></span>
                        HAT (Hub of All Things)
                      </h5>
                      <button 
                        onClick={() => setShowHATModal(true)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        {hatConfig.connected ? 'Reconfigure' : 'Configure'}
                      </button>
                    </div>
                    <div className="text-sm text-gray-600 space-y-2">
                      <div>Status: <span className={`${
                        hatConfig.status === 'connected' ? 'text-green-600' :
                        hatConfig.status === 'error' ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {hatConfig.status === 'connected' ? 'Connected' :
                         hatConfig.status === 'error' ? 'Connection Error' : 'Not Connected'}
                      </span></div>
                      <div>Domain: <span className="text-gray-500">
                        {hatConfig.domain || 'Not configured'}
                      </span></div>
                      <div>Data Types: All unified data types</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Apple Health Configuration */}
              <div className="border rounded-lg p-6">
                <h4 className="text-lg font-medium mb-4 flex items-center">
                  <span className="mr-2">🏥</span>
                  Apple Health Integration
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center">
                      <span className={`w-3 h-3 rounded-full mr-3 ${
                        healthConfig.authorized ? 'bg-green-500' : 'bg-red-500'
                      }`}></span>
                      <div>
                        <div className="font-medium">Apple HealthKit</div>
                        <div className="text-sm text-gray-600">Access to health and fitness data</div>
                        {healthConfig.lastSync && (
                          <div className="text-xs text-gray-500">Last sync: {healthConfig.lastSync.toLocaleString()}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`text-sm ${healthConfig.authorized ? 'text-green-600' : 'text-gray-500'}`}>
                        Status: {healthConfig.authorized ? 'Authorized' : 'Not Authorized'}
                      </span>
                      <button 
                        onClick={handleHealthKitRequest}
                        className={`px-3 py-1 text-white text-sm rounded ${
                          healthConfig.authorized 
                            ? 'bg-green-600 hover:bg-green-700' 
                            : 'bg-red-600 hover:bg-red-700'
                        }`}
                      >
                        {healthConfig.authorized ? 'Reconfigure' : 'Request Access'}
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    {[
                      { key: 'vitals', label: 'Vitals', icon: '❤️' },
                      { key: 'fitness', label: 'Fitness', icon: '🏃' },
                      { key: 'nutrition', label: 'Nutrition', icon: '🍎' },
                      { key: 'sleep', label: 'Sleep', icon: '😴' },
                      { key: 'mental_health', label: 'Mental Health', icon: '🧠' },
                      { key: 'medical_records', label: 'Medical Records', icon: '📋' }
                    ].map(category => (
                      <div key={category.key} className="flex items-center space-x-2 p-2 border rounded">
                        <input 
                          type="checkbox" 
                          className="rounded" 
                          checked={healthConfig.categories[category.key as keyof typeof healthConfig.categories]}
                          disabled={!healthConfig.authorized}
                          onChange={() => toggleHealthCategory(category.key)}
                        />
                        <span className="mr-2">{category.icon}</span>
                        <span className={healthConfig.authorized ? 'text-gray-900' : 'text-gray-500'}>
                          {category.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  {healthConfig.authorized && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="text-sm text-green-800 font-medium mb-2">Mock Health Data Available:</div>
                      <div className="text-xs text-green-700 space-y-1">
                        <div>• Heart Rate: 72 BPM (last reading)</div>
                        <div>• Steps: 8,247 today</div>
                        <div>• Sleep: 7.5 hours last night</div>
                        <div>• Weight: 165 lbs (last recorded)</div>
                        <div>• Blood Pressure: 120/80 mmHg</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Individual Registrations */}
              <div className="border rounded-lg p-6">
                <h4 className="text-lg font-medium mb-4 flex items-center">
                  <span className="mr-2">👥</span>
                  Individual Registrations
                </h4>
                <div className="space-y-4">
                  {/* Client Registration */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium flex items-center">
                        <span className="mr-2">👤</span>
                        Client Registration
                      </h5>
                      <button 
                        onClick={() => handleOpenRegistration('client')}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                      >
                        Register New Client
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500">Total Registered</div>
                        <div className="font-medium text-lg">{registeredPersons.clients.length}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">This Month</div>
                        <div className="font-medium text-lg text-green-600">+{dashboardData?.clientMetrics.newClientsThisMonth}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Data Stores Active</div>
                        <div className="font-medium text-lg">0</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Health Connected</div>
                        <div className="font-medium text-lg">0</div>
                      </div>
                    </div>
                  </div>

                  {/* Staff Registration */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium flex items-center">
                        <span className="mr-2">👨‍💼</span>
                        Staff Registration
                      </h5>
                      <button 
                        onClick={() => handleOpenRegistration('staff')}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        Register New Staff
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500">Total Staff</div>
                        <div className="font-medium text-lg">{registeredPersons.staff.length}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Active Today</div>
                        <div className="font-medium text-lg text-green-600">{dashboardData?.staffMetrics.activeStaff}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Training Complete</div>
                        <div className="font-medium text-lg">{dashboardData?.staffMetrics.trainingCompletionRate}%</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Cert Expiring</div>
                        <div className="font-medium text-lg text-yellow-600">{dashboardData?.staffMetrics.certificationExpirations.length}</div>
                      </div>
                    </div>
                  </div>

                  {/* Manager Registration */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium flex items-center">
                        <span className="mr-2">👨‍💻</span>
                        Manager Registration
                      </h5>
                      <button 
                        onClick={() => handleOpenRegistration('manager')}
                        className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                      >
                        Register New Manager
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500">Total Managers</div>
                        <div className="font-medium text-lg">{registeredPersons.managers.length}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Active Sessions</div>
                        <div className="font-medium text-lg text-green-600">3</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Admin Access</div>
                        <div className="font-medium text-lg">5</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Data Access</div>
                        <div className="font-medium text-lg">8</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="border rounded-lg p-6">
                <h4 className="text-lg font-medium mb-4 flex items-center">
                  <span className="mr-2">⚡</span>
                  Quick Configuration Actions
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
                    <div className="font-medium text-purple-600">🔗 Setup Solid Pod</div>
                    <div className="text-sm text-gray-600 mt-1">Connect to decentralized data storage</div>
                  </button>
                  <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
                    <div className="font-medium text-blue-600">🎩 Configure HAT</div>
                    <div className="text-sm text-gray-600 mt-1">Setup Hub of All Things integration</div>
                  </button>
                  <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
                    <div className="font-medium text-red-600">🏥 Enable Apple Health</div>
                    <div className="text-sm text-gray-600 mt-1">Request HealthKit permissions</div>
                  </button>
                  <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
                    <div className="font-medium text-green-600">👤 Bulk Client Import</div>
                    <div className="text-sm text-gray-600 mt-1">Import multiple client records</div>
                  </button>
                  <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
                    <div className="font-medium text-orange-600">🔐 Privacy Settings</div>
                    <div className="text-sm text-gray-600 mt-1">Configure data privacy controls</div>
                  </button>
                  <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
                    <div className="font-medium text-indigo-600">📋 Data Export</div>
                    <div className="text-sm text-gray-600 mt-1">Export system configuration</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'shelters' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center">
                  <span className="mr-2">🏠</span>
                  Shelter Services Management
                </h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShelterViewMode('list')}
                      className={`px-3 py-1 rounded ${
                        shelterViewMode === 'list'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      📋 List View
                    </button>
                    <button
                      onClick={() => setShelterViewMode('map')}
                      className={`px-3 py-1 rounded ${
                        shelterViewMode === 'map'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      🗺️ Map View
                    </button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={spatialNavigationEnabled}
                        onChange={(e) => setSpatialNavigationEnabled(e.target.checked)}
                        className="mr-2"
                      />
                      Spatial Navigation
                    </label>
                  </div>
                </div>
              </div>

              {/* Shelter Content */}
              {shelterViewMode === 'list' ? (
                <ShelterList
                  userRole="manager"
                  showFilters={true}
                  allowSelection={true}
                  onShelterSelect={setSelectedShelter}
                  maxHeight="700px"
                  enableExport={true}
                />
              ) : (
                <div className="space-y-4">
                  <OpenMapsComponent
                    shelters={shelters}
                    onShelterSelect={setSelectedShelter}
                    showUtilizationPopups={true}
                    userRole="manager"
                    enableSpatialNavigation={spatialNavigationEnabled}
                    height="600px"
                    center={{ lat: 45.515, lng: -122.65 }}
                    zoom={12}
                  />
                  
                  {selectedShelter && (
                    <div className="bg-white border rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Selected Shelter Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="font-medium">{selectedShelter.name}</div>
                          <div className="text-gray-600">{selectedShelter.address.street}</div>
                          <div className="text-gray-600">{selectedShelter.address.city}, {selectedShelter.address.state}</div>
                        </div>
                        <div>
                          <div className="font-medium">Capacity & Utilization</div>
                          <div className="text-gray-600">Total: {selectedShelter.capacity.total}</div>
                          <div className="text-gray-600">
                            Occupied: {selectedShelter.currentUtilization.occupied} 
                            ({Math.round(selectedShelter.currentUtilization.utilizationRate * 100)}%)
                          </div>
                          <div className="text-gray-600">Available: {selectedShelter.currentUtilization.available}</div>
                        </div>
                        <div>
                          <div className="font-medium">Services & Demographics</div>
                          <div className="text-gray-600">Type: {selectedShelter.type}</div>
                          <div className="text-gray-600">
                            Serves: {selectedShelter.demographics.acceptedPopulations.join(', ')}
                          </div>
                          <div className="text-gray-600">
                            Services: {selectedShelter.services.slice(0, 2).join(', ')}
                            {selectedShelter.services.length > 2 && ` +${selectedShelter.services.length - 2} more`}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Shelter Management Actions */}
              <div className="bg-gray-50 border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Shelter Management Actions</h4>
                  <div className="text-sm text-gray-600">
                    Manager Access • Spatial Navigation: {spatialNavigationEnabled ? 'Enabled' : 'Disabled'}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <button className="p-3 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
                    📊 View Utilization Analytics
                  </button>
                  <button className="p-3 bg-green-600 text-white rounded hover:bg-green-700 text-sm">
                    🗺️ Export Facility Data
                  </button>
                  <button className="p-3 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm">
                    📱 Generate QR Codes
                  </button>
                  <button className="p-3 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm">
                    ⚠️ Manage Alerts
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Solid Pod Configuration Modal */}
      {showSolidModal && <SolidConfigModal onClose={() => setShowSolidModal(false)} onConnect={handleSolidConnect} />}

      {/* HAT Configuration Modal */}
      {showHATModal && <HATConfigModal onClose={() => setShowHATModal(false)} onConnect={handleHATConnect} />}

      {/* Person Registration Modal */}
      <PersonRegistrationModal 
        isOpen={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
        personType={registrationType}
        onSuccess={handleRegistrationSuccess}
      />
    </div>
  );
};

// Solid Pod Configuration Modal Component
const SolidConfigModal: React.FC<{
  onClose: () => void;
  onConnect: (provider: string, webId: string) => void;
}> = ({ onClose, onConnect }) => {
  const [selectedProvider, setSelectedProvider] = useState('');
  const [webId, setWebId] = useState('');
  const [customServer, setCustomServer] = useState('');
  const [loading, setLoading] = useState(false);

  const solidProviders = [
    { id: 'inrupt', name: 'Inrupt Pod Spaces', url: 'https://login.inrupt.com' },
    { id: 'solidcommunity', name: 'Solid Community', url: 'https://solidcommunity.net' },
    { id: 'solidweb', name: 'SolidWeb.org', url: 'https://solidweb.org' },
    { id: 'custom', name: 'Custom Server', url: '' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider || (!webId && selectedProvider !== 'custom')) return;

    setLoading(true);
    try {
      const provider = selectedProvider === 'custom' ? customServer : 
                      solidProviders.find(p => p.id === selectedProvider)?.name || selectedProvider;
      const finalWebId = selectedProvider === 'custom' ? `${customServer}/profile/card#me` : webId;
      
      await onConnect(provider, finalWebId);
    } catch (error) {
      console.error('Connection failed:', error);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Configure Solid Pod</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <span className="text-xl">×</span>
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Connect to your Solid Pod to store personal data with full ownership control.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Choose your Solid Pod Provider
            </label>
            <div className="space-y-2">
              {solidProviders.map(provider => (
                <label key={provider.id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="provider"
                    value={provider.id}
                    checked={selectedProvider === provider.id}
                    onChange={(e) => setSelectedProvider(e.target.value)}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{provider.name}</div>
                    {provider.url && (
                      <div className="text-xs text-gray-500">{provider.url}</div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {selectedProvider === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Server URL
              </label>
              <input
                type="url"
                value={customServer}
                onChange={(e) => setCustomServer(e.target.value)}
                placeholder="https://your-pod-server.com"
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
          )}

          {selectedProvider && selectedProvider !== 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your WebID
              </label>
              <input
                type="url"
                value={webId}
                onChange={(e) => setWebId(e.target.value)}
                placeholder="https://your-username.solidcommunity.net/profile/card#me"
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Your WebID is your unique identifier in the Solid ecosystem
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedProvider || loading || (selectedProvider !== 'custom' && !webId) || (selectedProvider === 'custom' && !customServer)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading && <span className="animate-spin mr-2">⟳</span>}
              Connect to Solid Pod
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// HAT Configuration Modal Component
const HATConfigModal: React.FC<{
  onClose: () => void;
  onConnect: (domain: string) => void;
}> = ({ onClose, onConnect }) => {
  const [hatDomain, setHatDomain] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hatDomain) return;

    setLoading(true);
    try {
      // Add .hubofallthings.net if not included
      const domain = hatDomain.includes('.') ? hatDomain : `${hatDomain}.hubofallthings.net`;
      await onConnect(domain);
    } catch (error) {
      console.error('HAT connection failed:', error);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Configure HAT</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <span className="text-xl">×</span>
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Connect to your Hub of All Things (HAT) personal data vault for advanced data analytics and sharing.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              HAT Domain
            </label>
            <div className="relative">
              <input
                type="text"
                value={hatDomain}
                onChange={(e) => setHatDomain(e.target.value.toLowerCase())}
                placeholder="your-hat-name"
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-32"
                required
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-gray-500">
                .hubofallthings.net
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Enter your HAT name. The full domain will be: {hatDomain || 'your-hat-name'}.hubofallthings.net
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-sm text-blue-800 font-medium mb-1">What is a HAT?</div>
            <div className="text-xs text-blue-700 space-y-1">
              <div>• Personal data vault that you fully control</div>
              <div>• Connects to multiple services and applications</div>
              <div>• Enables data portability and privacy</div>
              <div>• Provides analytics and insights on your data</div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="text-xs text-yellow-800">
              <strong>Note:</strong> You need to have an existing HAT account. 
              Visit <a href="https://www.dataswift.io/" className="underline" target="_blank" rel="noopener noreferrer">dataswift.io</a> to create one.
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!hatDomain || loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading && <span className="animate-spin mr-2">⟳</span>}
              Connect to HAT
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServicesManager;
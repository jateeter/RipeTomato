/**
 * Organization Management Dashboard
 * 
 * Comprehensive dashboard for organization administrators to monitor
 * all community services, staff, resources, clients, and financial metrics.
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
  COMMUNITY_SERVICE_TYPES
} from '../types/CommunityServices';
import { CommunityConfiguration } from '../types/CommunityServices';

interface OrganizationDashboardProps {
  organizationId: string;
  userRole: 'admin' | 'manager' | 'supervisor';
}

export const OrganizationDashboard: React.FC<OrganizationDashboardProps> = ({
  organizationId,
  userRole
}) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'staff' | 'clients' | 'resources' | 'financial' | 'alerts'>('overview');
  const [selectedService, setSelectedService] = useState<CommunityServiceType>('shelter');
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'quarter'>('today');

  useEffect(() => {
    loadDashboardData();
    
    // Set up auto-refresh every 30 seconds for real-time updates
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, [organizationId, timeRange]);

  const loadDashboardData = async () => {
    try {
      // In a real implementation, this would fetch from an API
      const mockDashboardData = createMockDashboardData();
      setDashboardData(mockDashboardData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createMockDashboardData = (): DashboardData => {
    const mockConfig: CommunityConfiguration = {
      communityName: 'Idaho Community Services Hub',
      locations: [
        {
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
          accessibility: [
            { feature: 'wheelchair_accessible', available: true }
          ],
          contactInfo: {
            phone: '(208) 555-0123',
            email: 'info@idahocommunityservices.org',
            languages: ['English', 'Spanish']
          }
        }
      ],
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

    const serviceMetrics: ServiceMetrics[] = [
      {
        serviceType: 'shelter',
        totalRequests: 45,
        completedRequests: 42,
        pendingRequests: 3,
        averageWaitTime: 15,
        averageServiceTime: 45,
        clientSatisfactionRating: 4.3,
        capacityUtilization: 78,
        trends: [
          { date: '2024-01-08', value: 35, metric: 'requests' },
          { date: '2024-01-09', value: 45, metric: 'requests' }
        ]
      },
      {
        serviceType: 'food_water',
        totalRequests: 128,
        completedRequests: 125,
        pendingRequests: 3,
        averageWaitTime: 8,
        averageServiceTime: 12,
        clientSatisfactionRating: 4.6,
        capacityUtilization: 65,
        trends: [
          { date: '2024-01-08', value: 110, metric: 'requests' },
          { date: '2024-01-09', value: 128, metric: 'requests' }
        ]
      },
      {
        serviceType: 'sanitation',
        totalRequests: 67,
        completedRequests: 64,
        pendingRequests: 3,
        averageWaitTime: 12,
        averageServiceTime: 25,
        clientSatisfactionRating: 4.4,
        capacityUtilization: 82,
        trends: [
          { date: '2024-01-08', value: 58, metric: 'requests' },
          { date: '2024-01-09', value: 67, metric: 'requests' }
        ]
      },
      {
        serviceType: 'transportation',
        totalRequests: 34,
        completedRequests: 32,
        pendingRequests: 2,
        averageWaitTime: 22,
        averageServiceTime: 35,
        clientSatisfactionRating: 4.1,
        capacityUtilization: 45,
        trends: [
          { date: '2024-01-08', value: 28, metric: 'requests' },
          { date: '2024-01-09', value: 34, metric: 'requests' }
        ]
      }
    ];

    const staffMetrics: StaffMetrics = {
      totalStaff: 28,
      activeStaff: 24,
      staffUtilization: 85,
      averageServiceTime: 28,
      trainingCompletionRate: 92,
      staffSatisfactionRating: 4.2,
      certificationExpirations: [
        {
          staffId: '1',
          staffName: 'John Smith',
          certificationType: 'First Aid',
          expirationDate: new Date('2024-02-15'),
          daysUntilExpiration: 36
        }
      ]
    };

    const resourceMetrics: ResourceMetrics = {
      totalResources: 847,
      lowStockItems: 12,
      expiredItems: 3,
      totalInventoryValue: 45280,
      monthlyConsumption: [
        { resourceType: 'Food Items', quantityUsed: 2450, cost: 8900, month: '2024-01' }
      ],
      wasteMetrics: {
        foodWaste: 8.2,
        supplyWaste: 3.1,
        costOfWaste: 1240,
        wasteReductionGoals: []
      }
    };

    const clientMetrics: ClientMetrics = {
      totalActiveClients: 186,
      newClientsThisMonth: 23,
      returningClients: 142,
      averageServicesPerClient: 2.4,
      clientRetentionRate: 76.3,
      demographicBreakdown: {
        ageGroups: [
          { group: '18-25', count: 34 },
          { group: '26-35', count: 52 },
          { group: '36-45', count: 48 },
          { group: '46-55', count: 31 },
          { group: '56+', count: 21 }
        ],
        genderDistribution: [
          { gender: 'Male', count: 98 },
          { gender: 'Female', count: 76 },
          { gender: 'Non-binary', count: 8 },
          { gender: 'Prefer not to say', count: 4 }
        ],
        ethnicityDistribution: [
          { ethnicity: 'White', count: 112 },
          { ethnicity: 'Hispanic/Latino', count: 34 },
          { ethnicity: 'Black/African American', count: 21 },
          { ethnicity: 'Native American', count: 12 },
          { ethnicity: 'Asian', count: 5 },
          { ethnicity: 'Other', count: 2 }
        ],
        languagePreferences: [
          { language: 'English', count: 152 },
          { language: 'Spanish', count: 28 },
          { language: 'Other', count: 6 }
        ],
        specialNeeds: [
          { need: 'Mobility assistance', count: 18 },
          { need: 'Mental health support', count: 34 },
          { need: 'Substance abuse support', count: 22 }
        ]
      },
      serviceUtilization: serviceMetrics.map(sm => ({
        serviceType: sm.serviceType,
        uniqueClients: Math.floor(sm.totalRequests * 0.7),
        totalSessions: sm.totalRequests,
        averageSessionsPerClient: parseFloat((sm.totalRequests / Math.floor(sm.totalRequests * 0.7)).toFixed(1)),
        peakUsageTimes: [
          { timeSlot: '08:00-10:00', dayOfWeek: 'Monday', averageOccupancy: 85 },
          { timeSlot: '17:00-19:00', dayOfWeek: 'Friday', averageOccupancy: 92 }
        ]
      }))
    };

    const financialMetrics: FinancialMetrics = {
      totalBudget: 2850000,
      budgetUtilization: 67.4,
      costPerClient: 789,
      costPerService: serviceMetrics.map(sm => ({
        serviceType: sm.serviceType,
        totalCost: sm.totalRequests * 25,
        costPerClient: 25,
        majorExpenses: [
          { category: 'Staff', amount: sm.totalRequests * 15, percentage: 60 },
          { category: 'Supplies', amount: sm.totalRequests * 8, percentage: 32 },
          { category: 'Utilities', amount: sm.totalRequests * 2, percentage: 8 }
        ]
      })),
      fundingSources: [
        { sourceId: '1', sourceName: 'Federal Grants', sourceType: 'government', amount: 1850000, percentage: 64.9, renewalDate: new Date('2024-09-30') },
        { sourceId: '2', sourceName: 'State Funding', sourceType: 'government', amount: 650000, percentage: 22.8, renewalDate: new Date('2024-06-30') },
        { sourceId: '3', sourceName: 'Private Donations', sourceType: 'donation', amount: 350000, percentage: 12.3 }
      ],
      grants: [],
      donations: {
        totalDonations: 350000,
        averageDonation: 127,
        donorCount: 2756,
        recurringDonors: 458,
        inKindDonations: []
      }
    };

    const alerts: OrganizationAlert[] = [
      {
        alertId: '1',
        alertType: 'resource_shortage',
        severity: 'medium',
        title: 'Low Inventory Alert',
        description: 'Hygiene supplies running low - 12 items below restock threshold',
        affectedServices: ['sanitation'],
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        followUpRequired: true
      },
      {
        alertId: '2',
        alertType: 'certification_expiring',
        severity: 'low',
        title: 'Staff Certification Expiring',
        description: 'John Smith\'s First Aid certification expires in 36 days',
        affectedServices: ['shelter', 'food_water'],
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        followUpRequired: true
      }
    ];

    return {
      organizationId,
      communityConfig: mockConfig,
      serviceMetrics,
      staffMetrics,
      resourceMetrics,
      clientMetrics,
      financialMetrics,
      alerts,
      reports: []
    };
  };

  const getServiceIcon = (serviceType: CommunityServiceType): string => {
    switch (serviceType) {
      case 'shelter': return '🏠';
      case 'food_water': return '🍽️';
      case 'sanitation': return '🚿';
      case 'transportation': return '🚌';
      default: return '🏢';
    }
  };

  const getAlertColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return 'bg-red-100 border-red-500 text-red-800';
      case 'high': return 'bg-orange-100 border-orange-500 text-orange-800';
      case 'medium': return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      case 'low': return 'bg-blue-100 border-blue-500 text-blue-800';
      default: return 'bg-gray-100 border-gray-500 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Failed to load dashboard data</p>
          <button
            onClick={loadDashboardData}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {dashboardData.communityConfig.communityName}
                </h1>
                <p className="text-gray-600">Organization Management Dashboard</p>
              </div>
              <div className="flex items-center space-x-4">
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as any)}
                  className="border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                </select>
                <div className="flex items-center text-sm text-gray-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  Live updates
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="text-3xl text-blue-500 mr-4">👥</div>
              <div>
                <div className="text-2xl font-bold text-gray-800">
                  {dashboardData.clientMetrics.totalActiveClients}
                </div>
                <div className="text-sm text-gray-500">Active Clients</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="text-3xl text-green-500 mr-4">🏢</div>
              <div>
                <div className="text-2xl font-bold text-gray-800">
                  {dashboardData.serviceMetrics.reduce((sum, sm) => sum + sm.completedRequests, 0)}
                </div>
                <div className="text-sm text-gray-500">Services Completed</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="text-3xl text-purple-500 mr-4">👨‍💼</div>
              <div>
                <div className="text-2xl font-bold text-gray-800">
                  {dashboardData.staffMetrics.activeStaff}/{dashboardData.staffMetrics.totalStaff}
                </div>
                <div className="text-sm text-gray-500">Active Staff</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="text-3xl text-orange-500 mr-4">💰</div>
              <div>
                <div className="text-2xl font-bold text-gray-800">
                  {dashboardData.financialMetrics.budgetUtilization.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-500">Budget Used</div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'services', label: 'Services', icon: '🏢' },
              { id: 'staff', label: 'Staff', icon: '👨‍💼' },
              { id: 'clients', label: 'Clients', icon: '👥' },
              { id: 'resources', label: 'Resources', icon: '📦' },
              { id: 'financial', label: 'Financial', icon: '💰' },
              { id: 'alerts', label: 'Alerts', icon: '🚨', count: dashboardData.alerts.filter(a => !a.acknowledgedAt).length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.count && tab.count > 0 && (
                  <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="min-h-96">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Service Performance */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4">Service Performance</h3>
                  <div className="space-y-4">
                    {dashboardData.serviceMetrics.map((service) => (
                      <div key={service.serviceType} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{getServiceIcon(service.serviceType)}</span>
                          <div>
                            <div className="font-medium capitalize">
                              {service.serviceType.replace('_', ' & ')} Services
                            </div>
                            <div className="text-sm text-gray-500">
                              {service.completedRequests}/{service.totalRequests} completed
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold">
                            {((service.completedRequests / service.totalRequests) * 100).toFixed(1)}%
                          </div>
                          <div className="text-xs text-gray-500">
                            {service.capacityUtilization}% capacity
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Alerts */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4">Recent Alerts</h3>
                  <div className="space-y-3">
                    {dashboardData.alerts.slice(0, 5).map((alert) => (
                      <div key={alert.alertId} className={`p-3 rounded border-l-4 ${getAlertColor(alert.severity)}`}>
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{alert.title}</div>
                          <div className="text-xs">
                            {new Date(alert.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-sm mt-1">{alert.description}</div>
                        <div className="text-xs mt-2">
                          Affects: {alert.affectedServices.map(s => s.replace('_', ' & ')).join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Services Tab */}
          {activeTab === 'services' && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4 mb-6">
                <label className="text-sm font-medium text-gray-700">Service Type:</label>
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value as CommunityServiceType)}
                  className="border border-gray-300 rounded-md px-3 py-2"
                >
                  {Object.values(COMMUNITY_SERVICE_TYPES).map((service) => (
                    <option key={service} value={service}>
                      {getServiceIcon(service)} {service.replace('_', ' & ').toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {(() => {
                const service = dashboardData.serviceMetrics.find(s => s.serviceType === selectedService);
                if (!service) return <div>Service data not available</div>;

                return (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow">
                      <h4 className="font-semibold mb-4">Request Summary</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Total Requests:</span>
                          <span className="font-medium">{service.totalRequests}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Completed:</span>
                          <span className="font-medium text-green-600">{service.completedRequests}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Pending:</span>
                          <span className="font-medium text-yellow-600">{service.pendingRequests}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Success Rate:</span>
                          <span className="font-medium">
                            {((service.completedRequests / service.totalRequests) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow">
                      <h4 className="font-semibold mb-4">Performance Metrics</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Avg Wait Time:</span>
                          <span className="font-medium">{service.averageWaitTime} min</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Avg Service Time:</span>
                          <span className="font-medium">{service.averageServiceTime} min</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Capacity Utilization:</span>
                          <span className="font-medium">{service.capacityUtilization}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Client Satisfaction:</span>
                          <span className="font-medium">⭐ {service.clientSatisfactionRating}/5.0</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow">
                      <h4 className="font-semibold mb-4">Trends</h4>
                      <div className="space-y-3">
                        {service.trends.map((trend, index) => (
                          <div key={index} className="flex justify-between">
                            <span>{trend.date}:</span>
                            <span className="font-medium">{trend.value} {trend.metric}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Staff Tab */}
          {activeTab === 'staff' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h4 className="font-semibold mb-4">Staff Overview</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Total Staff:</span>
                      <span className="font-medium">{dashboardData.staffMetrics.totalStaff}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Today:</span>
                      <span className="font-medium text-green-600">{dashboardData.staffMetrics.activeStaff}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Utilization:</span>
                      <span className="font-medium">{dashboardData.staffMetrics.staffUtilization}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Satisfaction:</span>
                      <span className="font-medium">⭐ {dashboardData.staffMetrics.staffSatisfactionRating}/5.0</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h4 className="font-semibold mb-4">Training & Certifications</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Training Completion:</span>
                      <span className="font-medium">{dashboardData.staffMetrics.trainingCompletionRate}%</span>
                    </div>
                    <div className="mt-4">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Expiring Certifications:</h5>
                      {dashboardData.staffMetrics.certificationExpirations.map((cert) => (
                        <div key={cert.staffId} className="text-sm bg-yellow-50 p-2 rounded">
                          <div className="font-medium">{cert.staffName}</div>
                          <div className="text-gray-600">{cert.certificationType} - {cert.daysUntilExpiration} days</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h4 className="font-semibold mb-4">Performance</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Avg Service Time:</span>
                      <span className="font-medium">{dashboardData.staffMetrics.averageServiceTime} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Efficiency Rating:</span>
                      <span className="font-medium text-green-600">Good</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Clients Tab */}
          {activeTab === 'clients' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h4 className="font-semibold mb-4">Client Overview</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Active Clients:</span>
                      <span className="font-medium">{dashboardData.clientMetrics.totalActiveClients}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>New This Month:</span>
                      <span className="font-medium text-blue-600">{dashboardData.clientMetrics.newClientsThisMonth}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Returning Clients:</span>
                      <span className="font-medium text-green-600">{dashboardData.clientMetrics.returningClients}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Retention Rate:</span>
                      <span className="font-medium">{dashboardData.clientMetrics.clientRetentionRate}%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h4 className="font-semibold mb-4">Age Distribution</h4>
                  <div className="space-y-2">
                    {dashboardData.clientMetrics.demographicBreakdown.ageGroups.map((group) => (
                      <div key={group.group} className="flex justify-between text-sm">
                        <span>{group.group}:</span>
                        <span className="font-medium">{group.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h4 className="font-semibold mb-4">Gender Distribution</h4>
                  <div className="space-y-2">
                    {dashboardData.clientMetrics.demographicBreakdown.genderDistribution.map((gender) => (
                      <div key={gender.gender} className="flex justify-between text-sm">
                        <span>{gender.gender}:</span>
                        <span className="font-medium">{gender.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h4 className="font-semibold mb-4">Special Needs</h4>
                  <div className="space-y-2">
                    {dashboardData.clientMetrics.demographicBreakdown.specialNeeds.map((need) => (
                      <div key={need.need} className="flex justify-between text-sm">
                        <span>{need.need}:</span>
                        <span className="font-medium">{need.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Resources Tab */}
          {activeTab === 'resources' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h4 className="font-semibold mb-4">Inventory Overview</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Total Resources:</span>
                      <span className="font-medium">{dashboardData.resourceMetrics.totalResources}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Low Stock Items:</span>
                      <span className="font-medium text-yellow-600">{dashboardData.resourceMetrics.lowStockItems}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Expired Items:</span>
                      <span className="font-medium text-red-600">{dashboardData.resourceMetrics.expiredItems}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Value:</span>
                      <span className="font-medium">${dashboardData.resourceMetrics.totalInventoryValue.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h4 className="font-semibold mb-4">Waste Metrics</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Food Waste:</span>
                      <span className="font-medium">{dashboardData.resourceMetrics.wasteMetrics.foodWaste}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Supply Waste:</span>
                      <span className="font-medium">{dashboardData.resourceMetrics.wasteMetrics.supplyWaste}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cost of Waste:</span>
                      <span className="font-medium text-red-600">${dashboardData.resourceMetrics.wasteMetrics.costOfWaste}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow col-span-2">
                  <h4 className="font-semibold mb-4">Monthly Consumption</h4>
                  <div className="space-y-2">
                    {dashboardData.resourceMetrics.monthlyConsumption.map((consumption) => (
                      <div key={consumption.resourceType} className="flex justify-between">
                        <span>{consumption.resourceType}:</span>
                        <div className="text-right">
                          <div className="font-medium">{consumption.quantityUsed} units</div>
                          <div className="text-sm text-gray-500">${consumption.cost}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Financial Tab */}
          {activeTab === 'financial' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h4 className="font-semibold mb-4">Budget Overview</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Total Budget:</span>
                      <span className="font-medium">${dashboardData.financialMetrics.totalBudget.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Budget Used:</span>
                      <span className="font-medium">{dashboardData.financialMetrics.budgetUtilization}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cost per Client:</span>
                      <span className="font-medium">${dashboardData.financialMetrics.costPerClient}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h4 className="font-semibold mb-4">Funding Sources</h4>
                  <div className="space-y-2">
                    {dashboardData.financialMetrics.fundingSources.map((source) => (
                      <div key={source.sourceId} className="flex justify-between text-sm">
                        <span>{source.sourceName}:</span>
                        <div className="text-right">
                          <div className="font-medium">${source.amount.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">{source.percentage}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h4 className="font-semibold mb-4">Donations</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Total Donations:</span>
                      <span className="font-medium">${dashboardData.financialMetrics.donations.totalDonations.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Donation:</span>
                      <span className="font-medium">${dashboardData.financialMetrics.donations.averageDonation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Donors:</span>
                      <span className="font-medium">{dashboardData.financialMetrics.donations.donorCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Recurring Donors:</span>
                      <span className="font-medium text-green-600">{dashboardData.financialMetrics.donations.recurringDonors}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Alerts Tab */}
          {activeTab === 'alerts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">System Alerts</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
                    {dashboardData.alerts.filter(a => !a.acknowledgedAt).length} unacknowledged
                  </span>
                </div>
              </div>
              
              <div className="space-y-4">
                {dashboardData.alerts.map((alert) => (
                  <div key={alert.alertId} className={`p-4 rounded-lg border-l-4 ${getAlertColor(alert.severity)}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="font-semibold">{alert.title}</div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                          alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                          alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {alert.severity.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(alert.createdAt).toLocaleDateString()} {new Date(alert.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                    
                    <p className="text-gray-700 mt-2">{alert.description}</p>
                    
                    <div className="flex items-center justify-between mt-3">
                      <div className="text-sm text-gray-500">
                        Affects: {alert.affectedServices.map(s => s.replace('_', ' & ')).join(', ')}
                      </div>
                      
                      <div className="flex space-x-2">
                        {!alert.acknowledgedAt && (
                          <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                            Acknowledge
                          </button>
                        )}
                        {alert.followUpRequired && (
                          <button className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">
                            Take Action
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
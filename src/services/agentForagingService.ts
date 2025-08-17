/**
 * Agent Foraging Service
 * 
 * Simulates and manages agent-based foraging of operational service environments
 * for real-time metrics collection on Shelters, Food, Hygiene, and Transportation services.
 */

import {
  ServiceType,
  AgentForagingData,
  ServiceLocation,
  ForagingAgent,
  ForagingMission,
  ServiceDashboardData,
  ServiceMetric,
  ServiceAlert
} from '../types/ServiceMetrics';

class AgentForagingService {
  private agents: ForagingAgent[] = [];
  private locations: ServiceLocation[] = [];
  private missions: ForagingMission[] = [];
  private foragingData: Map<string, AgentForagingData[]> = new Map();
  private isForaging: boolean = false;

  constructor() {
    this.initializeAgents();
    this.initializeLocations();
    this.startPeriodicForaging();
  }

  /**
   * Initialize foraging agents
   */
  private initializeAgents(): void {
    this.agents = [
      {
        id: 'agent-001',
        name: 'Mobile Survey Agent',
        type: 'automated',
        specialties: ['shelter', 'food', 'hygiene'],
        reliability: 0.85,
        lastActive: new Date(),
        foragingCount: 0,
        accuracy: 0.78
      },
      {
        id: 'agent-002',
        name: 'Community Outreach Bot',
        type: 'automated',
        specialties: ['food', 'transportation'],
        reliability: 0.92,
        lastActive: new Date(),
        foragingCount: 0,
        accuracy: 0.84
      },
      {
        id: 'agent-003',
        name: 'Field Volunteer Network',
        type: 'human',
        specialties: ['shelter', 'hygiene', 'transportation'],
        reliability: 0.76,
        lastActive: new Date(),
        foragingCount: 0,
        accuracy: 0.91
      },
      {
        id: 'agent-004',
        name: 'Crowdsource Mapper',
        type: 'crowdsource',
        specialties: ['food', 'transportation'],
        reliability: 0.68,
        lastActive: new Date(),
        foragingCount: 0,
        accuracy: 0.72
      }
    ];
  }

  /**
   * Initialize service locations
   */
  private initializeLocations(): void {
    this.locations = [
      // Shelter locations
      {
        id: 'shelter-001',
        name: 'Downtown Emergency Shelter',
        serviceType: 'shelter',
        address: {
          street: '125 SW 2nd Ave',
          city: 'Portland',
          state: 'OR',
          zipCode: '97204',
          coordinates: { lat: 45.5152, lng: -122.6764 }
        },
        operatingHours: {
          'monday': { open: '18:00', close: '08:00', isOpen: true },
          'tuesday': { open: '18:00', close: '08:00', isOpen: true },
          'wednesday': { open: '18:00', close: '08:00', isOpen: true },
          'thursday': { open: '18:00', close: '08:00', isOpen: true },
          'friday': { open: '18:00', close: '08:00', isOpen: true },
          'saturday': { open: '18:00', close: '08:00', isOpen: true },
          'sunday': { open: '18:00', close: '08:00', isOpen: true }
        },
        capacity: { total: 100, available: 23 },
        services: ['Emergency Housing', 'Meals', 'Case Management'],
        contact: { phone: '(503) 555-0101', website: 'https://example-shelter.org' },
        agentVerified: true
      },
      // Food locations
      {
        id: 'food-001',
        name: 'Community Food Pantry',
        serviceType: 'food',
        address: {
          street: '1515 SE McLoughlin Blvd',
          city: 'Portland',
          state: 'OR',
          zipCode: '97202',
          coordinates: { lat: 45.4981, lng: -122.6647 }
        },
        operatingHours: {
          'monday': { open: '09:00', close: '17:00', isOpen: true },
          'wednesday': { open: '09:00', close: '17:00', isOpen: true },
          'friday': { open: '09:00', close: '17:00', isOpen: true }
        },
        capacity: { total: 200, available: 45 },
        services: ['Food Boxes', 'Hot Meals', 'Nutrition Counseling'],
        contact: { phone: '(503) 555-0201' },
        agentVerified: true
      },
      // Hygiene locations
      {
        id: 'hygiene-001',
        name: 'Hygiene Center Downtown',
        serviceType: 'hygiene',
        address: {
          street: '338 NW 6th Ave',
          city: 'Portland',
          state: 'OR',
          zipCode: '97209',
          coordinates: { lat: 45.5252, lng: -122.6793 }
        },
        operatingHours: {
          'monday': { open: '08:00', close: '16:00', isOpen: true },
          'tuesday': { open: '08:00', close: '16:00', isOpen: true },
          'wednesday': { open: '08:00', close: '16:00', isOpen: true },
          'thursday': { open: '08:00', close: '16:00', isOpen: true },
          'friday': { open: '08:00', close: '16:00', isOpen: true }
        },
        capacity: { total: 50, available: 12 },
        services: ['Showers', 'Laundry', 'Restrooms', 'Hygiene Supplies'],
        contact: { phone: '(503) 555-0301' },
        agentVerified: true
      },
      // Transportation locations
      {
        id: 'transport-001',
        name: 'TriMet Transit Center',
        serviceType: 'transportation',
        address: {
          street: '701 SW 5th Ave',
          city: 'Portland',
          state: 'OR',
          zipCode: '97204',
          coordinates: { lat: 45.5189, lng: -122.6781 }
        },
        operatingHours: {
          'monday': { open: '05:00', close: '23:00', isOpen: true },
          'tuesday': { open: '05:00', close: '23:00', isOpen: true },
          'wednesday': { open: '05:00', close: '23:00', isOpen: true },
          'thursday': { open: '05:00', close: '23:00', isOpen: true },
          'friday': { open: '05:00', close: '23:00', isOpen: true },
          'saturday': { open: '06:00', close: '23:00', isOpen: true },
          'sunday': { open: '07:00', close: '22:00', isOpen: true }
        },
        capacity: { total: 1000, available: 850 },
        services: ['Bus Routes', 'MAX Light Rail', 'Real-time Updates'],
        contact: { website: 'https://trimet.org' },
        agentVerified: true
      }
    ];
  }

  /**
   * Start periodic foraging missions
   */
  private startPeriodicForaging(): void {
    // Run foraging every 5 minutes
    setInterval(() => {
      if (!this.isForaging) {
        this.executeForagingMission();
      }
    }, 5 * 60 * 1000);

    // Initial foraging
    this.executeForagingMission();
  }

  /**
   * Execute a foraging mission
   */
  private async executeForagingMission(): Promise<void> {
    this.isForaging = true;
    
    try {
      const serviceTypes: ServiceType[] = ['shelter', 'food', 'hygiene', 'transportation'];
      
      for (const serviceType of serviceTypes) {
        const locations = this.locations.filter(loc => loc.serviceType === serviceType);
        const agent = this.selectAgentForService(serviceType);
        
        if (agent && locations.length > 0) {
          const mission = this.createMission(serviceType, locations, agent);
          await this.executeMission(mission);
        }
      }
    } catch (error) {
      console.error('Foraging mission failed:', error);
    } finally {
      this.isForaging = false;
    }
  }

  /**
   * Select best agent for a service type
   */
  private selectAgentForService(serviceType: ServiceType): ForagingAgent | null {
    const suitableAgents = this.agents.filter(agent => 
      agent.specialties.includes(serviceType)
    );
    
    if (suitableAgents.length === 0) return null;
    
    // Select agent with highest reliability * accuracy score
    return suitableAgents.reduce((best, current) => 
      (current.reliability * current.accuracy) > (best.reliability * best.accuracy) 
        ? current : best
    );
  }

  /**
   * Create a foraging mission
   */
  private createMission(
    serviceType: ServiceType,
    locations: ServiceLocation[],
    agent: ForagingAgent
  ): ForagingMission {
    return {
      id: `mission-${Date.now()}-${serviceType}`,
      serviceType,
      targetLocations: locations.map(loc => loc.id),
      assignedAgent: agent.id,
      status: 'pending',
      priority: 'medium',
      scheduledTime: new Date(),
      results: []
    };
  }

  /**
   * Execute a mission and generate foraging data
   */
  private async executeMission(mission: ForagingMission): Promise<void> {
    mission.status = 'in_progress';
    
    const agent = this.agents.find(a => a.id === mission.assignedAgent);
    if (!agent) return;

    const results: AgentForagingData[] = [];

    for (const locationId of mission.targetLocations) {
      const location = this.locations.find(loc => loc.id === locationId);
      if (!location) continue;

      const foragingResult = this.simulateForaging(location, agent);
      results.push(foragingResult);
      
      // Update location data
      location.lastForaging = new Date();
      location.capacity.available = foragingResult.capacity.available;
    }

    mission.results = results;
    mission.status = 'completed';
    mission.completedTime = new Date();

    // Store results
    for (const result of results) {
      if (!this.foragingData.has(result.serviceType)) {
        this.foragingData.set(result.serviceType, []);
      }
      this.foragingData.get(result.serviceType)!.push(result);
    }

    // Update agent stats
    agent.foragingCount += results.length;
    agent.lastActive = new Date();

    console.log(`🔍 Foraging mission completed: ${mission.serviceType} - ${results.length} locations`);
  }

  /**
   * Simulate foraging data collection
   */
  private simulateForaging(location: ServiceLocation, agent: ForagingAgent): AgentForagingData {
    const baseVariability = (1 - agent.accuracy) * 0.3; // Less accurate agents have more variance
    const randomFactor = (Math.random() - 0.5) * baseVariability;

    // Simulate capacity fluctuations
    const utilizationRate = 0.6 + randomFactor;
    const available = Math.max(0, Math.floor(location.capacity.total * (1 - utilizationRate)));
    const utilized = location.capacity.total - available;

    // Simulate operational status
    const statusChance = Math.random();
    let operationalStatus: 'operational' | 'limited' | 'unavailable' | 'unknown';
    if (statusChance > 0.8) operationalStatus = 'limited';
    else if (statusChance > 0.95) operationalStatus = 'unavailable';
    else operationalStatus = 'operational';

    return {
      serviceId: location.id,
      serviceType: location.serviceType,
      timestamp: new Date(),
      location: {
        lat: location.address.coordinates?.lat || 0,
        lng: location.address.coordinates?.lng || 0,
        address: `${location.address.street}, ${location.address.city}`
      },
      operationalStatus,
      capacity: {
        total: location.capacity.total,
        available,
        utilized
      },
      qualityMetrics: {
        rating: Math.max(1, Math.min(5, 3.5 + randomFactor * 2)),
        cleanliness: Math.max(1, Math.min(5, 3.8 + randomFactor * 1.5)),
        safety: Math.max(1, Math.min(5, 4.0 + randomFactor * 1.2)),
        accessibility: Math.max(1, Math.min(5, 3.2 + randomFactor * 1.8))
      },
      agentObservations: {
        crowdLevel: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
        waitTime: Math.floor(Math.random() * 30 + randomFactor * 15),
        staffPresent: Math.random() > 0.2,
        issuesReported: Math.random() > 0.8 ? ['Maintenance needed'] : []
      },
      sourceAgent: agent.id,
      confidence: agent.reliability * (0.8 + Math.random() * 0.2)
    };
  }

  /**
   * Get dashboard data for a service type
   */
  public getServiceDashboard(serviceType: ServiceType): ServiceDashboardData {
    const serviceLocations = this.locations.filter(loc => loc.serviceType === serviceType);
    const recentForaging = this.foragingData.get(serviceType) || [];
    const latestData = recentForaging.slice(-10);

    const totalCapacity = serviceLocations.reduce((sum, loc) => sum + loc.capacity.total, 0);
    const totalAvailable = serviceLocations.reduce((sum, loc) => sum + loc.capacity.available, 0);
    const currentUtilization = totalCapacity - totalAvailable;
    const utilizationRate = totalCapacity > 0 ? currentUtilization / totalCapacity : 0;

    const operationalCount = latestData.filter(d => d.operationalStatus === 'operational').length;
    const avgQuality = latestData.length > 0 
      ? latestData.reduce((sum, d) => sum + d.qualityMetrics.rating, 0) / latestData.length 
      : 0;
    const avgWaitTime = latestData.length > 0
      ? latestData.reduce((sum, d) => sum + d.agentObservations.waitTime, 0) / latestData.length
      : 0;

    return {
      serviceType,
      totalLocations: serviceLocations.length,
      operationalLocations: operationalCount,
      totalCapacity,
      currentUtilization,
      utilizationRate,
      averageQuality: avgQuality,
      averageWaitTime: avgWaitTime,
      metrics: this.generateMetrics(serviceType, latestData),
      recentForaging: latestData,
      alerts: this.generateAlerts(serviceType, latestData),
      lastUpdated: new Date()
    };
  }

  /**
   * Generate service metrics
   */
  private generateMetrics(serviceType: ServiceType, data: AgentForagingData[]): ServiceMetric[] {
    const metrics: ServiceMetric[] = [
      {
        id: `${serviceType}-capacity`,
        name: 'Capacity Utilization',
        value: data.length > 0 ? (data.reduce((sum, d) => sum + d.capacity.utilized, 0) / data.reduce((sum, d) => sum + d.capacity.total, 0)) * 100 : 0,
        unit: '%',
        trend: Math.random() > 0.5 ? 'up' : 'down',
        changePercent: (Math.random() - 0.5) * 10,
        lastUpdated: new Date(),
        category: 'utilization'
      },
      {
        id: `${serviceType}-quality`,
        name: 'Service Quality',
        value: data.length > 0 ? data.reduce((sum, d) => sum + d.qualityMetrics.rating, 0) / data.length : 0,
        unit: '/5',
        trend: Math.random() > 0.6 ? 'up' : 'stable',
        changePercent: (Math.random() - 0.3) * 5,
        lastUpdated: new Date(),
        category: 'quality'
      },
      {
        id: `${serviceType}-availability`,
        name: 'Operational Status',
        value: data.length > 0 ? (data.filter(d => d.operationalStatus === 'operational').length / data.length) * 100 : 0,
        unit: '%',
        trend: 'stable',
        changePercent: (Math.random() - 0.5) * 3,
        lastUpdated: new Date(),
        category: 'availability'
      }
    ];

    return metrics;
  }

  /**
   * Generate service alerts
   */
  private generateAlerts(serviceType: ServiceType, data: AgentForagingData[]): ServiceAlert[] {
    const alerts: ServiceAlert[] = [];

    data.forEach(foragingData => {
      // High utilization alert
      if (foragingData.capacity.utilized / foragingData.capacity.total > 0.9) {
        alerts.push({
          id: `alert-${foragingData.serviceId}-capacity`,
          serviceType,
          locationId: foragingData.serviceId,
          severity: 'warning',
          message: 'Near capacity - limited availability',
          timestamp: foragingData.timestamp,
          resolved: false
        });
      }

      // Service unavailable alert
      if (foragingData.operationalStatus === 'unavailable') {
        alerts.push({
          id: `alert-${foragingData.serviceId}-unavailable`,
          serviceType,
          locationId: foragingData.serviceId,
          severity: 'critical',
          message: 'Service currently unavailable',
          timestamp: foragingData.timestamp,
          resolved: false
        });
      }

      // Long wait time alert
      if (foragingData.agentObservations.waitTime > 20) {
        alerts.push({
          id: `alert-${foragingData.serviceId}-wait`,
          serviceType,
          locationId: foragingData.serviceId,
          severity: 'info',
          message: `Extended wait time: ${foragingData.agentObservations.waitTime} minutes`,
          timestamp: foragingData.timestamp,
          resolved: false
        });
      }
    });

    return alerts.slice(0, 5); // Return most recent 5 alerts
  }

  /**
   * Get all agents
   */
  public getAgents(): ForagingAgent[] {
    return this.agents;
  }

  /**
   * Get all locations
   */
  public getLocations(): ServiceLocation[] {
    return this.locations;
  }

  /**
   * Get recent missions
   */
  public getRecentMissions(): ForagingMission[] {
    return this.missions.slice(-10);
  }
}

export const agentForagingService = new AgentForagingService();
export default agentForagingService;
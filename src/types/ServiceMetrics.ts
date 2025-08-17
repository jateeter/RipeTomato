/**
 * Service Metrics Types
 * 
 * Defines interfaces for service dashboard metrics and agent foraging data
 */

export interface ServiceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
  lastUpdated: Date;
  category: 'capacity' | 'utilization' | 'quality' | 'availability';
}

export interface AgentForagingData {
  serviceId: string;
  serviceType: ServiceType;
  timestamp: Date;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  operationalStatus: 'operational' | 'limited' | 'unavailable' | 'unknown';
  capacity: {
    total: number;
    available: number;
    utilized: number;
  };
  qualityMetrics: {
    rating: number; // 1-5
    cleanliness?: number; // 1-5
    safety?: number; // 1-5
    accessibility?: number; // 1-5
  };
  agentObservations: {
    crowdLevel: 'low' | 'medium' | 'high';
    waitTime: number; // minutes
    staffPresent: boolean;
    issuesReported: string[];
  };
  sourceAgent: string;
  confidence: number; // 0-1
}

export type ServiceType = 'shelter' | 'food' | 'hygiene' | 'transportation';

export interface ServiceDashboardData {
  serviceType: ServiceType;
  totalLocations: number;
  operationalLocations: number;
  totalCapacity: number;
  currentUtilization: number;
  utilizationRate: number;
  averageQuality: number;
  averageWaitTime: number;
  metrics: ServiceMetric[];
  recentForaging: AgentForagingData[];
  alerts: ServiceAlert[];
  lastUpdated: Date;
}

export interface ServiceAlert {
  id: string;
  serviceType: ServiceType;
  locationId: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: Date;
  resolved: boolean;
}

export interface ServiceLocation {
  id: string;
  name: string;
  serviceType: ServiceType;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  operatingHours: {
    [key: string]: {
      open: string;
      close: string;
      isOpen: boolean;
    };
  };
  capacity: {
    total: number;
    available: number;
  };
  services: string[];
  contact: {
    phone?: string;
    website?: string;
  };
  lastForaging?: Date;
  agentVerified: boolean;
}

export interface ForagingAgent {
  id: string;
  name: string;
  type: 'human' | 'automated' | 'crowdsource';
  specialties: ServiceType[];
  reliability: number; // 0-1
  lastActive: Date;
  foragingCount: number;
  accuracy: number; // 0-1
}

export interface ForagingMission {
  id: string;
  serviceType: ServiceType;
  targetLocations: string[];
  assignedAgent: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high';
  scheduledTime: Date;
  completedTime?: Date;
  results: AgentForagingData[];
}
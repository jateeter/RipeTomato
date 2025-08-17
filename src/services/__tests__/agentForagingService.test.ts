/**
 * Agent Foraging Service Unit Tests
 */

import { agentForagingService } from '../agentForagingService';
import { ServiceType } from '../../types/ServiceMetrics';

describe('AgentForagingService', () => {
  beforeEach(() => {
    // Reset any state if needed
    jest.clearAllMocks();
  });

  describe('getServiceDashboard', () => {
    it('should return dashboard data for shelter service', () => {
      const dashboardData = agentForagingService.getServiceDashboard('shelter');
      
      expect(dashboardData).toBeDefined();
      expect(dashboardData.serviceType).toBe('shelter');
      expect(dashboardData.totalLocations).toBeGreaterThanOrEqual(0);
      expect(dashboardData.metrics).toBeInstanceOf(Array);
      expect(dashboardData.lastUpdated).toBeInstanceOf(Date);
    });

    it('should return dashboard data for food service', () => {
      const dashboardData = agentForagingService.getServiceDashboard('food');
      
      expect(dashboardData).toBeDefined();
      expect(dashboardData.serviceType).toBe('food');
      expect(dashboardData.totalLocations).toBeGreaterThanOrEqual(0);
      expect(dashboardData.utilizationRate).toBeGreaterThanOrEqual(0);
      expect(dashboardData.utilizationRate).toBeLessThanOrEqual(1);
    });

    it('should return dashboard data for hygiene service', () => {
      const dashboardData = agentForagingService.getServiceDashboard('hygiene');
      
      expect(dashboardData).toBeDefined();
      expect(dashboardData.serviceType).toBe('hygiene');
      expect(dashboardData.averageQuality).toBeGreaterThanOrEqual(0);
      expect(dashboardData.averageQuality).toBeLessThanOrEqual(5);
    });

    it('should return dashboard data for transportation service', () => {
      const dashboardData = agentForagingService.getServiceDashboard('transportation');
      
      expect(dashboardData).toBeDefined();
      expect(dashboardData.serviceType).toBe('transportation');
      expect(dashboardData.alerts).toBeInstanceOf(Array);
      expect(dashboardData.recentForaging).toBeInstanceOf(Array);
    });

    it('should calculate utilization rate correctly', () => {
      const dashboardData = agentForagingService.getServiceDashboard('shelter');
      
      if (dashboardData.totalCapacity > 0) {
        const expectedUtilization = dashboardData.currentUtilization / dashboardData.totalCapacity;
        expect(dashboardData.utilizationRate).toBeCloseTo(expectedUtilization, 2);
      }
    });

    it('should include service metrics for each dashboard', () => {
      const serviceTypes: ServiceType[] = ['shelter', 'food', 'hygiene', 'transportation'];
      
      serviceTypes.forEach(serviceType => {
        const dashboardData = agentForagingService.getServiceDashboard(serviceType);
        
        expect(dashboardData.metrics).toBeInstanceOf(Array);
        expect(dashboardData.metrics.length).toBeGreaterThan(0);
        
        dashboardData.metrics.forEach(metric => {
          expect(metric).toHaveProperty('id');
          expect(metric).toHaveProperty('name');
          expect(metric).toHaveProperty('value');
          expect(metric).toHaveProperty('unit');
          expect(metric).toHaveProperty('trend');
          expect(metric).toHaveProperty('category');
          expect(typeof metric.value).toBe('number');
          expect(['up', 'down', 'stable']).toContain(metric.trend);
        });
      });
    });
  });

  describe('getAgents', () => {
    it('should return array of foraging agents', () => {
      const agents = agentForagingService.getAgents();
      
      expect(agents).toBeInstanceOf(Array);
      expect(agents.length).toBeGreaterThan(0);
      
      agents.forEach(agent => {
        expect(agent).toHaveProperty('id');
        expect(agent).toHaveProperty('name');
        expect(agent).toHaveProperty('type');
        expect(agent).toHaveProperty('specialties');
        expect(agent).toHaveProperty('reliability');
        expect(agent).toHaveProperty('accuracy');
        expect(['human', 'automated', 'crowdsource']).toContain(agent.type);
        expect(agent.reliability).toBeGreaterThanOrEqual(0);
        expect(agent.reliability).toBeLessThanOrEqual(1);
        expect(agent.accuracy).toBeGreaterThanOrEqual(0);
        expect(agent.accuracy).toBeLessThanOrEqual(1);
        expect(agent.specialties).toBeInstanceOf(Array);
      });
    });

    it('should have agents with different specialties', () => {
      const agents = agentForagingService.getAgents();
      const allSpecialties = new Set();
      
      agents.forEach(agent => {
        agent.specialties.forEach(specialty => {
          allSpecialties.add(specialty);
        });
      });
      
      expect(allSpecialties.size).toBeGreaterThan(1);
      expect(allSpecialties.has('shelter') || allSpecialties.has('food') || 
             allSpecialties.has('hygiene') || allSpecialties.has('transportation')).toBe(true);
    });
  });

  describe('getLocations', () => {
    it('should return array of service locations', () => {
      const locations = agentForagingService.getLocations();
      
      expect(locations).toBeInstanceOf(Array);
      expect(locations.length).toBeGreaterThan(0);
      
      locations.forEach(location => {
        expect(location).toHaveProperty('id');
        expect(location).toHaveProperty('name');
        expect(location).toHaveProperty('serviceType');
        expect(location).toHaveProperty('address');
        expect(location).toHaveProperty('capacity');
        expect(['shelter', 'food', 'hygiene', 'transportation']).toContain(location.serviceType);
        expect(location.capacity.total).toBeGreaterThanOrEqual(0);
        expect(location.capacity.available).toBeGreaterThanOrEqual(0);
        expect(location.capacity.available).toBeLessThanOrEqual(location.capacity.total);
      });
    });

    it('should have locations for all service types', () => {
      const locations = agentForagingService.getLocations();
      const serviceTypes = new Set(locations.map(loc => loc.serviceType));
      
      expect(serviceTypes.has('shelter')).toBe(true);
      expect(serviceTypes.has('food')).toBe(true);
      expect(serviceTypes.has('hygiene')).toBe(true);
      expect(serviceTypes.has('transportation')).toBe(true);
    });
  });

  describe('data consistency', () => {
    it('should maintain data consistency across multiple calls', () => {
      const firstCall = agentForagingService.getServiceDashboard('shelter');
      const secondCall = agentForagingService.getServiceDashboard('shelter');
      
      expect(firstCall.serviceType).toBe(secondCall.serviceType);
      expect(firstCall.totalLocations).toBe(secondCall.totalLocations);
    });

    it('should have different data for different service types', () => {
      const shelterData = agentForagingService.getServiceDashboard('shelter');
      const foodData = agentForagingService.getServiceDashboard('food');
      
      expect(shelterData.serviceType).not.toBe(foodData.serviceType);
      // Other metrics may vary, which is expected
    });
  });

  describe('metrics validation', () => {
    it('should generate valid capacity utilization metrics', () => {
      const serviceTypes: ServiceType[] = ['shelter', 'food', 'hygiene', 'transportation'];
      
      serviceTypes.forEach(serviceType => {
        const dashboardData = agentForagingService.getServiceDashboard(serviceType);
        const capacityMetric = dashboardData.metrics.find(m => m.name.includes('Capacity'));
        
        if (capacityMetric) {
          expect(capacityMetric.value).toBeGreaterThanOrEqual(0);
          expect(capacityMetric.value).toBeLessThanOrEqual(100);
          expect(capacityMetric.unit).toBe('%');
        }
      });
    });

    it('should generate valid quality metrics', () => {
      const serviceTypes: ServiceType[] = ['shelter', 'food', 'hygiene', 'transportation'];
      
      serviceTypes.forEach(serviceType => {
        const dashboardData = agentForagingService.getServiceDashboard(serviceType);
        const qualityMetric = dashboardData.metrics.find(m => m.name.includes('Quality'));
        
        if (qualityMetric) {
          expect(qualityMetric.value).toBeGreaterThanOrEqual(0);
          expect(qualityMetric.value).toBeLessThanOrEqual(5);
          expect(qualityMetric.unit).toBe('/5');
        }
      });
    });
  });

  describe('alerts generation', () => {
    it('should generate appropriate alerts for service issues', () => {
      const serviceTypes: ServiceType[] = ['shelter', 'food', 'hygiene', 'transportation'];
      
      serviceTypes.forEach(serviceType => {
        const dashboardData = agentForagingService.getServiceDashboard(serviceType);
        
        dashboardData.alerts.forEach(alert => {
          expect(alert).toHaveProperty('id');
          expect(alert).toHaveProperty('serviceType');
          expect(alert).toHaveProperty('severity');
          expect(alert).toHaveProperty('message');
          expect(alert).toHaveProperty('timestamp');
          expect(alert.serviceType).toBe(serviceType);
          expect(['info', 'warning', 'critical']).toContain(alert.severity);
          expect(alert.timestamp).toBeInstanceOf(Date);
        });
      });
    });
  });
});
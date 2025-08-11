/**
 * Food and Water Services
 * 
 * Manages meal services, food pantry operations, water distribution,
 * and nutrition counseling within the Community Services Hub.
 * 
 * @license MIT
 */

import { v4 as uuidv4 } from 'uuid';
import {
  FoodWaterService,
  FoodWaterResource,
  ServiceRequest,
  ServiceSchedule,
  ServiceRequirement,
  DietaryInfo,
  NutritionInformation,
  ResourceUsage,
  ServiceOutcome
} from '../types/CommunityServices';
import { UnifiedDataOwner } from '../types/UnifiedDataOwnership';
import { unifiedDataOwnershipService } from './unifiedDataOwnershipService';

interface MealSession {
  sessionId: string;
  serviceId: string;
  date: Date;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  clientsServed: string[];
  resourcesUsed: ResourceUsage[];
  staffMember: string;
  notes?: string;
}

interface FoodPantryVisit {
  visitId: string;
  clientId: string;
  visitDate: Date;
  itemsProvided: FoodWaterResource[];
  familySize: number;
  specialDietaryNeeds: string[];
  nextEligibleDate: Date;
  staffMember: string;
}

class FoodWaterServiceManager {
  private services: Map<string, FoodWaterService> = new Map();
  private resources: Map<string, FoodWaterResource[]> = new Map();
  private mealSessions: MealSession[] = [];
  private pantryVisits: FoodPantryVisit[] = [];
  private activeRequests: Map<string, ServiceRequest> = new Map();

  constructor() {
    this.initializeDefaultServices();
    console.log('🍽️ Food and Water Services initialized');
  }

  /**
   * Initialize default food and water services
   */
  private initializeDefaultServices(): void {
    const mealService: FoodWaterService = {
      serviceId: uuidv4(),
      serviceType: 'meal',
      name: 'Community Meals',
      description: 'Hot meals served daily with nutritious options for all dietary needs',
      location: 'Main Community Center',
      schedule: {
        scheduleId: uuidv4(),
        serviceId: '',
        dayOfWeek: 'monday',
        startTime: '07:00',
        endTime: '19:00',
        isRecurring: true,
        exceptions: []
      },
      capacity: 150,
      currentOccupancy: 0,
      requirements: [
        {
          requirementType: 'id_required',
          description: 'Photo ID or alternative identification required',
          isStrict: false
        }
      ],
      resources: [],
      nutritionInfo: {
        servingSize: '1 meal',
        calories: 650,
        macros: {
          protein: 25,
          carbs: 75,
          fat: 20,
          fiber: 8
        }
      }
    };
    mealService.schedule.serviceId = mealService.serviceId;

    const foodPantryService: FoodWaterService = {
      serviceId: uuidv4(),
      serviceType: 'food_pantry',
      name: 'Emergency Food Pantry',
      description: 'Weekly food assistance for families and individuals in need',
      location: 'Food Distribution Center',
      schedule: {
        scheduleId: uuidv4(),
        serviceId: '',
        dayOfWeek: 'wednesday',
        startTime: '10:00',
        endTime: '16:00',
        isRecurring: true,
        exceptions: []
      },
      capacity: 75,
      currentOccupancy: 0,
      requirements: [
        {
          requirementType: 'income_verification',
          description: 'Proof of income below 200% federal poverty level',
          isStrict: true
        },
        {
          requirementType: 'id_required',
          description: 'Valid identification required',
          isStrict: true
        }
      ],
      resources: []
    };
    foodPantryService.schedule.serviceId = foodPantryService.serviceId;

    const waterDistributionService: FoodWaterService = {
      serviceId: uuidv4(),
      serviceType: 'water_distribution',
      name: 'Clean Water Distribution',
      description: 'Free clean drinking water and emergency water supplies',
      location: 'Mobile Water Units',
      schedule: {
        scheduleId: uuidv4(),
        serviceId: '',
        dayOfWeek: 'monday',
        startTime: '08:00',
        endTime: '17:00',
        isRecurring: true,
        exceptions: []
      },
      capacity: 500,
      currentOccupancy: 0,
      requirements: [],
      resources: []
    };
    waterDistributionService.schedule.serviceId = waterDistributionService.serviceId;

    const nutritionCounselingService: FoodWaterService = {
      serviceId: uuidv4(),
      serviceType: 'nutrition_counseling',
      name: 'Nutrition Counseling',
      description: 'Individual and group nutrition education and meal planning support',
      location: 'Health Services Building',
      schedule: {
        scheduleId: uuidv4(),
        serviceId: '',
        dayOfWeek: 'tuesday',
        startTime: '09:00',
        endTime: '16:00',
        isRecurring: true,
        exceptions: []
      },
      capacity: 20,
      currentOccupancy: 0,
      requirements: [
        {
          requirementType: 'appointment_only',
          description: 'Scheduled appointments required',
          isStrict: true
        }
      ],
      resources: []
    };
    nutritionCounselingService.schedule.serviceId = nutritionCounselingService.serviceId;

    this.services.set(mealService.serviceId, mealService);
    this.services.set(foodPantryService.serviceId, foodPantryService);
    this.services.set(waterDistributionService.serviceId, waterDistributionService);
    this.services.set(nutritionCounselingService.serviceId, nutritionCounselingService);

    // Initialize resources
    this.initializeResources();
  }

  /**
   * Initialize food and water resources
   */
  private initializeResources(): void {
    const mealResources: FoodWaterResource[] = [
      {
        resourceId: uuidv4(),
        type: 'food_item',
        name: 'Mixed Green Salad',
        category: 'vegetables',
        quantity: 100,
        unit: 'servings',
        expirationDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
        allergens: [],
        dietaryInfo: {
          isVegetarian: true,
          isVegan: true,
          isGlutenFree: true,
          isHalal: true,
          isKosher: true
        },
        nutritionInfo: {
          servingSize: '1 cup',
          calories: 45,
          macros: { protein: 2, carbs: 8, fat: 0.5 }
        }
      },
      {
        resourceId: uuidv4(),
        type: 'food_item',
        name: 'Grilled Chicken Breast',
        category: 'protein',
        quantity: 80,
        unit: 'portions',
        expirationDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        allergens: [],
        dietaryInfo: {
          isVegetarian: false,
          isVegan: false,
          isGlutenFree: true,
          isHalal: false,
          isKosher: false
        },
        nutritionInfo: {
          servingSize: '4 oz',
          calories: 185,
          macros: { protein: 35, carbs: 0, fat: 4 }
        }
      },
      {
        resourceId: uuidv4(),
        type: 'beverage',
        name: 'Bottled Water',
        category: 'beverages',
        quantity: 500,
        unit: 'bottles',
        allergens: [],
        dietaryInfo: {
          isVegetarian: true,
          isVegan: true,
          isGlutenFree: true,
          isHalal: true,
          isKosher: true
        }
      }
    ];

    const pantryResources: FoodWaterResource[] = [
      {
        resourceId: uuidv4(),
        type: 'food_item',
        name: 'Canned Beans',
        category: 'canned_goods',
        quantity: 200,
        unit: 'cans',
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        allergens: [],
        dietaryInfo: {
          isVegetarian: true,
          isVegan: true,
          isGlutenFree: true,
          isHalal: true,
          isKosher: true
        }
      },
      {
        resourceId: uuidv4(),
        type: 'food_item',
        name: 'Rice (5lb bag)',
        category: 'grains',
        quantity: 50,
        unit: 'bags',
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        allergens: [],
        dietaryInfo: {
          isVegetarian: true,
          isVegan: true,
          isGlutenFree: true,
          isHalal: true,
          isKosher: true
        }
      }
    ];

    // Store resources by service type
    const mealService = Array.from(this.services.values()).find(s => s.serviceType === 'meal');
    const pantryService = Array.from(this.services.values()).find(s => s.serviceType === 'food_pantry');

    if (mealService) {
      this.resources.set(mealService.serviceId, mealResources);
      mealService.resources = mealResources;
    }

    if (pantryService) {
      this.resources.set(pantryService.serviceId, pantryResources);
      pantryService.resources = pantryResources;
    }
  }

  /**
   * Submit a food or water service request
   */
  async submitServiceRequest(
    clientId: string,
    serviceId: string,
    requestType: string,
    details: Record<string, any>
  ): Promise<ServiceRequest> {
    const service = this.services.get(serviceId);
    if (!service) {
      throw new Error(`Service not found: ${serviceId}`);
    }

    // Check client eligibility
    const owner = await unifiedDataOwnershipService.getDataOwner(clientId);
    if (!owner) {
      throw new Error(`Client not found: ${clientId}`);
    }

    // Validate requirements
    await this.validateServiceRequirements(service, owner);

    const request: ServiceRequest = {
      requestId: uuidv4(),
      clientId,
      serviceType: 'food_water',
      requestType,
      priority: this.determinePriority(details),
      status: 'submitted',
      submittedAt: new Date(),
      location: service.location,
      details: {
        serviceId,
        serviceName: service.name,
        specialRequirements: details.specialRequirements || [],
        familySize: details.familySize || 1,
        dietaryRestrictions: details.dietaryRestrictions || [],
        ...details
      }
    };

    this.activeRequests.set(request.requestId, request);
    
    console.log(`🍽️ Food/Water service request submitted: ${request.requestId}`);
    return request;
  }

  /**
   * Process a meal service
   */
  async serveMeal(
    sessionId: string,
    clientId: string,
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
    staffMember: string,
    specialRequests?: string[]
  ): Promise<MealSession> {
    const mealService = Array.from(this.services.values()).find(s => s.serviceType === 'meal');
    if (!mealService) {
      throw new Error('Meal service not available');
    }

    const owner = await unifiedDataOwnershipService.getDataOwner(clientId);
    if (!owner) {
      throw new Error(`Client not found: ${clientId}`);
    }

    // Check capacity
    if (mealService.currentOccupancy >= mealService.capacity) {
      throw new Error('Meal service at capacity');
    }

    // Create meal session
    const session: MealSession = {
      sessionId,
      serviceId: mealService.serviceId,
      date: new Date(),
      mealType,
      clientsServed: [clientId],
      resourcesUsed: [],
      staffMember,
      notes: specialRequests?.join(', ')
    };

    // Track resource usage
    const resources = this.resources.get(mealService.serviceId) || [];
    const resourcesUsed: ResourceUsage[] = resources.map(resource => ({
      resourceType: resource.name,
      quantityUsed: 1,
      notes: `Served to ${owner.firstName} ${owner.lastName}`
    }));

    session.resourcesUsed = resourcesUsed;

    // Update occupancy
    mealService.currentOccupancy++;

    // Store session
    this.mealSessions.push(session);

    // Update resources
    this.updateResourceQuantities(mealService.serviceId, resourcesUsed);

    // Store service record in unified data system
    await unifiedDataOwnershipService.storeData(clientId, 'service_history', {
      serviceType: 'food_water',
      serviceName: 'Community Meal',
      serviceDate: new Date(),
      outcome: 'successful',
      details: {
        mealType,
        sessionId,
        staffMember,
        specialRequests
      }
    });

    console.log(`🍽️ Meal served: ${mealType} for client ${clientId}`);
    return session;
  }

  /**
   * Process food pantry visit
   */
  async processFoodPantryVisit(
    clientId: string,
    familySize: number,
    specialDietaryNeeds: string[],
    staffMember: string
  ): Promise<FoodPantryVisit> {
    const pantryService = Array.from(this.services.values()).find(s => s.serviceType === 'food_pantry');
    if (!pantryService) {
      throw new Error('Food pantry service not available');
    }

    const owner = await unifiedDataOwnershipService.getDataOwner(clientId);
    if (!owner) {
      throw new Error(`Client not found: ${clientId}`);
    }

    // Check if client is eligible (not visited recently)
    const recentVisit = this.pantryVisits
      .filter(v => v.clientId === clientId)
      .sort((a, b) => b.visitDate.getTime() - a.visitDate.getTime())[0];

    if (recentVisit && recentVisit.nextEligibleDate > new Date()) {
      throw new Error(`Client not eligible until ${recentVisit.nextEligibleDate.toDateString()}`);
    }

    // Determine items to provide based on family size and dietary needs
    const resources = this.resources.get(pantryService.serviceId) || [];
    const itemsProvided = this.selectFoodPantryItems(resources, familySize, specialDietaryNeeds);

    const visit: FoodPantryVisit = {
      visitId: uuidv4(),
      clientId,
      visitDate: new Date(),
      itemsProvided,
      familySize,
      specialDietaryNeeds,
      nextEligibleDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
      staffMember
    };

    this.pantryVisits.push(visit);

    // Update resource quantities
    const resourcesUsed: ResourceUsage[] = itemsProvided.map(item => ({
      resourceType: item.name,
      quantityUsed: 1
    }));
    this.updateResourceQuantities(pantryService.serviceId, resourcesUsed);

    // Store service record
    await unifiedDataOwnershipService.storeData(clientId, 'service_history', {
      serviceType: 'food_water',
      serviceName: 'Food Pantry Visit',
      serviceDate: new Date(),
      outcome: 'successful',
      details: {
        visitId: visit.visitId,
        itemsProvided: itemsProvided.map(i => i.name),
        familySize,
        specialDietaryNeeds,
        staffMember
      }
    });

    console.log(`🥫 Food pantry visit completed for client ${clientId}`);
    return visit;
  }

  /**
   * Distribute water
   */
  async distributeWater(
    clientId: string,
    quantityRequested: number,
    emergencyDistribution: boolean = false,
    staffMember: string
  ): Promise<ServiceOutcome> {
    const waterService = Array.from(this.services.values()).find(s => s.serviceType === 'water_distribution');
    if (!waterService) {
      throw new Error('Water distribution service not available');
    }

    const owner = await unifiedDataOwnershipService.getDataOwner(clientId);
    if (!owner) {
      throw new Error(`Client not found: ${clientId}`);
    }

    const waterResources = this.resources.get(waterService.serviceId) || [];
    const waterBottles = waterResources.find(r => r.name === 'Bottled Water');

    if (!waterBottles || waterBottles.quantity < quantityRequested) {
      throw new Error('Insufficient water supply');
    }

    // Distribute water
    const resourcesUsed: ResourceUsage[] = [{
      resourceType: 'Bottled Water',
      quantityUsed: quantityRequested,
      notes: emergencyDistribution ? 'Emergency distribution' : 'Regular distribution'
    }];

    this.updateResourceQuantities(waterService.serviceId, resourcesUsed);

    const outcome: ServiceOutcome = {
      outcomeType: 'successful',
      description: `Distributed ${quantityRequested} bottles of water`,
      resourcesUsed,
      followUpRequired: false
    };

    // Store service record
    await unifiedDataOwnershipService.storeData(clientId, 'service_history', {
      serviceType: 'food_water',
      serviceName: 'Water Distribution',
      serviceDate: new Date(),
      outcome: 'successful',
      details: {
        quantityDistributed: quantityRequested,
        emergencyDistribution,
        staffMember
      }
    });

    console.log(`💧 Water distributed: ${quantityRequested} bottles to client ${clientId}`);
    return outcome;
  }

  /**
   * Schedule nutrition counseling
   */
  async scheduleNutritionCounseling(
    clientId: string,
    appointmentDate: Date,
    counselingType: 'individual' | 'group',
    focusAreas: string[]
  ): Promise<string> {
    const nutritionService = Array.from(this.services.values()).find(s => s.serviceType === 'nutrition_counseling');
    if (!nutritionService) {
      throw new Error('Nutrition counseling service not available');
    }

    const owner = await unifiedDataOwnershipService.getDataOwner(clientId);
    if (!owner) {
      throw new Error(`Client not found: ${clientId}`);
    }

    const appointmentId = uuidv4();

    // Store appointment in unified data system
    await unifiedDataOwnershipService.storeData(clientId, 'service_history', {
      serviceType: 'food_water',
      serviceName: 'Nutrition Counseling Appointment',
      serviceDate: appointmentDate,
      outcome: 'scheduled',
      details: {
        appointmentId,
        counselingType,
        focusAreas,
        status: 'scheduled'
      }
    });

    console.log(`🥗 Nutrition counseling scheduled: ${appointmentId} for client ${clientId}`);
    return appointmentId;
  }

  // Service management methods
  async getAvailableServices(): Promise<FoodWaterService[]> {
    return Array.from(this.services.values());
  }

  async getServiceById(serviceId: string): Promise<FoodWaterService | null> {
    return this.services.get(serviceId) || null;
  }

  async getServiceMetrics(serviceId: string) {
    const service = this.services.get(serviceId);
    if (!service) return null;

    const relatedSessions = this.mealSessions.filter(s => s.serviceId === serviceId);
    const relatedVisits = this.pantryVisits.filter(v => 
      this.services.get(serviceId)?.serviceType === 'food_pantry'
    );

    return {
      serviceId,
      serviceName: service.name,
      totalSessions: relatedSessions.length,
      totalClients: Array.from(new Set([
        ...relatedSessions.flatMap(s => s.clientsServed),
        ...relatedVisits.map(v => v.clientId)
      ])).length,
      capacityUtilization: (service.currentOccupancy / service.capacity) * 100,
      resourcesLow: service.resources.filter(r => r.quantity < 10).length
    };
  }

  // Private helper methods
  private async validateServiceRequirements(service: FoodWaterService, client: UnifiedDataOwner): Promise<void> {
    for (const requirement of service.requirements) {
      switch (requirement.requirementType) {
        case 'id_required':
          // In a real implementation, check if client has valid ID
          break;
        case 'income_verification':
          // In a real implementation, check income verification
          break;
        case 'appointment_only':
          throw new Error('This service requires an appointment. Please schedule in advance.');
      }
    }
  }

  private determinePriority(details: Record<string, any>): 'low' | 'medium' | 'high' | 'urgent' | 'emergency' {
    if (details.emergency) return 'emergency';
    if (details.familySize > 5) return 'high';
    if (details.specialDietaryNeeds?.length > 0) return 'medium';
    return 'low';
  }

  private selectFoodPantryItems(
    resources: FoodWaterResource[],
    familySize: number,
    dietaryNeeds: string[]
  ): FoodWaterResource[] {
    const baseQuantity = Math.max(1, Math.floor(familySize / 2));
    const availableItems = resources.filter(r => r.quantity > 0);
    
    // Select items that meet dietary requirements
    return availableItems
      .filter(item => this.itemMeetsDietaryNeeds(item, dietaryNeeds))
      .slice(0, baseQuantity + 2); // Base items plus extras
  }

  private itemMeetsDietaryNeeds(item: FoodWaterResource, dietaryNeeds: string[]): boolean {
    for (const need of dietaryNeeds) {
      switch (need.toLowerCase()) {
        case 'vegetarian':
          if (!item.dietaryInfo.isVegetarian) return false;
          break;
        case 'vegan':
          if (!item.dietaryInfo.isVegan) return false;
          break;
        case 'gluten-free':
          if (!item.dietaryInfo.isGlutenFree) return false;
          break;
        case 'halal':
          if (!item.dietaryInfo.isHalal) return false;
          break;
        case 'kosher':
          if (!item.dietaryInfo.isKosher) return false;
          break;
      }
    }
    return true;
  }

  private updateResourceQuantities(serviceId: string, resourcesUsed: ResourceUsage[]): void {
    const resources = this.resources.get(serviceId) || [];
    
    for (const usage of resourcesUsed) {
      const resource = resources.find(r => r.name === usage.resourceType);
      if (resource) {
        resource.quantity = Math.max(0, resource.quantity - usage.quantityUsed);
      }
    }
    
    this.resources.set(serviceId, resources);
  }
}

export const foodWaterService = new FoodWaterServiceManager();
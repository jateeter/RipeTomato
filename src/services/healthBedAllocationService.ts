import { v4 as uuidv4 } from 'uuid';
import { Bed, Client, BedReservation } from '../types/Shelter';
import { HealthBasedBedCriteria, HealthMetrics, ClientHealthProfile } from '../types/Health';

interface BedMatchResult {
  bed: Bed;
  compatibilityScore: number;
  matchReasons: string[];
  concerns: string[];
}

class HealthBedAllocationService {
  
  /**
   * Find the best bed matches for a client based on their health profile
   */
  findOptimalBeds(
    availableBeds: Bed[], 
    healthProfile: ClientHealthProfile, 
    maxResults: number = 5
  ): BedMatchResult[] {
    if (!healthProfile || !healthProfile.bedCriteria) {
      // If no health data, return standard bed matching
      return availableBeds
        .filter(bed => bed.isActive && !bed.maintenanceRequired)
        .map(bed => ({
          bed,
          compatibilityScore: 50, // Neutral score
          matchReasons: ['Standard accommodation'],
          concerns: []
        }))
        .slice(0, maxResults);
    }

    const results: BedMatchResult[] = [];
    const criteria = healthProfile.bedCriteria;
    
    for (const bed of availableBeds) {
      if (!bed.isActive || bed.maintenanceRequired) continue;
      
      const matchResult = this.calculateBedCompatibility(bed, criteria, healthProfile);
      results.push(matchResult);
    }

    // Sort by compatibility score (highest first)
    results.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
    
    return results.slice(0, maxResults);
  }

  /**
   * Calculate how well a bed matches a client's health criteria
   */
  private calculateBedCompatibility(
    bed: Bed, 
    criteria: HealthBasedBedCriteria, 
    healthProfile: ClientHealthProfile
  ): BedMatchResult {
    let score = 0;
    const matchReasons: string[] = [];
    const concerns: string[] = [];
    const maxScore = 100;

    // Base score for active, maintained bed
    score += 20;

    // Medical supervision requirement (highest priority)
    if (criteria.requiresmedicalSupervision) {
      if (bed.hasMedicalSupport) {
        score += 25;
        matchReasons.push('Medical support available');
      } else {
        score -= 30;
        concerns.push('Requires medical supervision but bed lacks support');
      }
    }

    // Emergency monitoring
    if (criteria.emergencyMonitoring) {
      if (bed.hasEmergencyAlert) {
        score += 20;
        matchReasons.push('Emergency alert system');
      } else {
        score -= 25;
        concerns.push('Emergency monitoring needed but not available');
      }
    }

    // Accessibility needs
    if (criteria.needsAccessibility) {
      if (bed.hasAccessibility) {
        score += 15;
        matchReasons.push('Accessible features available');
      } else {
        score -= 20;
        concerns.push('Accessibility required but not available');
      }
    }

    // Staff proximity for high-need clients
    if (criteria.needsProximityToStaff) {
      if (bed.hasStaffProximity) {
        score += 15;
        matchReasons.push('Close to staff station');
      } else {
        score -= 15;
        concerns.push('Needs staff proximity but bed is distant');
      }
    }

    // Quiet environment for mental health/recovery
    if (criteria.requiresQuietEnvironment) {
      if (bed.hasQuietZone) {
        score += 10;
        matchReasons.push('Quiet zone designation');
      } else {
        score -= 10;
        concerns.push('Quiet environment needed but not available');
      }
    }

    // Mobility assistance
    if (criteria.mobilityAssistance) {
      if (bed.hasAccessibility) {
        score += 10;
        matchReasons.push('Mobility assistance features');
      } else {
        score -= 15;
        concerns.push('Mobility assistance needed');
      }
    }

    // Medication management
    if (criteria.medicationReminders) {
      if (bed.hasMedicationStorage && bed.hasStaffProximity) {
        score += 15;
        matchReasons.push('Medication management support');
      } else if (bed.hasMedicationStorage) {
        score += 8;
        matchReasons.push('Medication storage available');
      } else {
        score -= 10;
        concerns.push('Medication management needed');
      }
    }

    // Temperature regulation needs
    if (criteria.temperatureRegulation !== 'standard') {
      if (bed.hasTemperatureControl) {
        score += 10;
        matchReasons.push('Temperature control available');
      } else {
        score -= 8;
        concerns.push(`${criteria.temperatureRegulation} temperature control needed`);
      }
    }

    // Check bed type compatibility
    const bedTypeBonus = this.getBedTypeBonus(bed, criteria);
    score += bedTypeBonus.points;
    if (bedTypeBonus.reason) {
      matchReasons.push(bedTypeBonus.reason);
    }

    // Occupancy consideration for medical needs
    if (criteria.requiresmedicalSupervision || criteria.emergencyMonitoring) {
      if (bed.capacity <= bed.maxOccupancyForMedical) {
        score += 5;
        matchReasons.push('Appropriate occupancy for medical needs');
      } else {
        score -= 5;
        concerns.push('High occupancy may limit medical care');
      }
    }

    // Health condition specific adjustments
    const conditionScore = this.getHealthConditionScore(healthProfile, bed);
    score += conditionScore.points;
    matchReasons.push(...conditionScore.reasons);
    concerns.push(...conditionScore.concerns);

    // Normalize score to 0-100 range
    const finalScore = Math.max(0, Math.min(maxScore, score));

    return {
      bed,
      compatibilityScore: finalScore,
      matchReasons,
      concerns
    };
  }

  /**
   * Get bonus points based on bed type compatibility
   */
  private getBedTypeBonus(bed: Bed, criteria: HealthBasedBedCriteria): { points: number, reason?: string } {
    if (criteria.requiresmedicalSupervision && bed.type === 'medical') {
      return { points: 15, reason: 'Medical bed type for supervision needs' };
    }
    
    if (criteria.needsAccessibility && bed.type === 'accessible') {
      return { points: 12, reason: 'Accessible bed type' };
    }
    
    if (criteria.requiresQuietEnvironment && bed.type === 'isolation') {
      return { points: 8, reason: 'Isolation bed for quiet needs' };
    }
    
    return { points: 0 };
  }

  /**
   * Score adjustments based on specific health conditions
   */
  private getHealthConditionScore(
    healthProfile: ClientHealthProfile, 
    bed: Bed
  ): { points: number, reasons: string[], concerns: string[] } {
    let points = 0;
    const reasons: string[] = [];
    const concerns: string[] = [];

    if (healthProfile.healthMetrics.length === 0) {
      return { points, reasons, concerns };
    }

    const latestMetrics = healthProfile.healthMetrics[0];
    const conditions = latestMetrics.chronicConditions || [];
    const medications = latestMetrics.currentMedications || [];

    // Diabetes management
    if (conditions.includes('Diabetes Type 2') || medications.includes('Insulin')) {
      if (bed.hasMedicationStorage && bed.hasStaffProximity) {
        points += 8;
        reasons.push('Optimal for diabetes management');
      } else {
        points -= 5;
        concerns.push('Diabetes management may be challenging');
      }
    }

    // Heart conditions
    if (conditions.includes('Heart Disease') || conditions.includes('Hypertension')) {
      if (bed.hasEmergencyAlert && bed.hasMedicalSupport) {
        points += 10;
        reasons.push('Cardiac monitoring capability');
      } else {
        points -= 8;
        concerns.push('Limited cardiac emergency response');
      }
    }

    // Respiratory conditions
    if (conditions.includes('COPD') || conditions.includes('Asthma')) {
      if (bed.hasQuietZone && bed.hasEmergencyAlert) {
        points += 8;
        reasons.push('Respiratory-friendly environment');
      } else if (!bed.hasQuietZone) {
        points -= 5;
        concerns.push('May worsen respiratory symptoms');
      }
    }

    // Mental health conditions
    if (conditions.includes('Depression') || conditions.includes('Anxiety Disorder')) {
      if (bed.hasQuietZone) {
        points += 6;
        reasons.push('Conducive to mental health recovery');
      } else {
        points -= 3;
        concerns.push('Environment may increase stress/anxiety');
      }
    }

    // Mobility issues
    if (conditions.includes('Chronic Back Pain') || conditions.includes('Arthritis')) {
      if (bed.hasAccessibility) {
        points += 8;
        reasons.push('Mobility-friendly accommodation');
      } else {
        points -= 10;
        concerns.push('Mobility challenges not addressed');
      }
    }

    // High-risk medications
    if (medications.includes('Warfarin') || medications.includes('Insulin')) {
      if (bed.hasMedicationStorage && bed.hasStaffProximity && bed.hasMedicalSupport) {
        points += 12;
        reasons.push('High-risk medication management available');
      } else {
        points -= 8;
        concerns.push('High-risk medications need closer supervision');
      }
    }

    return { points, reasons, concerns };
  }

  /**
   * Create a reservation with health-based priority
   */
  createHealthBasedReservation(
    clientId: string,
    bedMatch: BedMatchResult,
    staffId: string,
    healthProfile: ClientHealthProfile
  ): BedReservation {
    // Determine priority based on health needs
    let priority: 'standard' | 'high' | 'emergency' = 'standard';
    
    if (healthProfile.bedCriteria.emergencyMonitoring || 
        healthProfile.bedCriteria.requiresmedicalSupervision) {
      priority = 'emergency';
    } else if (healthProfile.bedCriteria.medicationReminders || 
               healthProfile.bedCriteria.needsAccessibility) {
      priority = 'high';
    }

    // Generate health-specific special requests
    const specialRequests: string[] = [];
    
    if (healthProfile.bedCriteria.medicationReminders) {
      specialRequests.push('Medication reminder assistance needed');
    }
    
    if (healthProfile.bedCriteria.emergencyMonitoring) {
      specialRequests.push('Emergency health monitoring required');
    }
    
    if (healthProfile.bedCriteria.mobilityAssistance) {
      specialRequests.push('Mobility assistance required');
    }

    // Add health condition notes
    const latestMetrics = healthProfile.healthMetrics[0];
    if (latestMetrics?.chronicConditions && latestMetrics.chronicConditions.length > 0) {
      specialRequests.push(`Health conditions: ${latestMetrics.chronicConditions.join(', ')}`);
    }

    if (latestMetrics?.allergies && latestMetrics.allergies.length > 0) {
      specialRequests.push(`Allergies: ${latestMetrics.allergies.join(', ')}`);
    }

    return {
      id: uuidv4(),
      bedId: bedMatch.bed.id,
      clientId,
      reservationDate: new Date(),
      status: 'reserved',
      priority,
      notes: `Health-based allocation (compatibility: ${bedMatch.compatibilityScore}%). ${bedMatch.matchReasons.join('; ')}.`,
      createdBy: staffId,
      createdAt: new Date(),
      updatedAt: new Date(),
      specialRequests
    };
  }

  /**
   * Generate mock beds with health amenities for demonstration
   */
  generateMockBedsWithHealthFeatures(): Bed[] {
    const beds: Bed[] = [];
    
    // Medical beds (4 beds)
    for (let i = 1; i <= 4; i++) {
      beds.push({
        id: `med-${i}`,
        number: `M${i}`,
        type: 'medical',
        capacity: 1,
        location: 'Medical Wing',
        floor: 1,
        isActive: true,
        hasAccessibility: true,
        hasMedicalSupport: true,
        hasQuietZone: true,
        hasStaffProximity: true,
        hasTemperatureControl: true,
        hasMedicationStorage: true,
        hasEmergencyAlert: true,
        maxOccupancyForMedical: 1,
        healthCompatibilityScore: 95
      });
    }

    // Accessible beds (6 beds)
    for (let i = 1; i <= 6; i++) {
      beds.push({
        id: `acc-${i}`,
        number: `A${i}`,
        type: 'accessible',
        capacity: 1,
        location: 'Accessible Wing',
        floor: 1,
        isActive: true,
        hasAccessibility: true,
        hasMedicalSupport: false,
        hasQuietZone: false,
        hasStaffProximity: i <= 3, // First 3 are near staff
        hasTemperatureControl: true,
        hasMedicationStorage: false,
        hasEmergencyAlert: i <= 3,
        maxOccupancyForMedical: 1,
        healthCompatibilityScore: 75
      });
    }

    // Quiet zone beds (8 beds)
    for (let i = 1; i <= 8; i++) {
      beds.push({
        id: `quiet-${i}`,
        number: `Q${i}`,
        type: 'standard',
        capacity: 1,
        location: 'Quiet Zone',
        floor: 2,
        isActive: true,
        hasAccessibility: false,
        hasMedicalSupport: false,
        hasQuietZone: true,
        hasStaffProximity: i <= 2, // First 2 near staff
        hasTemperatureControl: true,
        hasMedicationStorage: false,
        hasEmergencyAlert: false,
        maxOccupancyForMedical: 1,
        healthCompatibilityScore: 60
      });
    }

    // Standard beds (20 beds)
    for (let i = 1; i <= 20; i++) {
      beds.push({
        id: `std-${i}`,
        number: `S${i}`,
        type: 'standard',
        capacity: 1,
        location: `Standard Wing ${Math.ceil(i / 10)}`,
        floor: Math.ceil(i / 10),
        isActive: i <= 18, // 2 beds under maintenance
        hasAccessibility: false,
        hasMedicalSupport: false,
        hasQuietZone: false,
        hasStaffProximity: i <= 4, // First 4 near staff
        hasTemperatureControl: false,
        hasMedicationStorage: false,
        hasEmergencyAlert: false,
        maxOccupancyForMedical: 2,
        healthCompatibilityScore: 50,
        maintenanceRequired: i > 18
      });
    }

    return beds;
  }

  /**
   * Get health-based priority score for waitlist ordering
   */
  getHealthPriorityScore(healthProfile: ClientHealthProfile): number {
    let score = 0;
    const criteria = healthProfile.bedCriteria;
    
    // Emergency conditions get highest priority
    if (criteria.emergencyMonitoring) score += 100;
    if (criteria.requiresmedicalSupervision) score += 80;
    
    // High-need conditions
    if (criteria.medicationReminders) score += 60;
    if (criteria.needsAccessibility) score += 50;
    if (criteria.mobilityAssistance) score += 40;
    
    // Mental health needs
    if (criteria.requiresQuietEnvironment) score += 30;
    if (criteria.needsProximityToStaff) score += 25;
    
    // Special temperature needs
    if (criteria.temperatureRegulation !== 'standard') score += 20;
    
    // Add urgency based on health alerts
    const criticalAlerts = healthProfile.healthAlerts.filter(
      alert => alert.type === 'critical' && !alert.acknowledged
    );
    score += criticalAlerts.length * 50;
    
    return score;
  }
}

export const healthBedAllocationService = new HealthBedAllocationService();
#!/usr/bin/env node

/**
 * Cache Population CLI
 *
 * Standalone tool to populate the local cache database with:
 * - Location information (shelters, clinics, services, food banks)
 * - Shelter capacity and availability metrics
 *
 * Usage:
 *   node cli/cache-populate.js
 *   npm run cache:populate
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Portland homeless services data
const PORTLAND_LOCATIONS = [
  {
    name: 'Blanchet House',
    address: '340 NW Glisan St, Portland, OR 97209',
    latitude: 45.5264,
    longitude: -122.6755,
    type: 'shelter',
    shelter: {
      capacity: 125,
      available_beds: 15,
      services: JSON.stringify(['meals', 'shelter', 'showers', 'laundry', 'mail']),
      phone: '503-241-4340',
      hours: '24/7',
      eligibility: 'Men only, 18+',
      metrics: JSON.stringify({
        average_stay_days: 45,
        success_rate: 0.65,
        meals_served_monthly: 3500
      })
    }
  },
  {
    name: 'Transition Projects - Clark Center',
    address: '655 NW Hoyt St, Portland, OR 97209',
    latitude: 45.5279,
    longitude: -122.6812,
    type: 'shelter',
    shelter: {
      capacity: 90,
      available_beds: 8,
      services: JSON.stringify(['shelter', 'case_management', 'housing_navigation', 'storage']),
      phone: '503-280-4700',
      hours: '24/7',
      eligibility: 'Men only, 18+, no pets',
      metrics: JSON.stringify({
        average_stay_days: 60,
        success_rate: 0.72,
        housing_placements_monthly: 12
      })
    }
  },
  {
    name: 'Jean\'s Place (Transition Projects)',
    address: '4800 NE Glisan St, Portland, OR 97213',
    latitude: 45.5264,
    longitude: -122.6125,
    type: 'shelter',
    shelter: {
      capacity: 38,
      available_beds: 5,
      services: JSON.stringify(['shelter', 'case_management', 'childcare', 'meals']),
      phone: '503-280-4700',
      hours: '24/7',
      eligibility: 'Families with children',
      metrics: JSON.stringify({
        average_stay_days: 90,
        success_rate: 0.80,
        families_served_monthly: 25
      })
    }
  },
  {
    name: 'Outside In',
    address: '1132 SW 13th Ave, Portland, OR 97205',
    latitude: 45.5182,
    longitude: -122.6851,
    type: 'clinic',
    shelter: null
  },
  {
    name: 'Central City Concern - Blackburn Center',
    address: '232 NW 6th Ave, Portland, OR 97209',
    latitude: 45.5246,
    longitude: -122.6763,
    type: 'service',
    shelter: {
      capacity: 160,
      available_beds: 22,
      services: JSON.stringify(['housing', 'mental_health', 'addiction_treatment', 'employment']),
      phone: '503-294-1681',
      hours: '24/7',
      eligibility: 'Adults 18+, chronic homelessness',
      metrics: JSON.stringify({
        average_stay_days: 180,
        success_rate: 0.78,
        housing_retention_1year: 0.85
      })
    }
  },
  {
    name: 'JOIN Resource Center',
    address: '4110 SE Hawthorne Blvd, Portland, OR 97214',
    latitude: 45.5121,
    longitude: -122.6191,
    type: 'service',
    shelter: null
  },
  {
    name: 'Blanchet Farm',
    address: '15335 NE Hwy 47, Carlton, OR 97111',
    latitude: 45.2934,
    longitude: -123.1756,
    type: 'shelter',
    shelter: {
      capacity: 45,
      available_beds: 12,
      services: JSON.stringify(['shelter', 'meals', 'farm_work', 'recovery', 'rural_setting']),
      phone: '503-852-7495',
      hours: '24/7',
      eligibility: 'Men only, 18+, willing to work',
      metrics: JSON.stringify({
        average_stay_days: 120,
        success_rate: 0.70,
        farm_harvest_pounds_yearly: 50000
      })
    }
  },
  {
    name: 'Salvation Army - Harbor Light Center',
    address: '36 SE 6th Ave, Portland, OR 97214',
    latitude: 45.5211,
    longitude: -122.6618,
    type: 'shelter',
    shelter: {
      capacity: 185,
      available_beds: 28,
      services: JSON.stringify(['shelter', 'addiction_treatment', 'meals', 'chapel', 'case_management']),
      phone: '503-239-1243',
      hours: '24/7',
      eligibility: 'Men only, 18+',
      metrics: JSON.stringify({
        average_stay_days: 90,
        success_rate: 0.68,
        program_completion_rate: 0.55
      })
    }
  },
  {
    name: 'Sisters Of The Road Cafe',
    address: '133 NW 6th Ave, Portland, OR 97209',
    latitude: 45.5238,
    longitude: -122.6763,
    type: 'food',
    shelter: null
  },
  {
    name: 'Portland Rescue Mission',
    address: '111 W Burnside St, Portland, OR 97209',
    latitude: 45.5231,
    longitude: -122.6721,
    type: 'shelter',
    shelter: {
      capacity: 250,
      available_beds: 35,
      services: JSON.stringify(['shelter', 'meals', 'showers', 'clothing', 'chapel', 'recovery']),
      phone: '503-906-7690',
      hours: '24/7',
      eligibility: 'Adults 18+',
      metrics: JSON.stringify({
        average_stay_days: 60,
        success_rate: 0.63,
        meals_served_yearly: 425000
      })
    }
  },
  {
    name: 'Ecumenical Ministries - EMOCHA',
    address: '0325 SE 11th Ave, Portland, OR 97214',
    latitude: 45.5152,
    longitude: -122.6547,
    type: 'clinic',
    shelter: null
  },
  {
    name: 'Human Solutions - Family Shelter',
    address: '12350 SE Powell Blvd, Portland, OR 97236',
    latitude: 45.4973,
    longitude: -122.5318,
    type: 'shelter',
    shelter: {
      capacity: 60,
      available_beds: 7,
      services: JSON.stringify(['shelter', 'case_management', 'childcare', 'meals', 'housing_navigation']),
      phone: '503-548-0200',
      hours: '24/7',
      eligibility: 'Families with children',
      metrics: JSON.stringify({
        average_stay_days: 75,
        success_rate: 0.82,
        children_served_monthly: 85
      })
    }
  }
];

class CachePopulateCLI {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  /**
   * Print colored message
   */
  print(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  /**
   * Print banner
   */
  printBanner() {
    this.print('\n' + '='.repeat(60), 'cyan');
    this.print('       CACHE DATABASE POPULATION TOOL', 'bright');
    this.print('       Local SQLite Cache for Homeless Services', 'cyan');
    this.print('='.repeat(60) + '\n', 'cyan');
  }

  /**
   * Ask question
   */
  question(prompt) {
    return new Promise((resolve) => {
      this.rl.question(`${colors.blue}${prompt}${colors.reset} `, resolve);
    });
  }

  /**
   * Simulate database operations
   * (In real use, this would call the actual database service)
   */
  async populateCache() {
    this.print('\n📦 Populating cache database...', 'yellow');

    // Create cache data structure
    const cacheData = {
      locations: [],
      shelters: [],
      metadata: {
        last_sync: new Date().toISOString(),
        version: '1.0.0',
        total_locations: 0,
        total_shelters: 0
      }
    };

    // Process each location
    for (let i = 0; i < PORTLAND_LOCATIONS.length; i++) {
      const loc = PORTLAND_LOCATIONS[i];
      const locationId = i + 1;

      this.print(`\n  ✓ Adding location: ${loc.name}`, 'green');

      cacheData.locations.push({
        id: locationId,
        name: loc.name,
        address: loc.address,
        latitude: loc.latitude,
        longitude: loc.longitude,
        type: loc.type,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Add shelter data if available
      if (loc.shelter) {
        this.print(`    → Shelter capacity: ${loc.shelter.capacity} beds`, 'dim');
        this.print(`    → Available: ${loc.shelter.available_beds} beds`, 'dim');

        cacheData.shelters.push({
          id: cacheData.shelters.length + 1,
          location_id: locationId,
          name: loc.name,
          capacity: loc.shelter.capacity,
          available_beds: loc.shelter.available_beds,
          occupied_beds: loc.shelter.capacity - loc.shelter.available_beds,
          services: loc.shelter.services,
          phone: loc.shelter.phone,
          hours: loc.shelter.hours,
          eligibility: loc.shelter.eligibility,
          metrics: loc.shelter.metrics,
          last_updated: new Date().toISOString(),
          created_at: new Date().toISOString()
        });
      }

      // Small delay for visual effect
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Update metadata
    cacheData.metadata.total_locations = cacheData.locations.length;
    cacheData.metadata.total_shelters = cacheData.shelters.length;

    // Save to public directory for app access
    const publicDir = path.join(__dirname, '..', 'public');
    const cacheFile = path.join(publicDir, 'cache-data.json');

    try {
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }

      fs.writeFileSync(cacheFile, JSON.stringify(cacheData, null, 2), 'utf8');
      this.print(`\n✅ Cache data saved to: ${cacheFile}`, 'green');
    } catch (error) {
      this.print(`\n❌ Error saving cache data: ${error.message}`, 'red');
      throw error;
    }

    return cacheData;
  }

  /**
   * Display summary
   */
  displaySummary(cacheData) {
    this.print('\n' + '─'.repeat(60), 'cyan');
    this.print('CACHE POPULATION SUMMARY', 'bright');
    this.print('─'.repeat(60), 'cyan');

    this.print(`\n📍 Total Locations: ${cacheData.metadata.total_locations}`, 'green');
    this.print(`🏠 Total Shelters: ${cacheData.metadata.total_shelters}`, 'green');
    this.print(`🕐 Last Sync: ${new Date(cacheData.metadata.last_sync).toLocaleString()}`, 'cyan');

    // Calculate total beds
    const totalCapacity = cacheData.shelters.reduce((sum, s) => sum + s.capacity, 0);
    const totalAvailable = cacheData.shelters.reduce((sum, s) => sum + s.available_beds, 0);

    this.print(`\n🛏️  Total Bed Capacity: ${totalCapacity}`, 'yellow');
    this.print(`✨ Total Available Beds: ${totalAvailable}`, 'green');
    this.print(`📊 Occupancy Rate: ${((totalCapacity - totalAvailable) / totalCapacity * 100).toFixed(1)}%`, 'magenta');

    // List locations by type
    const types = ['shelter', 'service', 'clinic', 'food'];
    this.print('\n📋 Locations by Type:', 'cyan');
    types.forEach(type => {
      const count = cacheData.locations.filter(l => l.type === type).length;
      if (count > 0) {
        this.print(`   ${type}: ${count}`, 'dim');
      }
    });

    this.print('\n' + '─'.repeat(60) + '\n', 'cyan');
  }

  /**
   * Main run method
   */
  async run() {
    try {
      this.printBanner();

      this.print('This tool will populate the local cache database with:', 'yellow');
      this.print('  • Portland shelter locations', 'dim');
      this.print('  • Service provider information', 'dim');
      this.print('  • Bed availability metrics', 'dim');
      this.print('  • Shelter capacity data', 'dim');

      const answer = await this.question('\nContinue with cache population? (yes/no): ');

      if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
        this.print('\n❌ Cache population cancelled.', 'yellow');
        this.rl.close();
        return;
      }

      // Populate cache
      const cacheData = await this.populateCache();

      // Display summary
      this.displaySummary(cacheData);

      this.print('✅ Cache population completed successfully!', 'green');
      this.print('\n💡 The main app will now use this cached data on startup.', 'cyan');
      this.print('💡 To refresh, run this tool again or let the app update during startup.\n', 'cyan');

      this.rl.close();

    } catch (error) {
      this.print(`\n❌ Error: ${error.message}`, 'red');
      console.error(error);
      this.rl.close();
      process.exit(1);
    }
  }
}

// Run CLI if executed directly
if (require.main === module) {
  const cli = new CachePopulateCLI();
  cli.run();
}

module.exports = CachePopulateCLI;

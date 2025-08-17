/**
 * HMIS Facilities Validation Script
 * 
 * Validates that all shelters from HMIS OpenCommons are properly loaded
 * and displayed in the application.
 */

const { hmisOpenCommonsService } = require('../services/hmisOpenCommonsService');

async function validateHMISFacilities() {
  console.log('🏢 Starting HMIS Facilities Validation...\n');

  try {
    // Step 1: Fetch facilities from HMIS API
    console.log('📡 Step 1: Fetching facilities from HMIS OpenCommons API...');
    const apiResponse = await hmisOpenCommonsService.getAllFacilities();
    
    console.log(`✅ API Response: ${apiResponse.success ? 'Success' : 'Failed'}`);
    console.log(`📊 Total facilities returned: ${apiResponse.data.length}`);
    console.log(`🕒 Last updated: ${apiResponse.lastUpdated}`);
    
    if (apiResponse.error) {
      console.log(`⚠️  Error: ${apiResponse.error}`);
      console.log('📋 Using fallback/mock data for validation');
    }

    // Step 2: Analyze facility data
    console.log('\n📋 Step 2: Analyzing facility data...');
    
    const facilities = apiResponse.data;
    const facilitiesByType = {};
    const facilitiesByState = {};
    const facilitiesWithCoordinates = [];
    const facilitiesWithContact = [];
    
    facilities.forEach(facility => {
      // Count by type
      facilitiesByType[facility.type] = (facilitiesByType[facility.type] || 0) + 1;
      
      // Count by state
      if (facility.address.state) {
        facilitiesByState[facility.address.state] = (facilitiesByState[facility.address.state] || 0) + 1;
      }
      
      // Check for coordinates (map display)
      if (facility.address.latitude && facility.address.longitude) {
        facilitiesWithCoordinates.push(facility);
      }
      
      // Check for contact info
      if (facility.contact.phone || facility.contact.email || facility.contact.website) {
        facilitiesWithContact.push(facility);
      }
    });

    // Step 3: Display validation results
    console.log('\n📊 Validation Results:');
    console.log('='.repeat(50));
    
    console.log(`\n🏠 Facility Types Distribution:`);
    Object.entries(facilitiesByType).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} facilities`);
    });
    
    console.log(`\n🗺️  Geographic Distribution:`);
    Object.entries(facilitiesByState).forEach(([state, count]) => {
      console.log(`   ${state}: ${count} facilities`);
    });
    
    console.log(`\n📍 Map Display Validation:`);
    console.log(`   Facilities with coordinates: ${facilitiesWithCoordinates.length}/${facilities.length}`);
    console.log(`   Map display coverage: ${Math.round((facilitiesWithCoordinates.length / facilities.length) * 100)}%`);
    
    console.log(`\n📞 Contact Information Validation:`);
    console.log(`   Facilities with contact info: ${facilitiesWithContact.length}/${facilities.length}`);
    console.log(`   Contact info coverage: ${Math.round((facilitiesWithContact.length / facilities.length) * 100)}%`);

    // Step 4: Validate specific expected facilities
    console.log(`\n🔍 Checking for Expected Major Facilities:`);
    const expectedFacilities = [
      'Portland Rescue Mission',
      'Bybee Lakes Hope Center', 
      'Clark Center',
      'Rescue Mission',
      'Hope Center'
    ];
    
    const foundFacilities = [];
    expectedFacilities.forEach(expectedName => {
      const found = facilities.find(f => 
        f.name.toLowerCase().includes(expectedName.toLowerCase())
      );
      if (found) {
        foundFacilities.push(found.name);
        console.log(`   ✅ Found: ${found.name}`);
      } else {
        console.log(`   ❌ Missing: ${expectedName}`);
      }
    });

    // Step 5: Data quality validation
    console.log(`\n🔍 Data Quality Assessment:`);
    
    const facilitiesWithFullAddress = facilities.filter(f => 
      f.address.street && f.address.city && f.address.state
    );
    console.log(`   Complete addresses: ${facilitiesWithFullAddress.length}/${facilities.length} (${Math.round((facilitiesWithFullAddress.length / facilities.length) * 100)}%)`);
    
    const facilitiesWithCapacity = facilities.filter(f => 
      f.capacity.total && f.capacity.total > 0
    );
    console.log(`   Capacity information: ${facilitiesWithCapacity.length}/${facilities.length} (${Math.round((facilitiesWithCapacity.length / facilities.length) * 100)}%)`);
    
    const facilitiesWithServices = facilities.filter(f => 
      f.services && f.services.length > 0
    );
    console.log(`   Service information: ${facilitiesWithServices.length}/${facilities.length} (${Math.round((facilitiesWithServices.length / facilities.length) * 100)}%)`);

    // Step 6: Generate validation summary
    console.log(`\n📋 VALIDATION SUMMARY:`);
    console.log('='.repeat(50));
    
    const validationScore = {
      dataAvailability: apiResponse.success ? 100 : 50,
      mapReadiness: Math.round((facilitiesWithCoordinates.length / facilities.length) * 100),
      contactCompleteness: Math.round((facilitiesWithContact.length / facilities.length) * 100),
      dataQuality: Math.round((facilitiesWithFullAddress.length / facilities.length) * 100),
      expectedFacilities: Math.round((foundFacilities.length / expectedFacilities.length) * 100)
    };
    
    const overallScore = Object.values(validationScore).reduce((sum, score) => sum + score, 0) / Object.keys(validationScore).length;
    
    console.log(`   Overall Validation Score: ${Math.round(overallScore)}%`);
    console.log(`   Data Availability: ${validationScore.dataAvailability}%`);
    console.log(`   Map Display Readiness: ${validationScore.mapReadiness}%`);
    console.log(`   Contact Info Completeness: ${validationScore.contactCompleteness}%`);
    console.log(`   Data Quality: ${validationScore.dataQuality}%`);
    console.log(`   Expected Facilities Found: ${validationScore.expectedFacilities}%`);
    
    // Step 7: Recommendations
    console.log(`\n💡 Recommendations:`);
    if (validationScore.mapReadiness < 80) {
      console.log(`   - Improve coordinate data for better map display`);
    }
    if (validationScore.contactCompleteness < 70) {
      console.log(`   - Add more contact information for facilities`);
    }
    if (validationScore.expectedFacilities < 50) {
      console.log(`   - Verify API is returning complete facility dataset`);
    }
    if (overallScore > 80) {
      console.log(`   ✅ Facilities data is well-prepared for map and table display`);
    }

    return {
      success: true,
      facilities: facilities.length,
      score: Math.round(overallScore),
      details: validationScore,
      readyForDisplay: overallScore > 70
    };

  } catch (error) {
    console.error('❌ Validation failed:', error);
    return {
      success: false,
      error: error.message,
      readyForDisplay: false
    };
  }
}

// Export for use in tests or other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { validateHMISFacilities };
}

// Run validation if this script is executed directly
if (require.main === module) {
  validateHMISFacilities()
    .then(result => {
      console.log(`\n🎯 Final Result: ${result.success ? 'PASSED' : 'FAILED'}`);
      if (result.success) {
        console.log(`✅ ${result.facilities} facilities validated with ${result.score}% confidence`);
        console.log(`🖥️  Ready for display: ${result.readyForDisplay ? 'YES' : 'NO'}`);
      }
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}
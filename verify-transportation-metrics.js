/**
 * Transportation Metrics Verification Script
 *
 * Verifies that all transportation metrics are properly displayed
 * across Manager, Staff, and Client perspectives.
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(title) {
  console.log('\n' + '='.repeat(70));
  log(title, 'bright');
  console.log('='.repeat(70) + '\n');
}

function section(title) {
  log(`\n${'─'.repeat(60)}`, 'cyan');
  log(`  ${title}`, 'bright');
  log('─'.repeat(60), 'cyan');
}

function checkPass(message) {
  log(`✓ ${message}`, 'green');
}

function checkFail(message) {
  log(`✗ ${message}`, 'red');
}

function checkWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

// Verification results
const results = {
  passed: 0,
  failed: 0,
  warnings: 0
};

/**
 * Verify Mock Data Service
 */
function verifyMockDataService() {
  section('Verifying Mock Data Service');

  const mockDataPath = path.join(__dirname, 'src/services/mockTransportationData.ts');

  if (!fs.existsSync(mockDataPath)) {
    checkFail('Mock data service file not found');
    results.failed++;
    return false;
  }

  checkPass('Mock data service file exists');
  results.passed++;

  const content = fs.readFileSync(mockDataPath, 'utf8');

  // Check for required exports
  const requiredExports = [
    'mockVehicles',
    'mockDrivers',
    'mockRideRequests',
    'mockTransportationStats',
    'mockVouchers',
    'mockAlerts',
    'mockRoutes',
    'mockMaintenanceRecords',
    'mockFuelLogs',
    'transportationMockDataService'
  ];

  requiredExports.forEach(exportName => {
    if (content.includes(`export const ${exportName}`)) {
      checkPass(`Found export: ${exportName}`);
      results.passed++;
    } else {
      checkFail(`Missing export: ${exportName}`);
      results.failed++;
    }
  });

  // Check for required service functions
  const requiredFunctions = [
    'getVehicles',
    'getDrivers',
    'getRideRequests',
    'getTransportationStats',
    'getVouchers',
    'getAlerts',
    'getClientRides',
    'getClientVouchers'
  ];

  requiredFunctions.forEach(funcName => {
    if (content.includes(funcName)) {
      checkPass(`Found service function: ${funcName}`);
      results.passed++;
    } else {
      checkFail(`Missing service function: ${funcName}`);
      results.failed++;
    }
  });

  return true;
}

/**
 * Verify Transportation Perspectives Component
 */
function verifyPerspectivesComponent() {
  section('Verifying Transportation Perspectives Component');

  const componentPath = path.join(__dirname, 'src/components/TransportationPerspectives.tsx');

  if (!fs.existsSync(componentPath)) {
    checkFail('Transportation Perspectives component not found');
    results.failed++;
    return false;
  }

  checkPass('Transportation Perspectives component exists');
  results.passed++;

  const content = fs.readFileSync(componentPath, 'utf8');

  // Check for three perspective components
  const perspectives = [
    { name: 'ManagerPerspective', description: 'Manager view' },
    { name: 'StaffPerspective', description: 'Staff view' },
    { name: 'ClientPerspective', description: 'Client view' }
  ];

  perspectives.forEach(({ name, description }) => {
    if (content.includes(`const ${name}:`)) {
      checkPass(`Found ${description} component: ${name}`);
      results.passed++;
    } else {
      checkFail(`Missing ${description} component: ${name}`);
      results.failed++;
    }
  });

  // Check for perspective tabs
  const tabs = ['manager', 'staff', 'client'];
  tabs.forEach(tab => {
    if (content.includes(`perspective-${tab}`)) {
      checkPass(`Found ${tab} perspective tab`);
      results.passed++;
    } else {
      checkFail(`Missing ${tab} perspective tab`);
      results.failed++;
    }
  });

  return true;
}

/**
 * Verify Manager Perspective Metrics
 */
function verifyManagerMetrics() {
  section('Verifying Manager Perspective Metrics');

  const componentPath = path.join(__dirname, 'src/components/TransportationPerspectives.tsx');
  const content = fs.readFileSync(componentPath, 'utf8');

  // Required manager metrics
  const managerMetrics = [
    { id: 'metric-fleet-utilization', name: 'Fleet Utilization' },
    { id: 'metric-ontime-performance', name: 'On-Time Performance' },
    { id: 'metric-active-drivers', name: 'Active Drivers' },
    { id: 'metric-maintenance-cost', name: 'Maintenance Cost' }
  ];

  managerMetrics.forEach(({ id, name }) => {
    if (content.includes(id)) {
      checkPass(`Manager metric found: ${name} (${id})`);
      results.passed++;
    } else {
      checkFail(`Manager metric missing: ${name} (${id})`);
      results.failed++;
    }
  });

  // Check for required sections
  const managerSections = [
    { id: 'alerts-section', name: 'Alerts Section' },
    { id: 'fleet-status', name: 'Fleet Status' },
    { id: 'driver-status', name: 'Driver Status' },
    { id: 'rides-overview', name: 'Rides Overview' },
    { id: 'performance-metrics', name: 'Performance Metrics' }
  ];

  managerSections.forEach(({ id, name }) => {
    if (content.includes(id)) {
      checkPass(`Manager section found: ${name} (${id})`);
      results.passed++;
    } else {
      checkFail(`Manager section missing: ${name} (${id})`);
      results.failed++;
    }
  });

  // Check for performance metrics display
  const performanceMetrics = [
    'averageRideTime',
    'averageMilesPerRide',
    'totalMilesToday',
    'fuelEfficiency'
  ];

  performanceMetrics.forEach(metric => {
    if (content.includes(metric)) {
      checkPass(`Performance metric displayed: ${metric}`);
      results.passed++;
    } else {
      checkFail(`Performance metric missing: ${metric}`);
      results.failed++;
    }
  });
}

/**
 * Verify Staff Perspective Metrics
 */
function verifyStaffMetrics() {
  section('Verifying Staff Perspective Metrics');

  const componentPath = path.join(__dirname, 'src/components/TransportationPerspectives.tsx');
  const content = fs.readFileSync(componentPath, 'utf8');

  // Required staff metrics
  const staffMetrics = [
    { id: 'stat-pending-requests', name: 'Pending Requests' },
    { id: 'stat-active-rides', name: 'Active Rides' },
    { id: 'stat-available-vehicles', name: 'Available Vehicles' },
    { id: 'stat-available-drivers', name: 'Available Drivers' }
  ];

  staffMetrics.forEach(({ id, name }) => {
    if (content.includes(id)) {
      checkPass(`Staff metric found: ${name} (${id})`);
      results.passed++;
    } else {
      checkFail(`Staff metric missing: ${name} (${id})`);
      results.failed++;
    }
  });

  // Check for required sections
  const staffSections = [
    { id: 'staff-alerts', name: 'Staff Alerts' },
    { id: 'active-rides-section', name: 'Active Rides Section' },
    { id: 'pending-requests-section', name: 'Pending Requests Section' },
    { id: 'available-vehicles-section', name: 'Available Vehicles Section' },
    { id: 'available-drivers-section', name: 'Available Drivers Section' }
  ];

  staffSections.forEach(({ id, name }) => {
    if (content.includes(id)) {
      checkPass(`Staff section found: ${name} (${id})`);
      results.passed++;
    } else {
      checkFail(`Staff section missing: ${name} (${id})`);
      results.failed++;
    }
  });

  // Check for operational components
  const staffComponents = [
    'ActiveRideCard',
    'PendingRideCard',
    'VehicleAvailabilityItem',
    'DriverAvailabilityItem'
  ];

  staffComponents.forEach(component => {
    if (content.includes(component)) {
      checkPass(`Staff component found: ${component}`);
      results.passed++;
    } else {
      checkFail(`Staff component missing: ${component}`);
      results.failed++;
    }
  });
}

/**
 * Verify Client Perspective Metrics
 */
function verifyClientMetrics() {
  section('Verifying Client Perspective Metrics');

  const componentPath = path.join(__dirname, 'src/components/TransportationPerspectives.tsx');
  const content = fs.readFileSync(componentPath, 'utf8');

  // Check for required sections
  const clientSections = [
    { id: 'client-upcoming-rides', name: 'Upcoming Rides' },
    { id: 'client-vouchers', name: 'Transportation Vouchers' },
    { id: 'client-ride-history', name: 'Ride History' },
    { id: 'transportation-tips', name: 'Transportation Tips' }
  ];

  clientSections.forEach(({ id, name }) => {
    if (content.includes(id)) {
      checkPass(`Client section found: ${name} (${id})`);
      results.passed++;
    } else {
      checkFail(`Client section missing: ${name} (${id})`);
      results.failed++;
    }
  });

  // Check for client-specific components
  const clientComponents = [
    'ClientRideCard',
    'VoucherCard',
    'RideHistoryItem'
  ];

  clientComponents.forEach(component => {
    if (content.includes(component)) {
      checkPass(`Client component found: ${component}`);
      results.passed++;
    } else {
      checkFail(`Client component missing: ${component}`);
      results.failed++;
    }
  });

  // Check for client actions
  const clientActions = [
    'Request a Ride',
    'View My Vouchers',
    'Transportation Tips'
  ];

  clientActions.forEach(action => {
    if (content.includes(action)) {
      checkPass(`Client action found: ${action}`);
      results.passed++;
    } else {
      checkFail(`Client action missing: ${action}`);
      results.failed++;
    }
  });
}

/**
 * Verify Data Testids for E2E Testing
 */
function verifyTestIds() {
  section('Verifying Test IDs for E2E Testing');

  const componentPath = path.join(__dirname, 'src/components/TransportationPerspectives.tsx');
  const content = fs.readFileSync(componentPath, 'utf8');

  const requiredTestIds = [
    'perspective-manager',
    'perspective-staff',
    'perspective-client',
    'manager-content',
    'staff-content',
    'client-content'
  ];

  requiredTestIds.forEach(testId => {
    if (content.includes(`data-testid="${testId}"`)) {
      checkPass(`Test ID found: ${testId}`);
      results.passed++;
    } else {
      checkFail(`Test ID missing: ${testId}`);
      results.failed++;
    }
  });
}

/**
 * Verify Type Definitions
 */
function verifyTypeDefinitions() {
  section('Verifying Type Definitions');

  const typesPath = path.join(__dirname, 'src/types/Transportation.ts');

  if (!fs.existsSync(typesPath)) {
    checkFail('Transportation types file not found');
    results.failed++;
    return false;
  }

  checkPass('Transportation types file exists');
  results.passed++;

  const content = fs.readFileSync(typesPath, 'utf8');

  // Check for required interfaces
  const requiredInterfaces = [
    'Vehicle',
    'RideRequest',
    'Driver',
    'TransportationStats',
    'TransportationVoucher',
    'TransportationAlert',
    'MaintenanceRecord',
    'Route',
    'FuelLog'
  ];

  requiredInterfaces.forEach(interfaceName => {
    if (content.includes(`interface ${interfaceName}`)) {
      checkPass(`Type interface found: ${interfaceName}`);
      results.passed++;
    } else {
      checkFail(`Type interface missing: ${interfaceName}`);
      results.failed++;
    }
  });

  return true;
}

/**
 * Check Mock Data Quality
 */
function checkMockDataQuality() {
  section('Verifying Mock Data Quality');

  const mockDataPath = path.join(__dirname, 'src/services/mockTransportationData.ts');
  const content = fs.readFileSync(mockDataPath, 'utf8');

  // Count data records
  const dataChecks = [
    { name: 'mockVehicles', expectedMin: 3, pattern: /mockVehicles.*=.*\[/s },
    { name: 'mockDrivers', expectedMin: 3, pattern: /mockDrivers.*=.*\[/s },
    { name: 'mockRideRequests', expectedMin: 3, pattern: /mockRideRequests.*=.*\[/s },
    { name: 'mockVouchers', expectedMin: 2, pattern: /mockVouchers.*=.*\[/s },
    { name: 'mockAlerts', expectedMin: 2, pattern: /mockAlerts.*=.*\[/s }
  ];

  dataChecks.forEach(({ name, pattern }) => {
    if (pattern.test(content)) {
      checkPass(`Mock data array found: ${name}`);
      results.passed++;
    } else {
      checkFail(`Mock data array missing or malformed: ${name}`);
      results.failed++;
    }
  });

  // Check for realistic data
  const realismChecks = [
    { name: 'Vehicle names', pattern: /name:\s*['"].*Van|Bus|Car/i },
    { name: 'Driver names', pattern: /name:\s*['"][A-Z][a-z]+\s+[A-Z][a-z]+['"]/ },
    { name: 'Phone numbers', pattern: /phone:\s*['"][\d-()]+['"]/ },
    { name: 'Addresses', pattern: /address:\s*['"].*,.*ID/ },
    { name: 'Dates', pattern: /new Date\(['"]\d{4}-\d{2}-\d{2}/ }
  ];

  realismChecks.forEach(({ name, pattern }) => {
    if (pattern.test(content)) {
      checkPass(`Realistic data found: ${name}`);
      results.passed++;
    } else {
      checkWarning(`May lack realistic data: ${name}`);
      results.warnings++;
    }
  });
}

/**
 * Generate Summary Report
 */
function generateSummaryReport() {
  header('VERIFICATION SUMMARY');

  const total = results.passed + results.failed;
  const passRate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;

  log(`\nTotal Checks: ${total}`, 'bright');
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, 'red');
  log(`Warnings: ${results.warnings}`, 'yellow');
  log(`\nPass Rate: ${passRate}%`, results.failed === 0 ? 'green' : 'yellow');

  if (results.failed === 0) {
    log('\n✓ All verification checks passed!', 'green');
    log('Transportation metrics are properly implemented across all perspectives.\n', 'bright');
    return true;
  } else {
    log('\n✗ Some verification checks failed.', 'red');
    log(`Please review the ${results.failed} failed check(s) above.\n`, 'bright');
    return false;
  }
}

/**
 * Main Verification Runner
 */
function runVerification() {
  header('TRANSPORTATION METRICS VERIFICATION');
  log('Verifying transportation implementation across Manager, Staff, and Client perspectives\n', 'cyan');

  try {
    verifyTypeDefinitions();
    verifyMockDataService();
    checkMockDataQuality();
    verifyPerspectivesComponent();
    verifyManagerMetrics();
    verifyStaffMetrics();
    verifyClientMetrics();
    verifyTestIds();

    const success = generateSummaryReport();

    // Exit with appropriate code
    process.exit(success ? 0 : 1);

  } catch (error) {
    log('\n✗ Verification failed with error:', 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run verification
runVerification();

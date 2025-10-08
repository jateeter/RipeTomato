# Local Data Store Architecture

## Overview

The application now uses a local data store to cache information retrieved via APIs. This provides:
- **Improved Performance**: Data is served from local cache, reducing API calls
- **Offline Support**: Application can function with cached data when APIs are unavailable
- **Manager Control**: Data updates only occur when explicitly requested by managers
- **Reduced API Load**: Minimizes unnecessary API requests

## Architecture

### LocalDataStore Service (`src/services/localDataStore.ts`)

Central service managing all cached data with support for:
- **8 Data Categories**: shelters, services, weather, clients, staff, engagements, authorizations, hmis
- **Metadata Tracking**: Timestamps, record counts, data versions, source tracking
- **Export/Import**: Full cache export and import functionality
- **Automatic Fallback**: Falls back to API when cache is empty
- **Version Control**: Data versioning for compatibility

### Data Flow

```
┌─────────────────┐
│   Application   │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│ LocalDataStore API  │
├─────────────────────┤
│ - get<T>()          │
│ - set<T>()          │
│ - getOrFetch<T>()   │
│ - clear()           │
│ - getMetadata()     │
└────────┬────────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌─────┐
│ Cache  │ │ API │
│(Local  │ │     │
│Storage)│ │     │
└────────┘ └─────┘
```

## Manager Data Integration Dashboard

Located in `src/components/ManagerDataIntegration.tsx`, provides:

### Features

1. **Cache Status Overview**
   - Total data sources count
   - Total records cached
   - Last update timestamp

2. **Per-Category Management**
   - Individual refresh buttons
   - Age indicators
   - Stale data warnings (>1 hour)
   - Record counts
   - Portland-area community service locations

3. **Bulk Operations**
   - Refresh All Data: Updates all categories from APIs
   - Export Cache: Download complete cache as JSON
   - Clear Cache: Remove all cached data (with confirmation)

4. **Visual Indicators**
   - 🔄 Active refresh operations
   - ⚠️ Stale data warnings
   - Color-coded status badges

### Access

Managers can access the Data Integration view through:
1. Navigate to Services Manager Dashboard
2. Select "System" menu category
3. Click "Data Integration" tab

## Usage Example

### For Developers

```typescript
import { localDataStore } from '../services/localDataStore';

// Get cached data or fetch from API
const shelters = await localDataStore.getOrFetch(
  'shelters',
  () => shelterService.fetchShelters(),
  forceRefresh // optional, default false
);

// Manually set cache
await localDataStore.set('services', servicesData, 'api');

// Check if cache is stale
const isStale = await localDataStore.isStale('weather', 3600000); // 1 hour

// Clear specific category
await localDataStore.clear('clients');
```

### For Managers

1. **Normal Operation**: Application serves data from cache automatically
2. **Update Data**: Click "Refresh" on specific categories or "Refresh All Data"
3. **Monitor Freshness**: Yellow badges indicate stale data (>1 hour old)
4. **Backup/Restore**: Use "Export Cache" to download, import via localStorage

## Data Categories

| Category | Description | Update Frequency |
|----------|-------------|------------------|
| `shelters` | Shelter facilities and bed availability | Manager-controlled |
| `services` | Community service offerings | Manager-controlled |
| `weather` | Weather data and alerts | Manager-controlled |
| `clients` | Client information (privacy-protected) | Manager-controlled |
| `staff` | Staff assignments and schedules | Manager-controlled |
| `engagements` | Engagement opportunities | Manager-controlled |
| `authorizations` | Privacy authorizations | Manager-controlled |
| `hmis` | HMIS integration data | Manager-controlled |

## Portland-Area Locations

The system includes predefined locations for Portland, Oregon community services:

- **Counseling**: Transition Projects - Counseling Center
- **Job Training**: Worksystems Inc - SE Portland
- **Health Services**: Outside In Medical Clinic
- **Housing**: JOIN Resource Center
- **Meals**: Blanchet House - Old Town
- **Life Skills**: Portland Rescue Mission - Burnside
- **Peer Support**: Central City Concern - NW Portland
- **Case Management**: Cascadia Behavioral Healthcare

## Benefits

### Performance
- **Reduced Latency**: Local cache eliminates network delays
- **Lower Bandwidth**: Fewer API requests save bandwidth
- **Faster Load Times**: Instant data access from local storage

### Reliability
- **Offline Capable**: Functions without active internet connection
- **API Failure Tolerance**: Continues with cached data if APIs are down
- **Predictable Behavior**: Controlled update cycle prevents unexpected changes

### Control
- **Manager-Driven Updates**: Data only refreshes when explicitly requested
- **Audit Trail**: Metadata tracks update history
- **Selective Refresh**: Update only what's needed

## Implementation Notes

### Storage
- Uses browser `localStorage` for persistence
- Key prefix: `idaho_app_cache_`
- Metadata key: `idaho_app_metadata`
- Current version: `1.0.0`

### Best Practices

1. **Always use `getOrFetch()`** for automatic cache management
2. **Set appropriate staleness thresholds** based on data volatility
3. **Handle cache misses gracefully** with try-catch blocks
4. **Clear cache on major version updates** to prevent compatibility issues
5. **Export cache before major operations** for backup purposes

### Future Enhancements

- [ ] Background auto-refresh for critical categories
- [ ] Cache size monitoring and limits
- [ ] Compression for large datasets
- [ ] Sync across browser tabs
- [ ] Automatic stale data refresh reminders
- [ ] Import cache from file upload
- [ ] Per-category retention policies

## Security Considerations

- **Client Data**: Privacy-protected, manager-only access
- **Authorization Data**: Encrypted where possible
- **Export**: Contains sensitive data, handle securely
- **Access Control**: Manager-level permissions required

## Test Results

### Unit Tests
- **Status**: ✅ **380 passing**, 9 skipped (by design)
- **Framework**: Jest
- **Test Suites**: 23/24 passing (1 skipped)
- **Coverage**: All core services and components tested
- **Performance**: All tests complete in ~3s
- **Success Rate**: 100% of executable tests passing

### End-to-End Tests
- **Status**: ✅ **79/79 passing** (100% success rate)
- **Framework**: Cypress
- **Total Duration**: ~2.5 minutes
- **Breakdown**:
  - `agent-basic.cy.js`: ✅ 4/4 passing (15s)
  - `agent-workflow-final.cy.js`: ✅ 9/9 passing (45s)
  - `basic-workflow.cy.js`: ✅ 8/8 passing (4s)
  - `client-dashboard.cy.ts`: ✅ 38/38 passing (62s)
  - `weather-dashboard-integration.cy.ts`: ✅ 20/20 passing (20s)

### Test Improvement Journey
- **Starting Point**: 41/79 E2E tests passing (52%)
- **Mid-Progress**: 66/79 E2E tests passing (84%)
- **Final Result**: 79/79 E2E tests passing (100%)

### Key Fixes Applied
1. **Browser Compatibility**: Fixed `process is not defined` error in MultiLanguageRuntime
2. **Deterministic Test Data**: Implemented predictable mock data for Portland community locations
3. **Navigation System**: Added programmatic navigation via testExposureService
4. **Test Selectors**: Improved CSS selectors to match actual DOM structure
5. **Client ID Matching**: Aligned test client IDs with application defaults
6. **Authorization Flow**: Fixed localStorage key matching for privacy tests
7. **Syntax Corrections**: Fixed invalid Cypress syntax patterns

### Test Coverage
- ✅ Agent workflows and multi-language runtime
- ✅ Client dashboard (overview, schedule, privacy views)
- ✅ Engagement enrollment and authorization flows
- ✅ Weather dashboard integration with NOAA
- ✅ HMIS API integration
- ✅ Offline mode and error handling
- ✅ Responsive design across mobile/tablet/desktop
- ✅ Portland community service locations

## Troubleshooting

### Cache not updating
1. Check browser console for errors
2. Verify localStorage is not full
3. Try clearing cache and refreshing

### Stale data persisting
1. Click "Refresh" button for affected category
2. Check "Last Update" timestamp in overview
3. Verify API connectivity

### Import fails
1. Validate JSON format
2. Check data version compatibility
3. Ensure no localStorage quota exceeded

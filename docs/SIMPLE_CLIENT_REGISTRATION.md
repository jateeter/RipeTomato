# Simple Client Registration System

## Overview

The Simple Client Registration System is specifically designed for the homeless population with minimal technical expertise. It provides a streamlined, iPad-optimized registration workflow that requires only basic information while automatically handling complex technical tasks like Solid Pod provisioning and demographic data augmentation.

## Design Principles

### 1. Minimal User Input
**Only 6 required data points:**
- First name (required)
- Street duration (required)
- Has children? (yes/no)
- Has partner? (yes/no)
- Has other family? (yes/no)
- Contact info (optional)

Everything else is **automatic** or **optional**.

### 2. Hidden Complexity
**What happens automatically (hidden from user):**
- ✅ Solid Pod provisioning
- ✅ Unique client ID generation
- ✅ Demographic data augmentation
- ✅ Risk assessment calculation
- ✅ Service recommendations
- ✅ Data storage (local + Solid Pod)
- ✅ Privacy setup

**User never sees:** WebID, Pod URLs, storage endpoints, encryption, technical jargon.

### 3. iPad Optimization
**Touch-friendly interface:**
- Minimum 60px touch targets on all buttons
- Minimum 80px for primary action buttons
- Large 2xl-4xl text sizing
- High contrast colors
- Simple, linear workflow (no complex navigation)
- Progress indicator on every screen

### 4. 5G-Only / Minimal Connectivity
**Offline-first design:**
- Auto-save on each step to localStorage
- Resume from saved progress if connection lost
- Fallback to local storage if Solid Pod unavailable
- Works with intermittent connectivity

### 5. Inflection Point-Based Logic

**Street Duration** determines urgency and recommendations:
- **First-time / < 1 month**: Moderate urgency → Rapid rehousing, job training
- **1-6 months**: Moderate urgency → Traditional services
- **6-12 months**: High urgency → Intensive case management
- **Over a year / Chronic**: High urgency → Permanent housing, health services

**Family Situation** determines priority:
- **Children WITH client**: **CRITICAL** urgency → Immediate family shelter
- **Children elsewhere**: High priority → Family reunification services
- **Partner with client**: Couple-friendly services
- **Family contact available**: Family support services

## System Architecture

### Service Layer (`simpleClientRegistration.ts`)

```typescript
interface MinimalClientInput {
  firstName: string;
  lastName?: string;
  preferredName?: string;
  streetDuration: 'first-time' | 'less-than-month' | '1-6-months' |
                  '6-12-months' | 'over-year' | 'chronic';
  hasChildren: boolean;
  childrenWithClient?: number;
  childrenElsewhere?: number;
  hasPartner: boolean;
  partnerWithClient?: boolean;
  hasOtherFamily: boolean;
  familyContact?: 'yes' | 'no' | 'maybe';
  phoneNumber?: string;
  email?: string;
}
```

**Automatic Processes:**

1. **Client ID Generation**
   - Format: `FIRSTNAME-MMDDXX`
   - Example: `SARAH-121502`
   - Memorable and simple to share with staff

2. **Solid Pod Provisioning**
   - Attempts to create pod at `solidcommunity.net`
   - Generates secure random password (hidden)
   - Falls back to localStorage if unavailable
   - Completely transparent to user

3. **Demographic Augmentation**
   - Estimates age from street duration
   - Assigns Portland area zip code
   - Checks veteran status (public registries)
   - Identifies disability indicators
   - Uses publicly available data sources

4. **Risk Profile Calculation**
   ```typescript
   interface RiskProfile {
     urgency: 'critical' | 'high' | 'moderate' | 'low';
     priorityServices: string[];
     recommendedPrograms: string[];
     familySupport: boolean;
   }
   ```

5. **Service Recommendations**
   - Immediate shelter (always first)
   - Meals (always second)
   - Family services (if children)
   - Health services (priority for chronic)
   - Job training (priority for recent)
   - Counseling (medium priority)

### UI Component (`SimpleClientRegistration.tsx`)

**6-Step Workflow:**

**Step 1: Name**
- Large text inputs
- Optional fields clearly marked
- Auto-focus on first field

**Step 2: Street Duration**
- 6 large buttons with icons
- Visual feedback on selection
- Clear, non-technical language

**Step 3: Children**
- Yes/No toggle
- Conditional follow-up (how many with you, how many elsewhere)
- Large number inputs

**Step 4: Partner**
- Yes/No toggle
- Conditional follow-up (with you or not)

**Step 5: Other Family**
- Yes/No toggle
- Conditional follow-up (can we help contact them)
- Yes/Maybe/No options

**Step 6: Contact Info**
- Clearly marked as optional
- Phone and email
- Green "ready to complete" indicator

**Progress Features:**
- Progress bar at top
- Step counter (e.g., "Step 3 of 6")
- Percentage complete
- Auto-save to localStorage on each step
- Resume capability after browser refresh

**Success Screen:**
- Large welcome message with preferred name
- Client ID prominently displayed
- Urgency indicator (color-coded)
- Top 3 service recommendations
- Large button to view all services

## Testing Strategy

### E2E Test Coverage (`simple-client-registration.cy.ts`)

**Scenario 1: First-time, no family (Simple case)**
- Minimal complexity
- Tests basic workflow
- Verifies localStorage storage
- Checks moderate urgency assignment

**Scenario 2: Parent with children (Critical urgency)**
- Children WITH client → critical
- Children elsewhere → high priority
- Family services recommended
- Phone number capture

**Scenario 3: Chronic homelessness (High urgency)**
- Several years on streets
- Health services prioritized
- Permanent housing recommended

**Scenario 4: Couple together**
- Partner with client
- Couple-friendly services
- Email capture

**Scenario 5: Progress saving**
- Auto-save verification
- Resume from saved state
- Progress cleared after completion

**Scenario 6: Touch targets**
- 60px minimum height validation
- Large text sizing
- iPad-optimized layout

**Scenario 7: Client ID generation**
- Format validation (FIRSTNAME-MMDDXX)
- Uniqueness

**Scenario 8: Solid Pod provisioning**
- Automatic and hidden
- localStorage fallback
- No technical details shown to user

**Scenario 9: Service recommendations**
- Shelter (all clients)
- Job training (recent homelessness)
- Health services (chronic)

**Scenario 10: Offline functionality**
- Works after initial load
- localStorage persistence
- Completes without network

## Integration Points

### 1. Main App (`App.tsx`)
```typescript
type ActiveView = 'community-hub' | 'legacy-shelter' |
                  'client-dashboard' | 'simple-registration';
```

Navigate via:
```javascript
window.setActiveView('simple-registration');
```

### 2. Test Exposure (`testExposureService.ts`)
Registration view accessible in E2E tests for automated validation.

### 3. Client Dashboard
After successful registration, "View All Services" button navigates to `client-dashboard` view with full service access.

### 4. Solid Pod Integration
- Transparent to user
- Automatic provisioning
- Fallback to localStorage
- Future sync when connectivity restored

## Usage Workflow

### For Staff:
1. Hand iPad to client
2. Navigate to registration (one tap)
3. Let client complete at their own pace
4. Staff available for questions only
5. Client receives ID at end
6. Staff can look up by ID immediately

### For Clients:
1. Start with name screen
2. Answer 5 simple questions
3. Optionally provide contact info
4. Get instant client ID
5. See recommended services
6. Access full service catalog

## Technical Requirements

**Minimum Setup:**
- iPad (or any tablet) with 5G connectivity
- Safari, Chrome, or any modern browser
- No app download required
- No account creation needed
- No login credentials to remember

**Works with:**
- Intermittent connectivity (auto-save)
- Offline after initial load
- Older devices (responsive design)
- Various screen sizes (mobile-first)

## Data Privacy & Security

### What's Stored:
- **Local Storage**: Lightweight reference, auto-save progress
- **Solid Pod**: Full profile (if available)
- **No external database**: Privacy-first approach

### Who Can Access:
- Client owns their Solid Pod
- Staff can look up by client ID (with authorization)
- No third-party access
- HIPAA-aware design

### Encryption:
- HTTPS for all connections
- Solid Pod encrypted storage
- Secure password generation (hidden from user)
- No PII in URLs or logs

## Future Enhancements

**Planned:**
- [ ] Voice-to-text for name input
- [ ] Multiple language support (Spanish, Russian, Vietnamese)
- [ ] Photo ID capture (optional)
- [ ] Barcode/QR code generation for client ID
- [ ] SMS notification of client ID
- [ ] Integration with regional HMIS
- [ ] Automatic veteran status verification
- [ ] Disability services integration
- [ ] Real-time bed availability during registration

**Under Consideration:**
- [ ] Facial recognition for returning clients
- [ ] Biometric authentication (fingerprint)
- [ ] Apple Wallet / Google Wallet integration
- [ ] Offline-first sync when reconnected
- [ ] Staff-assisted mode for clients with disabilities

## Deployment Considerations

### iPad Configuration:
```bash
# Kiosk mode recommended
# Single app mode (Guided Access on iOS)
# Auto-clear cache daily
# Charge overnight
# 5G always on
```

### Recommended Setup:
- Multiple iPads at intake desk
- One staff member supervising
- Quiet, private area for registration
- Charging stations nearby
- Backup paper forms (just in case)

### Training Staff:
- 15-minute overview
- Focus on when to intervene vs. let client work
- How to look up client by ID
- What to do if iPad fails
- Privacy and sensitivity training

### Training Clients:
- No formal training needed
- Staff introduction: "Just answer a few questions"
- Emphasis on optional fields
- "Stop anytime and ask for help"

## Success Metrics

**Tracked Automatically:**
- Time to complete registration (target: < 5 minutes)
- Completion rate (target: > 95%)
- Abandonment at each step
- Help requests from clients
- Staff interventions needed
- Accuracy of risk assessments
- Service recommendation uptake

**Privacy-Protected Aggregates:**
- Demographics of population served
- Urgency distribution
- Family status patterns
- Street duration trends
- Service utilization by risk level

## Contact & Support

**For Technical Issues:**
- See TECHNICAL_README.md for developer docs
- Contact system administrator

**For Feature Requests:**
- Submit through organizational channels
- Monthly stakeholder meetings

**For Training:**
- See STAFF_USER_GUIDE.md
- Request on-site training sessions

---

## Quick Reference

### Registration Flow
```
Name → Duration → Children → Partner → Family → Contact → Success
  ↓        ↓          ↓          ↓         ↓         ↓         ↓
Auto-save on each step
```

### Urgency Assignment
```
Children with client → CRITICAL
Chronic (over 1 year) → HIGH
Recent (< 1 month) → MODERATE
Everything else → LOW
```

### Client ID Format
```
FIRSTNAME-MMDDXX
Example: MARIA-010823
```

### Touch Target Sizes
```
Inputs: 60px minimum
Buttons: 60px minimum
Primary actions: 80px minimum
```

---

**Last Updated**: 2025-01-XX
**Version**: 1.0.0
**Status**: Ready for deployment

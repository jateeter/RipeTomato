# Idaho Community Shelter Management System

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Cypress](https://img.shields.io/badge/Cypress-17202C?logo=cypress&logoColor=white)](https://www.cypress.io/)

A comprehensive, privacy-first shelter management system featuring **unified individual data ownership**, **real-time HMIS integration**, **intelligent calendar management**, **voice services**, and **interactive geospatial navigation** with satellite mapping capabilities.

## 🌟 System Overview

This revolutionary shelter management platform transforms how homeless services are delivered by:

- **🔐 Individual Data Ownership**: HAT personal data vaults with zero-knowledge architecture
- **📱 Digital Wallet Integration**: Apple Wallet passes for seamless facility access
- **🗺️ Real-time HMIS Integration**: Live data from hmis.opencommons.org with satellite mapping
- **📅 Intelligent Calendar System**: Google Calendar API with synchronized personal and service calendars
- **📞 Voice & SMS Services**: Google Voice integration with intelligent reminder agents
- **🧠 AI Agents**: Blood pressure monitoring and calendar reminder agents with proactive notifications
- **🌐 Spatial Navigation**: Interactive OpenStreetMap with satellite layers and facility clustering
- **🔄 End-to-End Testing**: Comprehensive Cypress test suite for all workflows

## 🚀 Major Features & Capabilities

### 🏠 **Comprehensive Shelter Management**
- **Real-time Bed Tracking**: Live availability from HMIS OpenCommons database
- **Interactive Registration**: Client-to-bed registration with calendar integration
- **Spatial Facility Management**: Satellite map views with facility clustering
- **Multi-view Dashboards**: Map, table, and split-view facility displays
- **Emergency Registration Workflows**: Priority handling for urgent cases

### 🔐 **Privacy-First Data Ownership**
- **HAT Data Vaults**: Personal encrypted data microservers for each individual
- **Solid Pod Integration**: Decentralized backup storage with complete data portability  
- **Zero-Knowledge Architecture**: Service providers cannot access raw personal data
- **Granular Consent Management**: Client-controlled data sharing permissions
- **GDPR Compliance**: Built-in privacy regulation compliance by design

### 📱 **Digital Wallet Integration**
- **Shelter Access Passes**: QR-coded facility entry and service access
- **Health Credential Passes**: Medical information for emergency situations
- **Identification Passes**: Official shelter ID with verification capabilities
- **Service Entitlement Passes**: Program access and benefit management
- **Emergency Contact Passes**: Critical contact information always available

### 📅 **Intelligent Calendar System**
- **Personal Calendars**: Unique calendars for clients, staff, and managers
- **Shelter Calendars**: Facility-specific scheduling and capacity management
- **Bi-directional Sync**: Personal and service delivery calendar synchronization
- **Google Calendar API**: Full integration with Google Workspace
- **Calendar Reminder Agent**: AI-powered SMS/voice reminder system

### 🗺️ **Advanced Geospatial Features**
- **HMIS OpenCommons Integration**: Real-time facility data from hmis.opencommons.org
- **Satellite Map Layers**: High-resolution satellite imagery with OpenStreetMap
- **Facility Clustering**: Dynamic marker clustering for large datasets
- **Interactive Popups**: Detailed facility information with contact links
- **Multi-layer Support**: OSM, satellite, and terrain layer switching

### 📞 **Voice & Communication Services**
- **Google Voice Integration**: SMS and voice call capabilities
- **Role-based Actions**: Different communication features for clients/staff/managers
- **Emergency Broadcasting**: Multi-recipient emergency alerts
- **Voicemail Management**: Automated voicemail transcription and handling
- **Communication Analytics**: Call/message statistics and reporting

### 🧠 **Intelligent Agent Services**
- **Blood Pressure Agent**: Automated health monitoring with SMS alerts
- **Calendar Reminder Agent**: Proactive event reminders via SMS/voice/notifications
- **Rule-based Triggers**: Customizable reminder rules by user type
- **Multi-channel Notifications**: SMS, voice calls, push notifications, and email
- **Agent Metrics**: Performance tracking and satisfaction scoring

### 🏥 **Health & Wellness Integration**
- **HealthKit Integration**: iOS health data synchronization
- **Vital Signs Monitoring**: Blood pressure tracking with threshold alerts
- **Medical Record Storage**: Encrypted health information in personal vaults
- **Emergency Medical Information**: Critical health data in wallet passes
- **Care Coordination**: Health data sharing with consent management

## 🛠️ Technology Stack

### **Frontend & Core**
- **React 19.1.0** with TypeScript for type-safe development
- **Tailwind CSS** for responsive design and styling
- **Leaflet.js** for interactive mapping with satellite layers
- **React Hooks** for modern state management patterns

### **Data Ownership & Privacy**
- **Dataswift HAT Platform** - Personal data vaults with zero-knowledge encryption
- **Solid Pod Protocol** - Decentralized data storage and portability
- **Apple Wallet PKPass** - Digital pass generation and management
- **OAuth2 & JWT** - Secure authentication and authorization

### **External Integrations**
- **Google Calendar API** - Calendar management and synchronization
- **Google Voice API** - SMS and voice communication services
- **Twilio SDK** - Backup communication provider
- **HealthKit API** - iOS health data integration
- **HMIS OpenCommons** - Real-time homeless services data

### **Mapping & Geospatial**
- **OpenStreetMap** - Base mapping with multiple tile providers
- **Satellite Imagery** - High-resolution satellite map layers
- **Marker Clustering** - Dynamic facility grouping for performance
- **Geocoding Services** - Address to coordinate conversion

### **Testing & Quality**
- **Cypress** - End-to-end testing framework
- **Jest** - Unit and integration testing
- **ESLint** - Code quality and style enforcement
- **TypeScript** - Type safety and developer experience

## 📦 Installation & Setup

### **Prerequisites**

- **Node.js 18.x or higher**
- **npm or yarn package manager**
- **Git for version control**
- **Modern web browser** (Chrome, Firefox, Safari, Edge)

### **Quick Start**

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/idaho-shelter-management.git
   cd idaho-shelter-management
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and configuration
   ```

4. **Build the application**
   ```bash
   npm run build
   ```

5. **Start the development server**
   ```bash
   npm start
   ```

6. **Open in browser**
   - Navigate to `http://localhost:3000`
   - The application will load with all integrated services

### **Environment Configuration**

Create a `.env` file with the following variables:

```bash
# Google Services
REACT_APP_GOOGLE_CALENDAR_API_KEY=your_calendar_api_key
REACT_APP_GOOGLE_VOICE_API_KEY=your_voice_api_key
REACT_APP_GOOGLE_CLIENT_ID=your_client_id

# Twilio (Backup Communication)
REACT_APP_TWILIO_ACCOUNT_SID=your_twilio_sid
REACT_APP_TWILIO_AUTH_TOKEN=your_twilio_token
REACT_APP_TWILIO_PHONE_NUMBER=your_twilio_phone

# HAT Configuration
REACT_APP_HAT_DOMAIN=hubofallthings.net
REACT_APP_HAT_APPLICATION_ID=idaho-shelter-management

# Apple Wallet
REACT_APP_APPLE_TEAM_ID=your_team_identifier
REACT_APP_WALLET_PASS_TYPE_ID=pass.com.idaho.shelter

# HMIS Integration
REACT_APP_HMIS_BASE_URL=https://hmis.opencommons.org
REACT_APP_HMIS_API_KEY=your_hmis_api_key

# Map Services
REACT_APP_MAPBOX_TOKEN=your_mapbox_token
REACT_APP_OPENCAGE_API_KEY=your_geocoding_key
```

## 🔧 Service Configuration

### **Google Calendar API Setup**

1. **Enable Google Calendar API** in Google Cloud Console
2. **Create OAuth 2.0 credentials** for web application
3. **Configure authorized domains** for your deployment
4. **Set up service account** for server-side calendar operations

```typescript
const calendarConfig = {
  apiKey: process.env.REACT_APP_GOOGLE_CALENDAR_API_KEY,
  clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
  discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
  scope: 'https://www.googleapis.com/auth/calendar'
};
```

### **Google Voice & Twilio Setup**

1. **Configure Google Voice** for organization account
2. **Set up Twilio account** for backup SMS/voice services
3. **Configure webhook endpoints** for message handling
4. **Set up phone number verification** for client registration

```typescript
const voiceConfig = {
  twilioAccountSid: process.env.REACT_APP_TWILIO_ACCOUNT_SID,
  twilioAuthToken: process.env.REACT_APP_TWILIO_AUTH_TOKEN,
  twilioPhoneNumber: process.env.REACT_APP_TWILIO_PHONE_NUMBER,
  googleVoiceNumber: '+12085551234' // Your Google Voice number
};
```

### **HMIS OpenCommons Integration**

1. **Register with HMIS OpenCommons** for API access
2. **Obtain API credentials** for facility data access
3. **Configure data synchronization** intervals and caching
4. **Set up webhook notifications** for real-time updates

```typescript
const hmisConfig = {
  baseUrl: 'https://hmis.opencommons.org',
  apiKey: process.env.REACT_APP_HMIS_API_KEY,
  syncInterval: 300000, // 5 minutes
  cacheTimeout: 900000, // 15 minutes
  retryAttempts: 3,
  enableWebhooks: true
};
```

### **HAT & Solid Pod Configuration**

1. **Set up HAT application** with Dataswift platform
2. **Configure Solid Pod provider** for backup storage
3. **Generate encryption keys** for client data protection
4. **Set up data synchronization** between HAT and Solid

```typescript
const dataOwnershipConfig = {
  hat: {
    domain: 'hubofallthings.net',
    applicationId: 'idaho-shelter-management',
    namespace: 'shelter',
    apiVersion: 'v2.6'
  },
  solid: {
    provider: 'https://solidcommunity.net',
    clientId: 'idaho-shelter-app',
    redirectUri: `${window.location.origin}/solid/callback`
  }
};
```

## 🚀 Running the Application

### **Development Mode**

```bash
# Start development server with hot reload
npm start

# Start with specific port
PORT=3001 npm start

# Start with environment-specific configuration
NODE_ENV=development npm start
```

### **Production Build**

```bash
# Create optimized production build
npm run build

# Serve production build locally
npm install -g serve
serve -s build

# Deploy to web server
# Copy build/ directory contents to your web server
```

### **Testing**

```bash
# Run unit and integration tests
npm test

# Run Cypress end-to-end tests (interactive)
npm run cy:open

# Run Cypress tests (headless)
npm run cy:run

# Run full test suite with server startup
npm run test:e2e

# Run specific test browsers
npm run cy:run:chrome
npm run cy:run:firefox
```

## 📊 Core Workflows

### **1. Client Registration & Bed Assignment**

```typescript
// Complete registration workflow
1. Navigate to client registration form
2. Fill basic client information (name, DOB, contact)
3. Add emergency contact information
4. Search and select available shelter
5. Choose bed type and dates
6. Submit registration
7. Automatic creation of:
   - HAT personal data vault
   - Apple Wallet passes (shelter access, ID, emergency)
   - Google Calendar events (personal + shelter)
   - SMS confirmation to client
   - Voice reminder agent activation
```

### **2. HMIS Data Synchronization**

```typescript
// Real-time facility data workflow  
1. Connect to HMIS OpenCommons API
2. Fetch current facility data
3. Update local cache with new information
4. Sync facility availability with maps
5. Update calendar capacity information
6. Trigger webhook notifications
7. Update client-facing displays
```

### **3. Calendar & Reminder Integration**

```typescript
// Calendar reminder workflow
1. Client registration creates calendar events
2. Personal and shelter calendars sync
3. Reminder agent monitors upcoming events
4. SMS/voice reminders sent based on rules
5. Client acknowledgment tracking
6. Follow-up reminders for unacknowledged events
```

### **4. Voice Services & Communication**

```typescript
// Voice communication workflow
1. Client registration enables voice actions
2. SMS confirmation sent automatically
3. Voice reminders scheduled based on calendar
4. Emergency alerts broadcast to contacts
5. Communication logs stored in personal vault
6. Analytics and reporting for staff
```

## 🧪 Testing & Quality Assurance

### **Cypress End-to-End Tests**

The application includes comprehensive Cypress tests covering:

- **Client Registration Workflow** - Complete registration process validation
- **Calendar Integration** - Event creation and synchronization testing
- **HMIS Data Sync** - Real-time facility data validation
- **Voice Services** - SMS and voice communication testing
- **Map Integration** - Satellite view and facility interaction
- **Error Handling** - Service failure and recovery scenarios
- **Cross-browser Testing** - Chrome, Firefox, Edge compatibility

```bash
# Run specific test suites
npx cypress run --spec "cypress/e2e/client-registration.cy.js"
npx cypress run --spec "cypress/e2e/integration-tests.cy.js"

# Run with specific browser and headed mode
npx cypress run --browser chrome --headed

# Open interactive test runner
npx cypress open
```

### **Test Coverage Areas**

- ✅ **Client Registration**: Complete workflow including edge cases
- ✅ **Data Ownership**: HAT vault creation and Solid Pod sync
- ✅ **Calendar Integration**: Event creation and bi-directional sync
- ✅ **HMIS Integration**: Real-time data synchronization
- ✅ **Voice Services**: SMS, voice calls, and emergency alerts
- ✅ **Map Integration**: Satellite layers and facility interaction
- ✅ **Agent Services**: Reminder and health monitoring agents
- ✅ **Error Handling**: Service failures and retry mechanisms

## 📱 User Guide

### **For Shelter Staff**

1. **Dashboard Access**
   - Navigate to Services Manager for comprehensive facility overview
   - Switch between different tabs: Overview, Facilities, HMIS Facilities, Clients
   - Monitor real-time bed availability and occupancy statistics

2. **Client Registration**
   - Use "Client Registration" button to start new client intake
   - Complete basic information and emergency contacts
   - Select shelter and bed type from real-time availability
   - System automatically creates personal data vault and wallet passes

3. **Facility Management**
   - View facilities on interactive satellite map
   - Switch between map, table, and split views
   - Export facility data as CSV or JSON
   - Monitor HMIS synchronization status

4. **Communication Management**
   - Send SMS confirmations and reminders to clients
   - Use voice services for urgent communications
   - Monitor communication logs and analytics
   - Set up emergency broadcast lists

### **For Clients**

1. **Personal Data Control**
   - Access personal HAT data vault through provided credentials
   - Manage privacy settings and data sharing permissions
   - View complete audit trail of data access
   - Export personal data at any time

2. **Digital Wallet Usage**
   - Add shelter access passes to Apple Wallet
   - Use QR codes for facility entry and service access
   - Keep emergency contact information readily available
   - Access health credentials for medical situations

3. **Calendar & Reminders**
   - Receive SMS and voice reminders for appointments
   - View personal calendar synchronized with shelter services
   - Manage reminder preferences and contact methods
   - Acknowledge receipt of important notifications

### **For Administrators**

1. **System Configuration**
   - Configure API keys and service integrations
   - Set up HAT domains and Solid Pod providers
   - Manage calendar synchronization rules
   - Configure voice service settings and phone numbers

2. **Data Management**
   - Monitor HMIS data synchronization health
   - Review privacy compliance and consent records
   - Manage backup and disaster recovery procedures
   - Configure data retention and deletion policies

3. **Analytics & Reporting**
   - View shelter occupancy trends and statistics
   - Monitor communication service usage and costs
   - Review agent performance and client satisfaction
   - Generate compliance and audit reports

## 🔒 Privacy & Security

### **Zero-Knowledge Data Architecture**

- **Client Data Vaults**: All personal data encrypted with client-controlled keys
- **Service Provider Blindness**: Staff cannot access raw personal data
- **Privacy-Preserving Analytics**: Aggregate insights without individual data exposure
- **Consent-Based Sharing**: Granular permissions for all data access

### **Security Measures**

- **End-to-End Encryption**: All data encrypted in transit and at rest
- **Multi-Factor Authentication**: Secure access for staff and administrative users
- **Regular Security Audits**: Automated vulnerability scanning and manual reviews
- **Incident Response**: Documented procedures for security breach handling

### **Compliance Features**

- **GDPR Compliance**: Built-in data protection and privacy rights
- **Right to Erasure**: Complete data deletion capabilities
- **Data Portability**: Export all personal data in standard formats
- **Consent Management**: Granular consent tracking and withdrawal

## 🌐 API Documentation

### **HMIS OpenCommons Integration**

```typescript
// Fetch facilities from HMIS OpenCommons
const facilities = await hmisOpenCommonsService.getAllFacilities({
  state: 'ID',
  type: 'Emergency Shelter',
  availability: 'available'
});

// Sync with local database
const syncResult = await hmisInventorySyncService.performFullSync();
```

### **Google Calendar Integration**

```typescript
// Create personal calendar for client
const calendarId = await googleCalendarService.createPersonalCalendar(
  clientId, 
  'client',
  { name: 'John Doe', email: 'john@example.com' }
);

// Create bed registration event
await googleCalendarService.createBedRegistrationEvent(
  bedRegistration,
  shelterCalendarId,
  clientCalendarId
);
```

### **Voice Services API**

```typescript
// Send SMS confirmation
await googleVoiceService.sendMessage(
  clientPhone,
  'Welcome to Idaho Community Shelter. Your registration is confirmed.',
  'general'
);

// Make voice call
await googleVoiceService.makeCall(clientPhone, 'general');
```

## 🤝 Contributing

We welcome contributions to improve the Idaho Community Shelter Management System!

### **Development Workflow**

1. **Fork the repository** and create a feature branch
2. **Install dependencies** with `npm install --legacy-peer-deps`
3. **Make changes** following TypeScript and React best practices
4. **Add tests** for new functionality using Jest and Cypress
5. **Run linting** with `npm run lint` and fix any issues
6. **Test thoroughly** with `npm test` and `npm run test:e2e`
7. **Submit a pull request** with detailed description

### **Code Standards**

- **TypeScript**: Strict type checking for all code
- **ESLint**: Automated code quality and style enforcement
- **Prettier**: Consistent code formatting
- **Test Coverage**: Unit tests for utilities, Cypress for workflows
- **Documentation**: JSDoc comments for all public APIs

### **Contribution Areas**

- **New Integrations**: Additional health systems, communication providers
- **Agent Development**: New intelligent agents for monitoring and assistance
- **Privacy Features**: Enhanced data ownership and consent management
- **Mobile Optimization**: React Native app development
- **Accessibility**: WCAG 2.1 AA compliance improvements
- **Internationalization**: Multi-language support

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Dataswift HAT Platform** - Personal data vault infrastructure and zero-knowledge architecture
- **HMIS OpenCommons** - Real-time homeless services data access and standardization
- **Google APIs** - Calendar, Voice, and authentication service integrations
- **OpenStreetMap Community** - Open mapping data and satellite imagery access
- **Cypress.io** - Comprehensive end-to-end testing framework
- **Idaho Community Organizations** - Supporting privacy-first approach to shelter management
- **Open Source Community** - Libraries, tools, and continuous innovation

## 📞 Support & Community

### **Getting Help**

- **Documentation**: Comprehensive guides in `/docs` directory
- **Issues**: [GitHub Issues](https://github.com/your-org/idaho-shelter-management/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/idaho-shelter-management/discussions)
- **Email**: support@idaho-shelter-management.org

### **Community Resources**

- **Developer Slack**: Join our development community
- **Monthly Calls**: Community updates and feature discussions
- **Training Materials**: Video tutorials and documentation
- **Case Studies**: Real-world implementation examples

## 🌟 Project Vision

This system represents a paradigm shift in social services technology - one where individual privacy, data ownership, and personal autonomy are foundational rather than afterthoughts. By combining cutting-edge technology with privacy-first principles, we enable:

- **Dignified Service Delivery**: Clients retain control and agency over their personal information
- **Improved Outcomes**: Better data leads to more effective and coordinated services
- **Reduced Stigma**: Technology that empowers rather than surveils or controls
- **Systemic Change**: A model for ethical technology in social services

### **Impact Goals**

- **10,000+ Individuals** served with privacy-preserving technology
- **100+ Shelter Partners** using unified data ownership model
- **Zero Data Breaches** through zero-knowledge architecture
- **95+ Client Satisfaction** with privacy and data control features

---

**Built with ❤️ for dignity, privacy, and effective service delivery in the Idaho community and beyond.**
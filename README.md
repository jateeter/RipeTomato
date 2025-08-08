# Idaho Community Shelter Management System

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)

A comprehensive shelter management system featuring **unified individual data ownership** through HAT (Hub of All Things) personal data vaults and Apple Wallet digital access representations.

## 🏠 Overview

This system revolutionizes shelter management by putting data ownership and privacy control directly into the hands of the individuals being served. Each client receives their own personal data vault and digital wallet access, ensuring maximum privacy, security, and autonomy.

## 🔐 Unified Data Ownership Model

### Core Principles

- **Individual Data Ownership**: Each client owns and controls their personal data
- **Zero-Knowledge Architecture**: Service providers cannot access raw personal data
- **Data Portability**: Complete control over data sharing and transfer
- **Digital Wallet Integration**: Seamless access through Apple Wallet passes
- **Compliance by Design**: Built-in GDPR and privacy regulation compliance

### Architecture Components

1. **HAT (Hub of All Things) Data Vaults**
   - Personal data microserver for each individual
   - Zero-knowledge encrypted storage
   - Full data portability and interoperability
   - Programmable privacy controls

2. **Apple Wallet Digital Passes**
   - Shelter access passes for services and facilities
   - Health credential passes for emergency information
   - Identification passes for official documentation
   - Service entitlement passes for program access
   - Emergency contact passes for critical situations

3. **Unified Service Interface**
   - Seamless integration between HAT vaults and wallet passes
   - Cross-system data synchronization
   - Comprehensive audit logging
   - Data integrity validation

## ✨ Key Features

### 🏠 Shelter Management
- Bed availability tracking and reservation system
- Client registration with unified data ownership
- Check-in/check-out process management
- Staff and client dashboards

### 🔐 Individual Data Ownership
- **Personal HAT Data Vaults**: Each client gets their own encrypted data vault
- **Digital Wallet Passes**: Multiple pass types for different access needs
- **Privacy Controls**: Granular permissions and consent management
- **Data Synchronization**: Real-time sync between HAT and wallet systems

### 🏥 Health & Wellness
- HealthKit integration for vital signs monitoring
- Blood pressure monitoring with SMS alerts
- Medical information storage in personal vaults
- Emergency contact management

### 📞 Communication
- Google Voice/Twilio integration for SMS and calls
- Emergency alert system
- Agent-based monitoring services
- Communication logging in personal vaults

### 📱 Digital Access
- **Shelter Access Passes**: Entry to facilities and services
- **Health Credential Passes**: Medical information for emergencies
- **Identification Passes**: Official shelter ID documents
- **Service Entitlement Passes**: Access to specific programs
- **Emergency Contact Passes**: Critical contact information

## 🚀 Technology Stack

- **Frontend**: React 19.1.0 with TypeScript
- **Styling**: Tailwind CSS
- **Data Ownership**: Dataswift HAT (Hub of All Things)
- **Digital Wallet**: Apple Wallet PKPass generation
- **Health Integration**: HealthKit API
- **Communication**: Google Voice API, Twilio SMS
- **Calendar**: Google Calendar API
- **Backup Storage**: Solid Pod (decentralized storage)
- **Authentication**: OAuth2, JWT tokens

## 📊 Data Types Supported

The unified model supports comprehensive data management across multiple categories:

### Personal Identity
- Basic personal information and identification
- Zero-knowledge encrypted storage
- Full client control over sharing

### Shelter Records
- Accommodation and service history
- Privacy-preserving access logging
- Portable between shelter systems

### Health Data
- Medical information and records
- Emergency contact details
- HealthKit integration for vitals

### Communication Logs
- SMS and call history
- Privacy-controlled access
- Agent monitoring records

### Access Records
- Facility and service access history
- Digital wallet pass usage
- Security and audit trails

### Consent Records
- Data sharing permissions
- GDPR compliance documentation
- Granular privacy controls

### Emergency Data
- Critical contact information
- Medical alerts and instructions
- Emergency access protocols

### Service History
- Program participation records
- Outcome tracking
- Continuity of care documentation

## 🛠️ Installation

### Prerequisites

- Node.js 18.x or higher
- npm or yarn package manager
- TypeScript compiler

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/idaho-shelter-management.git
   cd idaho-shelter-management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and configuration
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Open in browser**
   - Navigate to `http://localhost:3001`
   - The application will load with the unified data ownership system

## 🔧 Configuration

### HAT (Hub of All Things) Setup

```typescript
// Configure HAT service
const hatConfig = {
  applicationId: 'idaho-shelter-management',
  namespace: 'shelter',
  kind: 'shelter-management-app',
  hatApiVersion: 'v2.6',
  secure: true,
  domain: 'hubofallthings.net'
};
```

### Apple Wallet Configuration

```typescript
// Configure wallet pass generation
const walletConfig = {
  teamIdentifier: 'YOUR_TEAM_ID',
  passTypeIdentifiers: {
    shelter: 'pass.com.idaho.shelter.access',
    health: 'pass.com.idaho.shelter.health',
    identification: 'pass.com.idaho.shelter.id',
    service_entitlement: 'pass.com.idaho.shelter.services',
    emergency_contact: 'pass.com.idaho.shelter.emergency'
  },
  organizationName: 'Idaho Community Shelter'
};
```

## 📱 Usage

### For Shelter Staff

1. **Client Registration**
   - Register new clients with automatic HAT vault and wallet pass creation
   - Full unified data ownership established during registration
   - Privacy controls and consent management built-in

2. **Data Management**
   - View client data through privacy-preserving interfaces
   - Manage permissions and access controls
   - Monitor data synchronization and integrity

3. **Service Delivery**
   - Track bed availability and reservations
   - Manage check-ins and service access
   - Monitor health and communication needs

### For Clients

1. **Personal Data Control**
   - Own and control personal HAT data vault
   - Manage privacy settings and data sharing
   - Full data portability and export capabilities

2. **Digital Wallet Access**
   - Use Apple Wallet passes for facility access
   - Emergency contact information always available
   - Service entitlements and program access

3. **Privacy Management**
   - Granular control over data sharing
   - Consent management for all data uses
   - Complete audit trail of data access

## 🔒 Privacy & Security

### Zero-Knowledge Architecture
- Service providers cannot access raw personal data
- All data encrypted with client-controlled keys
- Privacy-preserving analytics and reporting

### Compliance Features
- Built-in GDPR compliance
- Comprehensive consent management
- Data retention and deletion controls
- Audit logging for all data access

### Security Measures
- End-to-end encryption for all data
- Multi-factor authentication support
- Regular security audits and updates
- Incident response procedures

## 🤝 Contributing

We welcome contributions to improve the Idaho Community Shelter Management System! Please read our contributing guidelines and code of conduct.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

### Code Standards

- TypeScript for type safety
- ESLint and Prettier for code formatting
- Comprehensive unit and integration tests
- Documentation for all public APIs

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Dataswift HAT Platform** - For providing the personal data vault infrastructure
- **Apple Wallet** - For digital pass and access management capabilities
- **Idaho Community Organizations** - For supporting this privacy-first approach to shelter management
- **Open Source Community** - For the libraries and tools that make this possible

## 📞 Support

For support, questions, or contributions:

- **Issues**: [GitHub Issues](https://github.com/your-org/idaho-shelter-management/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/idaho-shelter-management/discussions)
- **Email**: support@idaho-shelter-management.org

## 🌟 Project Vision

This system represents a new paradigm in social services technology - one where individual privacy, data ownership, and personal autonomy are built into the foundation rather than added as an afterthought. By giving each person complete control over their personal data while still enabling effective service delivery, we can build more ethical, empowering, and effective support systems.

---

**Built with ❤️ for the Idaho community and all individuals seeking shelter and support services.**
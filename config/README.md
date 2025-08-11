# Configuration Management Documentation
# Guide for managing configuration files in the Idaho Community Shelter Management System

## Overview

This directory contains YAML configuration files that organize all application settings, service configurations, and environment-specific values. This approach provides better organization, version control, and maintenance compared to scattered configuration across multiple TypeScript files.

## Configuration Files

### 1. `application.yaml`
**Purpose**: Main application configuration including feature flags, database settings, security, and core functionality.

**Key Sections**:
- Application metadata and environment settings
- Feature flags for enabling/disabling functionality
- Database configuration
- Authentication and security settings
- Privacy and consent management
- Identity verification requirements
- Health services configuration
- Shelter management settings
- Communication services setup
- Logging configuration

### 2. `google-services.yaml`
**Purpose**: Google Calendar API, Google Voice, and other Google services configuration.

**Key Sections**:
- OAuth 2.0 credentials and settings
- Calendar API configuration
- Security and authentication settings
- Development vs production endpoints

### 3. `solid-pod.yaml`
**Purpose**: Solid Pod integration for decentralized data ownership.

**Key Sections**:
- Pod provider configurations
- Data structure and organization
- Privacy levels and access controls
- Consent management
- Authentication settings

### 4. `hat-dataswift.yaml`
**Purpose**: HAT (Hub of All Things) integration for personal data vaults.

**Key Sections**:
- HAT service configuration
- Data schemas for different data types
- Privacy and encryption settings
- API endpoints and authentication

### 5. `apple-services.yaml`
**Purpose**: Apple Wallet pass generation and HealthKit integration.

**Key Sections**:
- Apple Wallet certificate configuration
- Pass type definitions for different use cases
- HealthKit data types and sharing preferences
- Privacy and security settings

### 6. `services.yaml`
**Purpose**: External service integrations and third-party APIs.

**Key Sections**:
- Twilio communication services
- Email service configuration
- HMIS integration settings
- Emergency services integration
- Community services partnerships
- Monitoring and analytics
- Backup and storage configuration

## Environment Variables

### `.env.template`
This file serves as a template for creating your local `.env` file. It includes:
- All required environment variables with descriptions
- Placeholder values that need to be replaced
- Organized sections for different service categories
- Development and production considerations

### Setting up Environment Variables
1. Copy `.env.template` to `.env`:
   ```bash
   cp .env.template .env
   ```

2. Fill in actual values for your environment:
   ```bash
   # Replace placeholder values with real credentials
   REACT_APP_GOOGLE_CLIENT_ID=your-actual-client-id
   REACT_APP_GOOGLE_API_KEY=your-actual-api-key
   # ... etc
   ```

3. **Never commit `.env` to version control**

## Configuration Loading

### TypeScript Integration
Update your existing TypeScript configuration files to load from YAML:

```typescript
// Example: src/config/configLoader.ts
import yaml from 'js-yaml';
import fs from 'fs';

export function loadConfig(configFile: string) {
  const configPath = `./config/${configFile}.yaml`;
  const fileContents = fs.readFileSync(configPath, 'utf8');
  return yaml.load(fileContents);
}

// Example usage in existing config files:
// src/config/googleConfig.ts
import { loadConfig } from './configLoader';

const googleConfig = loadConfig('google-services');
export const GOOGLE_CONFIG = {
  CLIENT_ID: process.env.REACT_APP_GOOGLE_CLIENT_ID || googleConfig.google.calendar.client_id,
  API_KEY: process.env.REACT_APP_GOOGLE_API_KEY || googleConfig.google.calendar.api_key,
  // ... rest of configuration
};
```

## Security Best Practices

### 1. Environment Variables
- Use environment variables for all sensitive data (API keys, secrets, passwords)
- Never hardcode sensitive values in configuration files
- Use the format `${VARIABLE_NAME}` in YAML files to reference environment variables

### 2. Configuration File Security
- YAML files can be committed to version control (they contain structure, not secrets)
- Use `.env` files for actual sensitive values (never commit these)
- Separate development and production configurations

### 3. Access Control
- Limit access to configuration files in production environments
- Use proper file permissions (600 or 644 for config files)
- Implement configuration validation to catch errors early

## Environment-Specific Configuration

### Development
- Use `development` sections in YAML files for dev-specific settings
- Enable debug modes and mock services
- Use local development URLs and endpoints

### Testing
- Use `testing` sections or separate test configuration files
- Mock external services
- Use test databases and isolated environments

### Production
- Use `production` sections for production-specific settings
- Disable debug modes
- Enable SSL, rate limiting, and monitoring
- Use production URLs and endpoints

## Validation and Testing

### Configuration Validation
Implement validation to ensure all required configuration is present:

```typescript
// Example validation function
export function validateConfiguration(config: any): boolean {
  const required = [
    'google.calendar.client_id',
    'solid.application.client_name',
    'hat.service.application_id'
  ];
  
  return required.every(path => {
    const value = getNestedValue(config, path);
    return value !== undefined && value !== '';
  });
}
```

### Testing Configuration
- Test configuration loading in unit tests
- Validate that all environment variables are properly referenced
- Test different environment configurations

## Migration from Existing Configuration

### 1. Gradual Migration
- Keep existing TypeScript config files initially
- Update them to load from YAML files
- Test thoroughly before removing old configuration

### 2. Backup Strategy
- Back up existing configuration before migration
- Test all functionality with new configuration
- Have rollback plan ready

### 3. Documentation Update
- Update README.md with new configuration instructions
- Update deployment documentation
- Train team members on new configuration management

## Troubleshooting

### Common Issues
1. **Missing Environment Variables**: Check that all required variables are set in `.env`
2. **YAML Syntax Errors**: Validate YAML syntax using online validators
3. **File Permissions**: Ensure configuration files are readable by the application
4. **Path Issues**: Verify that configuration file paths are correct

### Debugging
- Enable debug logging for configuration loading
- Validate configuration on application startup
- Use environment-specific logging levels

## Benefits of This Approach

1. **Organization**: All configuration in one place, organized by service
2. **Version Control**: Configuration structure is versioned, secrets are not
3. **Environment Management**: Easy to manage different environments
4. **Documentation**: Self-documenting configuration with comments
5. **Validation**: Easier to validate and test configuration
6. **Security**: Clear separation between structure and sensitive data
7. **Maintenance**: Easier to update and maintain configuration over time

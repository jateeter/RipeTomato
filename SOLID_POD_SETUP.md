# Solid Pod Integration with OpenCommons.net

This document explains how to configure and use the Solid Pod integration with OpenCommons.net for the Community Services application.

## Overview

The application is configured to connect to [OpenCommons.net](https://opencommons.net) as the primary Solid Pod provider. This integration provides:

- Secure, decentralized data storage for user information
- Client data privacy and ownership control
- Document sharing via QR codes
- Persistent authentication sessions
- Real-time connectivity monitoring

## Configuration

### 1. Environment Setup

Copy the `.env.example` file to `.env.local` and configure your credentials:

```bash
cp .env.example .env.local
```

### 2. Required Environment Variables

```env
# Solid Pod Provider Configuration
REACT_APP_SOLID_PROVIDER=https://opencommons.net

# Application Credentials (register at https://opencommons.net/register)
REACT_APP_SOLID_CLIENT_ID=idaho-community-services
REACT_APP_SOLID_CLIENT_SECRET=your_client_secret_here

# User Credentials (obtain after registering)
REACT_APP_SOLID_ACCESS_TOKEN=your_access_token_here
REACT_APP_SOLID_REFRESH_TOKEN=your_refresh_token_here

# Pod Information
REACT_APP_SOLID_WEB_ID=https://your-username.opencommons.net/profile/card#me
REACT_APP_SOLID_POD_URL=https://your-username.opencommons.net/
```

### 3. Registration Process

To obtain the required credentials:

1. **Create an Account**:
   - Visit [https://opencommons.net/register](https://opencommons.net/register)
   - Create a new user account
   - Your Pod will be automatically created

2. **Register Your Application**:
   - Access the developer console (typically at `/apps` or similar)
   - Register a new application with:
     - Name: "Community Services - Idaho Events"
     - Homepage: `http://localhost:3000` (for development)
     - Redirect URI: `http://localhost:3000/solid-callback`

3. **Obtain Credentials**:
   - Copy the `Client ID` and `Client Secret`
   - Generate or obtain access tokens for your application

## Application Integration

### Startup Workflow

The application automatically initializes the Solid Pod connection during startup:

1. **Connectivity Validation**: Tests connection to OpenCommons.net
2. **Credential Loading**: Loads credentials from environment variables
3. **Session Restoration**: Attempts to restore previous authentication
4. **Authentication**: Initializes Solid authentication framework
5. **Pod Testing**: Validates Pod connectivity
6. **State Persistence**: Saves initialization state for future sessions

### Connection Status

The application displays the current Solid Pod connection status in the header:

- 🟢 **Pod Connected**: Successfully connected to OpenCommons.net
- 🟡 **Pod Connecting...**: Initialization in progress
- 🔴 **Pod Error**: Connection failed (hover for details)

### Key Features

#### 1. Document Storage
- Secure document upload to user's Pod
- Encrypted storage with AES-256
- Privacy-level categorization (public, restricted, confidential, sensitive)

#### 2. QR Code Sharing
- Generate QR codes for document access
- Temporary access with expiration
- Service-specific permissions
- Access tracking and analytics

#### 3. Data Privacy
- Role-based access control
- Client data ownership
- Consent management
- Data retention policies

#### 4. Persistent Sessions
- Automatic session restoration
- Background connectivity monitoring
- Graceful error handling

## Development

### Services Overview

- **`solidInitializationService.ts`**: Handles startup workflow and connection management
- **`solidAuthService.ts`**: Manages authentication with OpenCommons.net
- **`solidPodService.ts`**: Provides document management and sharing functionality
- **`solidConfig.ts`**: Configuration for providers and application settings
- **`solidCredentials.ts`**: Credential management and validation

### Testing the Integration

1. **Start the Development Server**:
   ```bash
   npm start
   ```

2. **Monitor Console Output**:
   Look for initialization messages:
   ```
   🚀 Starting application with Solid Pod initialization...
   📡 Step 1: Validating OpenCommons.net connectivity...
   ✅ OpenCommons.net connection validated
   🔑 Step 2: Loading credentials from environment...
   ```

3. **Check Connection Status**:
   - View the status indicator in the application header
   - Check browser console for detailed logs

### Troubleshooting

#### Common Issues

1. **Connection Failed**:
   - Verify OpenCommons.net is accessible
   - Check network connectivity
   - Validate environment variables

2. **Authentication Errors**:
   - Verify client credentials are correct
   - Check access token validity
   - Ensure redirect URI matches registration

3. **Pod Access Denied**:
   - Verify Pod URL is correct
   - Check user permissions
   - Validate WebID format

#### Debug Mode

Enable debug logging by setting:
```env
REACT_APP_DEBUG_SOLID=true
```

This provides detailed console output for all Solid Pod operations.

## Security Considerations

1. **Environment Variables**: Never commit actual credentials to version control
2. **Token Management**: Implement proper token refresh mechanisms
3. **Data Encryption**: All sensitive data is encrypted before storage
4. **Access Control**: Implement proper role-based permissions
5. **Audit Logging**: All Pod access is logged for security monitoring

## API Reference

### Core Methods

```typescript
// Initialize Solid Pod connection
const result = await solidInitializationService.initialize();

// Check connection status
const status = await solidInitializationService.getConnectionStatus();

// Upload document to Pod
const document = await solidPodService.uploadDocument(
  clientId, fileName, fileData, fileType, contentType
);

// Generate QR code for document access
const qrAccess = await solidPodService.generateDocumentQRCode(
  clientId, documentId, accessLevel, expirationHours
);

// Validate QR code access
const validation = await solidPodService.validateDocumentQRCode(
  qrCodeData, requestingService, staffId
);
```

### Configuration Methods

```typescript
// Update credentials at runtime
updateSolidCredentials({
  accessToken: 'new_token',
  webId: 'https://user.opencommons.net/profile/card#me'
});

// Validate OpenCommons.net connectivity
const validation = await validateOpenCommonsConnection();

// Check if credentials are configured
const hasCredentials = hasSolidCredentials();
```

## Production Deployment

For production deployment:

1. **Use HTTPS**: Ensure all URLs use HTTPS protocol
2. **Update Redirect URIs**: Register production domain with OpenCommons.net
3. **Secure Credentials**: Use secure environment variable management
4. **Monitor Connectivity**: Implement health checks for Pod connectivity
5. **Error Handling**: Implement comprehensive error recovery mechanisms

## Support

For issues related to:
- **OpenCommons.net**: Contact OpenCommons.net support
- **Application Integration**: Check this documentation and console logs
- **Solid Protocol**: Refer to [Solid Project Documentation](https://solidproject.org/)

---

**Note**: This integration is designed to work primarily with OpenCommons.net but can be adapted for other Solid Pod providers by updating the configuration in `solidConfig.ts` and `solidCredentials.ts`.
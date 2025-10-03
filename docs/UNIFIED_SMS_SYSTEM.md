# Unified SMS System Documentation

## Overview

The Unified SMS System provides a flexible, extensible architecture for sending SMS messages through multiple providers (Twilio, Google Voice) with automatic fallback, load balancing, and health monitoring capabilities.

## Features

- **Multi-Provider Support**: Seamlessly switch between Twilio and Google Voice APIs
- **Automatic Fallback**: If primary provider fails, automatically retry with secondary providers
- **Load Balancing**: Multiple strategies including priority-based, round-robin, and least-used
- **Health Monitoring**: Continuous provider health checks with automatic recovery
- **Provider Management**: Enable/disable providers dynamically via admin interface
- **Testing Capabilities**: Test individual providers with real SMS sending
- **Statistics & Monitoring**: Comprehensive statistics for all providers and overall system
- **Browser Compatibility**: Mock implementations for development/browser environments

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      SMS Service (Public API)                   │
├─────────────────────────────────────────────────────────────────┤
│                   Unified SMS Manager                           │
├─────────────────────┬─────────────────┬─────────────────────────┤
│   Twilio Provider   │ Google Voice    │   Future Providers      │
│   (Priority: 1)     │ Provider        │   (e.g., AWS SNS)       │
│                     │ (Priority: 2)   │                         │
└─────────────────────┴─────────────────┴─────────────────────────┘
```

## File Structure

```
src/services/sms/
├── SMSProviderInterface.ts    # Base interfaces and abstract provider class
├── TwilioProvider.ts         # Twilio implementation
├── GoogleVoiceProvider.ts    # Google Voice implementation  
├── UnifiedSMSManager.ts      # Main manager coordinating all providers
└── __tests__/
    └── UnifiedSMSManager.test.ts
    
src/services/
└── smsService.ts            # Updated service using unified manager

src/components/
├── SMSProviderManagement.tsx # Admin interface for provider management
└── BotManagementDashboard.tsx # Updated with provider status display

src/config/
└── smsConfig.example.ts     # Example configuration file
```

## Configuration

### Environment Variables

**Twilio Configuration:**
```bash
REACT_APP_TWILIO_ACCOUNT_SID=your_account_sid
REACT_APP_TWILIO_AUTH_TOKEN=your_auth_token
REACT_APP_TWILIO_PHONE_NUMBER=+15551234567
```

**Google Voice Configuration:**
```bash
REACT_APP_GOOGLE_VOICE_EMAIL=your_email@gmail.com
REACT_APP_GOOGLE_VOICE_NUMBER=+15559876543
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
REACT_APP_GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Provider Configuration

```typescript
const config: UnifiedSMSConfig = {
  providers: [
    {
      name: 'Twilio',
      enabled: true,
      priority: 1, // Lower number = higher priority
      credentials: { /* ... */ }
    },
    {
      name: 'Google Voice', 
      enabled: true,
      priority: 2,
      credentials: { /* ... */ }
    }
  ],
  fallbackEnabled: true,
  maxRetries: 3,
  retryDelay: 2000,
  healthCheckInterval: 5 * 60 * 1000,
  loadBalancing: 'priority' // 'priority' | 'round-robin' | 'least-used'
};
```

## Usage

### Basic SMS Sending

```typescript
import { smsService } from './services/smsService';

// Send wake-up notification (uses existing API)
const result = await smsService.sendWakeupSMS('client123', {
  urgency: 'normal',
  bedNumber: 'A-12',
  facilityName: 'Main Shelter',
  checkoutTime: '7:00 AM'
});
```

### Provider Management

```typescript
// Get available providers
const providers = smsService.getAvailableProviders();
console.log('Available providers:', providers);

// Check provider health  
const healthyProviders = smsService.getHealthyProviders();
console.log('Healthy providers:', healthyProviders);

// Enable/disable providers
await smsService.enableProvider('Google Voice');
smsService.disableProvider('Twilio');

// Test a provider
const success = await smsService.testProvider('Twilio', '5551234567');
console.log('Test successful:', success);
```

### Statistics & Monitoring

```typescript
// Get overall statistics
const stats = await smsService.getMessageStats();
console.log('Overall stats:', stats);

// Get provider-specific statistics
const providerStats = smsService.getSMSProviderStats();
console.log('Provider stats:', providerStats);
```

## Load Balancing Strategies

### Priority-Based (Default)
Messages are sent using providers in priority order. If the primary provider fails, the system tries the next priority provider.

### Round-Robin
Messages are distributed evenly across all healthy providers in a rotating fashion.

### Least-Used
Messages are sent via the provider that has sent the fewest messages, helping to distribute load evenly.

## Provider Implementations

### Twilio Provider

**Features:**
- Full SMS and MMS support
- Delivery receipt tracking
- Incoming message support
- Rate limiting: 1 msg/sec, 60 msgs/min
- Account balance monitoring

**Browser Compatibility:**
Uses mock implementation in browser environment to avoid webpack issues.

### Google Voice Provider

**Features:**  
- Basic SMS support (no MMS)
- Incoming message support
- Lower rate limits (0.5 msg/sec, 10 msgs/min)
- Mock authentication for browser environment

**Note:** Google Voice implementation is conceptual as Google doesn't provide official SMS API. In production, consider using Google Cloud Communication APIs instead.

## Error Handling & Fallback

### Automatic Retry Logic
- Each provider implements automatic retry with exponential backoff
- Failed messages are retried up to `maxRetries` times
- Retry delay doubles with each attempt: 1s, 2s, 4s, etc.

### Provider Fallback
- If primary provider fails, system automatically tries next priority provider
- Fallback can be disabled by setting `fallbackEnabled: false`
- Each fallback attempt counts toward the overall retry limit

### Health Monitoring
- Providers are health-checked every `healthCheckInterval` milliseconds
- Unhealthy providers are automatically excluded from message sending
- Health checks include API connectivity and basic functionality tests

## Admin Interface

### SMS Provider Management Component

Located at `src/components/SMSProviderManagement.tsx`, this component provides:

- Real-time provider status monitoring
- Enable/disable provider controls
- Provider testing with actual SMS sending
- Statistics display for each provider
- Configuration guidance and help text

### Integration with Bot Dashboard

The Bot Management Dashboard (`src/components/BotManagementDashboard.tsx`) now includes:

- SMS provider status in the SMS statistics section
- Health indicators for each provider
- Integration with the unified SMS statistics

## Testing

### Unit Tests
```bash
npm test -- src/services/sms/__tests__/UnifiedSMSManager.test.ts
```

### Provider Testing
Use the SMS Provider Management interface to send test messages:

1. Navigate to the provider management dashboard
2. Enter a test phone number
3. Click "Test" for any enabled provider
4. Check the results in the interface

### Mock Environment
All providers use mock implementations in browser/development environments:

- **Twilio Mock**: Simulates successful sends with 90% success rate
- **Google Voice Mock**: Simulates authentication and message sending
- **Error Simulation**: Random failures to test fallback logic

## Migration from Single Provider

### Before (Twilio Only)
```typescript
// Old SMS service used Twilio directly
const twilioClient = new Twilio(accountSid, authToken);
const message = await twilioClient.messages.create({...});
```

### After (Unified System)
```typescript
// New SMS service uses unified manager automatically
const result = await smsService.sendWakeupSMS(clientId, options);
// Automatically uses best available provider with fallback
```

### Breaking Changes
- `SMSMessage.sid` renamed to `SMSMessage.providerId`
- Added `SMSMessage.providerName` field
- Enhanced statistics include provider-specific data
- New provider management methods available

## Performance Considerations

### Rate Limiting
Each provider implements rate limiting based on their service limits:
- **Twilio**: 1 msg/sec, 60 msgs/min, 10,000 msgs/day
- **Google Voice**: 0.5 msg/sec, 10 msgs/min, 500 msgs/day

### Memory Usage
- Provider instances are kept in memory for performance
- Message queue is maintained in memory (consider Redis for scaling)
- Statistics are cached and updated periodically

### Scaling Recommendations
For high-volume production use:
1. Implement persistent message queue (Redis/Database)
2. Use backend API for actual SMS sending
3. Implement webhook handlers for delivery receipts
4. Consider additional providers (AWS SNS, Azure Communication Services)

## Security Considerations

### Credential Management
- Never commit credentials to version control
- Use environment variables for all API keys
- Rotate credentials regularly
- Consider using secret management services (AWS Secrets Manager, etc.)

### Message Content
- Sanitize message content to prevent injection attacks
- Implement message content filtering for spam prevention
- Log message metadata only, not full message content
- Respect client privacy and opt-out preferences

## Troubleshooting

### Common Issues

**"No SMS providers successfully initialized"**
- Check environment variables are set correctly
- Verify provider credentials are valid
- Check network connectivity for API calls

**Messages not sending**
- Check provider health status in admin interface
- Verify phone numbers are in correct format (+1XXXXXXXXXX)
- Check provider account balances and limits
- Review error logs for specific failure reasons

**Provider showing as unhealthy**
- Check API credentials and account status
- Verify network connectivity to provider APIs
- Review provider-specific error messages
- Test provider manually using admin interface

### Debug Mode
Enable debug logging by setting:
```bash
REACT_APP_SMS_DEBUG=true
```

This will provide detailed logging for:
- Provider initialization
- Message sending attempts
- Fallback logic execution
- Health check results

## Future Enhancements

### Planned Features
- **Additional Providers**: AWS SNS, Azure Communication Services, SendGrid
- **Message Templates**: Enhanced template system with conditional logic
- **Analytics Dashboard**: Detailed reporting and analytics
- **Webhook Support**: Delivery receipt processing and incoming message handling
- **Message Scheduling**: Delay message sending to specific times
- **Bulk Operations**: Batch message sending with progress tracking

### API Extensions
- **Message History**: Persistent storage and retrieval of sent messages
- **Contact Management**: Enhanced client preference management
- **Campaign Management**: Organized message campaigns with targeting
- **A/B Testing**: Template and provider performance testing

## Support

For issues and questions:
1. Check this documentation first
2. Review error logs and console output
3. Test individual providers using admin interface
4. Check provider service status pages
5. Review environment variable configuration

## License

MIT License - See main project LICENSE file for details.
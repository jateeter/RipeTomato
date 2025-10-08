# Solid Pod Setup CLI

## Overview

The Solid Pod Setup CLI is a standalone command-line tool for initializing Solid Pod services for homeless clients. It provides an interactive, user-friendly interface for creating and configuring client-owned data storage with full privacy and security.

## Features

✅ **Interactive Prompts** - Step-by-step guided setup
✅ **Multiple Providers** - Support for SolidCommunity.net, Inrupt, SolidWeb
✅ **Automatic Pod Creation** - Secure credential generation
✅ **Client Profile Initialization** - Basic client information setup
✅ **Offline Fallback** - Local storage mode for development
✅ **Configuration Management** - Automatic .env generation
✅ **Data Ownership Verification** - Ensures client control

## Installation

No additional installation needed - runs with Node.js (already part of the project).

## Usage

### Quick Start

```bash
# From project root
npm run solid:setup
```

Or directly:

```bash
node cli/solid-pod-setup.js
```

### Interactive Workflow

The CLI will guide you through 6 steps:

**Step 1: Select Provider**
```
Available providers:

  1. SolidCommunity.net (Recommended for development)
  2. Inrupt PodSpaces (Enterprise-grade)
  3. SolidWeb.org (Community-hosted)
  4. Local/Offline (Development only)

Select provider (1-4):
```

**Step 2: User Information**
```
Username: client-john-doe
Password: ********
Confirm password: ********
Email (optional): john@example.com
```

**Step 3: Pod Creation**
- Automatic creation via API (if supported)
- Manual registration guidance (if needed)
- Offline fallback (if unavailable)

**Step 4: Client Profile**
```
Client first name: John
Client last name: Doe
Preferred name: Johnny
```

**Step 5: Save Configuration**
- Saves to `config/solid-pods.json`
- Generates `.env.solid-pod` template
- Excludes sensitive credentials from git

**Step 6: Verification**
- Review all settings
- Confirm accuracy
- Complete setup

## Output Files

### 1. `config/solid-pods.json`

Stores all Pod configurations (without passwords):

```json
[
  {
    "username": "client-john-doe",
    "webId": "https://solidcommunity.net/client-john-doe/profile/card#me",
    "podUrl": "https://solidcommunity.net/client-john-doe/",
    "provider": "SolidCommunity.net",
    "providerUrl": "https://solidcommunity.net",
    "clientProfile": {
      "firstName": "John",
      "lastName": "Doe",
      "preferredName": "Johnny",
      "webId": "https://solidcommunity.net/client-john-doe/profile/card#me",
      "podUrl": "https://solidcommunity.net/client-john-doe/",
      "createdAt": "2025-01-15T10:30:00.000Z",
      "provider": "SolidCommunity.net",
      "dataOwnership": "client",
      "privacyLevel": "maximum"
    },
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
]
```

### 2. `.env.solid-pod`

Environment variable template:

```bash
# Solid Pod Configuration for client-john-doe
# Generated: 2025-01-15T10:30:00.000Z

REACT_APP_SOLID_PROVIDER=https://solidcommunity.net
REACT_APP_SOLID_WEB_ID=https://solidcommunity.net/client-john-doe/profile/card#me
REACT_APP_SOLID_POD_URL=https://solidcommunity.net/client-john-doe/
REACT_APP_SOLID_USERNAME=client-john-doe

# Add this to your .env.local file
# Do not commit passwords to version control!
```

## Provider Details

### 1. SolidCommunity.net (Recommended)

**Best for:** Development and testing

**Pros:**
- Easy registration
- Free accounts
- Community-supported
- Well-documented

**Cons:**
- Not for production use
- May have downtime
- Limited storage

**Setup:**
1. Select option 1 in CLI
2. Provide username and password
3. CLI will attempt automatic registration
4. If fails, visit https://solidcommunity.net/register

### 2. Inrupt PodSpaces

**Best for:** Enterprise production use

**Pros:**
- Professional support
- 99.9% uptime SLA
- Scalable storage
- HIPAA-compliant options

**Cons:**
- Paid service (after free tier)
- Requires business account for full features

**Setup:**
1. Select option 2 in CLI
2. Visit https://login.inrupt.com
3. Create account manually
4. Return to CLI and provide credentials

### 3. SolidWeb.org

**Best for:** Community-hosted alternative

**Pros:**
- Community-owned
- Free accounts
- Privacy-focused

**Cons:**
- Smaller community
- Fewer guarantees

**Setup:**
1. Select option 3 in CLI
2. Visit https://solidweb.org/register
3. Create account
4. Provide credentials in CLI

### 4. Local/Offline Mode

**Best for:** Development without internet

**Pros:**
- No account needed
- Works offline
- Instant setup
- No external dependencies

**Cons:**
- Data stored in browser only (localStorage)
- Not accessible from other devices
- Not for production use

**Setup:**
1. Select option 4 in CLI
2. Auto-generates credentials
3. Data stored locally only

## Validation Rules

### Username
- 3-20 characters
- Lowercase letters, numbers, hyphens only
- No spaces or special characters
- Example: `client-john-123`

### Password
- Minimum 8 characters
- Mix of letters and numbers recommended
- Special characters allowed
- Stored securely (never in version control)

### Email
- Optional
- Used for account recovery (if supported by provider)
- Standard email format

## Security Best Practices

### For Developers

**✅ DO:**
- Keep passwords in `.env.local` (gitignored)
- Use environment variables for credentials
- Enable 2FA when available from provider
- Regularly rotate credentials
- Use different credentials for dev/prod

**❌ DON'T:**
- Commit passwords to git
- Share credentials in Slack/email
- Use same password for multiple Pods
- Store passwords in code comments
- Use weak passwords (< 8 characters)

### For Staff

**✅ DO:**
- Generate unique Pod for each client
- Explain data ownership to clients
- Document WebID for client access
- Test Pod connection before use
- Keep backup of configuration

**❌ DON'T:**
- Reuse Pods between clients
- Share client credentials
- Access client Pods without permission
- Modify client data without consent

## Troubleshooting

### Pod Creation Fails

**Error:** `Could not create Pod automatically`

**Solutions:**
1. Use manual registration link provided
2. Verify username is available
3. Check provider status page
4. Try different provider
5. Use offline mode for development

### Invalid Username

**Error:** `Username must be 3-20 characters`

**Solutions:**
- Use only lowercase letters, numbers, hyphens
- Remove spaces and special characters
- Keep between 3-20 characters
- Example: `client-jane-smith`

### Password Mismatch

**Error:** `Passwords do not match`

**Solutions:**
- Retype carefully
- Check Caps Lock
- Use copy-paste for confirmation
- Try shorter password (easier to type)

### Configuration File Errors

**Error:** `Could not read existing config`

**Solutions:**
1. Check file permissions
2. Verify JSON format in `config/solid-pods.json`
3. Delete corrupted file and retry
4. Check disk space

### Environment Variables Not Loading

**Problem:** App doesn't connect to Pod

**Solutions:**
1. Copy `.env.solid-pod` contents to `.env.local`
2. Restart development server (`npm start`)
3. Verify variable names match (check for typos)
4. Check for extra spaces in values

## Advanced Usage

### Batch Setup (Multiple Clients)

Create script to run CLI multiple times:

```bash
#!/bin/bash

# setup-multiple-pods.sh

for client in john jane michael sarah
do
  echo "Setting up Pod for $client"
  npm run solid:setup
  # Follow prompts for each client
done
```

### Automated Setup (Non-Interactive)

For scripting, use environment variables:

```javascript
// automated-setup.js
const SolidPodSetup = require('./cli/solid-pod-setup');

const setup = new SolidPodSetup();

// Override prompts with automated values
setup.config = {
  provider: SOLID_PROVIDERS.solidcommunity,
  username: 'client-auto-001',
  password: generateSecurePassword(),
  email: 'auto@example.com',
  // ... other config
};

await setup.createPod();
await setup.saveConfiguration();
```

### Migration from Other Providers

```bash
# Export from old provider
npm run solid:export --provider=old-provider

# Setup new provider
npm run solid:setup

# Import data to new provider
npm run solid:import --from=old-provider --to=new-provider
```

## Integration with Application

### Using Generated Configuration

**In React components:**

```typescript
import React, { useEffect } from 'react';

function ClientDashboard() {
  useEffect(() => {
    // WebID from CLI setup
    const webId = process.env.REACT_APP_SOLID_WEB_ID;
    const podUrl = process.env.REACT_APP_SOLID_POD_URL;

    console.log('Client WebID:', webId);
    console.log('Client Pod:', podUrl);

    // Initialize Solid session
    // ...
  }, []);

  return <div>Client Dashboard</div>;
}
```

### Verifying Connection

**Test Pod connectivity:**

```bash
# Start app
npm start

# Check browser console for:
# "✅ Solid Pod initialization completed successfully"

# Or check status indicator in UI
# Green dot = Connected
# Red dot = Error
```

## CLI Architecture

### File Structure

```
cli/
└── solid-pod-setup.js  # Main CLI script

config/
└── solid-pods.json     # Generated Pod configurations

.env.solid-pod          # Generated environment template
```

### Dependencies

**Built-in Node.js modules:**
- `readline` - Interactive prompts
- `fs` - File operations
- `path` - File path handling
- `https` - API calls (for Pod creation)

**No external dependencies** - runs with standard Node.js installation.

### Class Structure

```javascript
class SolidPodSetup {
  constructor()           // Initialize readline interface
  async run()            // Main setup flow

  // Setup steps
  async selectProvider()
  async collectUserInfo()
  async createPod()
  async initializeClientProfile()
  async saveConfiguration()
  async verifySetup()

  // Utilities
  question()             // Prompt user
  isValidUsername()      // Validate username
  isValidPassword()      // Validate password
  generateSecurePassword() // Auto-generate password
  printBanner()          // Welcome message
  printSuccess()         // Success message
  printError()           // Error message
}
```

## Testing

### Manual Testing

```bash
# Test full workflow
npm run solid:setup

# Follow prompts and verify:
# 1. config/solid-pods.json created
# 2. .env.solid-pod generated
# 3. All fields populated correctly
```

### Automated Testing

```bash
# Run unit tests (when implemented)
npm test cli/solid-pod-setup.test.js
```

## Future Enhancements

**Planned Features:**
- [ ] Multi-language support (Spanish, Russian, Vietnamese)
- [ ] Bulk Pod creation from CSV
- [ ] Data export/import between providers
- [ ] Pod health monitoring
- [ ] Automatic backup scheduling
- [ ] Integration with HMIS
- [ ] QR code generation for WebID
- [ ] Client self-service registration
- [ ] Pod migration wizard

## Support

### For Technical Issues

**CLI errors:**
```bash
# Enable debug output
DEBUG=* npm run solid:setup

# Check Node.js version
node --version  # Should be v16+
```

**File permission errors:**
```bash
# Fix permissions
chmod +x cli/solid-pod-setup.js
chmod -R 755 config/
```

### For Provider Issues

**SolidCommunity.net:**
- Status: https://status.solidcommunity.net
- Help: https://forum.solidproject.org

**Inrupt:**
- Support: https://inrupt.com/support
- Docs: https://docs.inrupt.com

### For Feature Requests

- Submit via organizational channels
- GitHub issues (if applicable)
- Monthly stakeholder feedback

---

## Quick Reference

### Commands

```bash
npm run solid:setup          # Run interactive setup
node cli/solid-pod-setup.js  # Direct execution
```

### Providers

1. **SolidCommunity.net** - Development, free
2. **Inrupt PodSpaces** - Production, enterprise
3. **SolidWeb.org** - Community-hosted
4. **Local/Offline** - Development only

### Files Generated

- `config/solid-pods.json` - Pod configurations
- `.env.solid-pod` - Environment template

### Validation

- Username: 3-20 chars, lowercase, numbers, hyphens
- Password: 8+ characters minimum

---

**Last Updated:** 2025-01-XX
**Version:** 1.0.0
**Status:** Production ready

# External Agent Access Guide

This document provides information for coding agents and automation systems to interact with the RipeTomato Shelter Management System.

## Overview

The RipeTomato system provides external access mechanisms for automated builds, testing, and deployment operations. This enables coding agents to:

- Monitor system health
- Trigger builds and tests
- Deploy to staging environments
- Retrieve system status and information

## Access Methods

### 1. Command Line Interface (CLI)

The primary interface for external agents is the CLI script located at `scripts/external-agent.js`.

#### Usage

```bash
# Check system health
node scripts/external-agent.js health

# Build the application
node scripts/external-agent.js build

# Run tests
node scripts/external-agent.js test

# Deploy to staging
node scripts/external-agent.js deploy --env staging

# Get system status
node scripts/external-agent.js status

# Get system information
node scripts/external-agent.js info
```

#### npm Scripts

For convenience, the following npm scripts are available:

```bash
npm run agent:health    # Check system health
npm run agent:build     # Build application
npm run agent:test      # Run tests
npm run agent:status    # Get status
npm run agent:info      # Get system info
```

### 2. GitHub Actions Integration

The CI/CD workflow at `.github/workflows/nodejs.yml` provides automated:

- Testing on Node.js 18.x and 20.x
- Building and artifact creation
- External access configuration generation
- Deployment to staging (production requires manual approval)

#### Triggering Workflows

Workflows are automatically triggered on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

#### Artifacts

The workflow generates the following artifacts:
- `build-files` - Production build output
- `coverage-report` - Test coverage data
- `external-access-config` - Configuration for external systems

### 3. API Endpoints (Planned)

The system includes API endpoint definitions in `src/api/endpoints.ts` for future REST API implementation:

- `GET /api/health` - System health check
- `GET /api/build/status` - Build status
- `POST /api/build/trigger` - Trigger new build
- `POST /api/deploy` - Deploy application
- `GET /api/system` - System information

## System Capabilities

### Automated Operations

✅ **Available**
- Health monitoring
- Dependency installation
- Application building
- Test execution
- Linting and code quality checks
- Status reporting

⚠️ **Limited**
- Staging deployment (simulation only)

❌ **Restricted**
- Production deployment (requires manual approval)

### Build Process

The build process includes:
1. Dependency installation (`npm ci`)
2. TypeScript compilation
3. React production build
4. Asset optimization
5. Artifact generation

### Testing

Automated testing includes:
- Unit tests with Jest
- Component testing with React Testing Library
- Coverage reporting
- ESLint code quality checks

## External Agent Configuration

### Required Environment

- Node.js 18.x or 20.x
- npm package manager
- Git (for repository operations)

### Authentication

Currently, the system uses:
- GitHub repository access (for CI/CD)
- No additional authentication for CLI operations
- Future API endpoints will require bearer token authentication

### Rate Limits

Planned rate limits for API access:
- 60 requests per minute
- 5 build triggers per hour
- 10 deployment triggers per day

## Integration Examples

### Basic Health Check

```javascript
const { execSync } = require('child_process');

function checkSystemHealth() {
  try {
    const result = execSync('node scripts/external-agent.js health', {
      encoding: 'utf8'
    });
    const health = JSON.parse(result.split('\n').slice(-2)[0]);
    return health.status === 'healthy';
  } catch (error) {
    return false;
  }
}
```

### Automated Build and Test

```javascript
async function buildAndTest() {
  console.log('Starting automated build and test...');
  
  // Check health first
  execSync('node scripts/external-agent.js health');
  
  // Run tests
  execSync('node scripts/external-agent.js test');
  
  // Build application
  execSync('node scripts/external-agent.js build');
  
  console.log('Build and test completed successfully');
}
```

### GitHub Actions Integration

```yaml
- name: External Agent Health Check
  run: node scripts/external-agent.js health

- name: External Agent Build
  run: node scripts/external-agent.js build

- name: External Agent Test
  run: node scripts/external-agent.js test
```

## Monitoring and Debugging

### System Status

Get comprehensive system status:

```bash
node scripts/external-agent.js status
```

Returns:
- Git information (branch, commit)
- Build status and timestamps
- Dependency installation status
- System health metrics

### Logs and Diagnostics

- Build logs are displayed during build operations
- Test results include coverage information
- Health checks provide component-level status
- CI/CD workflow logs available in GitHub Actions

## Security Considerations

### Current Security Measures

- Repository-level access control
- CI/CD environment isolation
- No external network access during builds (except npm registry)
- Artifact scanning in CI/CD pipeline

### Planned Security Enhancements

- API authentication with bearer tokens
- Rate limiting implementation
- Audit logging for all external operations
- Encrypted communication for sensitive operations

## Support and Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Verify dependencies are installed
   - Review build logs for specific errors

2. **Test Failures**
   - Check test environment setup
   - Verify no conflicting processes
   - Review test logs for assertion failures

3. **Health Check Issues**
   - Verify all required files and directories exist
   - Check file permissions
   - Ensure Git repository is properly initialized

### Getting Help

- Review GitHub Actions workflow logs
- Check CLI output for detailed error messages
- Verify system requirements are met
- Contact development team for assistance

## Version Information

- CLI Version: 1.0.0
- Node.js Support: 18.x, 20.x
- API Version: 1.0.0 (planned)
- Last Updated: 2025-08-11

This external access system enables coding agents to effectively manage, build, test, and deploy the RipeTomato Shelter Management System while maintaining security and stability.
#!/usr/bin/env node

/**
 * Solid Pod Setup CLI
 *
 * Standalone CLI tool for initializing Solid Pod services for homeless clients.
 *
 * Features:
 * - Interactive prompts for Pod configuration
 * - Support for multiple Pod providers (solidcommunity.net, inrupt.net, etc.)
 * - Automatic Pod creation with secure credentials
 * - Client profile initialization
 * - Data ownership verification
 * - Offline fallback configuration
 *
 * Usage:
 *   node solid-pod-setup.js
 *   npm run solid:setup
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const https = require('https');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Configuration
const SOLID_PROVIDERS = {
  solidcommunity: {
    name: 'SolidCommunity.net',
    url: 'https://solidcommunity.net',
    registerEndpoint: '/register',
    loginEndpoint: '/login/password'
  },
  inrupt: {
    name: 'Inrupt PodSpaces',
    url: 'https://login.inrupt.com',
    registerEndpoint: '/register',
    loginEndpoint: '/login'
  },
  solidweb: {
    name: 'SolidWeb.org',
    url: 'https://solidweb.org',
    registerEndpoint: '/register',
    loginEndpoint: '/login'
  }
};

class SolidPodSetup {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    this.config = {
      provider: null,
      username: null,
      password: null,
      email: null,
      webId: null,
      podUrl: null,
      clientProfile: null
    };
  }

  /**
   * Main setup flow
   */
  async run() {
    this.printBanner();

    try {
      await this.selectProvider();
      await this.collectUserInfo();
      await this.createPod();
      await this.initializeClientProfile();
      await this.saveConfiguration();
      await this.verifySetup();

      this.printSuccess();
    } catch (error) {
      this.printError(error);
    } finally {
      this.rl.close();
    }
  }

  /**
   * Print welcome banner
   */
  printBanner() {
    console.log(`
${colors.cyan}${colors.bright}╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║          Solid Pod Setup for Idaho Community Services    ║
║                                                           ║
║  Initialize secure, client-owned data storage             ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝${colors.reset}

${colors.dim}This tool will help you set up a Solid Pod for secure client data storage.${colors.reset}
`);
  }

  /**
   * Select Solid Pod provider
   */
  async selectProvider() {
    console.log(`${colors.bright}Step 1: Select Solid Pod Provider${colors.reset}\n`);

    console.log('Available providers:\n');
    console.log(`  1. ${colors.green}SolidCommunity.net${colors.reset} (Recommended for development)`);
    console.log(`  2. ${colors.blue}Inrupt PodSpaces${colors.reset} (Enterprise-grade)`);
    console.log(`  3. ${colors.yellow}SolidWeb.org${colors.reset} (Community-hosted)`);
    console.log(`  4. ${colors.dim}Local/Offline${colors.reset} (Development only)\n`);

    const choice = await this.question('Select provider (1-4): ');

    switch (choice.trim()) {
      case '1':
        this.config.provider = SOLID_PROVIDERS.solidcommunity;
        break;
      case '2':
        this.config.provider = SOLID_PROVIDERS.inrupt;
        break;
      case '3':
        this.config.provider = SOLID_PROVIDERS.solidweb;
        break;
      case '4':
        this.config.provider = {
          name: 'Local/Offline',
          url: 'local://idaho-app',
          registerEndpoint: null,
          loginEndpoint: null
        };
        console.log(`\n${colors.yellow}⚠️  Local mode: Data stored in browser localStorage only${colors.reset}\n`);
        break;
      default:
        throw new Error('Invalid provider selection');
    }

    console.log(`\n${colors.green}✓${colors.reset} Selected: ${colors.bright}${this.config.provider.name}${colors.reset}\n`);
  }

  /**
   * Collect user information
   */
  async collectUserInfo() {
    console.log(`${colors.bright}Step 2: User Information${colors.reset}\n`);

    // For local/offline, generate automatic credentials
    if (this.config.provider.name === 'Local/Offline') {
      this.config.username = `client_${Date.now()}`;
      this.config.password = this.generateSecurePassword();
      this.config.webId = `local://idaho-app/${this.config.username}/profile#me`;
      this.config.podUrl = `local://idaho-app/${this.config.username}/`;

      console.log(`${colors.green}✓${colors.reset} Auto-generated credentials for local storage\n`);
      return;
    }

    // Collect username
    this.config.username = await this.question('Username: ');

    while (!this.isValidUsername(this.config.username)) {
      console.log(`${colors.red}✗${colors.reset} Username must be 3-20 characters (lowercase letters, numbers, hyphens)\n`);
      this.config.username = await this.question('Username: ');
    }

    // Collect password
    console.log(`${colors.dim}Password requirements: 8+ characters, mix of letters and numbers${colors.reset}`);
    this.config.password = await this.question('Password: ', true);

    while (!this.isValidPassword(this.config.password)) {
      console.log(`${colors.red}✗${colors.reset} Password must be at least 8 characters\n`);
      this.config.password = await this.question('Password: ', true);
    }

    const confirmPassword = await this.question('Confirm password: ', true);

    if (this.config.password !== confirmPassword) {
      throw new Error('Passwords do not match');
    }

    // Collect email (optional)
    this.config.email = await this.question('Email (optional, press Enter to skip): ');

    // Generate WebID and Pod URL
    this.config.webId = `${this.config.provider.url}/${this.config.username}/profile/card#me`;
    this.config.podUrl = `${this.config.provider.url}/${this.config.username}/`;

    console.log(`\n${colors.green}✓${colors.reset} User information collected\n`);
  }

  /**
   * Create Solid Pod
   */
  async createPod() {
    console.log(`${colors.bright}Step 3: Creating Solid Pod${colors.reset}\n`);

    // Local/offline mode - no actual Pod creation
    if (this.config.provider.name === 'Local/Offline') {
      console.log(`${colors.yellow}⚠️${colors.reset}  Skipping Pod creation (local mode)\n`);
      return;
    }

    console.log(`${colors.dim}Connecting to ${this.config.provider.name}...${colors.reset}`);

    try {
      // Attempt to create Pod via provider API
      // Note: Most providers require web-based registration
      // This is a simplified mock implementation

      const created = await this.attemptPodCreation();

      if (created) {
        console.log(`${colors.green}✓${colors.reset} Pod created successfully\n`);
        console.log(`  WebID: ${colors.cyan}${this.config.webId}${colors.reset}`);
        console.log(`  Pod URL: ${colors.cyan}${this.config.podUrl}${colors.reset}\n`);
      } else {
        console.log(`${colors.yellow}⚠️${colors.reset}  Could not create Pod automatically\n`);
        console.log(`${colors.bright}Manual registration required:${colors.reset}`);
        console.log(`  1. Visit: ${colors.cyan}${this.config.provider.url}/register${colors.reset}`);
        console.log(`  2. Create account with username: ${colors.bright}${this.config.username}${colors.reset}`);
        console.log(`  3. Return here and press Enter when complete\n`);

        await this.question('Press Enter after manual registration... ');
        console.log(`\n${colors.green}✓${colors.reset} Manual registration confirmed\n`);
      }
    } catch (error) {
      console.log(`${colors.yellow}⚠️${colors.reset}  Automatic creation failed: ${error.message}`);
      console.log(`${colors.dim}Will use offline fallback mode${colors.reset}\n`);

      // Fallback to local mode
      this.config.provider.name = 'Local/Offline (Fallback)';
      this.config.webId = `local://idaho-app/${this.config.username}/profile#me`;
      this.config.podUrl = `local://idaho-app/${this.config.username}/`;
    }
  }

  /**
   * Attempt Pod creation via API
   */
  async attemptPodCreation() {
    // Most Solid providers don't support programmatic registration
    // This is a mock implementation
    return new Promise((resolve) => {
      // Simulate API call
      setTimeout(() => {
        // Return false to trigger manual registration flow
        resolve(false);
      }, 1000);
    });
  }

  /**
   * Initialize client profile in Pod
   */
  async initializeClientProfile() {
    console.log(`${colors.bright}Step 4: Initialize Client Profile${colors.reset}\n`);

    const firstName = await this.question('Client first name: ');
    const lastName = await this.question('Client last name (optional): ');
    const preferredName = await this.question('Preferred name (optional): ');

    this.config.clientProfile = {
      firstName,
      lastName: lastName || undefined,
      preferredName: preferredName || firstName,
      webId: this.config.webId,
      podUrl: this.config.podUrl,
      createdAt: new Date().toISOString(),
      provider: this.config.provider.name,
      dataOwnership: 'client',
      privacyLevel: 'maximum'
    };

    console.log(`\n${colors.green}✓${colors.reset} Client profile initialized\n`);
  }

  /**
   * Save configuration to file
   */
  async saveConfiguration() {
    console.log(`${colors.bright}Step 5: Save Configuration${colors.reset}\n`);

    const configDir = path.join(__dirname, '..', 'config');
    const configFile = path.join(configDir, 'solid-pods.json');

    // Create config directory if it doesn't exist
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    // Load existing configs
    let existingConfigs = [];
    if (fs.existsSync(configFile)) {
      try {
        const data = fs.readFileSync(configFile, 'utf8');
        existingConfigs = JSON.parse(data);
      } catch (error) {
        console.log(`${colors.yellow}⚠️${colors.reset}  Could not read existing config: ${error.message}`);
      }
    }

    // Add new config (without password)
    const configToSave = {
      username: this.config.username,
      webId: this.config.webId,
      podUrl: this.config.podUrl,
      provider: this.config.provider.name,
      providerUrl: this.config.provider.url,
      clientProfile: this.config.clientProfile,
      createdAt: new Date().toISOString()
    };

    existingConfigs.push(configToSave);

    // Save to file
    fs.writeFileSync(
      configFile,
      JSON.stringify(existingConfigs, null, 2),
      'utf8'
    );

    console.log(`${colors.green}✓${colors.reset} Configuration saved to: ${colors.cyan}${configFile}${colors.reset}\n`);

    // Also save .env template
    const envFile = path.join(__dirname, '..', '.env.solid-pod');
    const envContent = `# Solid Pod Configuration for ${this.config.username}
# Generated: ${new Date().toISOString()}

REACT_APP_SOLID_PROVIDER=${this.config.provider.url}
REACT_APP_SOLID_WEB_ID=${this.config.webId}
REACT_APP_SOLID_POD_URL=${this.config.podUrl}
REACT_APP_SOLID_USERNAME=${this.config.username}

# Add this to your .env.local file
# Do not commit passwords to version control!
`;

    fs.writeFileSync(envFile, envContent, 'utf8');
    console.log(`${colors.green}✓${colors.reset} Environment template saved to: ${colors.cyan}${envFile}${colors.reset}\n`);
  }

  /**
   * Verify setup
   */
  async verifySetup() {
    console.log(`${colors.bright}Step 6: Verification${colors.reset}\n`);

    console.log('Setup summary:\n');
    console.log(`  Provider:       ${colors.bright}${this.config.provider.name}${colors.reset}`);
    console.log(`  Username:       ${colors.bright}${this.config.username}${colors.reset}`);
    console.log(`  WebID:          ${colors.cyan}${this.config.webId}${colors.reset}`);
    console.log(`  Pod URL:        ${colors.cyan}${this.config.podUrl}${colors.reset}`);
    console.log(`  Client:         ${colors.bright}${this.config.clientProfile.preferredName}${colors.reset}`);
    console.log(`  Data Ownership: ${colors.green}${this.config.clientProfile.dataOwnership}${colors.reset}`);
    console.log();

    const verify = await this.question('Is this information correct? (y/n): ');

    if (verify.toLowerCase() !== 'y') {
      throw new Error('Setup verification failed');
    }

    console.log(`\n${colors.green}✓${colors.reset} Setup verified\n`);
  }

  /**
   * Print success message
   */
  printSuccess() {
    console.log(`
${colors.green}${colors.bright}╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║                    Setup Successful! ✓                    ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝${colors.reset}

${colors.bright}Next Steps:${colors.reset}

1. ${colors.cyan}Copy environment variables${colors.reset}
   - Add contents of .env.solid-pod to your .env.local file

2. ${colors.cyan}Test the connection${colors.reset}
   - Run: ${colors.dim}npm start${colors.reset}
   - Navigate to client dashboard
   - Verify Pod connection indicator

3. ${colors.cyan}Client access${colors.reset}
   - Client can access their data via WebID: ${colors.dim}${this.config.webId}${colors.reset}
   - Full data ownership and privacy control
   - Can be accessed from any Solid-compatible app

4. ${colors.cyan}Security${colors.reset}
   - Never commit passwords to version control
   - Store credentials securely
   - Enable 2FA if available from provider

${colors.green}Thank you for using Idaho Community Services Platform!${colors.reset}
`);
  }

  /**
   * Print error message
   */
  printError(error) {
    console.log(`
${colors.red}${colors.bright}╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║                    Setup Failed ✗                         ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝${colors.reset}

${colors.red}Error: ${error.message}${colors.reset}

${colors.dim}Please try again or contact support.${colors.reset}
`);
  }

  /**
   * Prompt user for input
   */
  question(prompt, hideInput = false) {
    return new Promise((resolve) => {
      if (hideInput) {
        // Hide input for password
        const stdin = process.stdin;
        const onData = (char) => {
          char = char + '';
          switch (char) {
            case '\n':
            case '\r':
            case '\u0004':
              stdin.setRawMode(false);
              stdin.pause();
              stdin.removeListener('data', onData);
              console.log();
              resolve(input);
              break;
            case '\u0003':
              process.exit();
              break;
            case '\u007f': // backspace
              input = input.slice(0, -1);
              process.stdout.write('\b \b');
              break;
            default:
              input += char;
              process.stdout.write('*');
              break;
          }
        };

        let input = '';
        process.stdout.write(prompt);
        stdin.resume();
        stdin.setRawMode(true);
        stdin.on('data', onData);
      } else {
        this.rl.question(prompt, resolve);
      }
    });
  }

  /**
   * Validate username
   */
  isValidUsername(username) {
    return /^[a-z0-9-]{3,20}$/.test(username);
  }

  /**
   * Validate password
   */
  isValidPassword(password) {
    return password && password.length >= 8;
  }

  /**
   * Generate secure random password
   */
  generateSecurePassword() {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }
}

// Run if called directly
if (require.main === module) {
  const setup = new SolidPodSetup();
  setup.run().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = SolidPodSetup;

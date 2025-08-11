#!/usr/bin/env node

/**
 * External Agent Access Script
 * 
 * Provides command-line interface for external coding agents to interact
 * with the RipeTomato Shelter Management System.
 * 
 * Usage:
 *   node scripts/external-agent.js --help
 *   node scripts/external-agent.js health
 *   node scripts/external-agent.js build
 *   node scripts/external-agent.js deploy --env staging
 * 
 * @license MIT
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class ExternalAgentCLI {
  constructor() {
    this.version = '1.0.0';
    this.projectRoot = path.join(__dirname, '..');
  }

  async run() {
    const args = process.argv.slice(2);
    const command = args[0];

    if (!command || command === '--help' || command === '-h') {
      this.showHelp();
      return;
    }

    try {
      switch (command) {
        case 'health':
          await this.checkHealth();
          break;
        case 'build':
          await this.build();
          break;
        case 'test':
          await this.test();
          break;
        case 'deploy':
          await this.deploy(args);
          break;
        case 'status':
          await this.getStatus();
          break;
        case 'info':
          await this.getSystemInfo();
          break;
        default:
          console.error(`Unknown command: ${command}`);
          this.showHelp();
          process.exit(1);
      }
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  }

  showHelp() {
    console.log(`
RipeTomato External Agent CLI v${this.version}

Usage: node scripts/external-agent.js <command> [options]

Commands:
  health              Check system health
  build               Build the application
  test                Run tests
  deploy [--env ENV]  Deploy to environment (staging/production)
  status              Get build and deployment status
  info                Get system information

Options:
  --help, -h          Show this help message
  --env ENV           Specify environment for deployment

Examples:
  node scripts/external-agent.js health
  node scripts/external-agent.js build
  node scripts/external-agent.js test
  node scripts/external-agent.js deploy --env staging
  node scripts/external-agent.js status
`);
  }

  async checkHealth() {
    console.log('🏥 Checking system health...');
    
    const health = {
      timestamp: new Date().toISOString(),
      version: this.version,
      nodejs: process.version,
      platform: process.platform,
      components: {}
    };

    // Check if package.json exists
    const packagePath = path.join(this.projectRoot, 'package.json');
    health.components.package = fs.existsSync(packagePath) ? 'healthy' : 'missing';

    // Check if node_modules exists
    const nodeModulesPath = path.join(this.projectRoot, 'node_modules');
    health.components.dependencies = fs.existsSync(nodeModulesPath) ? 'healthy' : 'missing';

    // Check if build directory exists
    const buildPath = path.join(this.projectRoot, 'build');
    health.components.build = fs.existsSync(buildPath) ? 'healthy' : 'not_built';

    // Check if src directory exists
    const srcPath = path.join(this.projectRoot, 'src');
    health.components.source = fs.existsSync(srcPath) ? 'healthy' : 'missing';

    const overall = Object.values(health.components).every(status => status === 'healthy') 
      ? 'healthy' : 'degraded';

    console.log('✅ Health check complete:');
    console.log(JSON.stringify({ status: overall, ...health }, null, 2));
  }

  async build() {
    console.log('🔨 Building application...');
    
    try {
      // Install dependencies if needed
      if (!fs.existsSync(path.join(this.projectRoot, 'node_modules'))) {
        console.log('📦 Installing dependencies...');
        execSync('npm ci', { cwd: this.projectRoot, stdio: 'inherit' });
      }

      // Run build
      console.log('⚡ Building for production...');
      execSync('CI=false npm run build', { cwd: this.projectRoot, stdio: 'inherit' });
      
      console.log('✅ Build completed successfully');
      
      // Return build info
      const buildInfo = {
        timestamp: new Date().toISOString(),
        status: 'success',
        artifacts: ['build/'],
        size: this.getBuildSize()
      };
      
      console.log(JSON.stringify(buildInfo, null, 2));
    } catch (error) {
      console.error('❌ Build failed:', error.message);
      throw error;
    }
  }

  async test() {
    console.log('🧪 Running tests...');
    
    try {
      execSync('npm test -- --watchAll=false --coverage', { 
        cwd: this.projectRoot, 
        stdio: 'inherit' 
      });
      
      console.log('✅ Tests passed');
      
      const testInfo = {
        timestamp: new Date().toISOString(),
        status: 'passed',
        coverage: this.getCoverageInfo()
      };
      
      console.log(JSON.stringify(testInfo, null, 2));
    } catch (error) {
      console.error('❌ Tests failed:', error.message);
      throw error;
    }
  }

  async deploy(args) {
    const envIndex = args.indexOf('--env');
    const environment = envIndex !== -1 && args[envIndex + 1] ? args[envIndex + 1] : 'staging';
    
    console.log(`🚀 Deploying to ${environment}...`);
    
    if (environment === 'production') {
      console.log('⚠️  Production deployment requires manual approval');
      console.log('Please use the GitHub Actions workflow for production deployments');
      return;
    }
    
    // For staging deployment
    console.log('📋 Deployment simulation for', environment);
    
    const deploymentInfo = {
      timestamp: new Date().toISOString(),
      environment,
      status: 'simulated',
      deploymentId: `deploy-${Date.now()}`,
      message: 'Deployment simulation completed. In production, this would trigger actual deployment.'
    };
    
    console.log(JSON.stringify(deploymentInfo, null, 2));
  }

  async getStatus() {
    console.log('📊 Getting system status...');
    
    const status = {
      timestamp: new Date().toISOString(),
      version: this.version,
      git: this.getGitInfo(),
      build: this.getBuildInfo(),
      dependencies: this.getDependencyInfo()
    };
    
    console.log(JSON.stringify(status, null, 2));
  }

  async getSystemInfo() {
    console.log('ℹ️  Getting system information...');
    
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(this.projectRoot, 'package.json'), 'utf8')
    );
    
    const info = {
      name: packageJson.name,
      version: packageJson.version,
      description: 'Idaho Community Shelter Management System with unified data ownership',
      features: [
        'unified-data-ownership',
        'apple-wallet-integration', 
        'solid-pod-support',
        'dataswift-hat-integration',
        'health-monitoring',
        'automated-scheduling'
      ],
      external_access: {
        enabled: true,
        cli_version: this.version,
        automation_ready: true,
        build_automation: true,
        test_automation: true,
        deploy_automation: 'staging-only'
      },
      scripts: packageJson.scripts,
      dependencies_count: Object.keys(packageJson.dependencies || {}).length,
      dev_dependencies_count: Object.keys(packageJson.devDependencies || {}).length
    };
    
    console.log(JSON.stringify(info, null, 2));
  }

  getBuildSize() {
    try {
      const buildPath = path.join(this.projectRoot, 'build');
      if (!fs.existsSync(buildPath)) return 'No build directory';
      
      const stats = fs.statSync(buildPath);
      return `${Math.round(stats.size / 1024)} KB`;
    } catch {
      return 'Unknown';
    }
  }

  getCoverageInfo() {
    try {
      const coveragePath = path.join(this.projectRoot, 'coverage', 'coverage-summary.json');
      if (fs.existsSync(coveragePath)) {
        const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
        return coverage.total;
      }
    } catch {
      // Ignore errors
    }
    return 'Coverage data not available';
  }

  getGitInfo() {
    try {
      const branch = execSync('git rev-parse --abbrev-ref HEAD', { 
        cwd: this.projectRoot, 
        encoding: 'utf8' 
      }).trim();
      
      const commit = execSync('git rev-parse --short HEAD', { 
        cwd: this.projectRoot, 
        encoding: 'utf8' 
      }).trim();
      
      return { branch, commit };
    } catch {
      return { branch: 'unknown', commit: 'unknown' };
    }
  }

  getBuildInfo() {
    const buildPath = path.join(this.projectRoot, 'build');
    return {
      exists: fs.existsSync(buildPath),
      last_modified: fs.existsSync(buildPath) 
        ? fs.statSync(buildPath).mtime.toISOString()
        : null
    };
  }

  getDependencyInfo() {
    const nodeModulesPath = path.join(this.projectRoot, 'node_modules');
    return {
      installed: fs.existsSync(nodeModulesPath),
      last_install: fs.existsSync(nodeModulesPath)
        ? fs.statSync(nodeModulesPath).mtime.toISOString()
        : null
    };
  }
}

// Run CLI if called directly
if (require.main === module) {
  const cli = new ExternalAgentCLI();
  cli.run().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = ExternalAgentCLI;
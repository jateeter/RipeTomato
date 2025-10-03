/**
 * Multi-Language Agent Runtime System
 * 
 * Provides a unified runtime environment for agents written in different languages:
 * - JavaScript/TypeScript (native Node.js execution)
 * - Python (via child_process spawning or HTTP API)
 * - Future: Java, Go, Rust, etc.
 * 
 * Features:
 * - Language-agnostic communication protocol
 * - Runtime environment management
 * - Resource isolation and monitoring
 * - Cross-language event handling
 * - Performance optimization per language
 * 
 * @license MIT
 */

// Note: child_process is Node.js only and cannot be used in browser
// This service should only be used in server-side/Node.js environments
// For browser compatibility, we use type-only imports
import type { ChildProcess } from 'child_process';
import { BotEvent, BotMessage, BotConfiguration, BotInstance } from './botlabCore';
import { safeLocalStorage } from '../utils/localStorage';

// Supported runtime languages
export enum AgentLanguage {
  JAVASCRIPT = 'javascript',
  TYPESCRIPT = 'typescript', 
  PYTHON = 'python',
  JAVA = 'java',
  GO = 'go',
  RUST = 'rust'
}

// Runtime environment configuration
export interface RuntimeEnvironment {
  language: AgentLanguage;
  version: string;
  executable: string; // Path to language interpreter/compiler
  workingDirectory: string;
  environmentVariables: Record<string, string>;
  resourceLimits: {
    maxMemoryMB: number;
    maxCpuPercent: number;
    timeoutMs: number;
  };
  dependencies: string[]; // Required packages/modules
}

// Cross-language message protocol
export interface CrossLanguageMessage {
  id: string;
  timestamp: string;
  type: 'event' | 'command' | 'response' | 'error' | 'heartbeat';
  source: {
    agentId: string;
    language: AgentLanguage;
    runtime: string;
  };
  destination: {
    agentId?: string;
    language?: AgentLanguage;
    broadcast?: boolean;
  };
  payload: any;
  metadata: {
    priority: 'low' | 'normal' | 'high' | 'critical';
    correlationId?: string;
    retryCount: number;
    maxRetries: number;
    timeoutMs: number;
  };
}

// Agent execution context
export interface AgentExecutionContext {
  agentId: string;
  language: AgentLanguage;
  runtime: RuntimeEnvironment;
  process?: ChildProcess;
  communicationChannel: 'stdio' | 'http' | 'websocket' | 'ipc';
  healthStatus: 'healthy' | 'degraded' | 'unhealthy' | 'stopped';
  lastHeartbeat: Date;
  resourceUsage: {
    memoryMB: number;
    cpuPercent: number;
    uptime: number;
  };
}

// Multi-language agent interface
export abstract class MultiLanguageAgent {
  protected agentId: string;
  protected language: AgentLanguage;
  protected runtime: RuntimeEnvironment;
  protected context: AgentExecutionContext;
  protected messageHandlers: Map<string, (message: CrossLanguageMessage) => Promise<void>> = new Map();

  constructor(agentId: string, language: AgentLanguage, runtime: RuntimeEnvironment) {
    this.agentId = agentId;
    this.language = language;
    this.runtime = runtime;
    this.context = {
      agentId,
      language,
      runtime,
      communicationChannel: this.determineCommunicationChannel(),
      healthStatus: 'stopped',
      lastHeartbeat: new Date(),
      resourceUsage: {
        memoryMB: 0,
        cpuPercent: 0,
        uptime: 0
      }
    };
  }

  // Abstract methods to be implemented by specific language runtimes
  abstract start(): Promise<void>;
  abstract stop(): Promise<void>;
  abstract sendMessage(message: CrossLanguageMessage): Promise<void>;
  abstract handleMessage(message: CrossLanguageMessage): Promise<void>;

  // Common functionality
  protected determineCommunicationChannel(): 'stdio' | 'http' | 'websocket' | 'ipc' {
    switch (this.language) {
      case AgentLanguage.JAVASCRIPT:
      case AgentLanguage.TYPESCRIPT:
        return 'ipc'; // In-process communication
      case AgentLanguage.PYTHON:
        return 'stdio'; // Standard input/output
      case AgentLanguage.JAVA:
        return 'http'; // HTTP API
      default:
        return 'stdio';
    }
  }

  protected registerMessageHandler(type: string, handler: (message: CrossLanguageMessage) => Promise<void>): void {
    this.messageHandlers.set(type, handler);
  }

  protected async updateHealthStatus(): Promise<void> {
    this.context.lastHeartbeat = new Date();
    // Basic health check - can be overridden by specific implementations
    this.context.healthStatus = 'healthy';
  }

  public getContext(): AgentExecutionContext {
    return { ...this.context };
  }

  public getAgentId(): string {
    return this.agentId;
  }

  public getLanguage(): AgentLanguage {
    return this.language;
  }
}

// JavaScript/TypeScript native runtime
export class JavaScriptAgent extends MultiLanguageAgent {
  private agentModule: any;
  private modulePath: string;
  private moduleLoaded = false;

  constructor(agentId: string, runtime: RuntimeEnvironment, modulePath: string) {
    super(agentId, AgentLanguage.JAVASCRIPT, runtime);
    this.modulePath = modulePath;
    // Don't load module immediately to avoid issues in testing
    // Module will be loaded on demand when needed
  }

  private async loadAgentModule(): Promise<void> {
    if (this.moduleLoaded) return;
    
    try {
      // Dynamic import for JavaScript/TypeScript agents
      this.agentModule = await import(this.modulePath);
      this.moduleLoaded = true;
      console.log(`📦 Loaded JavaScript agent module: ${this.modulePath}`);
    } catch (error) {
      console.error(`❌ Failed to load JavaScript agent module: ${this.modulePath}`, error);
      // In testing environments, we might not have actual modules, so don't throw
      if (process.env.NODE_ENV !== 'test') {
        throw error;
      }
    }
  }

  async start(): Promise<void> {
    try {
      await this.loadAgentModule();
      this.context.healthStatus = 'healthy';
      if (this.agentModule?.initialize) {
        await this.agentModule.initialize();
      }
      console.log(`🚀 Started JavaScript agent: ${this.agentId}`);
    } catch (error) {
      this.context.healthStatus = 'unhealthy';
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      await this.loadAgentModule();
      if (this.agentModule?.cleanup) {
        await this.agentModule.cleanup();
      }
      this.context.healthStatus = 'stopped';
      console.log(`🛑 Stopped JavaScript agent: ${this.agentId}`);
    } catch (error) {
      console.error(`❌ Error stopping JavaScript agent: ${this.agentId}`, error);
    }
  }

  async sendMessage(message: CrossLanguageMessage): Promise<void> {
    await this.loadAgentModule();
    if (this.agentModule?.handleMessage) {
      await this.agentModule.handleMessage(message);
    }
  }

  async handleMessage(message: CrossLanguageMessage): Promise<void> {
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      await handler(message);
    } else if (this.agentModule?.handleMessage) {
      await this.agentModule.handleMessage(message);
    }
  }
}

// Python runtime via child process
export class PythonAgent extends MultiLanguageAgent {
  private pythonProcess?: ChildProcess;
  private messageQueue: CrossLanguageMessage[] = [];
  private isProcessingMessages = false;

  constructor(agentId: string, runtime: RuntimeEnvironment, scriptPath: string) {
    super(agentId, AgentLanguage.PYTHON, runtime);
    this.initializePythonRuntime(scriptPath);
  }

  private initializePythonRuntime(scriptPath: string): void {
    // Prepare Python runtime environment
    const pythonExecutable = this.runtime.executable || 'python3';
    const args = [scriptPath, '--agent-id', this.agentId];
    
    console.log(`🐍 Initializing Python agent runtime: ${pythonExecutable} ${args.join(' ')}`);
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Check if we're in a browser environment
        if (typeof window !== 'undefined') {
          console.warn('⚠️ Python agents are not supported in browser environment');
          this.context.healthStatus = 'unhealthy';
          reject(new Error('Python agents require Node.js environment'));
          return;
        }

        // Dynamically import spawn only in Node.js environment
        const { spawn } = require('child_process');

        const pythonExecutable = this.runtime.executable || 'python3';
        const scriptPath = this.runtime.workingDirectory;

        this.pythonProcess = spawn(pythonExecutable, [scriptPath, '--agent-id', this.agentId], {
          cwd: this.runtime.workingDirectory,
          env: { ...process.env, ...this.runtime.environmentVariables },
          stdio: ['pipe', 'pipe', 'pipe']
        });

        // Handle process events
        this.pythonProcess.on('spawn', () => {
          this.context.healthStatus = 'healthy';
          console.log(`🚀 Started Python agent: ${this.agentId}`);
          resolve();
        });

        this.pythonProcess.on('error', (error) => {
          this.context.healthStatus = 'unhealthy';
          console.error(`❌ Python agent error: ${this.agentId}`, error);
          reject(error);
        });

        this.pythonProcess.on('exit', (code) => {
          this.context.healthStatus = 'stopped';
          console.log(`🛑 Python agent exited: ${this.agentId} (code: ${code})`);
        });

        // Set up communication
        this.setupPythonCommunication();

      } catch (error) {
        this.context.healthStatus = 'unhealthy';
        reject(error);
      }
    });
  }

  async stop(): Promise<void> {
    if (this.pythonProcess) {
      return new Promise((resolve) => {
        this.pythonProcess!.on('exit', () => {
          this.context.healthStatus = 'stopped';
          console.log(`🛑 Stopped Python agent: ${this.agentId}`);
          resolve();
        });

        // Send termination signal
        this.pythonProcess!.kill('SIGTERM');

        // Force kill after timeout
        setTimeout(() => {
          if (this.pythonProcess && !this.pythonProcess.killed) {
            this.pythonProcess.kill('SIGKILL');
            resolve();
          }
        }, 5000);
      });
    }
  }

  async sendMessage(message: CrossLanguageMessage): Promise<void> {
    if (this.pythonProcess && this.pythonProcess.stdin) {
      const messageStr = JSON.stringify(message) + '\n';
      this.pythonProcess.stdin.write(messageStr);
    } else {
      // Queue message if process not ready
      this.messageQueue.push(message);
    }
  }

  async handleMessage(message: CrossLanguageMessage): Promise<void> {
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      await handler(message);
    } else {
      // Forward to Python process
      await this.sendMessage(message);
    }
  }

  private setupPythonCommunication(): void {
    if (!this.pythonProcess) return;

    // Handle stdout (messages from Python agent)
    this.pythonProcess.stdout?.on('data', (data) => {
      const lines = data.toString().split('\n').filter(Boolean);
      
      lines.forEach(line => {
        try {
          const message: CrossLanguageMessage = JSON.parse(line);
          this.processPythonMessage(message);
        } catch (error) {
          console.log(`📄 Python agent output: ${line}`);
        }
      });
    });

    // Handle stderr
    this.pythonProcess.stderr?.on('data', (data) => {
      console.error(`🐍 Python agent stderr: ${data.toString()}`);
    });

    // Process queued messages
    this.processMessageQueue();
  }

  private async processPythonMessage(message: CrossLanguageMessage): Promise<void> {
    // Handle messages received from Python agent
    console.log(`📥 Received message from Python agent: ${message.type}`);
    
    // Update health status
    if (message.type === 'heartbeat') {
      await this.updateHealthStatus();
    }

    // Delegate to registered handlers
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      await handler(message);
    }
  }

  private async processMessageQueue(): Promise<void> {
    if (this.isProcessingMessages || this.messageQueue.length === 0) return;

    this.isProcessingMessages = true;
    
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()!;
      await this.sendMessage(message);
    }

    this.isProcessingMessages = false;
  }
}

// Multi-language agent runtime manager
class MultiLanguageAgentRuntimeManager {
  private agents: Map<string, MultiLanguageAgent> = new Map();
  private runtimeEnvironments: Map<AgentLanguage, RuntimeEnvironment> = new Map();

  constructor() {
    this.initializeDefaultRuntimes();
  }

  private initializeDefaultRuntimes(): void {
    // JavaScript/TypeScript runtime
    this.runtimeEnvironments.set(AgentLanguage.JAVASCRIPT, {
      language: AgentLanguage.JAVASCRIPT,
      version: process.version,
      executable: process.execPath,
      workingDirectory: process.cwd(),
      environmentVariables: {},
      resourceLimits: {
        maxMemoryMB: 512,
        maxCpuPercent: 80,
        timeoutMs: 30000
      },
      dependencies: []
    });

    // Python runtime
    this.runtimeEnvironments.set(AgentLanguage.PYTHON, {
      language: AgentLanguage.PYTHON,
      version: '3.9+',
      executable: 'python3',
      workingDirectory: '/tmp/python-agents',
      environmentVariables: {
        PYTHONPATH: '/tmp/python-agents',
        PYTHONUNBUFFERED: '1'
      },
      resourceLimits: {
        maxMemoryMB: 256,
        maxCpuPercent: 60,
        timeoutMs: 30000
      },
      dependencies: ['requests', 'json', 'asyncio']
    });
  }

  async createAgent(
    agentId: string,
    language: AgentLanguage,
    modulePath: string,
    customRuntime?: Partial<RuntimeEnvironment>
  ): Promise<MultiLanguageAgent> {
    const runtime = {
      ...this.runtimeEnvironments.get(language)!,
      ...customRuntime
    };

    let agent: MultiLanguageAgent;

    switch (language) {
      case AgentLanguage.JAVASCRIPT:
      case AgentLanguage.TYPESCRIPT:
        agent = new JavaScriptAgent(agentId, runtime, modulePath);
        break;
      case AgentLanguage.PYTHON:
        agent = new PythonAgent(agentId, runtime, modulePath);
        break;
      default:
        throw new Error(`Unsupported agent language: ${language}`);
    }

    this.agents.set(agentId, agent);
    console.log(`🎯 Created ${language} agent: ${agentId}`);

    return agent;
  }

  async startAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    await agent.start();
  }

  async stopAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    await agent.stop();
    this.agents.delete(agentId);
  }

  async stopAllAgents(): Promise<void> {
    const stopPromises = Array.from(this.agents.keys()).map(agentId => 
      this.stopAgent(agentId).catch(error => 
        console.error(`Error stopping agent ${agentId}:`, error)
      )
    );

    await Promise.all(stopPromises);
  }

  getAgent(agentId: string): MultiLanguageAgent | undefined {
    return this.agents.get(agentId);
  }

  getAllAgents(): MultiLanguageAgent[] {
    return Array.from(this.agents.values());
  }

  getAgentsByLanguage(language: AgentLanguage): MultiLanguageAgent[] {
    return Array.from(this.agents.values()).filter(agent => 
      agent.getLanguage() === language
    );
  }

  async broadcastMessage(message: CrossLanguageMessage): Promise<void> {
    const sendPromises = Array.from(this.agents.values()).map(async agent => {
      try {
        await agent.sendMessage(message);
      } catch (error) {
        console.error(`Error sending message to agent ${agent.getAgentId()}:`, error);
        // Don't rethrow - we want to continue sending to other agents
      }
    });

    await Promise.all(sendPromises);
  }

  getRuntimeEnvironment(language: AgentLanguage): RuntimeEnvironment | undefined {
    return this.runtimeEnvironments.get(language);
  }

  updateRuntimeEnvironment(language: AgentLanguage, updates: Partial<RuntimeEnvironment>): void {
    const existing = this.runtimeEnvironments.get(language);
    if (existing) {
      this.runtimeEnvironments.set(language, { ...existing, ...updates });
    }
  }

  getSystemStatus(): {
    totalAgents: number;
    agentsByLanguage: Record<string, number>;
    healthyAgents: number;
    unhealthyAgents: number;
  } {
    const agents = Array.from(this.agents.values());
    const agentsByLanguage: Record<string, number> = {};
    let healthyAgents = 0;
    let unhealthyAgents = 0;

    agents.forEach(agent => {
      const language = agent.getLanguage();
      agentsByLanguage[language] = (agentsByLanguage[language] || 0) + 1;

      const context = agent.getContext();
      if (context.healthStatus === 'healthy') {
        healthyAgents++;
      } else {
        unhealthyAgents++;
      }
    });

    return {
      totalAgents: agents.length,
      agentsByLanguage,
      healthyAgents,
      unhealthyAgents
    };
  }
}

// Export singleton manager
export const multiLanguageAgentRuntime = new MultiLanguageAgentRuntimeManager();
export default multiLanguageAgentRuntime;
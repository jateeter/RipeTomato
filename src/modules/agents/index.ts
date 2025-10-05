/**
 * Agents Module
 *
 * Multi-language agent operations with JavaScript/TypeScript and Python support.
 * Provides core bot functionality, runtime management, and cross-language messaging.
 */

// Core BotLab functionality
export {
  botLabCore,
  BaseBotLabBot,
  type BotMessage,
  type BotEvent,
  type BotConfiguration,
  type BotInstance
} from './core/BotLabCore';

// Multi-language runtime
export {
  multiLanguageAgentRuntime,
  multiLanguageAgentRuntime as multiLanguageRuntime,
  type AgentContext,
  type AgentConfig,
  type CrossLanguageMessage,
  type RuntimeConfig,
  type PythonRuntimeConfig,
  AgentLanguage
} from './runtime/MultiLanguageRuntime';

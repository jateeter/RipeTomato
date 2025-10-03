# Multi-Language Agent Configuration

## Overview

The Idaho Events agent system supports JavaScript/TypeScript and Python agents with cross-language communication capabilities.

## Architecture

### Agent Runtime System

```typescript
// Agent runtime hierarchy
MultiLanguageRuntime
  ├── JavaScriptRuntime (in-process)
  ├── PythonRuntime (child process)
  └── Future: Java, Go, Rust
```

### Communication Protocol

Agents communicate via JSON messages over stdio (Python) or in-process calls (JavaScript):

```typescript
interface CrossLanguageMessage {
  id: string;
  timestamp: string;
  type: 'event' | 'command' | 'response' | 'error' | 'heartbeat';
  source: {
    agentId: string;
    language: 'javascript' | 'python' | 'java';
    runtime: string;
  };
  destination: {
    agentId?: string;
    language?: string;
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
```

## Configuration Files

### 1. Agent Registry Configuration

**File**: `config/agents.yaml`

```yaml
agents:
  # JavaScript Agents
  calendar-reminder:
    language: javascript
    modulePath: ./src/agents/CalendarReminderAgent.ts
    enabled: true
    autostart: true
    resourceLimits:
      maxMemoryMB: 256
      maxCpuPercent: 50
      timeoutMs: 30000

  # Python Agents
  weather-monitoring:
    language: python
    scriptPath: ./src/agents/python/weather_monitoring_agent.py
    executable: python3
    enabled: true
    autostart: true
    environmentVariables:
      PYTHONPATH: ./src/agents/python
      PYTHONUNBUFFERED: "1"
    resourceLimits:
      maxMemoryMB: 512
      maxCpuPercent: 60
      timeoutMs: 60000
    dependencies:
      - requests
      - asyncio
      - json
```

### 2. Runtime Environment Configuration

**File**: `config/runtime-config.json`

```json
{
  "runtimeEnvironments": {
    "javascript": {
      "version": "16.x",
      "executable": "node",
      "workingDirectory": "./src/agents",
      "resourceLimits": {
        "maxMemoryMB": 512,
        "maxCpuPercent": 80,
        "timeoutMs": 30000
      }
    },
    "python": {
      "version": "3.9+",
      "executable": "python3",
      "workingDirectory": "./src/agents/python",
      "environmentVariables": {
        "PYTHONPATH": "./src/agents/python",
        "PYTHONUNBUFFERED": "1"
      },
      "resourceLimits": {
        "maxMemoryMB": 512,
        "maxCpuPercent": 60,
        "timeoutMs": 60000
      }
    }
  },
  "messageQueue": {
    "maxQueueSize": 1000,
    "messageRetention": 3600000,
    "deadLetterQueue": true
  },
  "healthCheck": {
    "interval": 30000,
    "timeout": 5000,
    "failureThreshold": 3
  }
}
```

## Creating a New Agent

### JavaScript/TypeScript Agent

**1. Create agent file**: `src/modules/agents/core/MyCustomAgent.ts`

```typescript
import { BotConfiguration, BotInstance, BotEvent } from '../../../services/botlabCore';

export interface MyCustomAgentConfig extends BotConfiguration {
  customSetting: string;
}

export class MyCustomAgent {
  constructor(private config: MyCustomAgentConfig) {}

  async initialize(): Promise<void> {
    console.log('Initializing MyCustomAgent...');
    // Setup logic
  }

  async handleEvent(event: BotEvent): Promise<void> {
    // Event handling logic
    console.log('Received event:', event.type);
  }

  async cleanup(): Promise<void> {
    // Cleanup logic
  }
}

// Export singleton instance
export const myCustomAgent = new MyCustomAgent({
  id: 'my-custom-agent',
  name: 'My Custom Agent',
  customSetting: 'value'
});
```

**2. Register in agent manager**: `src/modules/agents/core/AgentRegistry.ts`

```typescript
import { myCustomAgent } from './MyCustomAgent';

export const agentRegistry = {
  'my-custom-agent': myCustomAgent,
  // ... other agents
};
```

### Python Agent

**1. Create agent file**: `src/modules/agents/python/my_custom_agent.py`

```python
#!/usr/bin/env python3
import sys
import json
import asyncio
from base_agent import BaseAgent

class MyCustomAgent(BaseAgent):
    def __init__(self, agent_id: str):
        super().__init__(agent_id)
        self.custom_setting = None

    async def initialize(self):
        """Initialize agent"""
        print(f"Initializing {self.agent_id}...", file=sys.stderr)
        # Setup logic

    async def handle_message(self, message: dict):
        """Handle incoming messages"""
        msg_type = message.get('type')

        if msg_type == 'command':
            await self.handle_command(message)
        elif msg_type == 'event':
            await self.handle_event(message)

    async def handle_command(self, message: dict):
        """Handle command messages"""
        payload = message.get('payload', {})
        # Command handling logic

        # Send response
        response = self.create_message(
            msg_type='response',
            payload={'status': 'success', 'data': result}
        )
        await self.send_message(response)

    async def cleanup(self):
        """Cleanup resources"""
        print(f"Cleaning up {self.agent_id}...", file=sys.stderr)

if __name__ == '__main__':
    agent = MyCustomAgent('my-custom-agent')
    asyncio.run(agent.run())
```

**2. Update requirements**: `src/modules/agents/python/requirements.txt`

```
requests>=2.28.0
asyncio
# Add custom dependencies
```

## Agent Communication Examples

### JavaScript to Python

```typescript
// In JavaScript agent
const message: CrossLanguageMessage = {
  id: `weather_request_${Date.now()}`,
  timestamp: new Date().toISOString(),
  type: 'command',
  source: {
    agentId: 'calendar-agent',
    language: 'javascript',
    runtime: 'nodejs'
  },
  destination: {
    agentId: 'weather-monitoring',
    language: 'python'
  },
  payload: {
    action: 'get_forecast',
    location: 'Boise, ID'
  },
  metadata: {
    priority: 'normal',
    retryCount: 0,
    maxRetries: 3,
    timeoutMs: 30000
  }
};

await multiLanguageRuntime.sendMessage(message);
```

### Python to JavaScript

```python
# In Python agent
message = self.create_message(
    msg_type='event',
    payload={
        'eventType': 'weather_alert',
        'severity': 'high',
        'location': 'Boise, ID',
        'description': 'Severe thunderstorm warning'
    },
    destination={
        'broadcast': True  # Send to all agents
    }
)

await self.send_message(message)
```

## Environment Variables

### Required Variables

```bash
# Node.js Runtime
NODE_ENV=development|production
NODE_PATH=./src/modules/agents/core

# Python Runtime
PYTHON_PATH=./src/modules/agents/python
PYTHONUNBUFFERED=1
PYTHON_VERSION=3.9

# Agent Configuration
AGENT_LOG_LEVEL=debug|info|warn|error
AGENT_HEALTH_CHECK_INTERVAL=30000
AGENT_MESSAGE_TIMEOUT=30000
```

### Optional Variables

```bash
# Performance Tuning
AGENT_MAX_MEMORY_MB=512
AGENT_MAX_CPU_PERCENT=80
AGENT_WORKER_THREADS=4

# Monitoring
AGENT_METRICS_ENABLED=true
AGENT_METRICS_INTERVAL=60000
AGENT_TELEMETRY_ENDPOINT=https://metrics.example.com
```

## Monitoring & Health Checks

### Health Check Endpoint

Agents expose health status via the runtime manager:

```typescript
const status = await multiLanguageRuntime.getSystemStatus();
// Returns:
// {
//   totalAgents: 5,
//   healthyAgents: 4,
//   unhealthyAgents: 1,
//   agentsByLanguage: {
//     javascript: 3,
//     python: 2
//   }
// }
```

### Agent Metrics

Each agent reports:
- Memory usage (MB)
- CPU usage (%)
- Uptime (seconds)
- Messages processed
- Error count
- Last heartbeat timestamp

### Logging

Agents use structured logging:

```typescript
// JavaScript
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  level: 'info',
  agentId: 'my-agent',
  message: 'Event processed',
  metadata: { eventId: '123' }
}));
```

```python
# Python
import json
import sys

log_entry = {
    'timestamp': datetime.now().isoformat(),
    'level': 'info',
    'agentId': 'my-agent',
    'message': 'Event processed',
    'metadata': {'eventId': '123'}
}
print(json.dumps(log_entry), file=sys.stderr)
```

## Troubleshooting

### Common Issues

**1. Python agent not starting**
- Check Python version: `python3 --version`
- Verify PYTHONPATH is set correctly
- Check script permissions: `chmod +x agent.py`
- Review stderr logs for Python errors

**2. Message timeout**
- Increase `timeoutMs` in agent config
- Check network connectivity
- Verify message format is correct

**3. High memory usage**
- Reduce `maxMemoryMB` limit
- Check for memory leaks in agent code
- Implement proper cleanup in `cleanup()` method

**4. Agent crashes on startup**
- Check all dependencies are installed
- Verify environment variables
- Review initialization code
- Check file permissions

## Best Practices

1. **Error Handling**: Always wrap agent logic in try-catch blocks
2. **Resource Management**: Implement proper cleanup in `cleanup()` method
3. **Message Validation**: Validate all incoming message payloads
4. **Timeouts**: Set appropriate timeouts for long-running operations
5. **Logging**: Use structured logging for better debugging
6. **Testing**: Write unit tests for agent logic
7. **Monitoring**: Implement health checks and metrics
8. **Documentation**: Document agent capabilities and message formats

## Related Documentation

- [Architecture Overview](./ARCHITECTURE.md)
- [Python Agent Development Guide](./PYTHON_AGENT_GUIDE.md)
- [Message Protocol Specification](./MESSAGE_PROTOCOL.md)

#!/usr/bin/env python3
"""
Base Python Agent for Multi-Language Agent Runtime

Provides base functionality for Python agents that integrate with the
JavaScript/TypeScript agent infrastructure via stdio communication.

Features:
- Cross-language message protocol handling
- Event processing and response generation  
- Resource monitoring and health reporting
- State persistence and recovery
- Error handling and logging

Usage:
    class MyAgent(BaseAgent):
        def __init__(self, agent_id):
            super().__init__(agent_id, "my_agent", "1.0.0")
            
        async def handle_custom_event(self, message):
            # Handle custom events
            pass

@license MIT
"""

import asyncio
import json
import sys
import time
import traceback
import argparse
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional, Callable, List
from abc import ABC, abstractmethod

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class CrossLanguageMessage:
    """Represents a message in the cross-language communication protocol"""
    
    def __init__(self, 
                 msg_id: str,
                 msg_type: str,
                 source: Dict[str, Any],
                 destination: Dict[str, Any],
                 payload: Any,
                 metadata: Dict[str, Any]):
        self.id = msg_id
        self.type = msg_type
        self.timestamp = datetime.now(timezone.utc).isoformat()
        self.source = source
        self.destination = destination
        self.payload = payload
        self.metadata = metadata
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert message to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'timestamp': self.timestamp,
            'type': self.type,
            'source': self.source,
            'destination': self.destination,
            'payload': self.payload,
            'metadata': self.metadata
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'CrossLanguageMessage':
        """Create message from dictionary"""
        return cls(
            data['id'],
            data['type'],
            data['source'],
            data['destination'],
            data['payload'],
            data['metadata']
        )

class BaseAgent(ABC):
    """Base class for Python agents in the multi-language runtime"""
    
    def __init__(self, agent_id: str, name: str, version: str):
        self.agent_id = agent_id
        self.name = name
        self.version = version
        self.started_at = datetime.now(timezone.utc)
        self.last_heartbeat = datetime.now(timezone.utc)
        self.message_count = 0
        self.error_count = 0
        self.is_running = False
        
        # Message handlers registry
        self.message_handlers: Dict[str, Callable] = {}
        self.register_default_handlers()
        
        # State storage
        self.state: Dict[str, Any] = {}
        
        logger.info(f"🐍 Initialized Python agent: {self.name} ({self.agent_id})")
    
    def register_default_handlers(self):
        """Register default message handlers"""
        self.message_handlers.update({
            'ping': self.handle_ping,
            'shutdown': self.handle_shutdown,
            'get_status': self.handle_get_status,
            'heartbeat_request': self.handle_heartbeat_request
        })
    
    def register_handler(self, message_type: str, handler: Callable):
        """Register a custom message handler"""
        self.message_handlers[message_type] = handler
        logger.debug(f"Registered handler for message type: {message_type}")
    
    async def start(self):
        """Start the agent and begin message processing"""
        try:
            self.is_running = True
            logger.info(f"🚀 Starting Python agent: {self.name}")
            
            # Initialize agent-specific resources
            await self.initialize()
            
            # Send ready message
            await self.send_ready_message()
            
            # Start message processing loop
            await self.message_loop()
            
        except Exception as e:
            logger.error(f"❌ Error starting agent {self.name}: {e}")
            self.error_count += 1
            await self.send_error_message(str(e))
            raise
    
    async def stop(self):
        """Stop the agent and cleanup resources"""
        try:
            logger.info(f"🛑 Stopping Python agent: {self.name}")
            self.is_running = False
            
            # Cleanup agent-specific resources
            await self.cleanup()
            
            # Send goodbye message
            await self.send_goodbye_message()
            
        except Exception as e:
            logger.error(f"❌ Error stopping agent {self.name}: {e}")
            self.error_count += 1
    
    @abstractmethod
    async def initialize(self):
        """Initialize agent-specific resources (override in subclasses)"""
        pass
    
    @abstractmethod
    async def cleanup(self):
        """Cleanup agent-specific resources (override in subclasses)"""
        pass
    
    async def message_loop(self):
        """Main message processing loop"""
        logger.info(f"📡 Starting message loop for agent: {self.name}")
        
        while self.is_running:
            try:
                # Read message from stdin
                line = await self.read_stdin_line()
                if not line:
                    await asyncio.sleep(0.1)
                    continue
                
                # Parse message
                try:
                    message_data = json.loads(line)
                    message = CrossLanguageMessage.from_dict(message_data)
                    await self.process_message(message)
                    self.message_count += 1
                    
                except json.JSONDecodeError as e:
                    logger.error(f"❌ Invalid JSON message: {line[:100]}...")
                    self.error_count += 1
                    
            except Exception as e:
                logger.error(f"❌ Error in message loop: {e}")
                self.error_count += 1
                await asyncio.sleep(1)  # Brief pause before continuing
    
    async def read_stdin_line(self) -> Optional[str]:
        """Read a line from stdin asynchronously"""
        try:
            # Use asyncio to read from stdin
            loop = asyncio.get_event_loop()
            line = await loop.run_in_executor(None, sys.stdin.readline)
            return line.strip() if line else None
        except Exception:
            return None
    
    async def process_message(self, message: CrossLanguageMessage):
        """Process an incoming message"""
        try:
            logger.debug(f"📥 Processing message: {message.type} ({message.id})")
            
            # Update last activity
            self.last_heartbeat = datetime.now(timezone.utc)
            
            # Find and execute handler
            handler = self.message_handlers.get(message.type)
            if handler:
                await handler(message)
            else:
                logger.warning(f"⚠️ No handler for message type: {message.type}")
                await self.send_error_message(f"Unknown message type: {message.type}")
                
        except Exception as e:
            logger.error(f"❌ Error processing message {message.id}: {e}")
            self.error_count += 1
            await self.send_error_message(str(e), message.id)
    
    async def send_message(self, message: CrossLanguageMessage):
        """Send a message via stdout"""
        try:
            message_json = json.dumps(message.to_dict())
            print(message_json, flush=True)
            logger.debug(f"📤 Sent message: {message.type} ({message.id})")
        except Exception as e:
            logger.error(f"❌ Error sending message: {e}")
            self.error_count += 1
    
    async def send_ready_message(self):
        """Send ready message to indicate agent is initialized"""
        message = CrossLanguageMessage(
            msg_id=f"ready_{int(time.time() * 1000)}",
            msg_type="agent_ready",
            source={
                "agentId": self.agent_id,
                "language": "python",
                "runtime": "python3"
            },
            destination={"broadcast": True},
            payload={
                "name": self.name,
                "version": self.version,
                "capabilities": await self.get_capabilities()
            },
            metadata={
                "priority": "normal",
                "retryCount": 0,
                "maxRetries": 0,
                "timeoutMs": 5000
            }
        )
        await self.send_message(message)
    
    async def send_goodbye_message(self):
        """Send goodbye message when shutting down"""
        message = CrossLanguageMessage(
            msg_id=f"goodbye_{int(time.time() * 1000)}",
            msg_type="agent_goodbye",
            source={
                "agentId": self.agent_id,
                "language": "python",
                "runtime": "python3"
            },
            destination={"broadcast": True},
            payload={
                "reason": "normal_shutdown",
                "statistics": await self.get_statistics()
            },
            metadata={
                "priority": "normal",
                "retryCount": 0,
                "maxRetries": 0,
                "timeoutMs": 5000
            }
        )
        await self.send_message(message)
    
    async def send_error_message(self, error: str, correlation_id: Optional[str] = None):
        """Send error message"""
        message = CrossLanguageMessage(
            msg_id=f"error_{int(time.time() * 1000)}",
            msg_type="error",
            source={
                "agentId": self.agent_id,
                "language": "python",
                "runtime": "python3"
            },
            destination={"broadcast": True},
            payload={
                "error": error,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "agent_info": {
                    "name": self.name,
                    "version": self.version
                }
            },
            metadata={
                "priority": "high",
                "correlationId": correlation_id,
                "retryCount": 0,
                "maxRetries": 0,
                "timeoutMs": 5000
            }
        )
        await self.send_message(message)
    
    async def send_heartbeat(self):
        """Send heartbeat message"""
        message = CrossLanguageMessage(
            msg_id=f"heartbeat_{int(time.time() * 1000)}",
            msg_type="heartbeat",
            source={
                "agentId": self.agent_id,
                "language": "python",
                "runtime": "python3"
            },
            destination={"broadcast": True},
            payload={
                "status": "healthy",
                "uptime": (datetime.now(timezone.utc) - self.started_at).total_seconds(),
                "message_count": self.message_count,
                "error_count": self.error_count
            },
            metadata={
                "priority": "low",
                "retryCount": 0,
                "maxRetries": 0,
                "timeoutMs": 1000
            }
        )
        await self.send_message(message)
    
    # Default message handlers
    async def handle_ping(self, message: CrossLanguageMessage):
        """Handle ping message"""
        response = CrossLanguageMessage(
            msg_id=f"pong_{int(time.time() * 1000)}",
            msg_type="pong",
            source={
                "agentId": self.agent_id,
                "language": "python",
                "runtime": "python3"
            },
            destination=message.source,
            payload={
                "original_message_id": message.id,
                "timestamp": datetime.now(timezone.utc).isoformat()
            },
            metadata={
                "priority": "normal",
                "correlationId": message.id,
                "retryCount": 0,
                "maxRetries": 0,
                "timeoutMs": 5000
            }
        )
        await self.send_message(response)
    
    async def handle_shutdown(self, message: CrossLanguageMessage):
        """Handle shutdown message"""
        logger.info(f"🛑 Received shutdown command for agent: {self.name}")
        self.is_running = False
    
    async def handle_get_status(self, message: CrossLanguageMessage):
        """Handle status request"""
        response = CrossLanguageMessage(
            msg_id=f"status_{int(time.time() * 1000)}",
            msg_type="status_response",
            source={
                "agentId": self.agent_id,
                "language": "python",
                "runtime": "python3"
            },
            destination=message.source,
            payload=await self.get_status(),
            metadata={
                "priority": "normal",
                "correlationId": message.id,
                "retryCount": 0,
                "maxRetries": 0,
                "timeoutMs": 5000
            }
        )
        await self.send_message(response)
    
    async def handle_heartbeat_request(self, message: CrossLanguageMessage):
        """Handle heartbeat request"""
        await self.send_heartbeat()
    
    async def get_capabilities(self) -> List[str]:
        """Get agent capabilities (override in subclasses)"""
        return ["ping", "status", "heartbeat"]
    
    async def get_status(self) -> Dict[str, Any]:
        """Get current agent status"""
        uptime = (datetime.now(timezone.utc) - self.started_at).total_seconds()
        return {
            "agent_id": self.agent_id,
            "name": self.name,
            "version": self.version,
            "status": "running" if self.is_running else "stopped",
            "uptime_seconds": uptime,
            "message_count": self.message_count,
            "error_count": self.error_count,
            "last_heartbeat": self.last_heartbeat.isoformat(),
            "started_at": self.started_at.isoformat()
        }
    
    async def get_statistics(self) -> Dict[str, Any]:
        """Get agent statistics"""
        return await self.get_status()

def parse_args():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description='Python Agent Runtime')
    parser.add_argument('--agent-id', required=True, help='Unique agent identifier')
    parser.add_argument('--log-level', default='INFO', help='Logging level')
    return parser.parse_args()

async def main():
    """Main entry point for Python agents"""
    args = parse_args()
    
    # Set log level
    logging.getLogger().setLevel(getattr(logging, args.log_level.upper()))
    
    logger.info(f"🐍 Starting Python agent runtime with ID: {args.agent_id}")
    
    # This is a base class - actual agents should inherit from BaseAgent
    # and implement their own main() function
    logger.error("❌ BaseAgent cannot be run directly - create a subclass")
    sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
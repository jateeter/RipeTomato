/**
 * ChatGPT Agent Panel
 *
 * UI component for interacting with ChatGPT-powered agents.
 * Provides staff with AI-assisted tools for client services.
 */

import React, { useState, useEffect, useRef } from 'react';
import { chatGPTBotIntegration, ChatGPTBot } from '../modules/agents/integrations/ChatGPTBotIntegration';
import { chatGPTAgentService } from '../services/chatGPTAgentService';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const ChatGPTAgentPanel: React.FC = () => {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [activeBot, setActiveBot] = useState<ChatGPTBot | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const availableAgents = [
    {
      id: 'client-intake',
      name: 'Client Intake Assistant',
      icon: '📋',
      description: 'Helps with compassionate client intake',
      color: 'bg-blue-50 border-blue-300'
    },
    {
      id: 'service-recommender',
      name: 'Service Recommender',
      icon: '🎯',
      description: 'Matches clients with services',
      color: 'bg-green-50 border-green-300'
    },
    {
      id: 'crisis-support',
      name: 'Crisis Support',
      icon: '🚨',
      description: 'Crisis intervention guidance',
      color: 'bg-red-50 border-red-300'
    },
    {
      id: 'resource-navigator',
      name: 'Resource Navigator',
      icon: '🗺️',
      description: 'Helps navigate service systems',
      color: 'bg-purple-50 border-purple-300'
    },
    {
      id: 'case-advisor',
      name: 'Case Management Advisor',
      icon: '📊',
      description: 'Supports case planning',
      color: 'bg-yellow-50 border-yellow-300'
    }
  ];

  useEffect(() => {
    // Initialize integration
    chatGPTBotIntegration.initialize();
  }, []);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectAgent = async (agentId: string) => {
    const agent = availableAgents.find(a => a.id === agentId);
    if (!agent) return;

    setSelectedAgent(agentId);
    setMessages([]);

    // Create new bot
    const bot = await chatGPTBotIntegration.createBot(
      agent.name,
      agentId as any
    );

    setActiveBot(bot);

    // Add welcome message
    setMessages([{
      role: 'assistant',
      content: `Hi! I'm your ${agent.name}. ${agent.description}. How can I help you today?`,
      timestamp: new Date()
    }]);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !activeBot || isSending) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsSending(true);

    // Add user message
    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }]);

    try {
      // Send to ChatGPT bot
      const response = await chatGPTBotIntegration.sendMessage(
        activeBot.botId,
        userMessage
      );

      // Add assistant response
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      }]);

    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleReset = () => {
    if (activeBot) {
      chatGPTBotIntegration.deleteBot(activeBot.botId);
    }
    setSelectedAgent(null);
    setActiveBot(null);
    setMessages([]);
    setInputMessage('');
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">ChatGPT Agents</h2>
            <p className="text-sm text-gray-600">AI-powered assistance for homeless services</p>
          </div>
          {activeBot && (
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              New Conversation
            </button>
          )}
        </div>
      </div>

      {/* Agent Selection or Chat */}
      {!selectedAgent ? (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              Choose an AI Assistant:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableAgents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => handleSelectAgent(agent.id)}
                  className={`${agent.color} border-2 rounded-xl p-6 text-left hover:shadow-lg transition-all transform hover:scale-105`}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">{agent.icon}</div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        {agent.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {agent.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Info section */}
            <div className="mt-8 p-6 bg-blue-50 border-2 border-blue-200 rounded-xl">
              <h4 className="text-lg font-semibold text-blue-900 mb-2">
                ℹ️ How ChatGPT Agents Work
              </h4>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>• AI-powered assistants trained on homeless services best practices</li>
                <li>• Provide real-time guidance and recommendations</li>
                <li>• Available 24/7 for staff support</li>
                <li>• Learn from conversations to improve over time</li>
                <li>• Always verify critical information with supervisors</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Agent Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">
                {availableAgents.find(a => a.id === selectedAgent)?.icon}
              </span>
              <div>
                <h3 className="text-lg font-semibold">
                  {availableAgents.find(a => a.id === selectedAgent)?.name}
                </h3>
                <p className="text-sm text-blue-100">
                  {availableAgents.find(a => a.id === selectedAgent)?.description}
                </p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-3xl rounded-2xl px-6 py-4 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border-2 border-gray-200 text-gray-900'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  <div
                    className={`text-xs mt-2 ${
                      message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}

            {isSending && (
              <div className="flex justify-start">
                <div className="bg-white border-2 border-gray-200 rounded-2xl px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 bg-white p-4">
            <div className="flex gap-2">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message... (Shift+Enter for new line)"
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl resize-none focus:border-blue-500 focus:ring-4 focus:ring-blue-200 outline-none transition-all"
                rows={2}
                disabled={isSending}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isSending}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Send
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatGPTAgentPanel;

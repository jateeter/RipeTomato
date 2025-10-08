/**
 * ChatGPT Agent Service
 *
 * Integration with OpenAI's ChatGPT API for intelligent agent-based services.
 * Provides specialized agents for homeless services support:
 * - Client intake assistant
 * - Service recommendation engine
 * - Crisis intervention support
 * - Resource navigation helper
 * - Case management advisor
 */

export interface ChatGPTMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string;
}

export interface ChatGPTFunctionCall {
  name: string;
  arguments: string;
}

export interface ChatGPTAgentConfig {
  agentId: string;
  name: string;
  description: string;
  model: 'gpt-4' | 'gpt-4-turbo' | 'gpt-3.5-turbo';
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  functions?: ChatGPTFunction[];
}

export interface ChatGPTFunction {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface ChatGPTAgentResponse {
  agentId: string;
  message: string;
  functionCalls?: ChatGPTFunctionCall[];
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  conversationId: string;
}

export interface ChatGPTConversation {
  conversationId: string;
  agentId: string;
  messages: ChatGPTMessage[];
  createdAt: Date;
  lastUpdatedAt: Date;
}

class ChatGPTAgentService {
  private apiKey: string | null = null;
  private apiEndpoint = 'https://api.openai.com/v1/chat/completions';
  private conversations: Map<string, ChatGPTConversation> = new Map();
  private registeredAgents: Map<string, ChatGPTAgentConfig> = new Map();

  /**
   * Initialize the ChatGPT service with API key
   */
  async initialize(apiKey?: string): Promise<boolean> {
    // Try to get API key from environment or parameter
    this.apiKey = apiKey || process.env.REACT_APP_OPENAI_API_KEY || null;

    if (!this.apiKey) {
      console.warn('⚠️ OpenAI API key not configured. ChatGPT agents will use mock responses.');
      return false;
    }

    console.log('✅ ChatGPT Agent Service initialized');

    // Register default agents
    this.registerDefaultAgents();

    return true;
  }

  /**
   * Register pre-configured agents for homeless services
   */
  private registerDefaultAgents(): void {
    // Client Intake Assistant
    this.registerAgent({
      agentId: 'client-intake',
      name: 'Client Intake Assistant',
      description: 'Helps staff conduct compassionate, efficient client intake',
      model: 'gpt-4-turbo',
      temperature: 0.7,
      maxTokens: 1000,
      systemPrompt: `You are a compassionate intake specialist for homeless services.

Your role:
- Guide staff through sensitive client intake conversations
- Suggest trauma-informed questions
- Identify immediate safety concerns
- Recommend appropriate services based on client situation
- Maintain dignity and respect at all times

Client context may include:
- Street duration (first-time, chronic, etc.)
- Family situation (children, partner, family support)
- Immediate needs (shelter, food, safety)
- Health concerns
- Substance use or mental health

Respond with:
1. Empathetic acknowledgment
2. Specific next steps
3. Service recommendations
4. Safety considerations if applicable

Keep responses brief, actionable, and jargon-free.`,
      functions: [
        {
          name: 'recommend_services',
          description: 'Recommend appropriate services based on client needs',
          parameters: {
            type: 'object',
            properties: {
              urgency: {
                type: 'string',
                enum: ['critical', 'high', 'moderate', 'low'],
                description: 'Urgency level'
              },
              services: {
                type: 'array',
                items: { type: 'string' },
                description: 'List of recommended service types'
              },
              rationale: {
                type: 'string',
                description: 'Brief explanation for recommendations'
              }
            },
            required: ['urgency', 'services', 'rationale']
          }
        }
      ]
    });

    // Service Recommendation Engine
    this.registerAgent({
      agentId: 'service-recommender',
      name: 'Service Recommendation Engine',
      description: 'Intelligently matches clients with appropriate services',
      model: 'gpt-4',
      temperature: 0.5,
      maxTokens: 800,
      systemPrompt: `You are an expert in homeless services in Portland, Oregon.

Available services:
- Shelter (emergency, transitional, family, couples)
- Meals (3x daily at Blanchet House, other locations)
- Health services (Outside In, Central City Concern)
- Mental health (Cascadia Behavioral Healthcare)
- Job training (Worksystems Inc)
- Housing placement (JOIN Resource Center)
- Family services (Transition Projects)
- Substance use treatment
- Case management

Your task:
- Analyze client situation (duration, family, health, goals)
- Match with most appropriate services
- Prioritize by urgency and availability
- Consider Portland-specific resources
- Account for transportation and access barriers

Provide:
1. Top 3 recommended services
2. Priority level for each
3. Specific provider/location
4. Brief rationale`,
      functions: [
        {
          name: 'get_service_availability',
          description: 'Check current availability of a service',
          parameters: {
            type: 'object',
            properties: {
              serviceType: {
                type: 'string',
                description: 'Type of service (shelter, meals, health, etc.)'
              },
              location: {
                type: 'string',
                description: 'Portland area/neighborhood'
              }
            },
            required: ['serviceType']
          }
        }
      ]
    });

    // Crisis Intervention Support
    this.registerAgent({
      agentId: 'crisis-support',
      name: 'Crisis Intervention Support',
      description: 'Provides guidance during crisis situations',
      model: 'gpt-4-turbo',
      temperature: 0.3, // Lower temp for more consistent crisis responses
      maxTokens: 600,
      systemPrompt: `You are a crisis intervention specialist for homeless services.

CRITICAL SAFETY PROTOCOLS:
- If immediate danger: Call 911 immediately
- If suicidal ideation: National Suicide Prevention Lifeline 988
- If domestic violence: Confidential crisis line
- If child safety concern: Mandatory reporting

Your role:
- Assess level of crisis (immediate danger vs. urgent need)
- Guide staff through de-escalation
- Connect to appropriate emergency resources
- Document safety plan
- Follow up recommendations

Crisis types:
- Mental health crisis
- Substance use overdose risk
- Domestic violence
- Child endangerment
- Medical emergency
- Suicide risk
- Severe weather exposure

Response format:
1. SAFETY FIRST: Immediate actions needed
2. De-escalation steps
3. Resources to contact
4. Documentation requirements
5. Follow-up plan`,
      functions: [
        {
          name: 'emergency_resource_lookup',
          description: 'Find emergency resources for specific crisis type',
          parameters: {
            type: 'object',
            properties: {
              crisisType: {
                type: 'string',
                enum: ['medical', 'mental-health', 'substance', 'violence', 'suicide', 'child-safety', 'weather'],
                description: 'Type of crisis'
              },
              location: {
                type: 'string',
                description: 'Current location if known'
              }
            },
            required: ['crisisType']
          }
        }
      ]
    });

    // Resource Navigation Helper
    this.registerAgent({
      agentId: 'resource-navigator',
      name: 'Resource Navigation Helper',
      description: 'Helps clients navigate complex service systems',
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 800,
      systemPrompt: `You are a friendly resource navigator helping people experiencing homelessness in Portland.

Your approach:
- Use simple, jargon-free language
- Break down complex processes into steps
- Explain eligibility requirements clearly
- Provide specific addresses and phone numbers
- Mention bus lines and transportation options
- Note hours of operation
- Clarify what documents/ID are needed

Common questions:
- How to get ID/birth certificate
- How to apply for benefits (SNAP, Medicaid, SSI/SSDI)
- Where to get free phones/internet
- Laundry and shower locations
- Mail/mailing address services
- Storage for belongings
- Pet-friendly services

Portland-specific:
- TriMet transit info
- Multnomah County services
- Oregon Health Plan
- 211 info line
- Portland Street Response

Keep responses conversational and encouraging.`,
      functions: [
        {
          name: 'get_detailed_directions',
          description: 'Get transit directions to a service location',
          parameters: {
            type: 'object',
            properties: {
              destination: {
                type: 'string',
                description: 'Service location address'
              },
              startPoint: {
                type: 'string',
                description: 'Starting location if known'
              }
            },
            required: ['destination']
          }
        }
      ]
    });

    // Case Management Advisor
    this.registerAgent({
      agentId: 'case-advisor',
      name: 'Case Management Advisor',
      description: 'Supports case managers with client planning',
      model: 'gpt-4',
      temperature: 0.6,
      maxTokens: 1200,
      systemPrompt: `You are an experienced case management supervisor for homeless services.

Your expertise:
- Goal setting and action planning
- Barrier identification and problem-solving
- Progress tracking and motivation
- Housing-focused case management
- Trauma-informed care principles
- Motivational interviewing techniques
- Resource coordination

Case planning process:
1. Assess current situation and strengths
2. Identify immediate vs. long-term goals
3. Break goals into actionable steps
4. Anticipate barriers and solutions
5. Connect to appropriate services
6. Set realistic timelines
7. Plan for follow-up

Consider:
- Housing First principles
- Client self-determination
- Harm reduction approaches
- Cultural sensitivity
- Disability accommodations
- Family reunification when appropriate
- Employment and income
- Health and wellness

Provide structured, actionable advice for case managers.`,
      functions: [
        {
          name: 'create_action_plan',
          description: 'Generate structured action plan for client',
          parameters: {
            type: 'object',
            properties: {
              goal: {
                type: 'string',
                description: 'Primary goal (e.g., obtain housing, employment)'
              },
              barriers: {
                type: 'array',
                items: { type: 'string' },
                description: 'List of identified barriers'
              },
              timeline: {
                type: 'string',
                description: 'Target timeline (30 days, 90 days, 6 months)'
              }
            },
            required: ['goal']
          }
        }
      ]
    });

    console.log(`✅ Registered ${this.registeredAgents.size} default ChatGPT agents`);
  }

  /**
   * Register a custom agent
   */
  registerAgent(config: ChatGPTAgentConfig): void {
    this.registeredAgents.set(config.agentId, config);
    console.log(`✅ Registered ChatGPT agent: ${config.name}`);
  }

  /**
   * Get list of available agents
   */
  getAvailableAgents(): ChatGPTAgentConfig[] {
    return Array.from(this.registeredAgents.values());
  }

  /**
   * Start a new conversation with an agent
   */
  async startConversation(agentId: string): Promise<string> {
    const agent = this.registeredAgents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const conversationId = this.generateConversationId();
    const conversation: ChatGPTConversation = {
      conversationId,
      agentId,
      messages: [
        {
          role: 'system',
          content: agent.systemPrompt
        }
      ],
      createdAt: new Date(),
      lastUpdatedAt: new Date()
    };

    this.conversations.set(conversationId, conversation);
    return conversationId;
  }

  /**
   * Send message to agent and get response
   */
  async sendMessage(
    conversationId: string,
    userMessage: string
  ): Promise<ChatGPTAgentResponse> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    const agent = this.registeredAgents.get(conversation.agentId);
    if (!agent) {
      throw new Error(`Agent ${conversation.agentId} not found`);
    }

    // Add user message to conversation
    conversation.messages.push({
      role: 'user',
      content: userMessage
    });

    // Call OpenAI API or use mock
    let response: ChatGPTAgentResponse;

    if (this.apiKey) {
      response = await this.callOpenAIAPI(agent, conversation);
    } else {
      response = this.getMockResponse(agent, conversation, userMessage);
    }

    // Add assistant response to conversation
    conversation.messages.push({
      role: 'assistant',
      content: response.message
    });

    conversation.lastUpdatedAt = new Date();

    return response;
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAIAPI(
    agent: ChatGPTAgentConfig,
    conversation: ChatGPTConversation
  ): Promise<ChatGPTAgentResponse> {
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: agent.model,
          messages: conversation.messages,
          temperature: agent.temperature,
          max_tokens: agent.maxTokens,
          functions: agent.functions,
          function_call: 'auto'
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const choice = data.choices[0];

      return {
        agentId: agent.agentId,
        message: choice.message.content || '',
        functionCalls: choice.message.function_call ? [{
          name: choice.message.function_call.name,
          arguments: choice.message.function_call.arguments
        }] : undefined,
        usage: {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens
        },
        conversationId: conversation.conversationId
      };

    } catch (error) {
      console.error('OpenAI API call failed:', error);
      // Fallback to mock response
      return this.getMockResponse(agent, conversation, conversation.messages[conversation.messages.length - 1].content);
    }
  }

  /**
   * Generate mock response when API key not available
   */
  private getMockResponse(
    agent: ChatGPTAgentConfig,
    conversation: ChatGPTConversation,
    userMessage: string
  ): ChatGPTAgentResponse {
    let mockMessage = '';

    // Generate contextual mock response based on agent type
    switch (agent.agentId) {
      case 'client-intake':
        mockMessage = `Based on what you've shared, I recommend:

1. **Immediate shelter** - Client needs safe place tonight
2. **Health screening** - Schedule within 48 hours at Outside In
3. **Case manager assignment** - Connect with Transition Projects

Next steps:
- Complete intake form
- Check bed availability at Blanchet House
- Schedule health appointment

Safety considerations: Monitor for any mental health concerns.`;
        break;

      case 'service-recommender':
        mockMessage = `Top 3 recommended services for this client:

**1. Blanchet House - Emergency Shelter** (IMMEDIATE)
- 340 SW Madison St, Portland
- Open intake 24/7
- Meals included
- Rationale: Immediate housing need

**2. Outside In Medical Clinic** (HIGH PRIORITY)
- 1132 SW 13th Ave, Portland
- Walk-in hours: M-F 9am-5pm
- No insurance required
- Rationale: Health screening needed

**3. Worksystems Inc - Job Training** (MEDIUM PRIORITY)
- 1618 SW 1st Ave, Portland
- Employment programs available
- Rationale: Recent job loss, good candidate for rapid re-employment`;
        break;

      case 'crisis-support':
        mockMessage = `**SAFETY ASSESSMENT:**

No immediate danger indicated, but monitor closely.

**DE-ESCALATION STEPS:**
1. Speak calmly and maintain respectful distance
2. Acknowledge feelings: "I hear that you're frustrated"
3. Offer choices: "Would you like water? A quiet space?"
4. Avoid confrontation or arguments

**RESOURCES:**
- Mental health crisis: Call 988 (Suicide & Crisis Lifeline)
- Non-emergency mental health: Cascadia 503-674-7777
- Portland Street Response: 503-823-3333

**DOCUMENTATION:**
- Note time, observable behavior (not diagnosis)
- Safety plan discussed
- Resources provided

**FOLLOW-UP:**
Check-in within 24 hours.`;
        break;

      case 'resource-navigator':
        mockMessage = `Here's how to get to that service:

**Blanchet House**
340 SW Madison St, Portland

**From downtown:**
- Bus: Take MAX Red/Blue line to Skidmore Fountain
- Walk: 5 minutes west on Madison St
- Open 24/7

**What to bring:**
- Any ID if you have it (not required)
- Personal belongings

**What to expect:**
- Check-in at front desk
- Bed assignment if available
- Dinner served at 5:30 PM
- Breakfast at 7:00 AM

**Free TriMet Pass:**
You can get a free Hop card at JOIN Resource Center (4110 SE Hawthorne).

Need help with anything else?`;
        break;

      case 'case-advisor':
        mockMessage = `**CASE PLAN RECOMMENDATION:**

**Primary Goal:** Obtain stable housing within 90 days

**Action Steps:**

Week 1-2:
- ✅ Complete housing application at JOIN
- ✅ Gather required documents (ID, income verification)
- ✅ Begin apartment search

Week 3-4:
- ✅ Weekly check-ins with housing specialist
- ✅ Address credit/background barriers
- ✅ Apply for rental assistance

**Barriers & Solutions:**

Barrier: No recent rental history
Solution: Landlord liaison program, co-signer options

Barrier: Limited income
Solution: Rapid rehousing funds, subsidized housing applications

Barrier: Background concerns
Solution: Housing First providers, second-chance landlords

**Strengths to build on:**
- Motivated and engaged
- Recent employment history
- Family support available

**Follow-up Schedule:**
- Weekly case management meetings
- Bi-weekly housing search updates
- Monthly progress assessment`;
        break;

      default:
        mockMessage = 'I understand. How can I assist you further with this situation?';
    }

    return {
      agentId: agent.agentId,
      message: mockMessage,
      usage: {
        promptTokens: 100,
        completionTokens: 200,
        totalTokens: 300
      },
      conversationId: conversation.conversationId
    };
  }

  /**
   * Get conversation history
   */
  getConversation(conversationId: string): ChatGPTConversation | null {
    return this.conversations.get(conversationId) || null;
  }

  /**
   * Clear conversation history
   */
  clearConversation(conversationId: string): void {
    this.conversations.delete(conversationId);
  }

  /**
   * Generate unique conversation ID
   */
  private generateConversationId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Execute a function call from ChatGPT
   */
  async executeFunction(
    functionName: string,
    args: Record<string, any>
  ): Promise<any> {
    // This would integrate with actual services
    // For now, return mock data

    switch (functionName) {
      case 'recommend_services':
        return {
          success: true,
          recommendations: args.services,
          urgency: args.urgency
        };

      case 'get_service_availability':
        return {
          serviceType: args.serviceType,
          available: true,
          currentCapacity: '15 beds available',
          nextAvailability: 'Now'
        };

      case 'emergency_resource_lookup':
        return {
          crisisType: args.crisisType,
          resources: [
            { name: '988 Suicide & Crisis Lifeline', phone: '988' },
            { name: 'Portland Street Response', phone: '503-823-3333' },
            { name: 'Multnomah County Crisis Line', phone: '503-988-4888' }
          ]
        };

      case 'get_detailed_directions':
        return {
          destination: args.destination,
          directions: 'Take MAX Blue Line to Skidmore Fountain, walk 5 min west',
          transitLines: ['MAX Blue', 'MAX Red'],
          walkingTime: '5 minutes'
        };

      case 'create_action_plan':
        return {
          goal: args.goal,
          steps: [
            'Complete intake assessment',
            'Gather required documents',
            'Submit applications',
            'Weekly check-ins'
          ],
          timeline: args.timeline || '90 days',
          barriers: args.barriers || []
        };

      default:
        return { success: false, error: 'Function not found' };
    }
  }
}

// Export singleton instance
export const chatGPTAgentService = new ChatGPTAgentService();

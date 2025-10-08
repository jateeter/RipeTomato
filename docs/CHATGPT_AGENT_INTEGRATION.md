# ChatGPT Agent Integration

## Overview

The ChatGPT Agent Integration provides AI-powered assistance for homeless services staff. Using OpenAI's ChatGPT API, the system offers five specialized agents trained on best practices for homeless services, case management, crisis intervention, and resource navigation.

## Architecture

### Service Layer

**`chatGPTAgentService.ts`** - Core service managing ChatGPT API interactions
- Handles OpenAI API communication
- Manages conversations and message history
- Provides fallback mock responses when API unavailable
- Supports function calling for service integrations

**`ChatGPTBotIntegration.ts`** - Integration with BotLab Core
- Creates and manages ChatGPT-powered bots
- Provides unified interface for multi-agent systems
- Coordinates between ChatGPT and other agent types (Python, etc.)

### UI Components

**`ChatGPTAgentPanel.tsx`** - Interactive user interface
- Agent selection screen
- Real-time chat interface
- Conversation history
- Typing indicators
- Message timestamps

## Five Specialized Agents

### 1. Client Intake Assistant 📋

**Purpose:** Helps staff conduct compassionate, efficient client intake

**Capabilities:**
- Guides staff through trauma-informed questions
- Suggests appropriate follow-up questions based on client responses
- Identifies immediate safety concerns
- Recommends services based on client situation
- Maintains dignity and respect throughout intake

**Example Conversation:**
```
Staff: "Client is a 35-year-old first-time homeless, lost job 2 weeks ago"

Agent: Based on what you've shared, I recommend:

1. **Immediate shelter** - Client needs safe place tonight
2. **Health screening** - Schedule within 48 hours at Outside In
3. **Case manager assignment** - Connect with Transition Projects

Next steps:
- Complete intake form
- Check bed availability at Blanchet House
- Schedule health appointment

Safety considerations: Monitor for any mental health concerns.
```

**Function Calls:**
- `recommend_services(urgency, services, rationale)`

---

### 2. Service Recommendation Engine 🎯

**Purpose:** Intelligently matches clients with appropriate Portland services

**Capabilities:**
- Analyzes client situation (duration, family, health, goals)
- Matches with most appropriate services
- Prioritizes by urgency and availability
- Considers Portland-specific resources
- Accounts for transportation and access barriers

**Example Conversation:**
```
Staff: "Chronic homeless, 3 years on streets, mental health concerns, no family support"

Agent: Top 3 recommended services:

**1. Central City Concern - Permanent Supportive Housing** (HIGH PRIORITY)
- 232 NW 6th Ave, Portland
- Housing First approach with on-site support
- Rationale: Chronic homelessness needs permanent solution with wraparound services

**2. Outside In Medical Clinic** (HIGH PRIORITY)
- 1132 SW 13th Ave, Portland
- Mental health and primary care
- Rationale: Address mental health needs critical for housing stability

**3. Cascadia Behavioral Healthcare** (MEDIUM PRIORITY)
- Multiple locations
- Ongoing mental health case management
- Rationale: Long-term mental health support
```

**Function Calls:**
- `get_service_availability(serviceType, location)`

---

### 3. Crisis Intervention Support 🚨

**Purpose:** Provides guidance during crisis situations

**Capabilities:**
- Assesses level of crisis (immediate danger vs. urgent need)
- Guides staff through de-escalation techniques
- Connects to appropriate emergency resources
- Documents safety protocols
- Provides follow-up recommendations

**Safety Protocols:**
- Immediate danger → Call 911
- Suicidal ideation → 988 Suicide & Crisis Lifeline
- Domestic violence → Confidential crisis line
- Child safety concern → Mandatory reporting

**Example Conversation:**
```
Staff: "Client extremely agitated, talking about self-harm, hasn't slept in 3 days"

Agent: **SAFETY ASSESSMENT:**

IMMEDIATE ACTIONS NEEDED:
1. Call 988 (Suicide & Crisis Lifeline) NOW
2. Do not leave client alone
3. Remove access to any potential weapons/harm
4. Keep calm, non-confrontational tone

**DE-ESCALATION STEPS:**
1. Speak calmly: "I'm here to help you stay safe"
2. Maintain respectful distance (6+ feet)
3. Acknowledge feelings: "I can see you're in distress"
4. Offer water, quiet space

**RESOURCES TO CONTACT:**
- 988 Suicide & Crisis Lifeline (CALL NOW)
- Portland Street Response: 503-823-3333
- Unity Center (psychiatric ER): 503-944-8000

**DOCUMENTATION:**
- Time of crisis
- Observable behavior (agitation, statements about self-harm)
- Actions taken (called 988, stayed with client)
- Outcome and follow-up plan
```

**Function Calls:**
- `emergency_resource_lookup(crisisType, location)`

**Crisis Types Supported:**
- Medical emergency
- Mental health crisis
- Substance use/overdose risk
- Domestic violence
- Suicide risk
- Child endangerment
- Severe weather exposure

---

### 4. Resource Navigation Helper 🗺️

**Purpose:** Helps clients navigate complex service systems

**Capabilities:**
- Uses simple, jargon-free language
- Breaks down complex processes into steps
- Explains eligibility requirements clearly
- Provides specific addresses and phone numbers
- Mentions bus lines and transportation options
- Notes hours of operation and required documents

**Example Conversation:**
```
Staff: "Client needs to get Oregon Health Plan and doesn't have ID"

Agent: Here's the step-by-step process:

**Step 1: Get Oregon Health Plan WITHOUT ID**
Good news! You can apply for OHP without ID.

Call: 1-800-699-9075 (OHP application line)
Or visit: 211info.org
They'll help you apply over the phone.

**Step 2: Get ID While Waiting for OHP**
Visit JOIN Resource Center:
- Address: 4110 SE Hawthorne Blvd, Portland
- Bus: Take #14 Hawthorne
- Hours: Mon-Fri 9am-5pm
- Free help getting birth certificate and Oregon ID

What they'll do:
✓ Help you request birth certificate (takes 2-3 weeks)
✓ Fill out ID application
✓ Pay the fees (usually covered)
✓ Give you bus tickets to DMV

**Step 3: Use OHP While Getting ID**
- OHP card arrives in ~2 weeks by mail
- Can use it at clinics even without photo ID
- Outside In clinic accepts OHP, no ID required

Need a mailing address? JOIN can provide one.

Any questions about these steps?
```

**Function Calls:**
- `get_detailed_directions(destination, startPoint)`

**Common Navigation Topics:**
- Getting ID/birth certificate
- Applying for benefits (SNAP, Medicaid, SSI/SSDI)
- Free phones/internet access
- Laundry and shower locations
- Mail services and mailing addresses
- Storage for belongings
- Pet-friendly services
- TriMet transit information

---

### 5. Case Management Advisor 📊

**Purpose:** Supports case managers with client planning

**Capabilities:**
- Goal setting and action planning
- Barrier identification and problem-solving
- Progress tracking and motivation strategies
- Housing-focused case management
- Trauma-informed care principles
- Motivational interviewing techniques
- Resource coordination

**Example Conversation:**
```
Staff: "Client goal is permanent housing, barriers are poor credit and eviction 3 years ago"

Agent: **CASE PLAN RECOMMENDATION:**

**Primary Goal:** Obtain stable housing within 90 days

**Action Steps:**

Week 1-2: Document Gathering
- ✅ Complete housing application at JOIN
- ✅ Request credit report (free at annualcreditreport.com)
- ✅ Write letter explaining past eviction
- ✅ Gather references (employers, case managers, clergy)

Week 3-4: Barrier Mitigation
- ✅ Apply to Housing First providers (don't check credit)
- ✅ Look for private landlords vs. corporate (more flexible)
- ✅ Consider co-signer or guarantor programs
- ✅ Document stability: job, sobriety, case management

Week 5-8: Active Search
- ✅ Daily housing search (Craigslist, housing navigators)
- ✅ Apply to 5+ units per week
- ✅ Follow up with landlords personally
- ✅ Prepare "housing packet" with references

**Barriers & Solutions:**

Barrier 1: Poor credit (score unknown)
- Solution: Target Housing First programs (Central City Concern, JOIN)
- Solution: Private landlords who don't run credit
- Solution: Demonstrate current stability

Barrier 2: 3-year-old eviction
- Solution: Write honest explanation letter
- Solution: Show growth: 3 years housed successfully since
- Solution: Strong references from current support team
- Solution: Offer double deposit if possible

Barrier 3: Limited rental history
- Solution: Transitional housing letter of recommendation
- Solution: Homeless service provider reference
- Solution: Employment verification

**Client Strengths:**
- Motivated (proactively seeking housing)
- Employed (income source)
- Engaged in services (case management)
- Clean record for 3 years

**Recommended Approach:**
1. Housing First philosophy - housing stabilizes other issues
2. Trauma-informed - acknowledge past, focus on present
3. Client-driven - let client choose preferred neighborhoods
4. Harm reduction - housing not contingent on sobriety

**Follow-up Schedule:**
- Week 1: Daily check-ins (document gathering)
- Week 2-8: 2x weekly meetings
- Month 2-3: Weekly progress reviews
- After housed: Monthly stability check-ins (6 months)

**Potential Red Flags:**
- Loss of motivation or engagement
- Missed appointments (may need transportation help)
- New barriers emerging (address immediately)
```

**Function Calls:**
- `create_action_plan(goal, barriers, timeline)`

**Case Management Focus Areas:**
- Housing-focused case management
- Employment and income generation
- Health and wellness
- Substance use support (harm reduction)
- Mental health treatment
- Family reunification
- Legal issues
- Education and training

---

## Configuration

### Environment Variables

Add to `.env.local`:

```bash
# OpenAI ChatGPT API Configuration
REACT_APP_OPENAI_API_KEY=sk-your-api-key-here

# Optional: Customize model and parameters
REACT_APP_CHATGPT_MODEL=gpt-4-turbo
REACT_APP_CHATGPT_TEMPERATURE=0.7
REACT_APP_CHATGPT_MAX_TOKENS=1000
```

### Getting an API Key

1. Create account at https://platform.openai.com
2. Navigate to https://platform.openai.com/api-keys
3. Click "Create new secret key"
4. Copy key (starts with `sk-`)
5. Add to `.env.local`

### Cost Management

**Usage Estimates (GPT-4 Turbo):**
- Input: $0.01 per 1K tokens
- Output: $0.03 per 1K tokens
- Average conversation: ~500 input + 300 output tokens = ~$0.015

**Monthly Cost Examples:**
- 10 conversations/day: ~$4.50/month
- 50 conversations/day: ~$22.50/month
- 100 conversations/day: ~$45/month

**Best Practices:**
- Set usage limits in OpenAI dashboard
- Monitor usage regularly
- Use GPT-3.5-turbo for less critical conversations (10x cheaper)
- Implement caching for common questions

---

## Usage

### For Staff

**1. Access ChatGPT Agents**
- Navigate to Services Manager Dashboard
- Click "AI Agents" tab
- Select appropriate agent for your need

**2. Start Conversation**
- Choose agent type (Intake, Recommender, etc.)
- Type your question or situation
- Press Enter to send

**3. Follow Recommendations**
- Review AI suggestions
- Verify with supervisor when needed
- Document actions taken

**4. Best Practices**
- Provide context about client situation
- Be specific about barriers and needs
- Ask follow-up questions for clarification
- Always verify emergency/crisis recommendations

### Integration with Workflow

**Client Intake:**
```
1. Start intake conversation
2. Use Client Intake Assistant for guidance
3. Follow recommended questions
4. Document responses in system
5. Implement service recommendations
```

**Crisis Response:**
```
1. Assess immediate safety
2. Consult Crisis Support agent
3. Follow de-escalation steps
4. Contact recommended emergency resources
5. Document incident per agent guidance
```

**Case Planning:**
```
1. Identify client goals
2. Consult Case Management Advisor
3. Review suggested action plan
4. Customize to client strengths
5. Set follow-up schedule
```

---

## Technical Integration

### BotLab Core Integration

ChatGPT agents work alongside other bot types:

```typescript
import { chatGPTBotIntegration } from './integrations/ChatGPTBotIntegration';

// Create ChatGPT bot
const bot = await chatGPTBotIntegration.createBot(
  'Intake Assistant',
  'client-intake'
);

// Send message
const response = await chatGPTBotIntegration.sendMessage(
  bot.botId,
  'Client is first-time homeless with children'
);

console.log(response); // AI-generated guidance
```

### Function Calling

Agents can call system functions for real-time data:

```typescript
// Agent calls function
{
  name: 'get_service_availability',
  arguments: {
    serviceType: 'shelter',
    location: 'downtown'
  }
}

// System responds with actual data
{
  available: true,
  currentCapacity: '15 beds available',
  nextAvailability: 'Now'
}
```

### Conversation Management

```typescript
// Start new conversation
const conversationId = await chatGPTAgentService.startConversation('service-recommender');

// Send messages
const response1 = await chatGPTAgentService.sendMessage(conversationId, 'First message');
const response2 = await chatGPTAgentService.sendMessage(conversationId, 'Follow-up');

// Get history
const conversation = chatGPTAgentService.getConversation(conversationId);

// Clear when done
chatGPTAgentService.clearConversation(conversationId);
```

---

## Security & Privacy

### Data Handling

**What's Sent to OpenAI:**
- Staff questions/messages
- System prompts (agent instructions)
- Previous conversation context

**What's NOT Sent:**
- Client identifying information (unless specifically typed by staff)
- Full client records
- System database contents

**Best Practices:**
- Avoid typing client full names, SSNs, addresses
- Use general descriptions: "Client with children", "Chronic homeless"
- Do not paste confidential documents into chat
- Clear conversations regularly

### Compliance

**HIPAA Considerations:**
- OpenAI offers BAA (Business Associate Agreement) for enterprise
- Disable training on your data (available in settings)
- Use de-identified client descriptions
- Document AI assistance in case notes

**Staff Training:**
- What information is safe to share with AI
- How to de-identify client situations
- When to consult human supervisor instead
- Privacy and confidentiality protocols

---

## Limitations & Disclaimers

### Agent Limitations

**ChatGPT agents are tools, not replacements for:**
- Licensed clinical judgment
- Mandatory reporter obligations
- Emergency services (always call 911 for immediate danger)
- Legal advice
- Medical diagnosis or treatment

**Use agents for:**
- ✅ General guidance and suggestions
- ✅ Resource recommendations
- ✅ Process clarification
- ✅ Brainstorming solutions
- ✅ Documentation assistance

**Always verify with supervisor:**
- ⚠️ Crisis or safety concerns
- ⚠️ Legal or medical issues
- ⚠️ Policy questions
- ⚠️ Unusual situations
- ⚠️ High-stakes decisions

### Accuracy

- AI responses based on training data (may be outdated)
- Verify Portland-specific information (addresses, phone numbers, hours)
- Policies and procedures change - check current protocols
- Test responses with supervisor before implementing recommendations

---

## Troubleshooting

### Agent Not Responding

**Check:**
1. API key configured in `.env.local`
2. Internet connection active
3. OpenAI API status (https://status.openai.com)
4. Usage limits not exceeded

**Solutions:**
- Verify API key is correct (starts with `sk-`)
- Check OpenAI account for billing issues
- Try different agent
- Use mock responses (available when API offline)

### Unexpected Responses

**If agent provides inappropriate or unhelpful responses:**
1. Rephrase your question with more context
2. Ask agent to clarify or provide more details
3. Start new conversation (clears previous context)
4. Report issue to supervisor
5. Use different agent for that need

### Cost Concerns

**Monitor usage:**
- OpenAI dashboard shows token consumption
- Set monthly spending limits
- Use GPT-3.5-turbo for simple questions
- Implement conversation timeouts

**Reduce costs:**
- Clear old conversations regularly
- Be concise in messages
- Use for complex questions only
- Cache common responses locally

---

## Future Enhancements

**Planned Features:**
- [ ] Voice input/output for hands-free operation
- [ ] Multi-language support (Spanish, Russian, Vietnamese)
- [ ] Integration with HMIS for real-time data
- [ ] Automated case note generation
- [ ] Client-facing simplified agents
- [ ] Custom agent training on local policies
- [ ] Batch processing of common questions
- [ ] Analytics on agent effectiveness

---

## Support

**For Technical Issues:**
- See TECHNICAL_README.md
- Contact IT support
- OpenAI documentation: https://platform.openai.com/docs

**For Training:**
- Request staff training session
- Review agent-specific best practices
- Practice with non-sensitive scenarios
- Shadow experienced staff using agents

**For Feature Requests:**
- Submit through organizational channels
- Monthly stakeholder feedback
- Suggest new agent types or capabilities

---

**Last Updated:** 2025-01-XX
**Version:** 1.0.0
**Status:** Production ready

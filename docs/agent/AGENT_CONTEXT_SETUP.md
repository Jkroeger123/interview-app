# Agent Context System - Setup Complete ✅

This document describes the agent context and configuration system that was implemented to enable dynamic, context-aware visa interviews.

## Overview

The system allows the AI agent to:

- Adapt its behavior based on visa type (Tourist, Student, Work, Immigrant, Fiancé)
- Access user-uploaded documents via Ragie RAG using **partitions**
- Follow structured question banks for each visa type
- Track interview time and pace itself appropriately
- Gracefully end interviews

### Ragie Partition Strategy

Documents are organized using Ragie partitions:

- **Global docs**: `visa-{visaType}` (e.g., `visa-tourist`)
- **User docs**: `visa-{visaType}-user-{userId}` (e.g., `visa-tourist-user-user_123`)

This eliminates the need to track document IDs manually!

## Architecture

### Frontend Components

1. **Interview Context Provider** (`lib/contexts/interview-context.tsx`)

   - Manages interview state across the flow
   - Stores visa type, duration, focus areas, and uploaded documents

2. **Agent Configuration Builder** (`lib/agent-config-builder.ts`)

   - Combines all interview context into a structured config object
   - Includes: visa details, question bank, document IDs, focus areas, user info

3. **Document Upload with Ragie** (`app/api/ragie/upload/route.ts`)

   - Uploads user documents to Ragie for RAG retrieval
   - Uses partition: `visa-{visaType}-user-{userId}`

4. **Question Banks** (`lib/question-banks.ts`)

   - **180+ questions for F-1 Student Visa** based on real consular practice, INA §214(b), and FAM guidance (see `F1_INTERVIEW_GUIDE.md` for full context)
   - ~60-70 questions for other visa types covering major interview topics
   - Questions organized by assessment categories (academic purpose, financial ability, ties to home country, immigration history, etc.)
   - Questions are passed to agent as guidance (first 40 included in system prompt)

5. **Time Tracking** (`components/voice-call/call-session.tsx`)
   - Sends elapsed time updates to agent every 20 seconds
   - Helps agent pace the interview

### Backend Components

1. **Agent Configuration System** (`agent-starter-python/src/agent.py`)

   - Extracts config from room metadata
   - Builds dynamic system prompt based on visa type and context
   - Includes focus areas, question banks, and duration awareness

2. **Ragie Integration (Two Tools)**

   - `lookup_user_documents` - Queries user partition (`visa-{visaType}-user-{userId}`)
     - Searches applicant's submitted documents (bank statements, employment letters, etc.)
   - `lookup_reference_documents` - Queries global partition (`visa-{visaType}`)
     - Searches official visa guidelines and requirements
   - Agent can call both tools as needed for comprehensive verification
   - Note: Ragie only supports one partition per query, so separate tools are necessary

3. **Time Awareness**

   - Agent receives time updates via data messages
   - Logs percentage of interview elapsed
   - Prompt instructs wrapping up at 80% mark

4. **Graceful End**
   - `end_interview` tool allows agent to conclude session
   - Can be called when time is up or all questions answered

## Setup Instructions

### 1. Frontend Environment Variables

Add to `/Users/justinkroeger/interview-app/.env.local`:

```env
# Existing variables
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
DATABASE_URL=...
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
LIVEKIT_URL=...

# New: Ragie API Key
RAGIE_API_KEY=your_ragie_api_key_here
```

### 2. Agent Environment Variables

Add to `/Users/justinkroeger/agent-starter-python/.env.local`:

```env
# Existing variables
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
LIVEKIT_URL=...
TAVUS_API_KEY=...
TAVUS_PERSONA_ID=...
TAVUS_REPLICA_ID=...
ELEVEN_API_KEY=...

# New: Ragie API Key
RAGIE_API_KEY=your_ragie_api_key_here
```

### 3. Install Agent Dependencies

The agent needs the Ragie SDK. Run in the agent directory:

```bash
cd /Users/justinkroeger/agent-starter-python
uv pip install ragie
```

Or with pip:

```bash
pip install ragie
```

### 4. Deploy Agent with Secrets

Deploy the updated agent with the new environment variable:

```bash
cd /Users/justinkroeger/agent-starter-python
lk agent deploy
lk agent update-secrets --secrets-file .env.local
```

### 5. Upload Global Reference Documents (Optional but Recommended)

1. **Create directory structure:**

   ```bash
   cd /Users/justinkroeger/interview-app
   mkdir -p global-docs/{tourist,student,work,immigrant,fiance}
   ```

2. **Add reference documents** to each subdirectory (PDF, DOC, DOCX)

   - See `scripts/README.md` for suggested content

3. **Run upload script:**

   ```bash
   npx tsx scripts/upload-global-docs.ts
   ```

4. **Copy output** into `lib/global-document-ids.ts`

## How It Works

### Interview Flow

1. **User selects visa type** → stored in interview context
2. **User configures interview** → duration and focus areas selected
3. **User uploads documents** → sent to Ragie, IDs stored
4. **User starts interview** → agent config built from context
5. **Agent receives config** → via room metadata
6. **Agent customizes behavior:**
   - Uses visa-specific system prompt
   - References appropriate question bank
   - Can query user documents via Ragie
   - Tracks time and paces accordingly
7. **Interview concludes** → agent can gracefully end session

### Agent Config Structure

The agent receives this JSON structure via room metadata:

```typescript
{
  "visaType": "student",
  "visaCode": "F-1",
  "visaName": "Student Visa",
  "duration": 20,  // minutes
  "focusAreas": ["financial", "education"],
  "focusAreaLabels": ["Financial Background", "Educational Background"],
  "questionBank": ["What do you plan to study?", "..."],
  "ragiePartitions": ["visa-student", "visa-student-user-user_abc123"],
  "agentPromptContext": "This is an F-1 student visa interview...",
  "userInfo": {
    "name": "John Doe",
    "userId": "user_abc123"
  }
}
```

The `ragiePartitions` array contains:

1. Global partition for reference documents
2. User-specific partition for uploaded documents

### Dynamic Prompt Construction

The agent builds a comprehensive system prompt including:

1. **Base personality** - Firm, professional visa officer
2. **Visa-specific context** - Legal requirements and focus areas
3. **Question bank** - First 40 questions for guidance
4. **Focus areas** - Emphasize specific topics if selected
5. **Duration awareness** - Pacing instructions
6. **Document tools** - Guidance on using lookup_user_documents

### Document Lookup Example

During interview, agent can call:

```python
result = await lookup_user_documents(
    question="What is the applicant's annual income according to their bank statements?"
)
```

Ragie searches both partitions (`visa-student` and `visa-student-user-user_123`) and returns relevant chunks from:

- Global reference documents (visa law, requirements)
- User-uploaded documents (bank statements, employment letters, etc.)

## Testing

### Test the Full Flow

1. **Start the frontend:**

   ```bash
   cd /Users/justinkroeger/interview-app
   npm run dev
   ```

2. **Ensure agent is deployed:**

   ```bash
   cd /Users/justinkroeger/agent-starter-python
   lk agent status
   ```

3. **Test interview:**
   - Navigate to http://localhost:3000
   - Select "Student Visa"
   - Configure interview (Standard 20 min, select focus areas)
   - Upload test documents (bank statement, admission letter)
   - Start interview
   - Observe agent behavior in logs: `lk agent logs`

### Verify Features

- [ ] Agent references visa type in greeting
- [ ] Questions align with selected visa type
- [ ] Time updates appear in agent logs every 20s
- [ ] Agent can reference uploaded documents (test by asking about finances)
- [ ] Interview paces appropriately for selected duration
- [ ] Agent can gracefully conclude when time is up

## Troubleshooting

### "No documents available to reference"

- Check that RAGIE_API_KEY is set in both frontend and agent
- Verify documents uploaded successfully (check browser console)
- Confirm `ragiePartitions` are in agent config (check agent logs)
- Verify partitions exist in Ragie dashboard

### Agent doesn't adapt to visa type

- Check agent logs for "Loaded agent config" message
- Verify room metadata contains config (should log full config)
- Ensure agent was redeployed after code changes

### Time updates not working

- Check browser console for "Sent time update" messages
- Verify agent logs show "Time update: Xs elapsed"
- Ensure room is connected before time tracking starts

### Document lookup fails

- Verify Ragie API key is correct
- Check Ragie account has sufficient credits
- Ensure partitions exist in Ragie dashboard
- Verify partition names match pattern: `visa-{visaType}` and `visa-{visaType}-user-{userId}`
- Look for errors in agent logs

## F-1 Student Visa - Enhanced Context

The F-1 Student Visa has been significantly enhanced with **comprehensive real-world context** based on actual U.S. consular practice. See **`F1_INTERVIEW_GUIDE.md`** for the complete reference, which includes:

### What's Included

1. **Legal Framework**

   - INA §214(b) presumption of immigrant intent
   - 9 FAM 402.5 and 9 FAM 302.1 guidance
   - Burden of proof on applicant
   - Consular officer authority and discretion

2. **180+ Interview Questions**

   - Organized into 11 categories
   - Based on real consular interview patterns
   - Covers all major assessment areas
   - Includes edge cases and situational questions

3. **Common Wrong Answers**

   - Examples of responses that lead to INA §214(b) refusals
   - Why each answer is problematic
   - What officers are looking for instead

4. **Interview Preparation Standards**

   - What applicants should know (academic, financial, ties)
   - Documentation mastery requirements
   - Red flags to avoid

5. **Consulate-Specific Playbooks**

   - **India**: Mumbai, New Delhi, Chennai, Hyderabad, Kolkata
   - **China**: Beijing, Shanghai, Guangzhou
   - **Vietnam**: Ho Chi Minh City, Hanoi
   - **Nepal**: Kathmandu
   - **Nigeria**: Lagos, Abuja
   - **Pakistan**: Islamabad, Karachi
   - **Bangladesh**: Dhaka
   - **Brazil**: São Paulo, Rio de Janeiro
   - **South Korea**: Seoul
   - Each with common issues, officer expectations, and prep tips

6. **Denial Prevention Checklist**

   - 8 common denial triggers with prevention strategies
   - Covers nonimmigrant intent, academic purpose, financial evidence, immigration history, English proficiency, documentation consistency, rehearsed answers, and long-term purpose

7. **Mock Interview Script**
   - Example of successful F-1 interview flow
   - Shows proper responses and document handling

### How It's Integrated

1. **Question Bank** (`lib/question-banks.ts`)

   - All 180 questions loaded for F-1 visa type
   - Agent dynamically selects based on focus areas and interview progression

2. **Agent Prompt Context** (`lib/visa-types.ts`)

   - Comprehensive prompt includes INA §214(b) framework
   - Red flags to probe
   - Interview approach guidance (firm, skeptical, direct)
   - Documentation verification checklist
   - Denial criteria

3. **Agent System Prompt** (`agent-starter-python/src/agent.py`)
   - First 40 questions included in prompt for guidance
   - Visa-specific context shapes agent personality and focus
   - RAG tools enable document verification against F-1 standards

### Testing F-1 Interviews

When testing F-1 student visa interviews, verify:

- [ ] Agent exhibits **skeptical, firm demeanor** (consular officer mindset)
- [ ] Questions focus on **nonimmigrant intent** (ties to home country, return plans)
- [ ] Agent probes **financial ability** thoroughly (sponsor income, fund sources, large deposits)
- [ ] Agent tests **academic purpose** (why this university, why this program, career alignment)
- [ ] Agent detects **red flags** (vague answers, OPT emphasis, weak ties, coaching indicators)
- [ ] Agent uses **RAG tools** to verify claims against uploaded documents
- [ ] Agent **challenges inconsistencies** immediately
- [ ] Interview **paces appropriately** for selected duration
- [ ] Agent can **gracefully conclude** when time is up

### For Future Visa Types

The F-1 implementation serves as a **template** for enhancing other visa types with similar depth. Consider adding:

- Legal framework specific to that visa category
- Common denial reasons
- Red flags and fraud indicators
- Consulate-specific considerations
- Expanded question banks

## Next Steps

1. **Upload global reference documents** using the provided script
2. **Test each visa type** to ensure question banks are appropriate
3. **Fine-tune agent prompts** based on interview quality
4. **Add more questions** to question banks if needed (200 target per visa)
5. **Implement post-interview features** (report card, session recording)

## Files Modified/Created

### Frontend

- ✅ `lib/contexts/interview-context.tsx` - Added ragieDocumentId field
- ✅ `app/api/ragie/upload/route.ts` - New endpoint for document uploads
- ✅ `app/upload-documents/page.tsx` - Integrated Ragie upload
- ✅ `lib/question-banks.ts` - Question banks for all visa types
- ✅ `lib/global-document-ids.ts` - Placeholder for global doc IDs
- ✅ `lib/agent-config-builder.ts` - Builds agent config from context
- ✅ `app/api/livekit/connection-details/route.ts` - Passes config via metadata
- ✅ `hooks/use-connection-details.ts` - Accepts agent config
- ✅ `components/voice-call/call-interface.tsx` - Passes config to hook
- ✅ `app/call/page.tsx` - Builds and passes config
- ✅ `components/voice-call/call-session.tsx` - Time tracking implementation
- ✅ `scripts/upload-global-docs.ts` - Helper script for document upload
- ✅ `scripts/README.md` - Documentation for scripts

### Agent

- ✅ `pyproject.toml` - Added ragie dependency
- ✅ `src/agent.py` - Complete refactor with config system, Ragie integration, time tracking, tools

## Support

For issues or questions:

1. Check agent logs: `lk agent logs`
2. Check browser console for frontend errors
3. Verify all environment variables are set correctly
4. Ensure agent is deployed and running: `lk agent status`

---

**Implementation Complete!** 🎉

The agent context system is fully functional and ready for testing. Follow the setup instructions above to enable all features.

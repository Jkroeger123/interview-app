# Interview Document Upload System - How It Works

## Overview

The interview document upload system allows users to upload documents (DS-160, resume, I-20, passport, etc.) **for each specific interview session**. These documents are ephemeral - tied to one interview only, not stored long-term.

## Key Characteristics

### 🔒 Ephemeral & Session-Specific
- Documents are uploaded **per interview**, not per user
- Each interview session can have different documents
- Documents are deleted when the interview record expires (7 days)
- No permanent document storage

### 🤖 AI-Aware
- The interviewer AI agent receives the full document content
- Agent can reference specific details from uploaded documents
- Works with any document type - AI figures out what it is

### 📄 Supported Documents
- DS-160 forms
- Resumes/CVs
- I-20 forms
- Passport copies
- Bank statements
- Sponsorship letters
- Admission letters
- Any other relevant documents

---

## How It Works (Technical Flow)

### Step 1: User Starts Configuring Interview

```
User selects visa type → Goes to configure-interview page
  ↓
System creates a "draft" Interview record
  status: "draft"
  id: "uuid-123"
```

### Step 2: User Uploads Documents (Optional)

```
User drags & drops DS-160.pdf
  ↓
POST /api/interviews/uuid-123/documents
  ↓
1. Upload file to Ragie (document processing service)
   - Ragie extracts text from PDF/images
   - Stored in partition: "interview-uuid-123"
   
2. Save record to database:
   InterviewDocument {
     id: "doc-456",
     interviewId: "uuid-123",
     filename: "DS-160.pdf",
     ragieFileId: "ragie-abc",
     status: "processing" → "ready"
   }
```

### Step 3: User Starts Interview

```
User clicks "Start Interview"
  ↓
POST /api/livekit/connection-details
  ↓
1. System checks if draft interview has documents
2. If yes: Fetch full document content from Ragie
3. Convert draft to "in_progress" interview
4. Create LiveKit room with metadata including:
   {
     visaType: "student",
     duration: "standard",
     documentContext: "DS-160 FORM...[full content]..."
   }
```

### Step 4: Agent Joins & Receives Documents

```
Python agent connects to room
  ↓
Agent reads room metadata
  ↓
Finds documentContext in config
  ↓
Injects into system prompt:

"REFERENCE DOCUMENTS:
The following documents have been provided by the applicant:

--- DS-160.pdf ---
[Full extracted text content]
---

CRITICAL: Use this information to:
- Ask informed follow-up questions
- Verify consistency with verbal responses
- Reference specific details naturally"
```

### Step 5: Interview Happens

```
Agent can now:
✅ "I see from your DS-160 that you plan to attend MIT..."
✅ "Your passport shows you're from India. Tell me about your ties there."
✅ "According to your bank statement, you have $50,000. Is that correct?"

Agent knows:
- Specific school names
- Financial amounts
- Dates and timelines
- Sponsor information
- All document details
```

### Step 6: Interview Ends & Cleanup

```
Interview completes
  ↓
Interview status: "completed"
expiresAt: now + 7 days
  ↓
After 7 days:
  - Interview record deleted from database
  - InterviewDocument records cascade delete
  - Documents removed from Ragie
  - Video deleted from S3
  
Result: No permanent document storage
```

---

## Data Flow Diagram

```
┌─────────────┐
│   User      │
│  Browser    │
└──────┬──────┘
       │ 1. Upload DS-160.pdf
       ↓
┌─────────────────────┐
│   Next.js API       │
│ /interviews/123     │
│  /documents         │
└──────┬──────────────┘
       │ 2. Store file
       ↓
┌─────────────────────┐
│   Ragie API         │◄─── Extract text from PDF
│ (Document Service)  │     Store in partition
└──────┬──────────────┘
       │ 3. Return fileId
       ↓
┌─────────────────────┐
│   Database          │
│ InterviewDocument   │◄─── Link to interview
│ (Prisma)            │
└─────────────────────┘
       
       ... User starts interview ...
       
┌─────────────────────┐
│   Next.js API       │
│ connection-details  │
└──────┬──────────────┘
       │ 4. Fetch doc content
       ↓
┌─────────────────────┐
│   Ragie API         │──► Get full document text
└──────┬──────────────┘
       │ 5. Return content
       ↓
┌─────────────────────┐
│   LiveKit Room      │
│   (Metadata)        │◄─── Include documentContext
└──────┬──────────────┘
       │ 6. Agent reads metadata
       ↓
┌─────────────────────┐
│  Python Agent       │
│  (Interview AI)     │◄─── Inject into prompt
└─────────────────────┘
       │
       ↓
   🤖 Agent knows document contents
   Can reference naturally
```

---

## Why Documents Are Ephemeral

### Privacy & Security
- Users don't want sensitive documents stored permanently
- Visa documents contain private information
- Auto-deletion after 7 days protects user privacy

### Use Case
- Documents are for **THIS interview practice session**
- Next interview might need different/updated documents
- Forces users to upload current documents each time

### Storage Costs
- No long-term storage needed
- Documents auto-deleted
- Ragie handles cleanup automatically

---

## Example Interview Flow

### Without Documents

```
Agent: "Good afternoon. What university will you be attending?"
User: "MIT."
Agent: "What program will you study?"
User: "Computer Science."
```

### With DS-160 Uploaded

```
Agent: "Good afternoon. I see from your DS-160 that you've been 
       admitted to MIT for Computer Science. Congratulations. 
       When does your program start?"
       
User: "September 2024."

Agent: "Your DS-160 shows your sponsor is your father. According 
       to the financial documents, he earns $120,000 annually. 
       How will he fund your $55,000 annual tuition?"
```

**Key Difference:** Agent already knows details, can ask informed questions.

---

## Current Status

### ✅ Working
- Document upload UI (drag & drop)
- Draft interview creation
- Document storage in Ragie
- Database tracking
- Document context fetching
- Auto-deletion after 7 days

### ⚠️ Potential Issue
**Agent may not be using documents properly**

**Why:** Looking at the agent code, `documentContext` IS being passed, but there may be:
1. Ragie API issues (documents not retrieving)
2. Agent prompt not emphasizing document usage enough
3. Document context too long (truncated)
4. Logging not showing document context being used

---

## Debugging Steps

### Check if Documents Are Being Uploaded

```bash
# Check database
psql $DATABASE_URL -c "
SELECT id, filename, status, \"ragieFileId\" 
FROM \"InterviewDocument\" 
ORDER BY \"uploadedAt\" DESC 
LIMIT 5;
"
```

### Check if Ragie Has Documents

```bash
# Test Ragie API
curl -X GET "https://api.ragie.ai/files" \
  -H "Authorization: Bearer $RAGIE_API_KEY"
```

### Check if Agent Receives Context

**Look in agent logs for:**
```
📄 Fetching document context from Ragie...
✅ Document context retrieved: 5234 chars
✅ API: Room created with metadata (includes document context)
```

**Look in agent Python logs for:**
```
📄 DOCUMENT CONTEXT LOADED: 5234 characters
```

### Test Document Context Manually

```typescript
// Test in Next.js API route
import { getInterviewDocumentContext } from "@/lib/ragie-client";

const context = await getInterviewDocumentContext("interview-id-here");
console.log("Document context length:", context.length);
console.log("First 500 chars:", context.substring(0, 500));
```

---

## Recommendations for Fixing Agent Issue

### 1. Add Explicit Logging in Agent

```python
# In agent.py _build_instructions
document_context = config.get('documentContext', '')
if document_context:
    logger.info(f"📄 DOCUMENT CONTEXT LOADED: {len(document_context)} characters")
    logger.info(f"📄 First 200 chars: {document_context[:200]}")
else:
    logger.info("⚠️ NO DOCUMENT CONTEXT - user likely uploaded no documents")
```

### 2. Strengthen Agent Prompt

Add to system instructions:
```python
if document_context:
    doc_context_text = f"""
🔥 CRITICAL - UPLOADED DOCUMENTS:
The applicant has uploaded the following documents for this interview.
YOU MUST reference these documents frequently during the interview.

{document_context}

MANDATORY ACTIONS:
1. Start by acknowledging you've reviewed their documents
2. Reference specific details from documents in your questions
3. Ask follow-up questions based on document contents
4. Verify consistency between documents and verbal responses

Example good opening:
"I've reviewed your DS-160 and supporting documents. I see you've been 
admitted to [University] for [Program]. Let's discuss your plans."
"""
```

### 3. Check Document Length Limits

```python
# If context is too long, summarize key points
if len(document_context) > 10000:
    logger.warning(f"Document context very long ({len(document_context)} chars), may need summarization")
```

---

## Summary

**What it is:** Per-interview document upload system where AI agent can see and reference uploaded documents.

**How it works:** User uploads → Ragie extracts text → Agent receives full content in prompt → Agent references naturally.

**Why ephemeral:** Privacy, security, forces fresh documents, reduces storage costs.

**Current issue:** Agent may not be emphasizing documents enough or documents aren't being fetched properly from Ragie.

**Next steps:** 
1. Add more logging
2. Strengthen agent prompt to REQUIRE document usage
3. Test with sample documents
4. Verify Ragie API is working correctly

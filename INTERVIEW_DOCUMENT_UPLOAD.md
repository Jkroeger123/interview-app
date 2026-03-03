# Interview Document Upload Feature

## Overview

Implemented a flexible, unstructured document upload system that allows users to upload documents (DS-160, resume, I-20, etc.) for specific interview sessions. The AI agent automatically analyzes and references these documents during the interview.

**Key Difference from Existing System:**
- **Existing UserDocument**: Structured per visa type, requires specific document types
- **New InterviewDocument**: Unstructured, ad-hoc uploads per interview session, AI detects document type

---

## Architecture

### 1. Database Schema

**New Model: `InterviewDocument`**
```prisma
model InterviewDocument {
  id           String   @id @default(uuid())
  interviewId  String
  userId       String
  clerkId      String
  filename     String
  ragieFileId  String   @unique // Ragie's file ID for retrieval
  fileSize     Int
  mimeType     String
  
  // AI-extracted metadata
  detectedType String? // AI-detected document type
  extractedText String? @db.Text
  
  status       String   @default("processing")
  uploadedAt   DateTime @default(now())
  
  interview Interview @relation(fields: [interviewId], references: [id], onDelete: Cascade)
  
  @@index([interviewId])
  @@index([userId])
  @@index([ragieFileId])
}
```

**Updated Interview Model:**
- Added `status` support for "draft" interviews
- Added `documents` relation to `InterviewDocument[]`

---

## Implementation Details

### 2. Document Upload Flow

#### Step 1: Draft Interview Creation
When user reaches configuration page, a draft interview is created:

```typescript
// app/api/interviews/draft/route.ts
POST /api/interviews/draft
{
  "visaType": "student"
}

Response:
{
  "interview": {
    "id": "uuid",
    "status": "draft",
    "documents": []
  }
}
```

#### Step 2: Document Upload
User uploads documents to the draft interview:

```typescript
// app/api/interviews/[interviewId]/documents/route.ts
POST /api/interviews/{interviewId}/documents
FormData: { file: File }

Response:
{
  "success": true,
  "document": {
    "id": "uuid",
    "filename": "DS-160.pdf",
    "ragieFileId": "ragie-id",
    "status": "processing"
  }
}
```

**Storage:**
- Files uploaded to Ragie with partition: `interview-{interviewId}`
- Metadata includes: userId, interviewId, roomName, visaType, fileName
- Database record created immediately

#### Step 3: Interview Start
When user starts interview:

1. **Draft Conversion**: Draft interview converted to "in_progress"
2. **Document Context Retrieval**: Ragie queries documents for relevant information
3. **Agent Configuration**: Document context injected into agent system prompt

---

### 3. Document Context Retrieval

**Ragie Client (`lib/ragie-client.ts`):**

```typescript
export async function getInterviewDocumentContext(
  interviewId: string
): Promise<string>
```

**Process:**
1. Query Ragie partition: `interview-{interviewId}`
2. Semantic search for visa-relevant information
3. Extract top 10 chunks
4. Build formatted context string
5. Return to agent configuration

**Example Context:**
```
=== APPLICANT DOCUMENTS ===
The following information was extracted from the applicant's uploaded documents:

[DS-160.pdf]
Name: John Smith
Date of Birth: 01/15/1995
Passport Number: 123456789
Intended Program: Computer Science, Stanford University

[Resume.pdf]
Education: Bachelor's in Engineering, MIT (2017)
Work Experience: Software Engineer at Google (2017-2023)

=== END APPLICANT DOCUMENTS ===
Use this information to ask informed follow-up questions and verify consistency.
```

---

### 4. Agent Integration

**Modified: `agent-starter-python/src/agent.py`**

Document context injected into system prompt:

```python
def _build_instructions(self, config: dict) -> str:
    # ... existing code ...
    
    # Add document context if available
    document_context = config.get('documentContext', '')
    doc_context_text = ""
    if document_context:
        doc_context_text = f"""
{document_context}

IMPORTANT: Use this document information to:
- Ask informed follow-up questions
- Verify consistency between what they say and what's in their documents
- Reference specific details from their documents naturally
- Note any discrepancies or concerns
"""
    
    # Combine into full instructions
    full_instructions = f"""{base_instructions}
{visa_context}{doc_context_text}{focus_text}
...
"""
```

**Agent receives:**
- `hasDocuments`: boolean flag
- `documentContext`: formatted string with extracted information

---

### 5. UI Components

#### InterviewDocumentUpload Component
**Location:** `components/interview/interview-document-upload.tsx`

**Features:**
- Drag-and-drop file upload
- File type validation (PDF, DOC, DOCX, TXT, JPG, PNG)
- Size limit: 50MB
- Real-time document list
- Delete functionality
- Processing status indicators

**Integration:**
```tsx
// components/interview/configure-interview-client.tsx
{draftInterviewId && !isLoadingDraft && (
  <div className="mt-6">
    <InterviewDocumentUpload interviewId={draftInterviewId} />
  </div>
)}
```

---

## API Endpoints

### 1. Create Draft Interview
```
POST /api/interviews/draft
Body: { visaType: string }
Response: { interview: Interview }
```

### 2. Upload Document
```
POST /api/interviews/{interviewId}/documents
Body: FormData { file: File }
Response: { success: boolean, document: InterviewDocument }
```

### 3. List Documents
```
GET /api/interviews/{interviewId}/documents
Response: { documents: InterviewDocument[] }
```

### 4. Delete Document
```
DELETE /api/interviews/{interviewId}/documents?documentId={id}
Response: { success: boolean }
```

---

## Security

1. **Authentication**: All endpoints require Clerk authentication
2. **Ownership Verification**: 
   - Draft interviews belong to user
   - Documents can only be uploaded to user's interviews
   - Documents can only be deleted by owner
3. **File Validation**:
   - Type checking (MIME types)
   - Size limits (50MB)
   - Ragie handles malware scanning
4. **Partition Isolation**: Each interview has isolated Ragie partition

---

## User Flow

1. **Select Visa Type** → Navigate to configuration
2. **Configure Interview** → Draft interview created automatically
3. **Upload Documents (Optional)** → Documents uploaded to draft
4. **Start Interview** → Draft converted to in_progress
5. **AI Agent** → References documents during interview

---

## Technical Benefits

### 1. Flexibility
- No predefined document types
- AI automatically detects document content
- Users can upload any relevant documents

### 2. Contextual Intelligence
- Agent has full context of applicant's documents
- Can verify consistency
- Ask informed follow-up questions
- Reference specific details naturally

### 3. Scalability
- Ragie handles document parsing and extraction
- Partition-based isolation
- Automatic text extraction (PDF, DOCX, images via OCR)

### 4. Clean Separation
- Draft interviews don't affect credits
- Documents tied to specific interview sessions
- Cascade deletion when interview expires

---

## Example Interview Scenario

**Without Documents:**
```
Agent: What school will you be attending?
User: Stanford University
Agent: What program?
User: Computer Science
Agent: How much is tuition?
User: Around $60,000 per year
```

**With Documents (DS-160 uploaded):**
```
Agent: I see from your DS-160 that you'll be attending Stanford University for Computer Science. Can you tell me why you chose this specific program?
User: I'm interested in AI research...
Agent: Your DS-160 shows your intended start date is September 2026. Have you received your I-20 yet?
User: Yes, I received it last month.
Agent: I notice in your documents that your sponsor is your father. Can you tell me about his occupation?
```

---

## Testing Checklist

- [ ] Upload PDF document to draft interview
- [ ] Upload DOC/DOCX document
- [ ] Upload image (JPG/PNG)
- [ ] Verify document appears in list
- [ ] Delete document
- [ ] Start interview with documents
- [ ] Verify agent references documents
- [ ] Test without documents (should work normally)
- [ ] Test file size limit (>50MB should fail)
- [ ] Test invalid file types (should fail)
- [ ] Test ownership (can't upload to other user's interview)

---

## Future Enhancements

1. **AI Document Type Detection**: Automatically label documents (DS-160, Resume, I-20, etc.)
2. **Document Preview**: Show document thumbnails/previews in UI
3. **OCR Enhancement**: Improve image text extraction quality
4. **Multi-language Documents**: Support non-English documents
5. **Document Validation**: Check for required fields in specific document types
6. **Document Comparison**: Highlight discrepancies between documents
7. **Document History**: Track document versions and updates

---

## Migration Notes

**Existing System Unchanged:**
- `UserDocument` model still exists for structured uploads
- `/documents` page still works for visa-specific document management
- New system is completely separate and complementary

**Database Migration:**
- Run `npx prisma db push` to create `InterviewDocument` table
- No data migration needed (new feature)

---

## Cost Considerations

**Ragie Costs:**
- Document upload: ~$0.001 per page
- Retrieval queries: ~$0.0001 per query
- Storage: Minimal (documents deleted when interview expires)

**Estimated Cost per Interview:**
- With 3 documents (avg 10 pages each): ~$0.03
- Retrieval (1 query): ~$0.0001
- **Total: ~$0.03 per interview with documents**

---

## Deployment

1. **Database**: Run `npx prisma db push` (already done)
2. **Environment Variables**: Ensure `RAGIE_API_KEY` is set
3. **Agent**: Deploy updated `agent.py` to production
4. **Frontend**: Deploy Next.js app (build successful)

---

## Support

For issues or questions:
- Check Ragie dashboard for document processing status
- Review agent logs for document context injection
- Verify partition naming: `interview-{interviewId}`
- Check database for `InterviewDocument` records

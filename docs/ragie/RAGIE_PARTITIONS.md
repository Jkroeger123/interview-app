# Ragie Partition Strategy

## Overview

The Vysa application uses **Ragie partitions** to organize documents by visa type and user, eliminating the need to manually track document IDs.

## Partition Naming Convention

### Pattern

| Partition Type | Pattern | Example |
|---|---|---|
| Global Reference Docs | `visa-{visaType}` | `visa-tourist` |
| User-Uploaded Docs | `visa-{visaType}-user-{userId}` | `visa-tourist-user-user_abc123` |

### Examples by Visa Type

| Visa Type | Global Partition | User Partition |
|---|---|---|
| Tourist (B-1/B-2) | `visa-tourist` | `visa-tourist-user-{userId}` |
| Student (F-1) | `visa-student` | `visa-student-user-{userId}` |
| Work (H-1B) | `visa-work` | `visa-work-user-{userId}` |
| Immigrant (Green Card) | `visa-immigrant` | `visa-immigrant-user-{userId}` |
| Fiancé (K-1) | `visa-fiance` | `visa-fiance-user-{userId}` |

## How It Works

### 1. Global Reference Documents

**Purpose**: Legal reference materials shared across all users for a visa type

**Upload Process**:
```bash
cd /Users/justinkroeger/interview-app
npx tsx scripts/upload-global-docs.ts
```

**Storage**:
- Documents stored in partition: `visa-{visaType}`
- Example: Tourist visa PDFs → `visa-tourist`

**Access**: All users interviewing for that visa type

### 2. User-Uploaded Documents

**Purpose**: User-specific documents (bank statements, employment letters, etc.)

**Upload Process**:
- Automatic during interview flow
- User uploads via `/upload-documents` page
- Frontend API handles upload to Ragie

**Storage**:
- Documents stored in partition: `visa-{visaType}-user-{userId}`
- Example: John's tourist visa docs → `visa-tourist-user-user_abc123`

**Access**: Only that specific user

### 3. Agent Querying

**Important**: Ragie only supports querying **one partition at a time**, so the agent has two separate tools:

**Tool 1: Query User Documents**
```python
# Agent receives both partitions in config
ragie_partitions = ["visa-tourist", "visa-tourist-user-user_abc123"]

# Query user-specific partition
ragie_client = Ragie(auth=api_key)
results = ragie_client.retrievals.rag(
    query="What is the applicant's annual income?",
    partition=ragie_partitions[1],  # User partition only
    top_k=3
)
```

**Tool 2: Query Reference Documents**
```python
# Query global reference partition
results = ragie_client.retrievals.rag(
    query="What are the financial requirements for this visa?",
    partition=ragie_partitions[0],  # Global partition only
    top_k=3
)
```

**Agent Strategy**: 
- The agent can call both tools during an interview
- Often calls `lookup_reference_documents` first to understand requirements
- Then calls `lookup_user_documents` to verify applicant meets them
- Each tool queries its own partition independently

## Benefits

### ✅ No Manual ID Tracking
- Don't need to store or manage document IDs
- No database table for document mappings
- No sync issues between app and Ragie

### ✅ Automatic Scoping
- Documents automatically organized by visa type
- User documents isolated per user
- Can't accidentally query wrong user's docs

### ✅ Easy Management
- Add/remove documents in Ragie without code changes
- Re-upload global docs anytime
- Update reference materials independently

### ✅ Clear Organization
- Partition name tells you what's inside
- Easy to debug and inspect in Ragie dashboard
- Clear separation of concerns

### ✅ Scalable
- Partitions handle thousands of documents
- Fast queries even with many documents
- No performance degradation

## Implementation Details

### Frontend: Document Upload

**File**: `app/api/ragie/upload/route.ts`

```typescript
// Calculate partition based on visa type and user
const partition = `visa-${visaType}-user-${user.id}`;

// Add to form data
ragieFormData.append("partition", partition);
```

### Frontend: Agent Config

**File**: `lib/agent-config-builder.ts`

```typescript
// Build partition names
const globalPartition = `visa-${configuration.visaType}`;
const userPartition = `visa-${configuration.visaType}-user-${userInfo.userId}`;

// Pass both to agent
const ragiePartitions = [globalPartition, userPartition];
```

### Agent: Document Lookup

**File**: `agent-starter-python/src/agent.py`

```python
# Query both partitions
results = ragie_client.retrievals.rag(
    query=question,
    partition=self.ragie_partitions,  # Array of partitions
    top_k=3
)
```

## Uploading Global Documents

### Directory Structure

```
global-docs/
├── tourist/          # → uploads to visa-tourist
│   ├── b1-b2-requirements.pdf
│   └── denial-reasons.pdf
├── student/          # → uploads to visa-student
│   ├── f1-visa-guide.pdf
│   └── sevis-info.pdf
├── work/             # → uploads to visa-work
├── immigrant/        # → uploads to visa-immigrant
└── fiance/           # → uploads to visa-fiance
```

### Upload Command

```bash
npx tsx scripts/upload-global-docs.ts
```

### Output

```
✅ Documents uploaded to Ragie partitions
================================================

Documents are organized by partition:
  visa-tourist: 2 document(s)
  visa-student: 2 document(s)
  visa-work: 3 document(s)

💡 No code changes needed!
The agent automatically queries the correct partitions based on visa type:
  - Global docs: visa-{visaType}
  - User docs: visa-{visaType}-user-{userId}
```

## Ragie API Reference

### Creating a Document with Partition

```typescript
const formData = new FormData();
formData.append("file", file);
formData.append("metadata", JSON.stringify({ /* ... */ }));
formData.append("partition", "visa-tourist");  // Key line

const response = await fetch("https://api.ragie.ai/documents", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${RAGIE_API_KEY}`,
  },
  body: formData,
});
```

### Querying a Single Partition

**Note**: Ragie only supports querying one partition at a time.

```python
from ragie import Ragie

ragie_client = Ragie(auth=api_key)

# Query ONE partition at a time
results = ragie_client.retrievals.rag(
    query="What are the financial requirements?",
    partition="visa-tourist",  # String, not array
    top_k=3
)
```

To query multiple partitions, make separate API calls for each partition.

## Partition Constraints

From Ragie documentation:
- Partition names must be lowercase alphanumeric
- May only include special characters `_` and `-`
- Created automatically when first document is uploaded
- Can filter by multiple partitions in a single query

Our naming convention follows all these rules:
- `visa-tourist` ✅
- `visa-tourist-user-user_abc123` ✅

## Migration Notes

If migrating from document ID approach to partitions:

1. **No database changes needed** - just remove document ID fields if added
2. **Re-upload documents** - Upload to appropriate partitions
3. **Update agent code** - Change from `document_ids` to `partition`
4. **Test thoroughly** - Ensure queries work with partition filter

## FAQs

### Q: Do I need to track partition names in my database?

**A**: No! Partition names are deterministic - you can always calculate them from visa type and user ID.

### Q: What if a user hasn't uploaded any documents?

**A**: The agent will only query the global partition. Ragie won't error if a partition is empty or doesn't exist.

### Q: Can I query just the global partition?

**A**: Yes! That's exactly what the `lookup_reference_documents` tool does. It only queries the global partition (`visa-tourist`). The agent has two separate tools because Ragie only supports querying one partition at a time.

### Q: How do I delete old documents?

**A**: Use the Ragie dashboard or API to delete documents from a partition. The partition will remain even if empty.

### Q: Can different users share a partition?

**A**: Not recommended. Our naming scheme isolates users for privacy. But technically Ragie allows it.

### Q: What's the performance impact of making two separate queries?

**A**: Each tool call is a separate API request to Ragie, so there's the overhead of two HTTP requests. However, the agent only calls these tools when needed, not on every turn. The benefit of having context from both sources usually outweighs the latency cost.

## Monitoring & Debugging

### Check Partition Contents in Ragie Dashboard

1. Log into Ragie dashboard
2. Navigate to "Documents"
3. Filter by partition name (e.g., `visa-tourist`)
4. View all documents in that partition

### Agent Logs

The agent logs which partitions it's querying:

```
Agent will query Ragie partitions: ['visa-tourist', 'visa-tourist-user-user_abc123']
```

### Test Query

You can test partition queries directly in Ragie dashboard or via API to verify documents are accessible.

## Related Files

- `app/api/ragie/upload/route.ts` - User document upload with partition
- `lib/agent-config-builder.ts` - Builds partition names for config
- `lib/global-document-ids.ts` - Documentation on partition strategy
- `scripts/upload-global-docs.ts` - Global document upload script
- `agent-starter-python/src/agent.py` - Agent queries partitions
- `AGENT_CONTEXT_SETUP.md` - Full system documentation

---

**Summary**: Partitions provide a clean, scalable way to organize documents without manual ID tracking. The naming convention is simple, deterministic, and aligns perfectly with our visa-type-based architecture.


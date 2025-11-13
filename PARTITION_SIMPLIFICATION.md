# Ragie Partition Simplification

## Problem
Current partition structure is too complex and causing query issues:
- User docs: `visa-student-user-user_33ubtypqpstjix424rw9znwsm2a`
- Global docs: `visa-student`

Agent is querying but getting 0 results even though documents are uploaded.

## Solution: Simplified Partition Strategy

### New Partition Structure

**User Documents:**
```
user-{userId}
```
Example: `user-user_33ubtypqpstjix424rw9znwsm2a`

**Global Reference Documents:**
```
visa-{type}
```
Example: `visa-student`

### Why This is Better

1. **Simpler** - User docs don't need visa type prefix (user can upload docs for multiple visa types)
2. **More flexible** - Same user docs can be queried across different visa types
3. **Cleaner queries** - Agent queries one partition for user docs, another for global docs
4. **Metadata-based filtering** - Use Ragie metadata to filter by document type instead of partition names

### Changes Needed

#### 1. Update Upload (server/document-actions.ts)

**Current:**
```typescript
const partition = `visa-${visaType}-user-${user.id.toLowerCase()}`;
```

**New:**
```typescript
const partition = `user-${user.id.toLowerCase()}`;
```

**Also update metadata to include visa type:**
```typescript
const metadata = {
  userId: user.id,
  visaType: visaType,  // ADD THIS
  userName: user.firstName || user.emailAddresses[0]?.emailAddress || "Unknown",
  fileName: file.name,
  documentType: documentType.friendlyName,
  documentInternalName: documentType.internalName,  // ADD THIS for filtering
  uploadedAt: new Date().toISOString(),
};
```

#### 2. Update Delete (server/document-actions.ts)

**Current:**
```typescript
const partition = `visa-student-user-${document.clerkId.toLowerCase()}`;
```

**New:**
```typescript
const partition = `user-${document.clerkId.toLowerCase()}`;
```

#### 3. Update Status Check (server/document-actions.ts)

**Current:**
```typescript
const partition = `visa-student-user-${document.clerkId.toLowerCase()}`;
```

**New:**
```typescript
const partition = `user-${document.clerkId.toLowerCase()}`;
```

#### 4. Update Agent Config (lib/agent-config-builder.ts)

**Current:**
```typescript
const globalPartition = `visa-${configuration.visaType}`;
const userPartition = `visa-${configuration.visaType}-user-${userInfo.userId.toLowerCase()}`;
const ragiePartitions = [globalPartition, userPartition];
```

**New:**
```typescript
const globalPartition = `visa-${configuration.visaType}`;
const userPartition = `user-${userInfo.userId.toLowerCase()}`;

// Send as separate values, not array, so agent knows which is which
return {
  // ... other config
  ragieUserPartition: userPartition,
  ragieGlobalPartition: globalPartition,
  uploadedDocuments: uploadedDocuments,
};
```

#### 5. Update Agent Tool (agent-starter-python/src/agent.py)

**Current tool:**
```python
async def lookup_user_documents(question: str) -> str:
    # Queries both partitions
    for partition in ragie_partitions:
        ...
```

**New improved tool:**
```python
async def lookup_user_documents(
    question: str,
    document_types: list[str] | None = None
) -> str:
    """
    Search user's uploaded documents with optional filtering by document type.
    
    Args:
        question: What information to find in the documents
        document_types: Optional list of document types to search in, e.g.,
                       ["i20_form", "admission_letter", "bank_statement"]
                       If None, searches all user documents.
    
    Returns: Relevant text from user's documents
    """
    user_partition = agent_config.get("ragieUserPartition")
    
    # Build metadata filter if document types specified
    metadata_filter = None
    if document_types:
        # Filter by internal document name
        metadata_filter = {
            "documentInternalName": {"$in": document_types}
        }
    
    result = ragie_client.retrievals.retrieve(
        request={
            "query": question,
            "partition": user_partition,
            "top_k": 5,
            "metadata_filter": metadata_filter,  # NEW: Filter by doc type
        }
    )
    
    # Process results...
```

**Update tool description:**
```python
description="""
🔍 Search the applicant's uploaded documents. 

Available document types:
{uploaded_docs_list}

Examples:
- lookup_user_documents("What is the program start date?", ["i20_form"])
- lookup_user_documents("What is the sponsor's income?", ["bank_statement", "sponsor_letter"])
- lookup_user_documents("What university?", ["admission_letter", "i20_form"])

Args:
    question: Specific information to find
    document_types: List of document types to search (e.g. ["i20_form", "bank_statement"])
                   Leave empty to search all documents
""".format(
    uploaded_docs_list="\n".join([
        f"- {doc['friendlyName']} ({doc['internalName']})" 
        for doc in agent_config.get("uploadedDocuments", [])
    ])
)
```

### Migration Steps

1. **Update all partition references** in server/document-actions.ts
2. **Update agent-config-builder.ts** to use new structure
3. **Update agent.py** to:
   - Accept separate user/global partitions
   - Add document_types parameter to lookup_user_documents
   - Show available documents in tool description
4. **IMPORTANT: Re-upload existing documents** or migrate them in Ragie dashboard to new partitions

### Testing

After migration:
1. Upload a test document → verify partition is `user-{userId}`
2. Start interview → check agent logs show correct partitions
3. Agent queries documents → should get results
4. Try filtered query: `lookup_user_documents("start date", ["i20_form"])`

## Example Agent Behavior After Fix

### Before (Current - Not Working):
```
Agent: "When does your program start?"
You: "August 15, 2025"
Agent: [calls lookup_user_documents("Stevens Institute of Technology I-20")]
Agent: Found 0 chunks ❌ (wrong university name in query)
Agent: Proceeds without verification
```

### After (Fixed):
```
Agent: "When does your program start?"
You: "August 15, 2025"
Agent: [sees you have: Admission Letter, Transcripts uploaded]
Agent: [calls lookup_user_documents("program start date", ["i20_form", "admission_letter"])]
Agent: Found 3 chunks ✅ (filtered to right document types)
Agent: "I see your I-20 shows August 20th, not 15th. Please clarify."
```

## Benefits

1. ✅ Simpler partition names
2. ✅ Better filtering by document type
3. ✅ Agent knows exactly what documents exist
4. ✅ More targeted queries = better results
5. ✅ Easier to debug (clearer partition structure)


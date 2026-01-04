# Agent Update Guide - Document Verification Fix

## Overview

This guide updates the agent to:
1. Use simplified Ragie partitions
2. Filter queries by document type
3. Know exactly what documents user uploaded
4. Make targeted, effective queries

## Problem We're Solving

**Current behavior:**
- Agent queries: "Stevens Institute of Technology admission letter"
- User uploaded: "Northwestern acceptance letter"
- Result: 0 chunks found ❌

**Why it fails:**
1. Agent doesn't know what files exist
2. No filtering by document type
3. Queries are too specific/wrong

## Solution

### Frontend Changes (Already Done ✅)

1. **Simplified partitions:**
   - User docs: `user-{userId}` (not `visa-student-user-{userId}`)
   - Global docs: `visa-student` (unchanged)

2. **Enhanced metadata:**
   - Added `visaType`, `documentInternalName` to Ragie metadata
   - Allows filtering by document type

3. **Agent config now includes:**
   ```json
   {
     "ragieUserPartition": "user-user_33ubtypqpstjix424rw9znwsm2a",
     "ragieGlobalPartition": "visa-student",
     "uploadedDocuments": [
       {
         "friendlyName": "Admission/Acceptance Letter",
         "internalName": "admission_letter",
         "isRequired": true
       },
       {
         "friendlyName": "Transcripts, Diplomas, Test Scores",
         "internalName": "transcript",
         "isRequired": true
       }
     ]
   }
   ```

### Agent Changes Needed

Location: `/Users/justinkroeger/agent-starter-python/src/agent.py`

#### 1. Extract New Config Values

**Find where you load agent config and update:**

```python
# OLD
ragie_partitions = agent_config.get("ragiePartitions", [])

# NEW
ragie_user_partition = agent_config.get("ragieUserPartition", "")
ragie_global_partition = agent_config.get("ragieGlobalPartition", "visa-student")
uploaded_documents = agent_config.get("uploadedDocuments", [])

# Log for debugging
logger.info(f"✅ Ragie user partition: {ragie_user_partition}")
logger.info(f"✅ Ragie global partition: {ragie_global_partition}")
logger.info(f"✅ Uploaded documents: {len(uploaded_documents)}")
for doc in uploaded_documents:
    logger.info(f"   - {doc['friendlyName']} ({doc['internalName']})" + 
               (" [REQUIRED]" if doc['isRequired'] else ""))
```

#### 2. Update lookup_user_documents Tool

**Replace current tool with this improved version:**

```python
async def lookup_user_documents(
    question: str,
    document_types: list[str] | None = None
) -> str:
    """
    Search the applicant's uploaded documents.
    
    Args:
        question: Specific information to find (e.g., "program start date", "sponsor income")
        document_types: Optional list of document internal names to search in
                       Examples: ["i20_form"], ["bank_statement", "sponsor_letter"]
                       If None or empty, searches all uploaded documents
    
    Returns: Relevant text from the user's documents
    """
    try:
        logger.info(f"🔧 TOOL CALL: lookup_user_documents(question='{question[:50]}...', document_types={document_types})")
        
        logger.info(f"🔍 QUERYING USER DOCUMENTS:")
        logger.info(f"   Question: {question}...")
        logger.info(f"   Partition: {ragie_user_partition}")
        if document_types:
            logger.info(f"   Filtering by document types: {document_types}")
        else:
            logger.info(f"   Searching ALL user documents")
        
        # Build retrieval request
        retrieval_request = {
            "query": question,
            "partition": ragie_user_partition,
            "top_k": 5,
        }
        
        # Add metadata filter if document types specified
        if document_types and len(document_types) > 0:
            retrieval_request["metadata_filter"] = {
                "documentInternalName": {"$in": document_types}
            }
        
        # Query Ragie
        result = ragie_client.retrievals.retrieve(request=retrieval_request)
        
        if not result or not result.scored_chunks:
            logger.info(f"✅ TOOL RESULT: Found 0 relevant chunks from user documents")
            
            # Provide helpful context if no results
            if document_types:
                doc_list = ", ".join(document_types)
                return f"No information found in the following document types: {doc_list}. The applicant may not have uploaded these documents yet, or the information is not present in those specific documents."
            else:
                return "No relevant information found in the applicant's uploaded documents. They may not have uploaded the necessary documents yet."
        
        # Extract text from chunks
        chunks_text = []
        for chunk in result.scored_chunks[:5]:  # Top 5 results
            doc_name = chunk.metadata.get("documentType", "Unknown Document")
            text = chunk.text.strip()
            chunks_text.append(f"[From {doc_name}]: {text}")
        
        logger.info(f"✅ TOOL RESULT: Found {len(chunks_text)} relevant chunks from user documents")
        
        combined_text = "\n\n".join(chunks_text)
        return f"Information from applicant's documents:\n{combined_text}"
    
    except Exception as e:
        logger.error(f"❌ TOOL ERROR: Error querying user documents: {str(e)}")
        return f"Error accessing documents: {str(e)}"
```

#### 3. Update Tool Description (Critical!)

**Create the tool with enhanced description:**

```python
# Build available documents list for tool description
docs_list = []
for doc in uploaded_documents:
    docs_list.append(f"  - {doc['friendlyName']}: Use '{doc['internalName']}'")

docs_description = "\n".join(docs_list) if docs_list else "  (No documents uploaded yet)"

lookup_user_documents_tool = llm.ai.create_function_calling_tool(
    name="lookup_user_documents",
    func=lookup_user_documents,
    description=f"""
🔍 CRITICAL VERIFICATION TOOL - USE FREQUENTLY 🔍

Search the applicant's uploaded documents to verify their claims.

📋 DOCUMENTS AVAILABLE:
{docs_description}

⚠️ WHEN TO USE THIS TOOL:
- Applicant mentions specific dates → Verify immediately
- Applicant mentions specific amounts → Verify immediately
- Applicant mentions institutions/names → Verify immediately
- ANY claim that should be in their documents → Verify immediately

💡 HOW TO USE:
1. Use 'document_types' to search specific documents (recommended)
2. Leave 'document_types' empty to search all documents (less precise)

GOOD EXAMPLES:
- lookup_user_documents("program start date", ["i20_form"])
- lookup_user_documents("sponsor annual income", ["bank_statement", "sponsor_letter"])
- lookup_user_documents("university name and program", ["admission_letter", "i20_form"])
- lookup_user_documents("GPA and graduation date", ["transcript"])

BAD EXAMPLES:
- lookup_user_documents("everything")  ❌ Too vague
- lookup_user_documents("documents")   ❌ Too broad
- Searching for "Stevens" when they uploaded "Northwestern" ❌ Wrong specific

Args:
    question (str): Specific information to verify
    document_types (list[str] | None): List of document internal names to search
                                      Use the names from the "DOCUMENTS AVAILABLE" list above
""",
)
```

#### 4. Update System Prompt - Add Document Context

**Find where you build the system prompt and add this section:**

```python
# Build document verification context
uploaded_docs_context = ""
if len(uploaded_documents) > 0:
    docs_list = "\n".join([
        f"   - {doc['friendlyName']} ({doc['internalName']})" + 
        (" [REQUIRED]" if doc['isRequired'] else " [optional]")
        for doc in uploaded_documents
    ])
    
    uploaded_docs_context = f"""

🚨 CRITICAL: APPLICANT'S UPLOADED DOCUMENTS 🚨

The applicant has uploaded the following documents:
{docs_list}

⚠️ VERIFICATION PROTOCOL - FOLLOW STRICTLY:

1. WHEN APPLICANT MAKES SPECIFIC CLAIMS:
   - Program start date → lookup_user_documents("program start date", ["i20_form"])
   - Tuition cost → lookup_user_documents("tuition cost", ["i20_form"])
   - Sponsor income → lookup_user_documents("sponsor income", ["bank_statement", "sponsor_letter"])
   - University/program → lookup_user_documents("university and program", ["admission_letter", "i20_form"])
   - GPA/graduation → lookup_user_documents("GPA graduation date", ["transcript"])

2. ALWAYS VERIFY BEFORE ACCEPTING:
   - Do NOT proceed to next question until you've verified the claim
   - Call lookup_user_documents immediately after they give specific information
   - Cross-reference their verbal answer with document content

3. IF INFORMATION DOESN'T MATCH:
   - Challenge immediately: "I see [X] in your [document], but you said [Y]. Please clarify."
   - Give ONE chance to explain
   - If explanation is weak, note as red flag and continue with increased scrutiny

4. IF THEY'RE VAGUE:
   - Demand specifics: "I need the exact date from your I-20"
   - Then verify their specific answer

REMEMBER: A real visa officer has these documents open and constantly cross-references them.
You MUST simulate this behavior by actively using lookup_user_documents throughout the interview.
"""
else:
    uploaded_docs_context = """

⚠️ WARNING: NO DOCUMENTS UPLOADED

The applicant has NOT uploaded any supporting documents. This is a significant red flag.

- Question why they came unprepared
- Ask how they plan to prove their claims without documentation
- Be significantly more skeptical of all claims
- Consider whether to proceed with the interview at all
"""

# Insert this into your system prompt construction
system_prompt = f"""
You are a U.S. visa officer conducting a {visa_config['visaName']} ({visa_config['visaCode']}) interview.

{agent_prompt_context}

{uploaded_docs_context}

... rest of prompt ...
"""
```

#### 5. Update lookup_reference_documents (Separate Tool)

**Also update this tool to use the global partition:**

```python
async def lookup_reference_documents(question: str) -> str:
    """
    Search official visa requirements and regulations.
    Use this for questions about visa law, requirements, and general guidance.
    """
    try:
        logger.info(f"🔧 TOOL CALL: lookup_reference_documents(question='{question[:50]}...')")
        logger.info(f"   Partition: {ragie_global_partition}")
        
        result = ragie_client.retrievals.retrieve(request={
            "query": question,
            "partition": ragie_global_partition,
            "top_k": 3,
        })
        
        if not result or not result.scored_chunks:
            return "No relevant information found in visa reference documents."
        
        chunks_text = [chunk.text.strip() for chunk in result.scored_chunks[:3]]
        combined = "\n\n".join(chunks_text)
        
        logger.info(f"✅ Found {len(chunks_text)} chunks from reference documents")
        return f"Visa regulations and requirements:\n{combined}"
    
    except Exception as e:
        logger.error(f"❌ Error querying reference documents: {str(e)}")
        return f"Error: {str(e)}"
```

### Testing the Fix

After deploying updated agent:

#### Test 1: Correct Information
```
Upload: Northwestern admission letter + THSM transcript
Agent: "What university accepted you?"
You: "Northwestern"
Agent: [calls lookup_user_documents("university name", ["admission_letter"])]
Agent: ✅ "That matches your admission letter from Northwestern."
```

#### Test 2: Incorrect Information (Catching Lies)
```
Upload: Northwestern admission letter
Agent: "What university accepted you?"
You: "Stevens Institute"
Agent: [calls lookup_user_documents("university name", ["admission_letter"])]
Agent: ⚠️ "I see Northwestern in your admission letter, not Stevens. Please clarify."
```

#### Test 3: Document Type Filtering
```
Upload: I-20 + Transcript + Bank Statement
Agent: "When does your program start?"
You: "August 2025"
Agent: [calls lookup_user_documents("program start date", ["i20_form"])]
Agent: Searches ONLY I-20 (not all 3 documents) → More precise results
```

## Deployment

```bash
cd /Users/justinkroeger/agent-starter-python

# Make the changes above to src/agent.py

# Deploy
lk agent deploy

# Watch logs
lk agent logs --follow
```

## Important Notes

1. **Old Documents**: Any documents uploaded before this change will be in old partitions (`visa-student-user-...`). You'll need to:
   - Delete them and re-upload
   - OR manually migrate them in Ragie dashboard to new partition `user-{userId}`

2. **Agent Will See**:
   ```json
   "uploadedDocuments": [
     {"friendlyName": "Admission/Acceptance Letter", "internalName": "admission_letter", "isRequired": true},
     {"friendlyName": "Transcripts, Diplomas, Test Scores", "internalName": "transcript", "isRequired": true}
   ]
   ```

3. **Tool calls will be:**
   ```python
   # Good - targeted
   lookup_user_documents("program start date", ["i20_form"])
   
   # OK - broader search
   lookup_user_documents("program start date")
   
   # Bad - too vague
   lookup_user_documents("tell me about documents")
   ```

## Expected Logs After Fix

```
✅ Uploaded documents: 2
   - Admission/Acceptance Letter (admission_letter) [REQUIRED]
   - Transcripts, Diplomas, Test Scores (transcript) [REQUIRED]

🔧 TOOL CALL: lookup_user_documents(question='university name', document_types=['admission_letter'])
🔍 QUERYING USER DOCUMENTS:
   Question: university name...
   Partition: user-user_33ubtypqpstjix424rw9znwsm2a
   Filtering by document types: ['admission_letter']
✅ TOOL RESULT: Found 2 relevant chunks from user documents

[Agent verifies: Northwestern matches admission letter ✓]
```

## Summary

**Before:**
- Agent searched blindly: "Stevens" → 0 results
- No document type filtering
- Didn't know what files exist

**After:**
- Agent knows: Admission Letter, Transcript uploaded
- Searches with filters: `["admission_letter"]`
- Gets relevant results → Can verify claims
- Catches lies and inconsistencies

This transforms the agent from passive to **actively verifying every claim**! 🎯


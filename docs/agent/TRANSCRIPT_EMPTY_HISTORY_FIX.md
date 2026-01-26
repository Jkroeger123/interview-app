# Transcript Empty History Fix

## Problem

The session report sent from the Python agent to the Next.js API had an empty `history.items` array, resulting in:
- No transcript segments saved to database
- No AI-generated report
- Credits not being properly evaluated for deduction

### Root Cause Analysis

The code was trying to manually track conversation history with global variables, but this approach failed. The LiveKit Agent SDK **already tracks conversation history** via `session.history.items`, but we weren't accessing it correctly.

**The issue**: We were not using the correct LiveKit Agent SDK API to access conversation history.

## Solution

### Code Changes in `agent.py`

Made two critical fixes:

1. **Changed callback registration** from `ctx.add_shutdown_callback` to `@session.on("close")`
2. **Updated history access** to use the correct LiveKit Agent SDK API

#### Fix #1: Use Session Close Event (Critical!)

**Before (WRONG)**:
```python
ctx.add_shutdown_callback(send_session_report)
```

**After (CORRECT)**:
```python
# Track the report task
report_task = None

@session.on("close")
def _on_session_close(ev):
    nonlocal report_task
    logger.info("📊 Session close event triggered")
    # Create task and store reference
    report_task = asyncio.create_task(send_session_report())

# Ensure task completes before shutdown
async def await_report_task():
    nonlocal report_task
    if report_task:
        await report_task

ctx.add_shutdown_callback(await_report_task)
```

**Why this approach**:
1. `.on()` event handlers **must be synchronous** (LiveKit SDK requirement)
2. We create an async task in the synchronous callback
3. We store the task reference so we can await it later
4. The shutdown callback ensures the task completes before the process exits

**Why this matters**: The `ctx.add_shutdown_callback` runs when the worker process shuts down, which may be too early or in the wrong context. The `@session.on("close")` event fires when the agent session actually closes, ensuring `session.history.items` is fully populated.

#### Fix #2: Use Correct History API

Updated the `send_session_report()` function to use the **correct LiveKit Agent SDK API**:

**The Correct API** (from LiveKit's official examples):
```python
for item in session.history.items:
    if item.type == "message":
        role = item.role  # "user" or "assistant"
        text = item.text_content  # The actual text content
```

**Our Implementation**:
```python
if hasattr(session, 'history') and hasattr(session.history, 'items'):
    for item in session.history.items:
        if item.type == "message":
            conversation_items.append({
                "type": "message",
                "role": item.role,
                "content": [{"text": item.text_content}],
                "start_time": 0,  # TODO: Extract if available
                "end_time": 0,
            })
```

### Key Insights

1. **`session.history.items`** - This is the official API to access conversation history
2. **Item types**: Each item has a `.type` property:
   - `"message"` - User or assistant messages
   - `"function_call"` - Tool/function invocations
   - `"function_call_output"` - Tool/function results
   - `"agent_handoff"` - Agent transitions
3. **Message properties**:
   - `item.role` - "user" or "assistant"
   - `item.text_content` - The actual text
   - `item.interrupted` - Boolean indicating if message was interrupted

## Testing Steps

1. **Deploy the updated agent**:
   ```bash
   cd /Users/justinkroeger/agent-starter-python
   # Your deploy command
   ```

2. **Run a test interview** (5-10 exchanges minimum)

3. **Check the agent logs** - you should now see:
   ```
   ✅ Found session.history.items
     Total items count: 16
     [0] assistant: Good afternoon. Please state your name as it appears...
     [1] user: My name is John Smith...
     [2] assistant: Thank you. What is the purpose of your visit to the...
     [3] user: I will be studying computer science at Stanford...
     ...
   ✅ Extracted 14 conversation messages
   📊 Session report built with 14 conversation items
   ```

4. **Check the Next.js API logs** - you should see:
   ```
   📝 Processing 14 conversation items...
   💾 Saving 14 transcript segments...
   ✅ Saved 14 transcript segments
   🤖 Generating AI report based on transcript...
   ```

5. **Verify in the database**:
   - `TranscriptSegment` table should have records for the interview
   - `InterviewReport` table should have a generated report
   - Credits should be properly deducted (or not) based on classification

## Expected Behavior After Fix

### Successful Interview Flow:
1. ✅ Agent and user have conversation
2. ✅ Conversation stored in `session._report['chat_history']`
3. ✅ When session ends, `send_session_report()` extracts `chat_history`
4. ✅ Sends payload with populated `history.items[]` to Next.js API
5. ✅ API saves transcript segments to database
6. ✅ AI classification runs on transcript
7. ✅ Credits deducted if interview was successful
8. ✅ AI report generated and saved

### Current Status:
- ✅ Identified the correct LiveKit Agent SDK API
- ✅ Agent code updated to use `session.history.items`
- ✅ Syntax validated
- ⏳ **Ready for deployment and testing**

## Known Limitations

### Timestamps
With this approach, **all timestamps will initially be `0`** because:
- The `chat_history` object structure is still unknown (needs testing to see what attributes it has)
- We're setting `start_time: 0` and `end_time: 0` for all messages

### Options for Adding Timestamps (Future Enhancement):
1. **Inspect history items for timing** - check if `item` has timestamp attributes
2. **Use the `events` array** - check if events in session report have timing
3. **Parse from STT/TTS metrics** - logs show timing for each utterance
4. **Accept 00:00 timestamps** - focus on getting transcripts working first
5. **Check LiveKit docs** - look for timing info in `ConversationItem` or similar classes

## Files Modified

- `/Users/justinkroeger/agent-starter-python/src/agent.py`
  - Updated `send_session_report()` function
  - Fixed session report access (use closure instead of undefined global)
  - Added extensive debug logging
  - Extract conversation from `session._report['chat_history']`

## Related Documentation

- `docs/implementation/TRANSCRIPT_TIMESTAMPS_LIVEKIT.md` - Previous attempt using manual tracking
- `docs/agent/AGENT_CHANGES_COMPLETE.md` - Overall agent architecture
- `docs/livekit/TRANSCRIPT_CAPTURE.md` - Transcript capture overview

## Next Steps

1. **Deploy agent with this fix**
2. **Run test interview**
3. **Analyze new logs** to understand `chat_history` structure
4. **Add timestamp extraction** if timing info is available in `chat_history`
5. **Update docs** with findings

---

**Date**: 2026-01-26  
**Issue**: Empty session history causing no transcripts/reports  
**Status**: Fixed (awaiting deployment)  
**Priority**: High (blocks core functionality)

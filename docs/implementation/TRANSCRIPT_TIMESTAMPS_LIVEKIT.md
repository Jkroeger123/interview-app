# Transcript Timestamps with LiveKit TTS-Aligned Transcriptions

**Issue:** Interview transcripts showing all timestamps as `00:00` instead of actual conversation timing  
**Solution:** Use LiveKit's built-in `use_tts_aligned_transcript` feature and `transcription_node` method  
**Date:** January 2026  
**Status:** ✅ Implemented

---

## 🎯 Approach

Instead of manually tracking conversation timing, we leverage **LiveKit's built-in timing features**:

1. **TTS-aligned transcriptions** - Provides word-level timing via `TimedString` objects
2. **`transcription_node` method** - Captures timing as text flows through the agent
3. **`conversation_item_added` event** - Tracks user speech as it's added to history

---

## 🔧 Implementation

### 1. Enable TTS-Aligned Transcripts

**File:** `agent-starter-python/src/agent.py`

```python
session = AgentSession(
    stt="assemblyai/universal-streaming:en",
    llm="openai/gpt-4.1",
    tts=tts_instance,
    turn_detection=MultilingualModel(),
    vad=ctx.proc.userdata["vad"],
    preemptive_generation=True,
    use_tts_aligned_transcript=True,  # ✅ Enable timing information
)
```

### 2. Implement `transcription_node` in Assistant

This method receives timed string objects with `start_time` and `end_time` for each word/chunk. We use duck typing (checking for attributes) instead of explicit type hints since `TimedString` may not be directly importable:

```python
from typing import AsyncIterable, AsyncGenerator

class Assistant(Agent):
    # ... existing code ...
    
    async def transcription_node(
        self, text: AsyncIterable, model_settings
    ) -> AsyncGenerator:
        """Capture timing information from TTS-aligned transcriptions"""
        global _conversation_history, _time_elapsed
        
        collected_text = ""
        start_time_val = None
        end_time_val = None
        
        async for chunk in text:
            # Check if chunk has timing attributes (duck typing)
            if hasattr(chunk, 'start_time') and hasattr(chunk, 'end_time'):
                # Track timing from timed string objects
                if start_time_val is None:
                    start_time_val = chunk.start_time
                end_time_val = chunk.end_time
                collected_text += str(chunk)
                logger.info(f"📝 Timed chunk: '{chunk}' ({chunk.start_time:.2f}s - {chunk.end_time:.2f}s)")
            else:
                # Regular string chunk
                collected_text += str(chunk)
            
            yield chunk  # Pass through to TTS
        
        # After collecting the full message, add to history
        if collected_text and start_time_val is not None and end_time_val is not None:
            elapsed_start = (_time_elapsed if _time_elapsed else 0) + start_time_val
            elapsed_end = (_time_elapsed if _time_elapsed else 0) + end_time_val
            
            _conversation_history.append({
                "role": "assistant",
                "text": collected_text.strip(),
                "start_time": elapsed_start,
                "end_time": elapsed_end,
            })
            logger.info(f"📊 Tracked agent message: {collected_text[:50]}... ({elapsed_start:.1f}s - {elapsed_end:.1f}s)")
```

**Note:** We use `hasattr()` to check for timing attributes rather than `isinstance()` with `TimedString`, as the type may not be directly available for import in all SDK versions.

### 3. Track User Speech with `conversation_item_added`

```python
@session.on("conversation_item_added")
def _on_conversation_item_added(item):
    """Track user speech with timing information"""
    global _conversation_history, _time_elapsed
    
    try:
        # Only track user messages (agent messages tracked in transcription_node)
        if hasattr(item, 'role') and item.role == "user":
            text = ""
            if hasattr(item, 'content'):
                if isinstance(item.content, list):
                    for block in item.content:
                        if hasattr(block, 'text'):
                            text += block.text + " "
                        elif isinstance(block, str):
                            text += block + " "
                elif isinstance(item.content, str):
                    text = item.content
            
            text = text.strip()
            if text:
                _conversation_history.append({
                    "role": "user",
                    "text": text,
                    "start_time": _time_elapsed,
                    "end_time": _time_elapsed,
                })
                logger.info(f"📊 Tracked user message: {text[:50]}... ({_time_elapsed:.1f}s)")
    except Exception as e:
        logger.error(f"❌ Error tracking conversation item: {e}")
```

### 4. Send Conversation History in Session Report

```python
async def send_session_report():
    """Send session report to Next.js API when session ends"""
    global _conversation_history
    
    # Build session report with our tracked conversation history (includes timestamps)
    session_report = {
        "room_name": ctx.room.name,
        "history": {
            "items": [
                {
                    "type": "message",
                    "role": msg["role"],
                    "content": [{"text": msg["text"]}],
                    "start_time": msg["start_time"],
                    "end_time": msg["end_time"],
                }
                for msg in _conversation_history
            ]
        },
        "timestamp": datetime.now().isoformat(),
    }
    
    # ... send to API ...
```

---

## 📊 Data Flow

```
1. User speaks → STT → conversation_item_added event
   └─> Track: { role: "user", text: "...", start_time: X, end_time: X }

2. Agent responds → LLM → TTS → transcription_node
   └─> Receives TimedString objects with word-level timing
   └─> Track: { role: "assistant", text: "...", start_time: Y, end_time: Z }

3. Interview ends → send_session_report
   └─> Send _conversation_history to Next.js API

4. API receives → session-report/route.ts
   └─> Extracts start_time/end_time from each item
   └─> Saves to TranscriptSegment table

5. Report generation → openai-report-generator.ts
   └─> Formats transcript with timestamps: "[MM:SS] Speaker: text"
   └─> OpenAI generates timestamped feedback

6. UI displays → ai-analysis-card.tsx
   └─> Shows feedback timeline with accurate timestamps
```

---

## 🧪 Testing

### 1. Start a Test Interview

```bash
cd /Users/justinkroeger/agent-starter-python
python src/agent.py dev
```

### 2. Check Agent Logs

Look for these log messages:

```
📝 TimedString chunk: 'Hello' (0.00s - 0.50s)
📝 TimedString chunk: 'how' (0.50s - 0.75s)
📊 Tracked agent message: Hello how are you... (0.0s - 2.5s)
📊 Tracked user message: I'm doing well... (3.2s)
```

### 3. Complete Interview & Check Report

- End the interview
- Check agent logs for: `📊 Session report built with X conversation items`
- View the report in the UI
- Verify timestamps show actual times (not `00:00`)

### 4. Expected Results

**Before:**
```
[00:00] Officer: Good morning
[00:00] Applicant: Good morning
[00:00] Officer: Please state your name
```

**After:**
```
[00:05] Officer: Good morning
[00:08] Applicant: Good morning
[00:12] Officer: Please state your name
[00:15] Applicant: My name is John Smith
```

---

## 🔑 Key Benefits

1. **Word-level accuracy** - `TimedString` provides precise timing for each word
2. **No manual tracking** - LiveKit handles the complexity
3. **Synchronized** - Transcriptions match actual speech timing
4. **Reliable** - Built into the LiveKit SDK, well-tested

---

## 📚 References

- [LiveKit Docs: Text & Transcriptions](https://docs.livekit.io/agents/multimodality/text.md)
- [TTS-aligned transcriptions](https://docs.livekit.io/agents/multimodality/text.md#tts-aligned-transcriptions)
- [conversation_item_added event](https://docs.livekit.io/reference/other/events.md#conversation_item_added)

---

## ⚠️ Notes

- **TTS provider support**: Currently only Cartesia and ElevenLabs support word-level timing
- **Fallback**: For other providers (including LiveKit Inference), timing is sentence-level
- **Experimental**: The `transcription_node` API is experimental and may change in future SDK versions
- **Duck typing**: We use `hasattr()` instead of `isinstance(chunk, TimedString)` because `TimedString` may not be directly importable depending on SDK version
- **Type hints**: Generic `AsyncIterable` and `AsyncGenerator` are used instead of explicit `TimedString` type hints for compatibility

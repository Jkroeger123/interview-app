# Transcript Timestamps Fix

**Issue:** Interview transcripts showing all timestamps as `00:00` instead of actual conversation timing  
**Date:** January 2026  
**Status:** ✅ Fixed

---

## 🐛 The Problem

1. **Missing Timestamps:** All transcript segments showed `00:00` in the feedback/report UI
2. **Root Cause:** Agent wasn't sending conversation history with timing information
3. **Impact:** Users couldn't see when specific exchanges happened during the interview

---

## ✅ The Solution

### Changes Made

#### 1. **Python Agent (`agent-starter-python/src/agent.py`)**

**Added conversation tracking:**
```python
# Global variables for tracking
_conversation_history = []  # Track conversation with timestamps
_last_message_time = 0  # Track when the last message ended

# Event listeners to track conversation
@session.on("user_speech_committed")
def on_user_speech(msg):
    # Track user messages with timestamps
    _conversation_history.append({
        "role": "user",
        "text": text,
        "start_time": start_time,
        "end_time": end_time,
    })

@session.on("agent_speech_committed")
def on_agent_speech(msg):
    # Track agent messages with timestamps
    _conversation_history.append({
        "role": "assistant",
        "text": text,
        "start_time": start_time,
        "end_time": end_time,
    })
```

**Added session report function:**
```python
async def send_session_report(room_name: str, interview_id: str = None):
    """Send conversation history with timestamps to Next.js API"""
    session_report = {
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
        }
    }
    
    # Send to /api/interviews/session-report
    await client.post(api_url, json=payload)
```

**Hooked up session report sending:**
- Called when user ends interview (clicks "End Interview")
- Called when user disconnects (closes browser/loses connection)
- Called before agent disconnects from room

#### 2. **Next.js API (`app/api/interviews/session-report/route.ts`)**

**Already configured to receive timestamps:**
```typescript
// Extract timing if available
const startTime = item.start_time || 0;
const endTime = item.end_time || startTime;

transcriptSegments.push({
  interviewId: interview.id,
  speaker: role === "user" ? "user" : "agent",
  text: text,
  startTime: startTime,  // Now populated!
  endTime: endTime,       // Now populated!
});
```

---

## 📊 How It Works Now

### Flow:

```
1. Interview starts
   ↓
2. Agent tracks _time_elapsed from frontend updates
   ↓
3. User speaks → on_user_speech_committed event
   → Track: {role: "user", text: "...", start_time: X, end_time: Y}
   ↓
4. Agent responds → on_agent_speech_committed event
   → Track: {role: "assistant", text: "...", start_time: Y, end_time: Z}
   ↓
5. Interview ends (user clicks end OR closes browser)
   ↓
6. send_session_report() called
   → Sends _conversation_history with all timestamps
   ↓
7. Next.js API receives session report
   → Extracts start_time and end_time from each message
   → Saves to TranscriptSegment table
   ↓
8. UI displays transcript with proper timestamps
   → "00:15 - User: Why do you want to study in the US?"
   → "00:32 - Agent: Thank you for that answer..."
```

---

## 🧪 Testing

### Test Procedure:

1. **Start Interview:**
   - Configure a 5-minute interview
   - Start the session

2. **Have Conversation:**
   - Answer at least 3-4 questions
   - Let the interview run for 2-3 minutes

3. **End Interview:**
   - Click "End Interview" button

4. **Check Transcript:**
   - Go to interview report
   - View transcript
   - **Verify:** Timestamps show actual elapsed time (e.g., "00:15", "00:32", "01:45")
   - **Verify:** Timestamps increase sequentially
   - **Verify:** No more "00:00" timestamps

### Expected Results:

| Time | Speaker | Message |
|------|---------|---------|
| 00:05 | Agent | "Good morning. Please state your full name..." |
| 00:12 | User | "My name is John Smith..." |
| 00:18 | Agent | "Thank you. Why do you want to study..." |
| 00:45 | User | "I want to pursue a degree in..." |
| 01:15 | Agent | "Very good. How will you fund..." |

---

## 🔧 Technical Details

### Timestamp Format

- **Units:** Seconds (Float)
- **Origin:** Time elapsed since interview start
- **Example:** `45.5` = 45.5 seconds into the interview
- **Display:** Formatted as `MM:SS` in UI (e.g., "00:45")

### Data Structure

**Agent sends:**
```json
{
  "roomName": "interview_user_12345",
  "endedBy": "user",
  "sessionReport": {
    "history": {
      "items": [
        {
          "type": "message",
          "role": "user",
          "content": [{"text": "My name is John Smith"}],
          "start_time": 12.3,
          "end_time": 15.8
        },
        {
          "type": "message",
          "role": "assistant",
          "content": [{"text": "Thank you, John..."}],
          "start_time": 15.8,
          "end_time": 22.1
        }
      ]
    }
  }
}
```

**Database stores:**
```prisma
model TranscriptSegment {
  id          String   @id @default(uuid())
  interviewId String
  speaker     String   // "user" or "agent"
  text        String
  startTime   Float    // 12.3 (seconds)
  endTime     Float    // 15.8 (seconds)
  createdAt   DateTime @default(now())
}
```

---

## 🐛 Troubleshooting

### Issue: Still seeing 00:00 timestamps

**Possible Causes:**
1. Agent not restarted after code changes
2. Session report not being sent
3. Network error sending report

**Solutions:**
1. Restart Python agent: `python src/agent.py dev`
2. Check agent logs for "📤 Sending session report"
3. Check agent logs for "✅ Session report sent successfully"
4. Check Next.js logs for "📥 Session report POST received"

### Issue: Timestamps not sequential

**Possible Cause:** Time tracking not updating correctly

**Solution:**
- Check that frontend is sending time_update messages every minute
- Verify `_time_elapsed` is being updated in `on_data_received` handler

### Issue: Missing messages in transcript

**Possible Cause:** Event listeners not firing

**Solution:**
- Check agent logs for "📝 Tracked user speech" and "📝 Tracked agent speech"
- Verify session event listeners are registered (`✅ Conversation tracking enabled`)

---

## 📝 Related Files

- **Agent:** `/Users/justinkroeger/agent-starter-python/src/agent.py`
  - Lines 37-39: Global variables for conversation tracking
  - Lines 44-99: `send_session_report()` function
  - Lines 1063-1101: Event listeners for tracking conversation
  - Lines 870-890: Session report sending on disconnect

- **API:** `app/api/interviews/session-report/route.ts`
  - Lines 126-136: Timestamp extraction and segment creation

- **Database:** `prisma/schema.prisma`
  - Lines 126-138: TranscriptSegment model with startTime/endTime

---

## ✅ Verification Checklist

After deploying this fix:

- [ ] Restart Python agent
- [ ] Complete a test interview (2-3 minutes minimum)
- [ ] End interview normally
- [ ] Check transcript in report
- [ ] Verify timestamps show actual times (not 00:00)
- [ ] Verify timestamps increase sequentially
- [ ] Test with different interview durations (5, 10, 15 min)
- [ ] Test user-ended interviews
- [ ] Test browser-closed interviews

---

**Status:** ✅ Implemented  
**Testing:** Pending user verification  
**Last Updated:** January 2026


# Graceful Interview Disconnect

## Overview

This document explains how the interview gracefully ends when a user hangs up, ensuring that LiveKit's egress recording completes properly.

## The Problem

Previously, when a user clicked the "Hang Up" button:
1. The room would disconnect immediately
2. The interview status wasn't updated in the database
3. LiveKit's egress (recording) might not complete properly
4. The agent would remain in the room

## The Solution

### 1. User Clicks Hang Up

**File**: `components/voice-call/call-control-bar.tsx`

When the hang up button is clicked, `handleDisconnect()` now:

1. **Signals the Agent**: Sends a data message to the agent telling it to leave:
   ```typescript
   await room.localParticipant.publishData(
     JSON.stringify({
       type: "end_interview",
       reason: "user_ended"
     })
   );
   ```

2. **Waits 1 Second**: Gives the agent time to process and disconnect gracefully

3. **Updates Database**: Calls `endInterviewByRoomName()` to update the interview status:
   - Sets `status` to `"completed"`
   - Records `endedAt` timestamp
   - Calculates and stores `duration` in seconds

4. **Disconnects User**: Finally disconnects the user from the room

### 2. Agent Receives Signal

**File**: `agent-starter-python/src/agent.py`

The agent's `on_data_received()` handler:

```python
elif message.get('type') == 'end_interview':
    logger.info("🔴 Received end_interview signal from user")
    logger.info("🔴 Agent leaving room to close session gracefully")
    ctx.room.disconnect()
```

When the agent receives the `end_interview` signal, it:
1. Logs the event
2. Disconnects from the room immediately

### 3. Room Closes & Egress Completes

Once both the user and agent have left:
1. **LiveKit closes the room**
2. **Egress finishes recording** and uploads to S3
3. **Webhook is sent** to `/api/webhooks/livekit` with `egress_ended` event
4. **AI report is generated** automatically

## Benefits

✅ **Clean Recording**: Egress completes properly with both participants disconnected
✅ **Database Accuracy**: Interview status, duration, and end time are recorded
✅ **No Orphaned Rooms**: Agent doesn't stay in the room after user leaves
✅ **Better UX**: User sees "Interview ended" toast notification
✅ **Audit Trail**: Complete record of interview lifecycle in database

## Flow Diagram

```
User Clicks Hang Up
    ↓
Send "end_interview" signal to Agent
    ↓
Wait 1 second for Agent to process
    ↓
Agent Disconnects from Room
    ↓
Update Interview in Database (status: completed, duration, endedAt)
    ↓
User Disconnects from Room
    ↓
LiveKit Closes Room (all participants gone)
    ↓
Egress Finishes & Uploads to S3
    ↓
LiveKit Sends egress_ended Webhook
    ↓
AI Report Generated Automatically
```

## Testing

To verify this works:

1. Start an interview
2. Have a short conversation with the agent
3. Click the "Hang Up" button (red phone icon)
4. Check logs for:
   - ✅ "Sent end_interview signal to agent"
   - ✅ "Agent leaving room to close session gracefully"
   - ✅ "Interview status updated"
   - ✅ "Interview ended" toast
5. Wait ~30 seconds for egress to finish
6. Check LiveKit webhook logs for `egress_ended` event
7. Verify recording appears in S3 bucket
8. Check `/reports` page - interview should show as "completed" with correct duration

## Database Changes

### New Server Action: `endInterviewByRoomName()`

**File**: `server/interview-actions.ts`

```typescript
export async function endInterviewByRoomName(roomName: string)
```

- Finds interview by room name
- Calculates duration from start time
- Updates status to "completed"
- Records end time and duration
- Returns updated interview record

## Related Files

- `components/voice-call/call-control-bar.tsx` - Hang up button logic
- `server/interview-actions.ts` - Database update logic
- `agent-starter-python/src/agent.py` - Agent signal handling
- `app/api/webhooks/livekit/route.ts` - Egress webhook handler

## Future Enhancements

- Add timeout if agent doesn't leave within 3 seconds
- Show "Ending interview..." loading state during the 1-second wait
- Store partial transcripts even if egress fails
- Add retry logic for database updates


# Interview Completion Flow

## 🔄 User Journey

```
1. Configure Interview → 2. Start Interview → 3. Agent Ends Session → 4. Completion Page
   (configure-interview)     (interview-ready)     (end_interview tool)     (interview-complete)
```

## 📋 How It Works

### 1. **Agent Ends Interview**
When the agent calls the `end_interview` tool:
```python
# agent.py
@function_tool
async def end_interview(self, goodbye_message: str):
    # Say goodbye message
    _session_instance.say(goodbye_message, allow_interruptions=False)
    
    # Wait for speech to complete
    await asyncio.sleep(estimated_duration)
    
    # Disconnect room
    await _room_context.room.disconnect()
```

### 2. **Frontend Detects Disconnection**
The `CallInterface` component listens for the `RoomEvent.Disconnected` event:
```typescript
// call-interface.tsx
useEffect(() => {
  const onDisconnected = () => {
    if (onDisconnect) {
      onDisconnect(); // Routes to completion page
    }
  };
  
  room.on(RoomEvent.Disconnected, onDisconnected);
}, [room, onDisconnect]);
```

### 3. **Route to Completion Page**
The `interview-ready` page provides the callback:
```typescript
// interview-ready/page.tsx
<CallInterface 
  config={config} 
  agentConfig={agentConfig} 
  autoStart={true}
  onDisconnect={() => router.push("/interview-complete")}
/>
```

### 4. **Show Completion UI**
User sees a friendly completion page with options to:
- ✅ Practice again
- 🏠 Return home

## 🎨 Completion Page Features

- **Clean Design**: Card-based UI with success indicator
- **Clear Next Steps**: Explains what happens after the interview
- **Action Buttons**: 
  - "Practice Again" → `/configure-interview`
  - "Return Home" → `/`

## 🔍 Key Files Modified

1. **`/app/interview-complete/page.tsx`** (NEW)
   - Beautiful completion page with success message
   - Action buttons for next steps

2. **`/components/voice-call/call-interface.tsx`**
   - Updated to call `onDisconnect` callback when room disconnects
   - Falls back to reconnect UI if no callback provided

3. **`/app/interview-ready/page.tsx`**
   - Routes to `/interview-complete` instead of home on disconnect

## 🧪 Testing

1. Start an interview from `/interview-ready`
2. During interview, ask agent to end session (e.g., "I'm done")
3. Agent should:
   - Say goodbye message
   - Disconnect after speech completes
4. Frontend should:
   - Detect disconnection
   - Route to `/interview-complete`
   - Show completion page

## 📊 Event Flow Diagram

```
┌─────────────────┐
│  Agent calls    │
│ end_interview() │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Says goodbye  │
│   message       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Waits for speech│
│  to complete    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Disconnects    │
│     room        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   RoomEvent     │
│  .Disconnected  │
│    fires        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  onDisconnect() │
│   callback      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  router.push    │
│ (/interview-    │
│   complete)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Completion    │
│   Page Shown    │
└─────────────────┘
```

## ✨ Benefits

1. **Professional UX**: Clean end to interview experience
2. **Clear Communication**: User knows interview has ended
3. **Easy Re-engagement**: One click to practice again
4. **Flexible**: Works with agent-initiated or user-initiated disconnects


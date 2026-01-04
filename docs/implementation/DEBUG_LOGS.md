# Debugging Connection Issues - Log Guide

## 🎯 What to Look For

When you click "Join Interview" and it immediately disconnects, watch the browser console for this sequence:

### ✅ Normal Flow (Should Look Like This)

```
🚀 Starting interview session
📺 Rendering CallInterface with auto-start
🔵 ROOM CREATED: Room {...}
🔵 RENDER: CallInterface { sessionStarted: true, autoStart: true, roomState: "disconnected", mountAge: 0 }
🟢 EFFECT: Setting up room event listeners
🟢 EFFECT: Connection effect triggered { sessionStarted: true, roomState: "disconnected", connecting: false }
🟢 CONNECTING: Starting connection sequence
🔑 fetchConnectionDetails called { force: false, sessionId: "abc123..." }
🔵 Using cached connection details OR 🟢 Fetching NEW connection details from API
✅ API SUCCESS: Got connection details { roomName: "interview_user_xxx_abc123", ... }
🔑 Got connection details: { serverUrl: "...", roomName: "...", mountAge: 50 }
🎤 Microphone enabled
🟡 CONNECTING: { roomState: "connecting", mountAge: 100 }
🟢 CONNECTED: { roomState: "connected", roomName: "interview_user_xxx_abc123", mountAge: 500 }
✅ Connection sequence completed successfully
🏁 Connection sequence finished
```

### 🔴 React Strict Mode Issue (Most Likely)

Look for **DOUBLE MOUNT** pattern:
```
🚀 Starting interview session
📺 Rendering CallInterface with auto-start

// FIRST MOUNT
🔵 ROOM CREATED: Room {...}
🟢 EFFECT: Setting up room event listeners
🟢 EFFECT: Connection effect triggered
🟢 CONNECTING: Starting connection sequence
🔑 fetchConnectionDetails called

// STRICT MODE CLEANUP (This kills the connection!)
🔴 CLEANUP: Connection effect cleanup { roomState: "connecting", mountAge: 50 }
🔴 CLEANUP: Disconnecting room { roomState: "connecting" }
🔴 CLEANUP: Removing room event listeners

// SECOND MOUNT (Immediate remount)
🔵 RENDER: CallInterface (mountAge: 0)
🟢 EFFECT: Setting up room event listeners
🟢 EFFECT: Connection effect triggered
🔴 DISCONNECTED: { reason: undefined, mountAge: 100 } ← IMMEDIATE DISCONNECT!
🔴 Calling onDisconnect callback (routing to completion)
🏁 onDisconnect callback fired, routing to completion page
```

**Key indicators:**
- Two `ROOM CREATED` logs (or one, but cleanup runs very quickly)
- `CLEANUP: Disconnecting room` happens while `roomState: "connecting"`
- `mountAge` resets to 0 after cleanup
- `DISCONNECTED` fires almost immediately after second mount

### 🔴 Race Condition Issue

Look for **MULTIPLE API CALLS**:
```
🟢 CONNECTING: Starting connection sequence
🔑 fetchConnectionDetails called { sessionId: "abc123" }
🟢 Fetching NEW connection details from API { sessionId: "abc123" }
✅ API SUCCESS: Got connection details { roomName: "interview_user_xxx_abc123" }

// Unexpected second call!
🔑 fetchConnectionDetails called { sessionId: "def456" } ← DIFFERENT SESSION ID!
🟢 Fetching NEW connection details from API { sessionId: "def456" }
✅ API SUCCESS: Got connection details { roomName: "interview_user_xxx_def456" } ← DIFFERENT ROOM!

🔴 DISCONNECTED: { reason: ..., mountAge: 500 }
```

**Key indicators:**
- Multiple `fetchConnectionDetails` calls
- Different `sessionId` values
- Different `roomName` values
- Connection to first room gets killed when second connection starts

### 🔴 Agent Timeout Issue

```
🟢 CONNECTED: { roomState: "connected", mountAge: 500 }
... (20 seconds pass)
🔴 DISCONNECTED: { reason: "Interview session ended", mountAge: 20500 }
```

**Key indicator:**
- `mountAge` is around 20000ms (20 seconds) at disconnect
- Means agent didn't join within 20 second timeout

## 🔍 What to Check

### 1. React Strict Mode
**File:** `app/layout.tsx`

Look for:
```typescript
<React.StrictMode>
  {children}
</React.StrictMode>
```

If present, **temporarily comment it out** and test:
```typescript
{/* <React.StrictMode> */}
  {children}
{/* </React.StrictMode> */}
```

### 2. Component Mount Count
Count how many times you see:
- `🔵 ROOM CREATED` - Should be **1 time only**
- `🔴 CLEANUP: Connection effect cleanup` - Should be **0 times** before successful connection

### 3. Session ID Consistency
Check if `sessionId` stays the same:
```
🔑 fetchConnectionDetails called { sessionId: "abc123..." }
🔑 Got connection details { sessionId: "abc123..." }  ← Should match!
```

### 4. Room State Transitions
Normal flow:
```
disconnected → connecting → connected
```

Problematic flow:
```
disconnected → connecting → disconnected (within 100ms)
```

## 📊 How to Test

1. **Open browser DevTools** (F12)
2. **Go to Console tab**
3. **Filter by emoji** if needed (search for 🔴 🟢 🔵)
4. **Click "Join Interview"**
5. **Watch the logs in real-time**
6. **Copy ALL logs** and share them

## 🎬 What to Do After Seeing Logs

### If it's React Strict Mode:
→ We'll add a cleanup guard to prevent disconnect during initial mount

### If it's race condition:
→ We'll add a connection lock to prevent duplicate connections

### If it's agent timeout:
→ We'll investigate why agent isn't joining quickly enough

### If something else:
→ Share the logs and we'll diagnose together!

## 💡 Quick Checks

**Before sharing logs, check:**
- [ ] Is this development or production?
- [ ] How long between "Join" click and disconnect? (instant = <100ms)
- [ ] Does camera light stay on after disconnect?
- [ ] Does reconnect work on second try?
- [ ] Do you see the interview completion page or reconnect screen?


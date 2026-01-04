# Testing Guide - New Imperative Connection Architecture

## ✅ What to Test

### 1. **Basic Connection Flow**

**Steps:**
1. Navigate to `/interview-ready`
2. Configure interview settings
3. Click "Start Interview"
4. **Expected:** Interview starts immediately, no disconnects

**Watch console for:**
```
🚀 Auto-starting connection (autoStart=true)
🟢 CONNECTING: Starting connection sequence (user-initiated)
🎤 Microphone enabled
🔑 Got connection details
🟢 CONNECTED
✅ Connection sequence completed successfully
```

**Should NOT see:**
- ❌ Multiple `ROOM CREATED` logs
- ❌ `CLEANUP: Disconnecting room` while connecting
- ❌ `DISCONNECTED` right after connecting

### 2. **React Strict Mode Test**

**Before running test:**
- Ensure React Strict Mode is ENABLED in `app/layout.tsx`:
  ```typescript
  <React.StrictMode>
    {children}
  </React.StrictMode>
  ```

**Steps:**
1. Open DevTools Console
2. Start interview
3. **Expected:** Connection works despite Strict Mode double-mounting

**Console should show:**
```
🟢 EFFECT: Setting up room event listeners (ONCE)
🚀 Auto-starting connection
🟢 CONNECTING: Starting connection sequence
⚠️ Already connected/connecting, ignoring request ← This is GOOD!
🟢 CONNECTED
```

**Key:** You might see connection called twice, but the guard prevents actual double-connection.

### 3. **Hot Module Reload Test**

**Steps:**
1. Start interview (connect successfully)
2. Make a small code change (e.g., add a console.log)
3. Save file (triggers HMR)
4. **Expected:** Connection stays alive, no disconnect

**Console should NOT show:**
- ❌ `🔴 CLEANUP: Disconnecting room`
- ❌ `WebSocket closed before connection established`

### 4. **Manual "Join Interview" Button Test**

**Steps:**
1. Navigate to `/call` (if you have a page without autoStart)
2. Click "Enter Interview Room" button
3. **Expected:** Connects on button click

**Console:**
```
🟢 CONNECTING: Starting connection sequence (user-initiated)
🎤 Microphone enabled
🔑 Got connection details
🟢 CONNECTED
```

### 5. **Reconnect Test**

**Steps:**
1. Start interview
2. Manually disconnect (via browser disconnect or end interview)
3. Click "Reconnect to Interview" button
4. **Expected:** Reconnects successfully

**Console:**
```
🔴 DISCONNECTED
🔄 Retry button clicked
🟢 CONNECTING: Starting connection sequence (user-initiated)
🟢 CONNECTED
```

### 6. **Double-Click Protection Test**

**Steps:**
1. Click "Enter Interview Room" button
2. IMMEDIATELY click it again (before connection completes)
3. **Expected:** Only one connection attempt

**Console:**
```
🟢 CONNECTING: Starting connection sequence (user-initiated)
⚠️ Already connected/connecting, ignoring request ← This is GOOD!
```

### 7. **Error Handling Test**

**Steps:**
1. Temporarily disable WiFi
2. Click "Enter Interview Room"
3. **Expected:** Shows error toast, "Reconnect" button appears

**Console:**
```
🟢 CONNECTING: Starting connection sequence
❌ CONNECTION ERROR: {...}
🏁 Connection sequence finished
```

### 8. **Interview End Flow Test**

**Steps:**
1. Start interview
2. Tell agent "I'm done, thank you"
3. Agent calls `end_interview` tool
4. **Expected:** 
   - Agent says goodbye
   - Room disconnects after ~3-5 seconds
   - Routes to `/interview-complete`

**Console:**
```
🔴 DISCONNECTED: {reason: ..., mountAge: ...}
🔴 Calling onDisconnect callback (routing to completion)
🏁 onDisconnect callback fired, routing to completion page
```

## 🐛 What Problems Are Fixed?

### ✅ Fixed Issues

| Issue | Before | After |
|-------|--------|-------|
| **Strict Mode** | Connection killed on remount | Immune to double-mount |
| **HMR** | Disconnect during dev | Connection persists |
| **Double-connect** | Possible with rapid clicks | Guarded by ref |
| **Cleanup timing** | Unpredictable | Only on unmount |
| **Error handling** | Lost in Promise chain | Clear try/catch |

### 🎯 Key Improvements

1. **Predictable**: Connection only happens when explicitly called
2. **Debuggable**: Clear call stack, no "magic" side effects
3. **Stable**: No unexpected disconnects during development
4. **User-friendly**: Clear error messages and retry options

## 📊 Success Criteria

**All tests pass if:**
- ✅ No unexpected disconnects
- ✅ HMR doesn't affect connection
- ✅ Strict Mode doesn't cause issues
- ✅ Only ONE connection per button click
- ✅ Reconnect works
- ✅ Error handling is clear
- ✅ Interview completion flow works

## 🚨 Known Behaviors (Not Bugs!)

### Normal Console Messages

**During Development:**
- You may see TWO `Setting up room event listeners` logs (Strict Mode)
- This is FINE - only cleanup on unmount matters

**During HMR:**
- You'll see component re-render
- Connection should NOT disconnect
- Event listeners may re-attach (harmless)

**During Connection:**
- `publishing track` messages from LiveKit (normal)
- Microphone permission prompts (expected)

## 📞 If Something Goes Wrong

1. **Check console for:**
   - Red errors (❌)
   - Unexpected cleanup logs
   - Multiple connection attempts

2. **Common issues:**
   - **"WebSocket closed"** → Old issue, should be fixed
   - **"Already connecting"** → Good! Guard working
   - **"CONNECTION ERROR"** → Check network, API keys

3. **Debugging:**
   - Enable verbose logs (already added)
   - Check LiveKit dashboard
   - Check network tab for API calls
   - Verify agent is deployed

## 🎉 Expected Outcome

**Bottom line:** 
- Click "Join Interview" → Connects successfully
- No unexpected disconnects
- Works in development (with HMR and Strict Mode)
- Works in production
- Clean error handling

If all tests pass, the refactor is successful! 🚀


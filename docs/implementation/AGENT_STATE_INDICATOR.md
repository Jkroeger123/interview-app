# Agent State Indicator

**Feature:** Visual indicator showing real-time agent state during interviews  
**Date:** January 2026  
**Purpose:** Prevent awkward overlaps and improve user experience

---

## 🎯 Overview

The Agent State Indicator is a visual component that displays the current state of the AI interviewer agent during an active interview session. It helps users know when to speak, when to listen, and when the agent is processing their response.

---

## 📊 Agent States

The indicator displays three distinct states:

### 1. **🟢 Listening** (Green)
- **Icon:** Microphone with pulsing animation
- **Label:** "Listening"
- **Helper Text:** "You can speak now"
- **Meaning:** The agent is actively listening for user input
- **User Action:** **Speak now** - this is your turn to talk

### 2. **🟡 Thinking** (Amber/Yellow)
- **Icon:** Brain icon (static, no animation)
- **Label:** "Thinking"
- **Helper Text:** "Please wait..."
- **Meaning:** The agent is processing your response (STT → LLM → TTS)
- **User Action:** **Wait** - don't speak yet, let the agent process

### 3. **🔵 Speaking** (Blue)
- **Icon:** Volume icon with pulsing animation
- **Label:** "Speaking"
- **Helper Text:** "Please listen"
- **Meaning:** The agent is currently speaking/asking a question
- **User Action:** **Listen** - don't interrupt, wait for the agent to finish

---

## 🎨 Visual Design

### Full Indicator (Default)
- Badge with icon, label, and helper text
- Color-coded background, border, and text
- Smooth transitions between states
- Pulsing animation for active states (listening/speaking)
- Shadow for depth

### Compact Version (Optional)
- Circular badge with just the icon
- Minimal space footprint
- Same color coding and animations
- Useful for smaller UI spaces

---

## 📍 Location in UI

The agent state indicator is displayed:

1. **During Active Interview:**
   - Below the "Interview In Progress" badge
   - Top center of the screen
   - Fixed position, always visible
   - Z-index: 30 (above video, below modals)

2. **Not Displayed:**
   - Before the interview starts
   - When agent is disconnected
   - When agent is connecting (not fully initialized)

---

## 🔧 Technical Implementation

### Component Location
```
components/voice-call/agent-state-indicator.tsx
```

### Key Technologies
- **LiveKit React Hooks:** `useVoiceAssistant()` for agent state
- **Tailwind CSS:** Styling and animations
- **Lucide React:** Icons (Mic, Brain, Volume2)
- **Shadcn/ui:** Badge component base

### State Detection
```typescript
const { state: agentState } = useVoiceAssistant();
// agentState: "disconnected" | "connecting" | "listening" | "thinking" | "speaking"
```

### Usage
```typescript
import { AgentStateIndicator } from "./agent-state-indicator";

// In your component:
<AgentStateIndicator />

// Or compact version:
<AgentStateIndicatorCompact />
```

---

## 🎭 State Transitions

### Typical Flow

```
connecting → listening → thinking → speaking → listening → ...
     ↓                                               ↑
disconnected ←──────────────────────────────────────┘
              (on interview end)
```

### User Journey Example

1. **Interview starts** → Indicator not shown (waiting for agent)
2. **Agent joins** → Shows "Interview In Progress"
3. **Agent ready** → 🟢 **Listening** ("You can speak now")
4. **User speaks** → 🟢 **Listening** (continues)
5. **User stops speaking** → 🟡 **Thinking** ("Please wait...")
6. **Agent responds** → 🔵 **Speaking** ("Please listen")
7. **Agent finishes** → 🟢 **Listening** ("You can speak now")
8. **Repeat steps 4-7** throughout interview
9. **Interview ends** → Indicator disappears

---

## ✨ Benefits

### 1. **Prevents Overlaps**
- Users know exactly when they can speak
- Reduces interruptions of the agent
- More natural conversation flow

### 2. **Clear Feedback**
- Visual confirmation that the agent heard them
- Shows when processing is happening
- Reduces user uncertainty

### 3. **Better UX**
- Less awkward pauses
- Users feel more confident
- Professional interview experience

### 4. **Accessibility**
- Color-coded states
- Text labels for clarity
- Icons for visual reinforcement
- Helper text for guidance

---

## 🎨 Customization

### Colors

Current color scheme:

| State | Primary | Background | Border | Text |
|-------|---------|------------|--------|------|
| Listening | `green-500` | `green-50` | `green-200` | `green-700` |
| Thinking | `amber-500` | `amber-50` | `amber-200` | `amber-700` |
| Speaking | `blue-500` | `blue-50` | `blue-200` | `blue-700` |

### Animations

- **Pulse:** Used for "listening" and "speaking" states
- **Duration:** 300ms transitions for smooth state changes
- **Tailwind:** `animate-ping` utility

### Size Variants

1. **Default:** Full badge with icon, label, and helper text
2. **Compact:** Icon-only in circular badge (not currently used)

To use compact version:
```typescript
<AgentStateIndicatorCompact />
```

---

## 🧪 Testing

### Manual Testing Checklist

- [ ] Indicator appears when agent joins
- [ ] Shows "Listening" when agent is ready
- [ ] Changes to "Thinking" when user stops speaking
- [ ] Shows "Speaking" when agent is talking
- [ ] Returns to "Listening" when agent finishes
- [ ] Disappears when interview ends
- [ ] Pulsing animation works for listening/speaking
- [ ] Color transitions are smooth
- [ ] Helper text is readable and helpful
- [ ] Responsive on mobile devices

### Test Scenarios

1. **Normal Interview Flow**
   - Start interview
   - Speak when "Listening" is shown
   - Observe state changes
   - Verify smooth transitions

2. **Edge Cases**
   - Quick back-and-forth conversation
   - Long pauses in conversation
   - Agent interrupted (should handle gracefully)
   - Network issues (may show disconnected)

---

## 🐛 Troubleshooting

### Indicator Not Showing

**Possible Causes:**
1. Agent hasn't fully connected yet
2. AgentState is "disconnected" or "connecting"
3. Interview hasn't started

**Solutions:**
- Wait for agent to fully join
- Check browser console for connection errors
- Verify LiveKit connection is active

### Wrong State Displayed

**Possible Causes:**
1. State updates lagging (network delay)
2. Agent not properly reporting state
3. LiveKit connection issues

**Solutions:**
- Check network connection
- Review agent logs
- Verify LiveKit agent is using latest version

### Animations Not Working

**Possible Causes:**
1. Tailwind animations not compiled
2. CSS conflicts
3. Browser compatibility

**Solutions:**
- Ensure `animate-ping` is in tailwind.config
- Check for CSS conflicts
- Test in different browsers

---

## 🔮 Future Enhancements

### Potential Improvements

1. **Audio Visualization**
   - Add waveform visualization when agent is speaking
   - Show volume meter when user is speaking

2. **Transcript Preview**
   - Show last thing agent said
   - Show what user just said (confirmation)

3. **Timer Integration**
   - Show how long agent has been speaking
   - Show user's speaking duration

4. **Custom Themes**
   - Allow users to customize colors
   - Dark mode optimization
   - Accessibility themes (high contrast)

5. **Mobile Optimization**
   - Smaller size for mobile screens
   - Different position on mobile
   - Touch-friendly design

6. **Analytics**
   - Track state transition times
   - Measure user overlap incidents
   - Optimize based on usage data

---

## 📝 Code Reference

### Main Component

```typescript:1:134:components/voice-call/agent-state-indicator.tsx
"use client";

import { useVoiceAssistant } from "@livekit/components-react";
import { Mic, Brain, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function AgentStateIndicator() {
  const { state: agentState } = useVoiceAssistant();

  // Don't show anything if agent is not connected yet
  if (agentState === "disconnected" || agentState === "connecting") {
    return null;
  }

  // State configuration with colors, icons, and helper text
  const stateConfig = { /* ... */ };

  // Render badge with icon, label, and helper text
  return (
    <div className="flex flex-col items-center gap-2">
      <Badge>{/* ... */}</Badge>
      <p>{config.helperText}</p>
    </div>
  );
}
```

### Integration

```typescript:136:153:components/voice-call/call-session.tsx
{/* Interview status indicator */}
{sessionStarted && interviewerJoined && (
  <div className="fixed top-20 left-1/2 -translate-x-1/2 z-30">
    <div className="flex flex-col items-center gap-3">
      {/* Interview In Progress Badge */}
      <div className="flex items-center gap-2 rounded-full bg-green-500/10 border border-green-500/20 px-4 py-2 backdrop-blur-sm">
        <CheckCircle2 className="size-4 text-green-600" />
        <span className="text-sm font-medium text-green-600">
          Interview In Progress
        </span>
      </div>
      {/* Agent State Indicator */}
      <AgentStateIndicator />
    </div>
  </div>
)}
```

---

## 📚 Related Documentation

- [LiveKit Setup](../livekit/LIVEKIT_SETUP.md) - LiveKit configuration
- [Agent Update Guide](../agent/AGENT_UPDATE_GUIDE.md) - Agent configuration
- [Interview Flow](../architecture/INTERVIEW_FLOW.md) - Overall interview flow

---

**Status:** ✅ Implemented and Active  
**Version:** 1.0  
**Last Updated:** January 2026


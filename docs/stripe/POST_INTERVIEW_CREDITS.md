# Post-Interview Credit Deduction System

## Overview

Credits are now deducted **AFTER** the interview completes, based on AI classification of interview success. This prevents charging users for technical failures, interruptions, or poor experiences.

## Philosophy

**Charge only for successful interviews where the user received value.**

- ✅ Real conversation with meaningful practice → Charge
- ❌ Technical failures or immediate disconnects → Don't charge
- ✅ User completed >50% and ended intentionally → Charge
- ❌ System errors or very short sessions → Don't charge

## Credit Flow

### Before Interview (Check Only)

```typescript
// app/api/livekit/connection-details/route.ts

// Check user has enough credits to start
if (userCredits < creditsPlanned) {
  return 402 Payment Required
}

// Don't deduct yet! Just record planned amount
await prisma.interview.create({
  creditsPlanned: 10,
  creditsDeducted: null, // Will be set after completion
  endedBy: null,         // Will be set when interview ends
})
```

### During Interview (Track Who Ends)

**User Ends:**
```typescript
// components/voice-call/call-control-bar.tsx
await endInterviewByRoomName(room.name, "user");
```

**Agent Ends:**
```python
# agent-starter-python/src/agent.py
@function_tool
async def end_interview(self):
    global _ended_by
    _ended_by = "agent"  # Track in agent
    await _room_context.room.disconnect()
```

**System/Error Ends:**
- Timeout, connection loss, etc. → `endedBy: "system"` or `"error"`

### After Interview (Classify & Deduct)

```typescript
// app/api/interviews/session-report/route.ts

// 1. Get transcript and metadata
const transcript = buildTranscriptFromSegments(segments);
const metadata = {
  plannedDurationMinutes: interview.creditsPlanned,
  actualDurationSeconds: duration,
  endedBy: interview.endedBy,
  transcriptWordCount: stats.wordCount,
  transcriptTurnCount: stats.turnCount,
};

// 2. Classify with AI
const classification = await classifyInterviewSuccess(transcript, metadata);

// 3. Deduct credits if successful
if (classification.shouldCharge) {
  await prisma.$transaction(async (tx) => {
    // Deduct from user balance
    await tx.user.update({
      where: { id: interview.userId },
      data: { credits: { decrement: interview.creditsPlanned } },
    });
    
    // Record in interview
    await tx.interview.update({
      where: { id: interview.id },
      data: {
        creditsDeducted: interview.creditsPlanned,
        chargeDecision: "charged",
        chargeReason: classification.reason,
      },
    });
    
    // Create ledger entry
    await tx.creditLedger.create({
      data: {
        userId: interview.userId,
        amount: -interview.creditsPlanned,
        balance: updatedUser.credits,
        type: "deduction",
        description: `Interview: ${interview.visaType} (${interview.creditsPlanned} min) - ${classification.reason}`,
        referenceId: interview.id,
      },
    });
  });
} else {
  // Not charging - mark as free
  await prisma.interview.update({
    where: { id: interview.id },
    data: {
      creditsDeducted: 0,
      chargeDecision: "not_charged",
      chargeReason: classification.reason,
    },
  });
}
```

## Classification Rules

### Automatic Rules (No AI Needed)

**Always Charge:**
1. **User-ended AND >50% duration**
   - User intentionally completed >half of interview
   - They got practice value
   - Reason: "User completed 65% of planned interview and chose to end it."

**Never Charge:**
2. **Very short (<30 seconds)**
   - Likely technical issue or immediate disconnect
   - Reason: "Interview too short (25s). Likely technical issue."

3. **Almost no dialogue (<20 words)**
   - No meaningful conversation
   - Reason: "Insufficient dialogue (15 words). No meaningful conversation."

### AI Classification (For Edge Cases)

Used when:
- System/error ended
- <50% duration
- User ended early (<50%)

**OpenAI (GPT-4o) Analyzes:**
```
- Did a real conversation happen?
- Were there meaningful Q&A exchanges?
- Did the user get practice value?
- Was there confusion/errors preventing dialogue?
```

**Example Prompts:**

```typescript
// Good interview (charge)
{
  transcript: "
    Officer: Hello, what's your name?
    Applicant: My name is John Smith.
    Officer: What is the purpose of your visit?
    Applicant: I'm here to study computer science at MIT.
    Officer: How will you fund your studies?
    Applicant: I have a scholarship covering tuition...
  ",
  shouldCharge: true,
  reason: "Meaningful interview practice with multiple Q&A exchanges."
}

// Technical failure (don't charge)
{
  transcript: "
    Officer: Hello, what's your name?
    [silence]
    Officer: Can you hear me?
    [disconnect]
  ",
  shouldCharge: false,
  reason: "Technical issues prevented meaningful dialogue."
}

// Brief but valuable (charge)
{
  transcript: "
    Officer: Hello, please state your name.
    Applicant: Maria Garcia.
    Officer: Purpose of visit?
    Applicant: Tourism. I want to visit my sister in California.
    Officer: How long?
    Applicant: Two weeks.
    Officer: Where does your sister live?
    Applicant: San Francisco. She's a software engineer there.
  ",
  shouldCharge: true,
  reason: "Brief but meaningful practice with substantive Q&A exchanges."
}
```

## Database Schema

```prisma
model Interview {
  // ... existing fields
  
  // Credit tracking
  creditsPlanned  Int?    // Credits user planned to spend (5/10/15)
  creditsDeducted Int?    // Actual credits deducted (null = not processed yet)
  endedBy         String? // "user", "agent", "system", "error"
  chargeDecision  String? // "charged", "not_charged"
  chargeReason    String? // Human-readable reason
}

model User {
  credits Int @default(0) // Current balance
}

model CreditLedger {
  type        String  // "purchase", "deduction", "refund"
  amount      Int     // +10 for purchase, -10 for deduction
  balance     Int     // Balance after transaction
  description String? // Human-readable description
  referenceId String? // Interview ID or Payment Intent ID
}
```

## Testing Scenarios

### Scenario 1: Successful Full Interview

```
User starts 10-minute interview
Agent asks questions for 8 minutes
User answers well
Agent calls end_interview tool
```

**Expected:**
- `endedBy: "agent"`
- Duration: ~480 seconds (80%)
- Classification: "Meaningful interview with Q&A exchanges"
- `chargeDecision: "charged"`
- `creditsDeducted: 10`

### Scenario 2: User Ends Early (>50%)

```
User starts 10-minute interview
Agent asks questions for 6 minutes
User clicks "Hang Up"
```

**Expected:**
- `endedBy: "user"`
- Duration: ~360 seconds (60%)
- Classification: "User completed 60% and chose to end it"
- `chargeDecision: "charged"`
- `creditsDeducted: 10`

### Scenario 3: Technical Failure

```
User starts interview
Agent greets
Connection drops after 15 seconds
```

**Expected:**
- `endedBy: "system"` or `"error"`
- Duration: ~15 seconds
- Classification: "Interview too short. Likely technical issue."
- `chargeDecision: "not_charged"`
- `creditsDeducted: 0`

### Scenario 4: User Ends Too Early (<50%)

```
User starts 10-minute interview
Agent asks 2 questions
User clicks "Hang Up" after 3 minutes
```

**Expected:**
- `endedBy: "user"`
- Duration: ~180 seconds (30%)
- AI analyzes transcript
- If good dialogue: `charged`
- If confused/minimal: `not_charged`

### Scenario 5: No Microphone Input

```
User starts interview
Agent speaks but no user audio detected
Only 5 words in transcript
Session ends after 2 minutes
```

**Expected:**
- `endedBy: "system"`
- Duration: ~120 seconds
- Classification: "Insufficient dialogue (5 words)"
- `chargeDecision: "not_charged"`
- `creditsDeducted: 0`

## Error Handling

### Classification Fails

```typescript
catch (error) {
  // Fallback to heuristics
  const fallbackCharge = 
    durationPercentage >= 30 && 
    transcriptWordCount >= 50;
  
  return {
    shouldCharge: fallbackCharge,
    reason: "AI unavailable. Based on 35% completion and 60 words.",
    confidence: "low"
  };
}
```

### Database Transaction Fails

```typescript
catch (error) {
  // Mark as error, don't charge
  await prisma.interview.update({
    where: { id: interview.id },
    data: {
      creditsDeducted: null,
      chargeDecision: "not_charged",
      chargeReason: `Classification error: ${error.message}`
    }
  });
}
```

## Advantages Over Pre-Deduction

**Before (Pre-Deduction):**
- ❌ Charged for technical failures
- ❌ Charged for poor experiences
- ❌ Complex refund logic needed
- ❌ Bad UX when things break

**After (Post-Deduction):**
- ✅ Only charge for successful interviews
- ✅ Fair to users
- ✅ No refunds needed
- ✅ AI ensures quality bar
- ✅ User trust increases

## Monitoring

### Key Metrics to Track

```sql
-- Charge rate (% of interviews charged)
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN chargeDecision = 'charged' THEN 1 ELSE 0 END) as charged,
  ROUND(100.0 * SUM(CASE WHEN chargeDecision = 'charged' THEN 1 ELSE 0 END) / COUNT(*), 2) as charge_rate
FROM "Interview"
WHERE creditsDeducted IS NOT NULL;

-- Average duration by charge decision
SELECT 
  chargeDecision,
  AVG(duration) as avg_duration,
  COUNT(*) as count
FROM "Interview"
WHERE creditsDeducted IS NOT NULL
GROUP BY chargeDecision;

-- Charge reasons
SELECT 
  chargeReason,
  COUNT(*) as count
FROM "Interview"
WHERE creditsDeducted IS NOT NULL
GROUP BY chargeReason
ORDER BY count DESC;

-- End reasons
SELECT 
  endedBy,
  AVG(duration) as avg_duration,
  COUNT(*) as count
FROM "Interview"
WHERE endedBy IS NOT NULL
GROUP BY endedBy;
```

### Expected Charge Rates

**Healthy System:**
- 70-85% of interviews should be charged
- 15-30% not charged (technical issues, early exits)
- If <50% charged → investigate technical problems
- If >95% charged → classification may be too lenient

## Future Enhancements

1. **Partial Credits**
   - Charge 50% for 50-75% completion
   - Charge 75% for 75-100% completion

2. **Quality Scoring**
   - Track interview quality (1-10)
   - Only charge for quality >5

3. **User Feedback**
   - Let users dispute charges
   - Use feedback to improve classification

4. **A/B Testing**
   - Test different classification thresholds
   - Optimize for user satisfaction + revenue

## Summary

**What Changed:**
- Credits checked but NOT deducted at interview start
- `endedBy` tracked throughout interview lifecycle
- AI classifies interview success after completion
- Credits deducted only for successful interviews
- Complete audit trail in `CreditLedger`

**Benefits:**
- Fair pricing (only charge for value)
- Better UX (technical failures are free)
- Higher user trust
- No complex refund logic
- AI ensures quality bar

**Files Modified:**
- `prisma/schema.prisma` - Added credit tracking fields
- `app/api/livekit/connection-details/route.ts` - Check only, don't deduct
- `app/api/interviews/session-report/route.ts` - Classify and deduct
- `lib/interview-classifier.ts` - AI classification logic
- `server/interview-actions.ts` - Added `endedBy` parameter
- `components/voice-call/call-control-bar.tsx` - Track user end
- `agent-starter-python/src/agent.py` - Track agent end, send `endedBy`

**Result:** A fair, user-friendly credit system that only charges for successful interviews! 🎉




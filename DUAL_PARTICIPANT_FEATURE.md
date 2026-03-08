# Dual Participant Interview Feature (Marriage/Fiancé Visas)

## Overview

Implemented support for dual-participant interviews for marriage-based visas (K-1 Fiancé and CR-1/IR-1 Immigrant visas). Both the U.S. citizen petitioner and foreign national beneficiary can participate in the same interview, with the AI interviewer able to direct questions to either participant by name.

---

## What Changed

### 1. Configuration Page - Participant Name Inputs

**When:** Marriage or Fiancé visa is selected  
**What:** New input section appears asking for both participants' names

**UI Component:** `ParticipantNamesInput`
- Participant 1: U.S. Citizen Petitioner
- Participant 2: Foreign National Beneficiary
- Visual card with helpful tip about how the interview works
- Required fields - interview won't start without both names

**Location in Flow:**
```
Interview Level → Interview Language → Participant Names → Focus Areas → Documents
```

### 2. Interview Context Updates

**Added to `InterviewConfiguration`:**
```typescript
participant1Name?: string;  // U.S. citizen / petitioner
participant2Name?: string;  // Foreign national / beneficiary
```

**New Context Function:**
```typescript
setParticipantNames(participant1: string, participant2: string)
```

### 3. Agent Configuration

**Added to `AgentConfig`:**
```typescript
participant1Name?: string;
participant2Name?: string;
isDualParticipant?: boolean;  // Auto-set if both names provided
```

**Passed to Agent:**
- Names are included in LiveKit room metadata
- Agent receives them in configuration
- Used to build dual-participant instructions

### 4. AI Agent Behavior

**New Capabilities:**

1. **Addresses Participants by Name**
   ```
   "Good afternoon, John and Maria, thank you for coming today."
   ```

2. **Directs Questions to Specific People**
   ```
   "John, tell me, how did you two meet?"
   "Maria, when did you first visit the United States?"
   ```

3. **Tests Consistency**
   ```
   "John, how did you meet?"
   [Answer]
   "Maria, can you tell me your version of how you met?"
   [Compare answers]
   ```

4. **Uses Context Clues**
   - If response mentions being U.S. citizen → Participant 1
   - If response mentions being from another country → Participant 2
   - Can ask: "And which one of you is answering?"

5. **Relationship Verification**
   - Asks both partners about shared experiences
   - Compares answers for consistency
   - Assesses authenticity of relationship

---

## User Experience

### Configuration Page

**For Marriage/Fiancé Visas:**
```
┌─────────────────────────────────────────┐
│ 👥 Interview Participants               │
│                                         │
│ Participant 1 Name (U.S. Citizen)      │
│ [John Smith                    ]       │
│                                         │
│ Participant 2 Name (Foreign National)  │
│ [Maria Garcia                  ]       │
│                                         │
│ 💡 Tip: The interviewer will address   │
│ both participants by name and may      │
│ direct specific questions to either    │
│ person. Use context clues to know who  │
│ should respond.                        │
└─────────────────────────────────────────┘
```

**For Other Visa Types:**
- Participant name inputs do NOT appear
- Standard single-participant interview

### During Interview

**Agent Opening:**
```
Officer: "Good afternoon, John and Maria. Thank you for coming today. 
         I'm going to ask you both some questions about your relationship 
         and your plans together."
```

**Directed Questions:**
```
Officer: "John, tell me, how did you two meet?"
[John answers]

Officer: "I see. Maria, can you tell me your version of how you met?"
[Maria answers]

Officer: "Maria, when did you first visit the United States?"
[Maria answers]

Officer: "John, how long have you been a U.S. citizen?"
[John answers]
```

**Verification Questions:**
```
Officer: "John, when is Maria's birthday?"
[John answers]

Officer: "Maria, what does John do for work?"
[Maria answers]
```

---

## Technical Implementation

### Frontend Changes

**Files Modified:**
- `lib/contexts/interview-context.tsx` - Added participant name state
- `lib/agent-config-builder.ts` - Pass names to agent
- `components/interview/configure-interview-client.tsx` - Validation & conditional rendering
- `components/interview/participant-names-input.tsx` - NEW component

**Validation:**
```typescript
// Before starting interview
if (isMarriageVisa && (!participant1Name || !participant2Name)) {
  alert("Please enter both participant names");
  return;
}
```

### Backend/Agent Changes

**Python Agent (`agent.py`):**

Added dual-participant context to system prompt:
```python
if is_dual_participant and participant1_name and participant2_name:
    participant_context = f"""
DUAL PARTICIPANT INTERVIEW:
This is a marriage/fiancé visa interview with TWO participants present:
- {participant1_name} (U.S. Citizen Petitioner)
- {participant2_name} (Foreign National Beneficiary)

CRITICAL INSTRUCTIONS:
1. Address participants by name
2. Direct questions to either participant
3. Test consistency between answers
4. Use context clues to determine who is responding
5. Assess relationship authenticity
"""
```

**Agent receives:**
- `participant1Name`: "John Smith"
- `participant2Name`: "Maria Garcia"  
- `isDualParticipant`: true

---

## Interview Strategy for Dual Participants

### 1. Opening
- Greet both participants by name
- Explain you'll be asking questions to both

### 2. Relationship Questions
- Ask both how they met (compare stories)
- Ask about proposal/engagement
- Ask about wedding plans
- Ask about shared experiences

### 3. Separate Verification
- Ask each partner about the other
- Birthdays, family members, work, hobbies
- Living arrangements, daily routines
- Future plans

### 4. Immigration-Specific
- **To U.S. Citizen:** Previous marriages, income, sponsorship ability
- **To Foreign National:** Intent to immigrate, ties to home country, visa history

### 5. Consistency Testing
- Ask similar questions to both
- Note discrepancies
- Follow up on inconsistencies

---

## Example Interview Flow

```
Officer: Good afternoon, John and Maria. Thank you for coming today.

Officer: John, tell me, how did you two meet?
John: We met through a mutual friend at a party in 2022.

Officer: I see. Maria, can you tell me your version of how you met?
Maria: Yes, we met at a friend's birthday party in Los Angeles.

Officer: Very good. Maria, when did you first visit the United States?
Maria: I first came in 2021 on a tourist visa.

Officer: And John, when did you propose to Maria?
John: I proposed in December 2023 when I visited her in Mexico.

Officer: Maria, where did John propose?
Maria: He proposed at a restaurant in Cancun, on the beach.

Officer: Excellent. John, what does Maria do for work?
John: She's a teacher, she teaches elementary school.

Officer: Maria, what is John's occupation?
Maria: He's a software engineer at a tech company.

Officer: Very good. Tell me, John, have you been married before?
John: No, this is my first marriage.

Officer: Maria, do you have any children?
Maria: No, I don't have any children.

Officer: When do you plan to get married?
John: We're planning the wedding for June 2024.

Officer: Very good. Based on your answers today, everything looks in order...
```

---

## Visa Types Affected

### ✅ Enabled for Dual Participants:
- **K-1 Fiancé Visa** (`fiance`)
- **CR-1/IR-1 Immigrant Visa** (`immigrant`) - Marriage-based green card

### ❌ Single Participant Only:
- F-1 Student
- B-1/B-2 Tourist/Business
- H-1B Work
- J-1 Exchange

---

## Benefits

1. **Realistic Practice:** Mirrors actual marriage visa interviews
2. **Consistency Testing:** Both partners can practice answering together
3. **Relationship Verification:** Tests if stories align
4. **Name Recognition:** AI addresses each person appropriately
5. **Flexible Questioning:** Agent can direct questions strategically

---

## User Instructions

### For Applicants:

**Before Interview:**
1. Enter both names on configuration page
2. Decide who will be "Participant 1" (U.S. citizen) and "Participant 2" (foreign national)
3. Both should be present during the interview

**During Interview:**
- Listen for your name in the question
- If officer says "John, tell me..." → John should answer
- If officer says "Maria, when did..." → Maria should answer
- If unclear who should answer, wait for clarification or respond naturally
- Both can hear all questions and answers (simulates real interview)

**Tips:**
- Practice telling your story consistently
- Know details about each other (birthdays, jobs, family)
- Be prepared for verification questions
- Answer honestly and naturally

---

## Testing Recommendations

1. **Test with Marriage Visa:**
   - Select K-1 or Immigrant visa
   - Verify participant name inputs appear
   - Enter two names
   - Start interview
   - Confirm agent uses both names

2. **Test with Non-Marriage Visa:**
   - Select F-1 or B-2 visa
   - Verify NO participant name inputs
   - Standard single-participant interview

3. **Test Validation:**
   - Try to start marriage interview without names
   - Should show error message

4. **Test Agent Behavior:**
   - Agent should greet both by name
   - Agent should direct questions to specific people
   - Agent should ask verification questions to both

---

## Future Enhancements

**Possible Additions:**
- Voice recognition to auto-detect who is speaking
- Visual indicators showing who should answer
- Separate video feeds for each participant
- Post-interview consistency report
- Practice mode with answer comparison

---

## Summary

✅ **Dual participant support added for marriage visas**  
✅ **Agent can address and question both partners by name**  
✅ **Realistic marriage visa interview simulation**  
✅ **Automatic consistency testing between partners**  
✅ **Context-aware response handling**  
✅ **Only appears for marriage/fiancé visas**  
✅ **Build successful - Ready to test!**

**Next Steps:**
1. Test with K-1 fiancé visa configuration
2. Verify both names are used in interview
3. Check agent directs questions appropriately
4. Validate consistency testing works

# Interview Levels Restructure

## Overview

Restructured interview system from **time-based durations** to **depth-based levels** with intelligent questioning strategies.

## Changes Made

### Previous System (Time-Based)
- Quick (5 minutes)
- Standard (10 minutes)
- Comprehensive (15 minutes)

### New System (Depth-Based)
- **Basic** - Surface-level questioning (~5 min)
- **Standard** - Surface-level + deep dive into 1-2 areas (~10 min)
- **In-Depth** - Comprehensive deep dive into all sections (~15 min)

## Implementation Details

### 1. Duration Configuration (`lib/visa-types.ts`)

Updated `INTERVIEW_DURATIONS` constant:

```typescript
export const INTERVIEW_DURATIONS = [
  {
    value: "basic",
    label: "Basic",
    description: "Surface-level questioning on key topics",
    credits: 5,
    minutes: 5,
    depth: "surface",
  },
  {
    value: "standard",
    label: "Standard",
    description: "Surface-level + deep dive into 1-2 key areas",
    credits: 10,
    minutes: 10,
    depth: "moderate",
  },
  {
    value: "in-depth",
    label: "In-Depth",
    description: "Comprehensive deep dive into all question bank sections",
    credits: 15,
    minutes: 15,
    depth: "comprehensive",
  },
]
```

Added `depth` and `description` fields to each level.

### 2. Agent Configuration (`lib/agent-config-builder.ts`)

Updated `AgentConfig` interface:

```typescript
export interface AgentConfig {
  // ... existing fields
  depth: string; // questioning depth: "surface", "moderate", "comprehensive"
}
```

Modified `buildAgentConfig()` to extract and pass the `depth` parameter from the duration object.

### 3. Agent Instructions (`agent-starter-python/src/agent.py`)

Replaced time-based instructions with depth-aware questioning strategies:

#### Basic (Surface Level)
- Only high-level, essential questions
- 3-5 questions per major topic
- Don't probe deeply unless red flags
- Focus: identity, purpose, basic eligibility

#### Standard (Selective Deep Dive)
- Surface questions across all topics
- Choose 1-2 areas for deep exploration based on:
  - Unclear/inconsistent responses
  - Critical areas for visa type
- 5-8 follow-up questions in selected areas
- Other areas: 2-3 questions only

#### In-Depth (Comprehensive)
- Thoroughly explore ALL major sections
- For each topic:
  - 2-3 initial surface questions
  - 4-6 follow-up probing questions
  - Verification if answers are vague
- Cover: Purpose, Financial, Academic/Work, Ties, Intent, Documentation

### 4. UI Updates (`components/interview/configure-interview-client.tsx`)

Updated interview configuration page:

- Changed label from "Interview Duration" to "Interview Level"
- Updated tooltip with depth-based descriptions
- Enhanced SelectItem display to show:
  - Level name (Basic/Standard/In-Depth)
  - Description
  - Credits and estimated time
- Updated helper text to show both credits and time

### 5. Default Configuration (`lib/contexts/interview-context.tsx`)

Changed default from `"quick"` to `"basic"` to match new naming.

## Questioning Strategy Examples

### Basic Interview Flow
```
1. Identity verification (1-2 questions)
2. Purpose of visit (2-3 questions)
3. Basic eligibility (2-3 questions)
4. Quick tie check (1-2 questions)
Total: ~8-10 questions in ~5 minutes
```

### Standard Interview Flow
```
1. Surface questions across all areas (~5-6 questions)
2. Agent identifies weak areas (e.g., financial proof unclear)
3. Deep dive into financial situation (5-8 questions):
   - Bank statements details
   - Income sources
   - Sponsor information
   - Fund accessibility
4. Quick wrap-up
Total: ~12-15 questions in ~10 minutes
```

### In-Depth Interview Flow
```
1. Purpose of Visit (5-7 questions)
   - Surface + deep probing
2. Financial Situation (5-7 questions)
   - All aspects thoroughly covered
3. Academic/Work Background (5-7 questions)
   - Complete history and verification
4. Ties to Home Country (5-7 questions)
   - Family, property, commitments
5. Intent to Return (4-6 questions)
   - Future plans, obligations
6. Documentation Review (3-5 questions)
Total: ~30-35 questions in ~15 minutes
```

## Agent Intelligence

The agent now receives explicit instructions on:

1. **How many questions** to ask per topic
2. **When to deep dive** vs surface-level questioning
3. **Which areas** to prioritize based on level
4. **How to adapt** based on user responses (especially Standard level)

## Credits Remain Unchanged

- Basic: 5 credits
- Standard: 10 credits
- In-Depth: 15 credits

## Benefits

1. **Clearer User Expectations**: Users know the *depth* of questioning, not just duration
2. **Intelligent Questioning**: Agent adapts questioning based on level
3. **Better Preparation**: Users can choose preparation intensity
4. **Flexible Practice**: Surface-level for quick checks, deep dive for thorough prep
5. **Cost-Effective**: Users only pay for the depth they need

## Testing Recommendations

1. Test Basic level with simple visa types (e.g., B-2 Tourist)
   - Verify only surface questions are asked
   - Confirm ~5 minute duration

2. Test Standard level with complex scenario
   - Verify agent identifies weak areas
   - Confirm deep dive into 1-2 selected topics
   - Other topics remain surface-level

3. Test In-Depth level with all visa types
   - Verify comprehensive coverage of all sections
   - Confirm thorough probing questions
   - Verify ~15 minute duration

## Files Modified

- `lib/visa-types.ts` - Duration definitions
- `lib/agent-config-builder.ts` - Agent config interface
- `lib/contexts/interview-context.tsx` - Default configuration
- `components/interview/configure-interview-client.tsx` - UI updates
- `agent-starter-python/src/agent.py` - Depth-aware instructions

## Migration Notes

Existing interviews with old duration values (`quick`, `comprehensive`) will continue to work:
- `quick` → Maps to 5 minutes (treated as Basic)
- `comprehensive` → Maps to 15 minutes (treated as In-Depth)

No database migration needed as duration values are stored as strings.

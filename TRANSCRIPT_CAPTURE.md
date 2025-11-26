# Interview Transcript Capture

This document explains how interview transcripts are captured, stored, and used for AI analysis.

## Architecture Overview

```
User Interview
     ↓
LiveKit Agent (records conversation)
     ↓
Session Ends → on_session_end callback
     ↓
ctx.make_session_report() (LiveKit built-in)
     ↓
POST /api/interviews/session-report
     ↓
Parse & Save to TranscriptSegment table
     ↓
Trigger AI Report Generation
     ↓
OpenAI analyzes transcript
     ↓
Save to InterviewReport table
```

## Components

### 1. Agent Session Reporting (`agent.py`)

When an interview session ends, the agent:

1. **Captures Session Report**:
   ```python
   async def on_session_end(ctx: JobContext):
       report = ctx.make_session_report()
       report_dict = report.to_dict()
   ```

2. **Sends to Next.js API**:
   ```python
   async with httpx.AsyncClient() as client:
       await client.post(
           f"{NEXT_PUBLIC_APP_URL}/api/interviews/session-report",
           json={"roomName": room_name, "sessionReport": report_dict}
       )
   ```

The session report includes:
- **Complete conversation history** with timestamps
- **Speaker labels** (user vs assistant)
- **Transcribed text** from STT
- **Session metadata** (duration, participants, etc.)

### 2. Session Report API (`/api/interviews/session-report`)

Receives the session report and processes it:

1. **Find Interview**:
   ```typescript
   const interview = await getInterviewByRoomName(roomName);
   ```

2. **Parse Conversation History**:
   ```typescript
   for (const item of sessionReport.history.items) {
       // Extract speaker, text, and timestamps
       transcriptSegments.push({
           interviewId: interview.id,
           speaker: item.role === "user" ? "user" : "agent",
           text: item.content.text,
           startTime: item.content.start_time,
           endTime: item.content.end_time,
       });
   }
   ```

3. **Save to Database**:
   ```typescript
   await prisma.transcriptSegment.createMany({
       data: transcriptSegments,
   });
   ```

4. **Trigger AI Analysis**:
   ```typescript
   generateAIReport(interview.id); // Async, don't wait
   ```

### 3. AI Report Generation (`server/report-actions.ts`)

Uses the saved transcript to generate analysis:

1. **Fetch Transcript**:
   ```typescript
   const transcript = await getFormattedTranscript(interviewId);
   ```

2. **Send to OpenAI**:
   ```typescript
   const report = await openai.chat.completions.create({
       model: "gpt-4o",
       messages: [{
           role: "user",
           content: `Analyze this visa interview transcript: ${transcript}`,
       }],
       response_format: { type: "json_object" },
   });
   ```

3. **Save Report**:
   ```typescript
   await prisma.interviewReport.create({
       data: {
           interviewId,
           overallScore: report.overallScore,
           recommendation: report.recommendation,
           strengths: report.strengths,
           weaknesses: report.weaknesses,
           redFlags: report.redFlags,
           timestampedComments: report.timestampedComments,
       },
   });
   ```

## Database Schema

### TranscriptSegment
```prisma
model TranscriptSegment {
  id          String   @id @default(uuid())
  interviewId String
  speaker     String   // "user" or "agent"
  text        String
  startTime   Float    // seconds from start
  endTime     Float    // seconds from start
  createdAt   DateTime @default(now())

  interview   Interview @relation(fields: [interviewId], references: [id])
}
```

### InterviewReport
```prisma
model InterviewReport {
  id                  String   @id @default(uuid())
  interviewId         String   @unique
  overallScore        Int
  recommendation      String   // "approve", "deny", "further_review"
  strengths           String[]
  weaknesses          String[]
  redFlags            Json[]   // [{ timestamp, description }]
  timestampedComments Json[]   // [{ timestamp, comment, severity }]
  rawAnalysis         String?
  generatedAt         DateTime @default(now())

  interview           Interview @relation(fields: [interviewId], references: [id])
}
```

## Configuration

### Agent Environment Variables

Add to `/agent-starter-python/.env.local`:

```bash
# Next.js API URL (where to send session reports)
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Development
# NEXT_PUBLIC_APP_URL=https://your-app.vercel.app  # Production
```

### Dependencies

The agent requires `httpx` for HTTP requests:

```toml
# pyproject.toml
dependencies = [
    "httpx>=0.27.0",
    # ... other dependencies
]
```

## Flow Diagram

```
┌─────────────────┐
│  User Interview │
│   (LiveKit)     │
└────────┬────────┘
         │
         │ Video + Audio + STT
         ↓
┌─────────────────┐
│  Agent Records  │
│  Conversation   │
└────────┬────────┘
         │
         │ Session Ends
         ↓
┌─────────────────────┐
│ on_session_end()    │
│ • Get session report│
│ • Extract history   │
│ • Send to API       │
└────────┬────────────┘
         │
         │ HTTP POST
         ↓
┌──────────────────────────┐
│ /api/interviews/         │
│ session-report           │
│ • Parse conversation     │
│ • Save segments to DB    │
│ • Update interview status│
└────────┬─────────────────┘
         │
         │ Trigger async
         ↓
┌──────────────────────┐
│ generateAIReport()   │
│ • Fetch transcript   │
│ • Call OpenAI        │
│ • Parse analysis     │
│ • Save report to DB  │
└──────────────────────┘
```

## Benefits of This Approach

1. **Built-in to LiveKit**: Uses `ctx.make_session_report()` - no custom STT handling
2. **Accurate Timestamps**: LiveKit provides precise timing for each utterance
3. **Speaker Labels**: Automatically distinguishes user vs agent
4. **Complete History**: Captures entire conversation in order
5. **Post-Processing**: Transcript saved before AI analysis, allowing retries
6. **No Streaming Complexity**: Simple end-of-session callback

## Viewing Reports

After an interview completes:

1. **Video Recording**: S3 → displayed at `/reports/[id]`
2. **Transcript**: Database → displayed below video
3. **AI Analysis**: OpenAI report → displayed as structured feedback

All three are linked by the `interviewId`.

## Troubleshooting

### Session report not received

Check agent logs for:
```
📊 Session ended, generating session report...
📤 Sending session report to: http://localhost:3000/api/interviews/session-report
✅ Session report successfully sent to API
```

### Empty transcript

Check API logs for:
```
📝 Processing N conversation items...
💾 Saving N transcript segments...
✅ Transcript segments saved
```

If N = 0, the session report may not contain conversation history. Verify STT is working during the call.

### AI report not generated

Check API logs for:
```
🤖 Triggering AI report generation...
✅ AI report generated successfully
```

If it fails, check:
- `OPENAI_API_KEY` is set
- Transcript exists in database
- OpenAI API quota/limits

## Testing

1. **Start Interview**: Creates `Interview` record
2. **Talk with Agent**: LiveKit records conversation
3. **End Interview**: Triggers session report
4. **Check Logs**: Verify transcript received
5. **View Report**: Navigate to `/reports/[id]`

Expected timeline:
- Transcript saved: ~1-2 seconds after interview ends
- AI report generated: ~5-15 seconds (depends on transcript length)


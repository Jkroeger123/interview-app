# LiveKit Recording Setup Guide

This application uses **LiveKit Auto Egress** to automatically record interview sessions to AWS S3.

## How It Works

1. **Auto-Start**: When a room is created, LiveKit automatically starts recording
2. **Storage**: Recordings are saved directly to your S3 bucket
3. **Webhooks**: LiveKit sends webhook events to notify your app about recording progress
4. **AI Analysis**: Once recording completes, the app automatically generates an AI report

## Setup Steps

### 1. Configure AWS S3 (Required)

You need an S3 bucket to store recordings.

**Environment Variables** (add to Vercel):
```env
AWS_S3_BUCKET=your-bucket-name
AWS_S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

**S3 Bucket Setup**:
1. Go to AWS Console → S3
2. Create a new bucket (or use existing)
3. Make sure CORS is configured if you want browser playback:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET"],
       "AllowedOrigins": ["*"],
       "ExposeHeaders": []
     }
   ]
   ```
4. Create an IAM user with S3 write permissions for this bucket
5. Generate access keys for that IAM user

### 2. Configure LiveKit Webhooks (Required)

**CRITICAL**: Without webhooks, your app won't know when recordings complete!

1. Go to [https://cloud.livekit.io](https://cloud.livekit.io)
2. Navigate to **Settings** → **Webhooks**
3. **Add Webhook URL**: `https://your-app.vercel.app/api/webhooks/livekit`
4. **Enable these events**:
   - ✅ `egress_started` - Recording begins
   - ✅ `egress_ended` - Recording completes (triggers AI report)

**Note**: The webhook endpoint is already public (configured in `middleware.ts`), so no authentication is needed.

### 3. Verify Environment Variables

Make sure these are set in **Vercel → Settings → Environment Variables**:

**LiveKit** (already configured):
- `LIVEKIT_URL`
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`

**AWS S3** (needed for recording):
- `AWS_S3_BUCKET`
- `AWS_S3_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

**OpenAI** (needed for report generation):
- `OPENAI_API_KEY`

## Testing

After deploying:

1. Start an interview
2. Check Vercel logs for:
   ```
   ✅ API: Room created with metadata and auto-egress
   ```
3. Complete the interview (agent leaves)
4. Check logs for webhook events:
   ```
   📥 LiveKit webhook received: egress_ended
   ```
5. View the report at `/reports/{interviewId}`

## Troubleshooting

### No Recording Starts
- Check AWS credentials are correct in Vercel
- Verify S3 bucket name and region match
- Check LiveKit logs in Vercel for errors

### Webhooks Not Received
- **Most common issue**: Webhook not configured in LiveKit Cloud
- Go to LiveKit Cloud → Settings → Webhooks
- Verify URL is `https://your-app.vercel.app/api/webhooks/livekit`
- Verify events are enabled (`egress_started`, `egress_ended`)

### Recording Starts But Never Completes
- Check LiveKit Cloud dashboard for egress status
- Verify webhook events are enabled
- Check Vercel logs for webhook delivery errors

### AI Report Not Generated
- Verify `OPENAI_API_KEY` is set in Vercel
- Check webhook was received (`egress_ended` event)
- Check Vercel logs for OpenAI API errors

## Architecture

```
Interview Starts
    ↓
Room Created with Auto-Egress Config
    ↓
LiveKit Automatically Starts Recording to S3
    ↓
[Recording in Progress]
    ↓
Interview Ends (Agent Leaves)
    ↓
LiveKit Sends Webhook: egress_ended
    ↓
App Updates Database with Recording URL
    ↓
App Generates AI Report (GPT-4o)
    ↓
Report Available at /reports/{id}
```

## File Structure

- `app/api/livekit/connection-details/route.ts` - Creates room with auto-egress
- `app/api/webhooks/livekit/route.ts` - Handles egress events
- `server/report-actions.ts` - Generates AI reports
- `lib/openai-report-generator.ts` - OpenAI API integration
- `app/reports/[id]/page.tsx` - Report viewing page


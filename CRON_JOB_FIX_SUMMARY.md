# Cron Job Fix Summary

## Problem Identified

The interview cleanup system was **partially working but not automated**:

✅ **Working:**
- S3 video files auto-delete after 7 days (AWS Lifecycle Rule)
- Cron endpoint exists and functions correctly
- Warning email and database deletion logic implemented

❌ **Not Working:**
- Cron job was **never scheduled** to run automatically
- No `vercel.json` configuration existed
- Warning emails never sent (cron never triggered)
- Database records never deleted (cron never triggered)

## Root Cause

The cron endpoint `/api/cron/check-expiring-interviews` was built but never scheduled. It was waiting to be called manually or by an external service, but no scheduler was configured.

## Solution Implemented

### 1. Created `vercel.json`

Added Vercel Cron configuration:

```json
{
  "crons": [
    {
      "path": "/api/cron/check-expiring-interviews",
      "schedule": "0 2 * * *"
    }
  ]
}
```

**Schedule:** Daily at 2:00 AM UTC
- Low traffic time
- Gives users 24-hour warning before deletion
- Sufficient for 7-day retention policy

### 2. Created Comprehensive Documentation

**New File:** `docs/infrastructure/CRON_JOB_SETUP.md`

Includes:
- How the system works (day-by-day timeline)
- Vercel Cron configuration explanation
- Environment variable setup (`CRON_SECRET`)
- Manual testing procedures
- Troubleshooting guide
- Monitoring recommendations
- Production deployment checklist

### 3. Updated Deployment Checklist

Updated `docs/setup/PRE_DEPLOYMENT_CHECKLIST.md` with:
- Clear Vercel Cron setup instructions
- `CRON_SECRET` generation command
- Testing procedures
- Link to detailed documentation

## What Happens Now

### Day-by-Day Flow

```
Day 0:  Interview completed
        ├─ expiresAt = now + 7 days
        └─ Video uploaded to S3

Day 1-5: Interview accessible in user's history

Day 6:  Cron runs at 2 AM UTC
        ├─ Finds interviews expiring in 24 hours
        ├─ Sends warning email: "Your report expires in 24 hours"
        └─ Sets expirationWarningSent = true

Day 7:  Cron runs at 2 AM UTC
        ├─ Finds expired interviews (expiresAt < now)
        ├─ Deletes interview record from database
        ├─ Cascades: Deletes transcripts, reports, documents
        └─ AWS S3 Lifecycle Rule deletes video file

Result: Clean database, no orphaned data, user was warned
```

## Deployment Steps

### For Production:

1. **Generate CRON_SECRET:**
   ```bash
   openssl rand -base64 32
   ```

2. **Add to Vercel:**
   - Go to: Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add variable:
     - Name: `CRON_SECRET`
     - Value: (your generated secret)
     - Environments: ✅ Production, ✅ Preview, ✅ Development

3. **Deploy:**
   ```bash
   git add vercel.json docs/
   git commit -m "Configure automated interview cleanup cron job"
   git push
   ```

4. **Verify:**
   - Go to: Vercel Dashboard → Your Project → Cron Jobs
   - Should see: `check-expiring-interviews` with status "Active"
   - Schedule: `0 2 * * *`

5. **Test (Optional):**
   ```bash
   # Manually trigger the cron job
   curl -X GET https://your-domain.com/api/cron/check-expiring-interviews \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   
   # Should return:
   # {
   #   "success": true,
   #   "warningsSent": 0,
   #   "interviewsDeleted": 0,
   #   "note": "S3 files are automatically deleted by AWS Lifecycle Rules"
   # }
   ```

## Testing Recommendations

### Test Warning Email:

```sql
-- Create an interview expiring tomorrow
UPDATE "Interview" 
SET 
  "expiresAt" = NOW() + INTERVAL '1 day',
  "expirationWarningSent" = false
WHERE id = 'your-test-interview-id';
```

Then trigger cron manually or wait for next scheduled run.

### Test Deletion:

```sql
-- Create an expired interview
UPDATE "Interview" 
SET "expiresAt" = NOW() - INTERVAL '1 day'
WHERE id = 'your-test-interview-id';
```

Then trigger cron manually or wait for next scheduled run.

### Verify Deletion:

```sql
-- Should return 0 rows after cron runs
SELECT * FROM "Interview" 
WHERE id = 'your-test-interview-id';
```

## Monitoring

### Check Cron Execution:

1. **Vercel Dashboard:**
   - Go to: Your Project → Logs
   - Filter: `/api/cron/check-expiring-interviews`
   - Should see daily executions at 2 AM UTC

2. **Check Response:**
   ```json
   {
     "success": true,
     "warningsSent": 3,
     "interviewsDeleted": 5,
     "note": "S3 files are automatically deleted by AWS Lifecycle Rules"
   }
   ```

3. **Email Delivery:**
   - Check Resend dashboard for sent emails
   - Verify no bounces or failures

4. **Database Health:**
   ```sql
   -- Should be 0 (all expired interviews cleaned up)
   SELECT COUNT(*) FROM "Interview" 
   WHERE "expiresAt" < NOW();
   ```

## Benefits

✅ **Automated:** No manual intervention required  
✅ **Reliable:** Runs daily, independent of application state  
✅ **User-Friendly:** 24-hour warning before deletion  
✅ **Clean Database:** No orphaned records  
✅ **Cost-Effective:** Minimal serverless function usage  
✅ **Privacy-Compliant:** Data automatically purged after retention period  
✅ **Scalable:** Handles any number of interviews  

## Files Modified

- ✅ `vercel.json` - Created (Vercel Cron configuration)
- ✅ `docs/infrastructure/CRON_JOB_SETUP.md` - Created (comprehensive guide)
- ✅ `docs/setup/PRE_DEPLOYMENT_CHECKLIST.md` - Updated (deployment instructions)

## Files Already Existing (No Changes Needed)

- ✅ `app/api/cron/check-expiring-interviews/route.ts` - Working correctly
- ✅ `lib/email.ts` - `sendDeletionWarningEmail()` function ready
- ✅ `emails/deletion-warning.tsx` - Email template ready
- ✅ `prisma/schema.prisma` - `expiresAt` and `expirationWarningSent` fields exist

## Next Steps

1. **Set `CRON_SECRET` in Vercel** (required before deployment)
2. **Push `vercel.json` to trigger deployment**
3. **Verify cron job appears in Vercel Dashboard**
4. **Test with a sample interview** (optional but recommended)
5. **Monitor logs for first few days** to ensure smooth operation

## Troubleshooting

If cron job doesn't run:
1. Check Vercel Dashboard → Cron Jobs (should show as "Active")
2. Verify `CRON_SECRET` is set in environment variables
3. Check Vercel Logs for errors
4. Manually trigger to test: `curl -X GET ... -H "Authorization: Bearer ..."`

If warning emails don't send:
1. Check Resend API key is configured
2. Verify `RESEND_FROM_EMAIL` is set
3. Check Resend dashboard for delivery errors
4. Test email function manually

If interviews don't delete:
1. Verify `expiresAt` is set on completed interviews
2. Check Prisma cascade deletes are configured
3. Manually trigger cron and check logs
4. Query database for expired interviews

## Summary

The interview cleanup system is now **fully automated**:

- 📧 **Warning emails** sent 24 hours before expiration
- 🗑️ **Database records** deleted after expiration
- 📹 **S3 videos** deleted by AWS Lifecycle Rules
- ⏰ **Runs daily** at 2 AM UTC automatically
- 🔒 **Secure** with CRON_SECRET authentication
- 📊 **Monitored** via Vercel logs

**Status:** Ready for deployment after setting `CRON_SECRET`

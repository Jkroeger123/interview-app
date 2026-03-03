# Automated Interview Cleanup & Email Warnings

## Overview

The system automatically deletes expired interviews and sends warning emails using:
1. **AWS S3 Lifecycle Rules** - Auto-deletes video files after 7 days
2. **Vercel Cron Job** - Sends warning emails and deletes database records

This document focuses on the **Vercel Cron Job** setup.

---

## How It Works

```
Day 0:  Interview completed
        ├─ expiresAt set to 7 days from now
        └─ Video uploaded to S3

Day 1-5: Interview accessible

Day 6:  Cron job runs (24 hours before expiration)
        ├─ Sends warning email to user
        └─ Sets expirationWarningSent = true

Day 7:  Cron job runs (after expiration)
        ├─ Deletes interview record from database
        ├─ Cascades to transcripts and reports
        └─ AWS S3 Lifecycle Rule deletes video file

Result: Clean database, no orphaned data
```

---

## Configuration

### 1. Vercel Cron Schedule (`vercel.json`)

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

**Schedule Explanation:**
- `0 2 * * *` = Runs daily at 2:00 AM UTC
- **Why 2 AM UTC?** 
  - Low traffic time
  - Gives users in all timezones reasonable warning timing
  - Before business hours in most regions

**Cron Schedule Format:**
```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6) (Sunday - Saturday)
│ │ │ │ │
0 2 * * *
```

**Alternative Schedules:**
- `0 */6 * * *` = Every 6 hours (more frequent checks)
- `0 0 * * *` = Midnight UTC (simpler)
- `0 3 * * *` = 3 AM UTC (later in morning)

### 2. Environment Variables

Add to Vercel Environment Variables:

```bash
CRON_SECRET=your-random-secret-here
```

**How to Generate a Secret:**
```bash
# Generate a secure random secret (run in terminal)
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Example output:
# K8x5mN2pQ7vR4wT6yU9zA1bC3dE5fG7hI0jK2lM4nO6p
```

**Setting in Vercel:**
1. Go to Project Settings → Environment Variables
2. Add variable:
   - **Name**: `CRON_SECRET`
   - **Value**: `your-generated-secret`
   - **Environments**: ✅ Production, ✅ Preview, ✅ Development
3. Redeploy after adding

---

## Cron Endpoint Details

### API Route: `/api/cron/check-expiring-interviews`

**Location:** `app/api/cron/check-expiring-interviews/route.ts`

**Authentication:**
- Requires `Authorization: Bearer <CRON_SECRET>` header
- Vercel Cron automatically includes this header
- Prevents unauthorized manual triggering

**What It Does:**

1. **Find Interviews Expiring in 24 Hours**
   - Status: `completed`
   - `expiresAt` between now and 24 hours from now
   - `expirationWarningSent` = false

2. **Send Warning Emails**
   - Uses `sendDeletionWarningEmail()` from `lib/email.ts`
   - Includes countdown ("24 hours remaining")
   - Urgent call-to-action to view report
   - Marks `expirationWarningSent = true` after sending

3. **Delete Expired Interviews**
   - Finds interviews with `expiresAt` < now
   - Deletes from database (cascades to transcripts, reports, documents)
   - **Note:** S3 videos deleted by AWS Lifecycle Rules (no code needed)

**Response Format:**
```json
{
  "success": true,
  "warningsSent": 3,
  "interviewsDeleted": 5,
  "note": "S3 files are automatically deleted by AWS Lifecycle Rules"
}
```

---

## Deployment

### After Pushing `vercel.json`:

1. **Push to GitHub:**
   ```bash
   git add vercel.json
   git commit -m "Configure automated interview cleanup cron job"
   git push
   ```

2. **Vercel Auto-Deploys:**
   - Detects `vercel.json` changes
   - Registers cron job automatically
   - No manual configuration needed in Vercel dashboard

3. **Verify Cron Job:**
   - Go to: Vercel Dashboard → Your Project → Cron Jobs
   - Should see: `check-expiring-interviews` with schedule `0 2 * * *`
   - Status should show: **Active** ✅

---

## Manual Testing

### Test Warning Email (Before Deployment):

```bash
# 1. Create test interview expiring tomorrow
psql $DATABASE_URL -c "
  UPDATE \"Interview\" 
  SET 
    \"expiresAt\" = NOW() + INTERVAL '1 day',
    \"expirationWarningSent\" = false
  WHERE id = 'your-interview-id';
"

# 2. Trigger cron job manually
curl -X GET https://your-domain.com/api/cron/check-expiring-interviews \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# 3. Check email inbox - should receive warning email
```

### Test Deletion:

```bash
# 1. Create expired interview
psql $DATABASE_URL -c "
  UPDATE \"Interview\" 
  SET \"expiresAt\" = NOW() - INTERVAL '1 day'
  WHERE id = 'your-interview-id';
"

# 2. Trigger cron job manually
curl -X GET https://your-domain.com/api/cron/check-expiring-interviews \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# 3. Verify interview deleted from database
psql $DATABASE_URL -c "
  SELECT id, \"expiresAt\", status 
  FROM \"Interview\" 
  WHERE id = 'your-interview-id';
"
# Should return 0 rows
```

### Check Cron Logs in Vercel:

1. Go to Vercel Dashboard → Your Project
2. Click "Logs" tab
3. Filter by: `/api/cron/check-expiring-interviews`
4. Should see daily execution logs at 2 AM UTC

---

## Monitoring

### What to Check Daily (First Week):

1. **Cron Execution:**
   - Vercel Logs → Should run daily at 2 AM UTC
   - Look for: ✅ 200 status codes

2. **Warning Emails Sent:**
   - Check Resend dashboard for sent emails
   - Verify emails delivered (not bounced)

3. **Database Cleanup:**
   - Query expired interviews:
     ```sql
     SELECT COUNT(*) FROM "Interview" 
     WHERE "expiresAt" < NOW();
     ```
   - Should be 0 (all cleaned up)

4. **S3 Storage:**
   - Check S3 bucket size trends
   - Should decrease as old videos delete

### Alert Setup (Optional):

Use Vercel Monitoring or external service to alert if:
- Cron job fails (non-200 response)
- Cron job doesn't run for 24+ hours
- Large number of expired interviews (indicates cleanup not working)

---

## Troubleshooting

### Cron Job Not Running

**Check 1: Is it configured in Vercel?**
```bash
# Verify vercel.json is deployed
git log --oneline | grep vercel.json
# Should show your commit
```

**Check 2: Is CRON_SECRET set?**
- Vercel Dashboard → Settings → Environment Variables
- Ensure `CRON_SECRET` exists in Production

**Check 3: Check Vercel Logs**
- Look for errors or missing executions
- Check timezone (UTC vs local time)

### Warning Emails Not Sending

**Check 1: Resend Configuration**
```bash
# Verify RESEND_API_KEY is set
# Check Resend dashboard for errors
```

**Check 2: Test Email Sending**
```typescript
// Run this in a test API route
import { sendDeletionWarningEmail } from "@/lib/email";

const result = await sendDeletionWarningEmail({
  to: "your-test-email@example.com",
  userName: "Test User",
  visaType: "Student Visa (F-1)",
  interviewDate: "January 1, 2024",
  expirationDate: "January 8, 2024",
  interviewId: "test-123",
  hoursRemaining: 24,
});

console.log(result); // Should show success: true
```

**Check 3: Check `expirationWarningSent` flag**
```sql
SELECT id, "expiresAt", "expirationWarningSent"
FROM "Interview"
WHERE "expiresAt" BETWEEN NOW() AND NOW() + INTERVAL '1 day';
```

### Interviews Not Deleting

**Check 1: Verify expiresAt is set**
```sql
SELECT id, "expiresAt", status
FROM "Interview"
WHERE "expiresAt" IS NULL AND status = 'completed';
```
All completed interviews should have `expiresAt`.

**Check 2: Manual deletion test**
```bash
# Set interview to expired
psql $DATABASE_URL -c "
  UPDATE \"Interview\" 
  SET \"expiresAt\" = NOW() - INTERVAL '1 day'
  WHERE id = 'test-interview-id';
"

# Trigger cron
curl -X GET https://your-domain.com/api/cron/check-expiring-interviews \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Verify deletion
psql $DATABASE_URL -c "
  SELECT * FROM \"Interview\" WHERE id = 'test-interview-id';
"
```

**Check 3: Check cascade deletes**
Ensure Prisma schema has `onDelete: Cascade`:
```prisma
model InterviewReport {
  interview Interview @relation(fields: [interviewId], references: [id], onDelete: Cascade)
}
```

---

## Production Checklist

Before deploying to production:

- [ ] `vercel.json` created and pushed
- [ ] `CRON_SECRET` environment variable set in Vercel
- [ ] Cron job appears in Vercel Dashboard → Cron Jobs
- [ ] Manual test successful (warning email sent)
- [ ] Manual test successful (expired interview deleted)
- [ ] Resend email deliverability verified
- [ ] S3 Lifecycle Rule configured (7 day TTL)
- [ ] Monitoring/alerts configured (optional but recommended)
- [ ] Documentation updated in README

---

## Frequency Comparison

| Schedule | Pros | Cons |
|----------|------|------|
| **`0 2 * * *`** (Daily 2 AM) | ✅ Low traffic time<br>✅ Predictable<br>✅ Sufficient for 7-day TTL | ⚠️ 24-hour delay possible |
| `0 */6 * * *` (Every 6 hours) | ✅ More responsive<br>✅ Faster cleanup | ⚠️ 4x more executions<br>⚠️ More API calls |
| `0 0 * * *` (Midnight UTC) | ✅ Simple<br>✅ Memorable | ⚠️ Peak time for some regions |

**Recommendation:** Start with daily (2 AM UTC). Increase frequency if needed.

---

## Cost Implications

**Vercel Cron Jobs:**
- Free tier: ✅ 1 cron job included
- This uses 1 cron job slot
- Executions count toward serverless function invocations

**Expected Usage (per month):**
- 30 daily executions
- ~1-2 seconds per execution
- Minimal cost impact (within free tier for most apps)

---

## Related Documentation

- [Vercel Cron Jobs Documentation](https://vercel.com/docs/cron-jobs)
- [AWS S3 Lifecycle Setup](./AWS_S3_LIFECYCLE_SETUP.md)
- [Email Notifications System](./EMAIL_NOTIFICATIONS.md)
- [Prisma Schema](../../prisma/schema.prisma)

---

## Summary

✅ **Cron job configured** - Runs daily at 2 AM UTC  
✅ **Warning emails** - Sent 24 hours before expiration  
✅ **Database cleanup** - Expired interviews auto-deleted  
✅ **S3 cleanup** - AWS Lifecycle Rules handle video deletion  
✅ **Secure** - Protected by CRON_SECRET  
✅ **Monitored** - Logs available in Vercel Dashboard  

**Next Steps:**
1. Set `CRON_SECRET` in Vercel
2. Push `vercel.json` to trigger deployment
3. Verify cron job appears in Vercel Dashboard
4. Test with sample expired interview
5. Monitor for first few days

**Questions?** Check the troubleshooting section or Vercel Cron documentation.

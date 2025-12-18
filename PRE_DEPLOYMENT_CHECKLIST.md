# Pre-Deployment Checklist

Complete checklist for deploying the post-interview credit deduction system.

## 1. Database Migration

### Update Production Database

```bash
# Push schema changes to production
npx prisma db push --accept-data-loss

# Or create migration (preferred for production)
npx prisma migrate dev --name add_post_interview_credits
npx prisma migrate deploy
```

**New Fields Added:**
- `Interview.creditsPlanned` - Credits user planned to spend
- `Interview.creditsDeducted` - Credits actually deducted
- `Interview.endedBy` - Who/what ended interview ("user", "agent", "system", "error")
- `Interview.chargeDecision` - "charged" or "not_charged"
- `Interview.chargeReason` - Human-readable reason for decision

---

## 2. Environment Variables

### Required New Variables

Add these to your production environment (Vercel, etc.):

```env
# OpenAI (for interview classification)
OPENAI_API_KEY=sk-...

# Existing variables (verify they're set)
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_10=price_...
STRIPE_PRICE_ID_50=price_...
STRIPE_PRICE_ID_100=price_...

RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=Vysa <noreply@yourdomain.com>

AWS_S3_BUCKET=your-bucket-name
AWS_S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
LIVEKIT_URL=wss://...

TAVUS_REPLICA_ID=...
TAVUS_PERSONA_ID=...

RAGIE_API_KEY=...

DATABASE_URL=postgresql://...
CLERK_SECRET_KEY=...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_WEBHOOK_SECRET=whsec_...

NEXT_PUBLIC_APP_URL=https://yourdomain.com
CRON_SECRET=... (for cron jobs)
```

---

## 3. OpenAI Setup

### Get API Key

1. Go to https://platform.openai.com/api-keys
2. Create new secret key
3. Add to environment: `OPENAI_API_KEY=sk-...`

**Usage:** Classification uses GPT-4o (~$0.01 per interview)

**Monthly Cost Estimate:**
- 100 interviews/month = ~$1
- 1,000 interviews/month = ~$10
- 10,000 interviews/month = ~$100

---

## 4. Stripe Setup

### Production Configuration

1. **Switch to Live Mode** in Stripe Dashboard

2. **Get Live API Keys:**
   - Go to: https://dashboard.stripe.com/apikeys
   - Copy **Live Secret Key** → `STRIPE_SECRET_KEY`
   - Copy **Live Publishable Key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

3. **Create Products** (if not already in live mode):
   - 10 Credits - $10 (one-time)
   - 50 Credits - $50 (one-time)
   - 100 Credits - $100 (one-time)
   - Copy Price IDs → `STRIPE_PRICE_ID_10`, `STRIPE_PRICE_ID_50`, `STRIPE_PRICE_ID_100`

4. **Set Up Production Webhook:**
   - URL: `https://yourdomain.com/api/stripe/webhook`
   - Events to listen for:
     - ✅ `checkout.session.completed`
     - ✅ `payment_intent.succeeded`
     - ✅ `payment_intent.payment_failed`
     - ✅ `payment_intent.canceled`
   - Copy **Signing Secret** → `STRIPE_WEBHOOK_SECRET`

5. **Disable Cash App Pay** (recommended):
   - Go to: Settings → Payment methods
   - Remove Cash App Pay

**Test Checklist:**
- [ ] Products created with correct prices
- [ ] Webhook endpoint configured
- [ ] Webhook signing secret added
- [ ] Test purchase in production (use real card, then refund)

---

## 5. Resend Email Setup

### Configure Email Service

1. **Sign up** at https://resend.com

2. **Verify Your Domain:**
   - Go to: Domains → Add Domain
   - Add DNS records (MX, TXT, CNAME)
   - Wait for verification (5-30 minutes)

3. **Get API Key:**
   - Go to: API Keys → Create API Key
   - Copy key → `RESEND_API_KEY`

4. **Set From Email:**
   - Format: `Vysa <noreply@yourdomain.com>`
   - Add to: `RESEND_FROM_EMAIL`

**Emails Sent:**
- Interview report ready notification
- Interview expiring in 24h warning

**Monthly Cost:**
- Free tier: 3,000 emails/month
- Pro: $20/month for 50,000 emails

**Test Checklist:**
- [ ] Domain verified in Resend
- [ ] API key added to environment
- [ ] From email configured
- [ ] Send test email to yourself

---

## 6. AWS S3 Lifecycle Rules

### Configure Automatic Video Deletion

**Important:** Videos are auto-deleted after 7 days using S3 Lifecycle Rules (no code changes needed).

1. **Go to AWS S3 Console:**
   - https://s3.console.aws.amazon.com/

2. **Select Your Bucket:**
   - Find: `your-interview-recordings-bucket`

3. **Create Lifecycle Rule:**
   - Management → Lifecycle rules → Create rule
   - **Rule name:** `delete-old-interviews`
   - **Prefix:** `interviews/` (to only affect interview videos)
   - **Actions:**
     - ✅ Delete expired object delete markers
     - ✅ Delete previous versions
   - **Expiration:**
     - Delete objects: `7 days` after creation
   - Create rule

**Verify:**
- [ ] Lifecycle rule created
- [ ] Applies to `interviews/` prefix
- [ ] Deletion set to 7 days
- [ ] Rule is enabled

---

## 7. Cron Job Setup

### Schedule Interview Cleanup

**If using Vercel:**

1. **Add Cron Job** in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/check-expiring-interviews",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

2. **Deploy** to activate cron

**If using another platform:**

Set up external cron service (e.g., cron-job.org):
- URL: `https://yourdomain.com/api/cron/check-expiring-interviews`
- Schedule: Every 6 hours
- Method: GET
- Header: `Authorization: Bearer YOUR_CRON_SECRET`

**What it does:**
- Sends warning emails 24h before expiration
- Deletes expired interview records (videos auto-delete via S3)

**Test Checklist:**
- [ ] Cron job configured
- [ ] `CRON_SECRET` set in environment
- [ ] Test endpoint manually with correct auth header

---

## 8. Agent Deployment

### Deploy Python Agent

**If using LiveKit Cloud:**

1. **Build and deploy agent:**
```bash
cd /Users/justinkroeger/agent-starter-python
# Follow LiveKit deployment docs
```

2. **Verify environment variables in agent:**
```env
OPENAI_API_KEY=...
TAVUS_REPLICA_ID=...
TAVUS_PERSONA_ID=...
RAGIE_API_KEY=...
AWS_S3_BUCKET=...
AWS_S3_REGION=...
```

**If self-hosted:**

Ensure agent has access to all required env vars and can reach your Next.js API at:
- `https://yourdomain.com/api/interviews/session-report`

---

## 9. Testing Before Launch

### Critical Tests

**1. Full Purchase Flow:**
```
✓ Buy credits with real card
✓ Credits appear immediately
✓ Transaction in Stripe Dashboard
✓ Webhook delivered successfully
```

**2. Interview Start (No Deduction):**
```
✓ Start interview with 10 credits
✓ Interview starts successfully
✓ Credits NOT deducted yet
✓ Database shows creditsPlanned=10, creditsDeducted=null
```

**3. Interview End - User Ends (>50%):**
```
✓ Complete 6+ minutes of 10-minute interview
✓ Click "Hang Up"
✓ Wait for session report processing
✓ Credits deducted (10)
✓ chargeDecision="charged"
✓ User balance decreased by 10
```

**4. Interview End - Technical Failure:**
```
✓ Start interview
✓ Disconnect after 15 seconds
✓ Wait for session report
✓ Credits NOT deducted
✓ chargeDecision="not_charged"
✓ chargeReason shows "too short"
```

**5. Email Notifications:**
```
✓ Complete interview
✓ Receive "Report Ready" email
✓ Check 24h warning email (may need to manually test)
```

**6. OpenAI Classification:**
```
✓ Check logs for classification results
✓ Verify AI is analyzing transcripts
✓ Confirm charge decisions make sense
```

---

## 10. Monitoring Setup

### Key Metrics to Watch

**First Week:**
- Monitor charge rate (should be 70-85%)
- Check classification reasons
- Watch for unusual patterns
- Monitor OpenAI API costs

**SQL Queries for Monitoring:**

```sql
-- Charge rate
SELECT 
  COUNT(*) FILTER (WHERE "chargeDecision" = 'charged') * 100.0 / COUNT(*) as charge_rate,
  COUNT(*) as total_interviews
FROM "Interview"
WHERE "creditsDeducted" IS NOT NULL;

-- Common reasons for not charging
SELECT "chargeReason", COUNT(*) as count
FROM "Interview"
WHERE "chargeDecision" = 'not_charged'
GROUP BY "chargeReason"
ORDER BY count DESC
LIMIT 10;

-- Average duration by decision
SELECT 
  "chargeDecision",
  AVG("duration") as avg_duration_seconds,
  COUNT(*) as count
FROM "Interview"
WHERE "creditsDeducted" IS NOT NULL
GROUP BY "chargeDecision";
```

---

## 11. Rollback Plan

### If Something Goes Wrong

**Emergency Disable:**

1. **Revert to pre-deduction** (temporary fix):
   - Set feature flag in code or env var
   - Deploy old version

2. **Manual credit refunds** (if needed):
```sql
-- Find affected users
SELECT * FROM "Interview"
WHERE "chargeDecision" = 'charged'
  AND "creditsDeducted" > 0
  AND "createdAt" > '2025-12-18';  -- Today's date

-- Manually refund credits (run in transaction)
BEGIN;

-- Add credits back
UPDATE "User"
SET "credits" = "credits" + 10
WHERE "id" = 'user_id_here';

-- Create refund ledger entry
INSERT INTO "CreditLedger" (
  "id", "userId", "amount", "balance", "type", 
  "description", "referenceId", "createdAt"
) VALUES (
  gen_random_uuid(),
  'user_id_here',
  10,
  (SELECT "credits" FROM "User" WHERE "id" = 'user_id_here'),
  'refund',
  'Refund: Post-interview credit system issue',
  'interview_id_here',
  NOW()
);

COMMIT;
```

---

## 12. Final Checklist

### Before Clicking Deploy

- [ ] Database schema updated (Prisma migration)
- [ ] All environment variables set
- [ ] OpenAI API key configured and tested
- [ ] Stripe live keys configured
- [ ] Stripe webhook configured and tested
- [ ] Resend domain verified and API key set
- [ ] AWS S3 lifecycle rule created (7 days)
- [ ] Cron job scheduled
- [ ] Agent deployed with new code
- [ ] Test purchase completed successfully
- [ ] Test interview (charged) completed
- [ ] Test interview (not charged) completed
- [ ] Email notifications received
- [ ] Monitoring queries ready
- [ ] Team aware of new system
- [ ] Rollback plan documented

---

## Cost Estimates

**Per Month (1,000 interviews):**

| Service | Cost |
|---------|------|
| OpenAI (GPT-4o classification) | ~$10 |
| Resend (emails) | Free (< 3k emails) |
| AWS S3 (storage + lifecycle) | ~$2 |
| Stripe (transaction fees) | 2.9% + $0.30 per purchase |
| **Total Additional Cost** | **~$12/month** |

---

## Support Contacts

**If you need help:**
- OpenAI: https://platform.openai.com/docs
- Stripe: https://dashboard.stripe.com/support
- Resend: https://resend.com/docs
- AWS S3: https://docs.aws.amazon.com/s3/

---

## Post-Deployment

**First 24 Hours:**
- [ ] Monitor error logs closely
- [ ] Check Stripe Dashboard for successful charges
- [ ] Verify OpenAI API calls are working
- [ ] Confirm email notifications sending
- [ ] Watch charge rate metrics

**First Week:**
- [ ] Review classification accuracy
- [ ] Analyze charge reasons
- [ ] Gather user feedback
- [ ] Optimize thresholds if needed

---

**Good luck with your deployment! 🚀**

The new post-interview credit system is fair, user-friendly, and will increase trust while preventing charges for poor experiences.




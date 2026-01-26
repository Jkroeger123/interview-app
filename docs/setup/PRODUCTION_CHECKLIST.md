# 🚀 Production Domain Setup - Quick Checklist

**Your Production Domain:** `https://___________________` ← Fill this in!

Use this checklist when deploying to your production domain. Check off items as you complete them.

---

## 🔧 Pre-Deployment (Do These First)

### 1. DNS & Domain Setup
- [ ] Add domain to Vercel (Project → Settings → Domains)
- [ ] Update DNS records at your registrar (A record / CNAME as shown by Vercel)
- [ ] Wait for SSL certificate (auto-provisioned by Vercel, ~60 seconds)
- [ ] Verify domain is live: `https://yourdomain.com`

---

## ⚙️ Environment Variables

### 2. Vercel Environment Variables
**Path:** Vercel Dashboard → Your Project → Settings → Environment Variables

- [ ] Update `NEXT_PUBLIC_APP_URL` to `https://yourdomain.com`
- [ ] Verify all other env vars are set:
  - [ ] `STRIPE_SECRET_KEY` (use `sk_live_...` for production)
  - [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (use `pk_live_...`)
  - [ ] `STRIPE_WEBHOOK_SECRET` (will update this in step 5)
  - [ ] `CLERK_SECRET_KEY`
  - [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - [ ] `LIVEKIT_API_KEY`
  - [ ] `LIVEKIT_API_SECRET`
  - [ ] `LIVEKIT_URL`
  - [ ] `OPENAI_API_KEY`
  - [ ] `AWS_ACCESS_KEY_ID`
  - [ ] `AWS_SECRET_ACCESS_KEY`
  - [ ] `AWS_S3_BUCKET`
  - [ ] `AWS_S3_REGION`
  - [ ] `RESEND_API_KEY`
  - [ ] `RESEND_FROM_EMAIL` (update if using new domain)
  - [ ] `STRIPE_PRICE_ID_5`
  - [ ] `STRIPE_PRICE_ID_10`
  - [ ] `STRIPE_PRICE_ID_50`
- [ ] **Redeploy** app after updating env vars

### 3. Python Agent Environment Variables
**File:** `/Users/justinkroeger/agent-starter-python/.env.local`

- [ ] Add or update: `NEXT_API_URL=https://yourdomain.com`
- [ ] Verify all agent env vars are set:
  - [ ] `LIVEKIT_URL`
  - [ ] `LIVEKIT_API_KEY`
  - [ ] `LIVEKIT_API_SECRET`
  - [ ] `OPENAI_API_KEY`
  - [ ] `RAGIE_API_KEY`
  - [ ] `AWS_S3_BUCKET`
  - [ ] `AWS_S3_REGION`
  - [ ] `AWS_ACCESS_KEY_ID`
  - [ ] `AWS_SECRET_ACCESS_KEY`
  - [ ] `LIVEAVATAR_AVATAR_ID` (or `TAVUS_REPLICA_ID` if using Tavus)

### 4. Python Agent Code Update
**File:** `/Users/justinkroeger/agent-starter-python/src/agent.py`

- [ ] Find line ~406: `next_api_url = "https://interview-app-indol.vercel.app"`
- [ ] Change to: `next_api_url = os.getenv("NEXT_API_URL", "https://yourdomain.com")`
- [ ] **Restart agent** after making this change

---

## 🔗 Third-Party Service Configuration

### 5. Stripe
**Dashboard:** https://dashboard.stripe.com

#### Webhooks:
- [ ] Go to: **Developers** → **Webhooks**
- [ ] Create new webhook (or update existing)
- [ ] Set endpoint URL: `https://yourdomain.com/api/stripe/webhook`
- [ ] Select events:
  - [ ] `checkout.session.completed`
  - [ ] `payment_intent.succeeded`
  - [ ] `payment_intent.payment_failed`
  - [ ] `payment_intent.canceled`
- [ ] **Copy signing secret** → Update `STRIPE_WEBHOOK_SECRET` in Vercel env vars
- [ ] **Redeploy** app after updating webhook secret

#### Test Mode vs Live Mode:
- [ ] Switch to **Live Mode** in Stripe Dashboard (toggle in top-right)
- [ ] Verify you're using live API keys (`sk_live_...`, `pk_live_...`)

---

### 6. Clerk
**Dashboard:** https://dashboard.clerk.com

#### Allowed Origins:
- [ ] Go to: **Settings** → **Advanced** → **Allowed Origins**
- [ ] Add: `https://yourdomain.com`
- [ ] Add: `https://www.yourdomain.com` (if using www)

#### Redirect URLs:
- [ ] Go to: **Settings** → **Paths**
- [ ] Update **Sign-in URL**: `https://yourdomain.com/sign-in`
- [ ] Update **Sign-up URL**: `https://yourdomain.com/sign-up`
- [ ] Update **Home URL**: `https://yourdomain.com`

#### Webhooks (if using):
- [ ] Go to: **Webhooks**
- [ ] Update endpoint: `https://yourdomain.com/api/webhooks/clerk`

#### Production Mode:
- [ ] Switch to **Production** instance (if using separate dev/prod)
- [ ] Verify you're using production keys (`pk_live_...`, `sk_live_...`)

---

### 7. LiveKit
**Dashboard:** https://cloud.livekit.io

- [ ] Go to: Your Project → **Settings** → **Webhooks**
- [ ] Update webhook URL: `https://yourdomain.com/api/webhooks/livekit`
- [ ] Ensure event `egress_ended` is enabled
- [ ] Test webhook connectivity (LiveKit provides test button)

---

### 8. Resend
**Dashboard:** https://resend.com

#### If Using New Domain for Emails:
- [ ] Go to: **Domains** → **Add Domain**
- [ ] Enter: `yourdomain.com`
- [ ] Add DNS records (provided by Resend):
  - [ ] SPF (TXT record)
  - [ ] DKIM (TXT record)
  - [ ] DMARC (TXT record)
- [ ] Wait for verification (5-30 minutes)
- [ ] Update `RESEND_FROM_EMAIL` in Vercel: `Vysa <noreply@yourdomain.com>`
- [ ] **Redeploy** app

#### If Using Existing Email Domain:
- [ ] No changes needed (skip this section)

---

### 9. AWS S3
**Console:** https://console.aws.amazon.com/s3

- [ ] Go to: Your S3 Bucket → **Permissions** → **CORS**
- [ ] Update CORS policy (replace with your domain):

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": [
      "https://yourdomain.com",
      "https://www.yourdomain.com"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

- [ ] **Save changes**

---

## ✅ Testing & Verification

### 10. End-to-End Testing

#### Authentication:
- [ ] Open `https://yourdomain.com` in incognito window
- [ ] Sign up with new test account
- [ ] Sign out
- [ ] Sign in again
- [ ] ✅ No CORS errors in browser console

#### Credit Purchase:
- [ ] Go to `/credits` page
- [ ] Click "Buy Credits" (5 credits pack)
- [ ] Complete Stripe checkout:
  - [ ] Use test card: `4242 4242 4242 4242` (test mode)
  - [ ] Or real card (live mode)
- [ ] Verify redirect to: `https://yourdomain.com/credits/success`
- [ ] Verify credits added to account
- [ ] Check Stripe Dashboard → Webhooks → Logs (should show 200 success)

#### Interview Flow:
- [ ] Start new interview (any visa type)
- [ ] Complete 2-3 minute mock interview
- [ ] End interview
- [ ] Wait 30 seconds
- [ ] Check interview appears in "My Reports"
- [ ] Open report - verify:
  - [ ] Transcript is present
  - [ ] Timestamps are NOT all `00:00`
  - [ ] AI feedback is generated
  - [ ] Recording plays (if available)

#### Email Notifications:
- [ ] Check email inbox (from previous interview)
- [ ] Verify "Report Ready" email received
- [ ] Click link in email
- [ ] Verify link goes to: `https://yourdomain.com/reports/[id]`

#### Agent Logs (Critical):
- [ ] SSH/Access your agent server
- [ ] Check agent logs for:
  - [ ] `✅ Session report successfully sent to API`
  - [ ] `🔍 API URL: https://yourdomain.com`
  - [ ] No 404 or connection errors
- [ ] If errors, verify `NEXT_API_URL` in agent `.env.local`

---

## 🚨 Troubleshooting

### Issue: "Stripe checkout redirects to old domain"
**Fix:**
1. Check `NEXT_PUBLIC_APP_URL` in Vercel env vars
2. Redeploy app
3. Clear browser cache

### Issue: "Cannot sign in - CORS error"
**Fix:**
1. Add domain to Clerk Allowed Origins
2. Clear browser cookies
3. Try incognito mode

### Issue: "Credits not added after purchase"
**Fix:**
1. Check Stripe webhook URL is correct
2. Verify `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
3. Check Stripe webhook logs for errors
4. Redeploy app

### Issue: "Interview reports not generating"
**Fix:**
1. Check agent `agent.py` has correct `NEXT_API_URL`
2. Restart agent server
3. Check agent logs for API connection errors
4. Verify `/api/interviews/session-report` is accessible

### Issue: "Recording won't play"
**Fix:**
1. Check S3 CORS policy includes your domain
2. Check browser console for CORS errors
3. Verify recording exists in S3 bucket

---

## 📊 Monitoring (First 24 Hours)

After going live, monitor these:

- [ ] **Stripe Dashboard** → Webhooks → Check for failed deliveries
- [ ] **Clerk Dashboard** → Users → Verify new sign-ups working
- [ ] **LiveKit Dashboard** → Sessions → Check interview sessions
- [ ] **AWS S3** → Check new recordings uploading
- [ ] **Vercel Logs** → Check for API errors
- [ ] **Agent Logs** → Check for connection errors

---

## 🎉 Success Criteria

Your deployment is successful when:

✅ Users can sign up/sign in at `https://yourdomain.com`  
✅ Users can purchase credits via Stripe  
✅ Credits are added immediately after purchase  
✅ Users can start and complete interviews  
✅ Interview reports generate with correct timestamps  
✅ Email notifications send with correct domain links  
✅ Recordings play without CORS errors  
✅ All webhook logs show 200 success responses  

---

## 📝 Notes

- **DNS Propagation:** Can take 24-48 hours. Use https://dnschecker.org to verify
- **Keep Old Webhooks Active:** For 24 hours during migration, then delete
- **Test in Incognito:** Avoids cache issues
- **Monitor Webhook Logs:** Actively for first 48 hours

---

**Need Help?** See [DOMAIN_UPDATE_GUIDE.md](DOMAIN_UPDATE_GUIDE.md) for detailed explanations.

**Document Version:** 1.0  
**Last Updated:** January 2026

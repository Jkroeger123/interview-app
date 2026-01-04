# Production Domain Update Guide

Complete checklist for updating all domain references when deploying to production with a new domain name.

**Current Development Domain:** `http://localhost:3000` / `https://interview-app-indol.vercel.app`  
**New Production Domain:** `https://yourdomain.com` (replace with your actual domain)

---

## 📋 Table of Contents

1. [Next.js Application Updates](#1-nextjs-application-updates)
2. [Python Agent Updates](#2-python-agent-updates)
3. [Clerk Authentication](#3-clerk-authentication)
4. [Stripe Configuration](#4-stripe-configuration)
5. [LiveKit Cloud](#5-livekit-cloud)
6. [Resend Email Service](#6-resend-email-service)
7. [AWS S3 CORS](#7-aws-s3-cors)
8. [Vercel Deployment](#8-vercel-deployment)
9. [Testing Checklist](#9-testing-checklist)

---

## 1. Next.js Application Updates

### Environment Variables

**File:** `.env.local` (local) or Vercel Environment Variables (production)

#### Update This Variable:

```env
# OLD (development):
NEXT_PUBLIC_APP_URL=http://localhost:3000

# NEW (production):
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

**Where It's Used:**
- Stripe checkout redirect URLs (`success_url`, `cancel_url`)
- Email templates (report links, deletion warnings)
- Any client-side URL generation

**Impact if Not Updated:**
- ❌ Stripe checkout will redirect to wrong domain after payment
- ❌ Email links will point to localhost or old domain
- ❌ OAuth/authentication flows may break

---

### Code Files to Check

#### 1. Email Templates

**Files:**
- `emails/report-ready.tsx`
- `emails/deletion-warning.tsx`

**Current (line 29 in deletion-warning.tsx, line 28 in report-ready.tsx):**
```typescript
reportUrl = "https://vysa.app/reports/123"  // Example/placeholder
```

**Action:** These use `NEXT_PUBLIC_APP_URL` at runtime via `lib/email.ts`, so **no code changes needed** if environment variable is set correctly.

**Verify:**
```typescript
// lib/email.ts (line 9)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
```

This automatically uses the production domain when `NEXT_PUBLIC_APP_URL` is set.

---

#### 2. Clerk Webhook Configuration

**File:** `middleware.ts`

**Current Setup:** Public routes are configured, no domain-specific code.

**Action Required:**
- ✅ No code changes needed
- ⚠️ Update Clerk Dashboard (see [Section 3](#3-clerk-authentication))

---

## 2. Python Agent Updates

### ⚠️ CRITICAL: Hardcoded API URL

**File:** `/Users/justinkroeger/agent-starter-python/src/agent.py`

**Line 501:**
```python
# CURRENT (HARDCODED):
next_api_url = "https://interview-app-indol.vercel.app"
```

**MUST UPDATE TO:**
```python
# OPTION 1: Hardcode new production domain
next_api_url = "https://yourdomain.com"

# OPTION 2 (RECOMMENDED): Use environment variable
next_api_url = os.getenv("NEXT_API_URL", "https://yourdomain.com")
```

**Where It's Used:**
- Line 539: `endpoint = f"{next_api_url}/api/interviews/session-report"`
- Sends session transcript and report data to Next.js API after interview

**Impact if Not Updated:**
- ❌ **CRITICAL**: Interview reports will NOT be generated
- ❌ Transcripts will NOT be saved to database
- ❌ Users will NOT receive email notifications
- ❌ Credits will NOT be deducted properly

---

### Environment Variable Approach (Recommended)

**Add to agent `.env.local`:**
```env
NEXT_API_URL=https://yourdomain.com
```

**Update agent.py (line 501):**
```python
# Get the Next.js API URL from environment
next_api_url = os.getenv("NEXT_API_URL")
if not next_api_url:
    logger.error("❌ NEXT_API_URL environment variable not set!")
    raise ValueError("NEXT_API_URL must be configured")
    
logger.info(f"🔍 API URL: {next_api_url}")
```

---

## 3. Clerk Authentication

### Clerk Dashboard Updates

**URL:** https://dashboard.clerk.com

#### A. Allowed Origins (CORS)

1. Go to **Settings** → **Advanced** → **Allowed Origins**
2. Add your production domain:
   - `https://yourdomain.com`
   - `https://www.yourdomain.com` (if using www)

**Impact if Not Updated:**
- ❌ Sign-in/sign-up will fail with CORS errors
- ❌ Users cannot authenticate

---

#### B. Redirect URLs

1. Go to **Settings** → **Paths**
2. Update redirect URLs:

**Sign-in URL:**
- OLD: `http://localhost:3000/sign-in` or `https://interview-app-indol.vercel.app/sign-in`
- NEW: `https://yourdomain.com/sign-in`

**Sign-up URL:**
- OLD: `http://localhost:3000/sign-up`
- NEW: `https://yourdomain.com/sign-up`

**Home URL:**
- OLD: `http://localhost:3000`
- NEW: `https://yourdomain.com`

---

#### C. Webhook Endpoints (if using Clerk webhooks)

1. Go to **Webhooks**
2. Update endpoint URL:
   - OLD: `https://interview-app-indol.vercel.app/api/webhooks/clerk`
   - NEW: `https://yourdomain.com/api/webhooks/clerk`

---

## 4. Stripe Configuration

### Stripe Dashboard Updates

**URL:** https://dashboard.stripe.com

#### A. Webhook Endpoints

1. Go to **Developers** → **Webhooks**
2. Click on your webhook (or create new)
3. Update **Endpoint URL:**
   - OLD: `https://interview-app-indol.vercel.app/api/stripe/webhook`
   - NEW: `https://yourdomain.com/api/stripe/webhook`

**Events to Listen For:**
- ✅ `checkout.session.completed`
- ✅ `payment_intent.succeeded`
- ✅ `payment_intent.payment_failed`
- ✅ `payment_intent.canceled`

4. **Copy the new Signing Secret** → Update `STRIPE_WEBHOOK_SECRET` in environment variables

**Impact if Not Updated:**
- ❌ Credits will NOT be added after purchase
- ❌ Payment confirmations will NOT sync to database
- ❌ Webhook logs will show 404 errors

---

#### B. Checkout Success/Cancel URLs

**No Code Changes Needed!** These URLs are dynamically generated using `NEXT_PUBLIC_APP_URL`:

**File:** `app/api/stripe/checkout/route.ts` (lines 97-98)
```typescript
success_url: `${process.env.NEXT_PUBLIC_APP_URL}/credits/success?session_id={CHECKOUT_SESSION_ID}`,
cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/credits`,
```

**Action:** Just ensure `NEXT_PUBLIC_APP_URL` is set correctly in production environment.

---

## 5. LiveKit Cloud

### LiveKit Dashboard Updates

**URL:** https://cloud.livekit.io

#### A. Webhook Configuration

1. Go to your project → **Settings** → **Webhooks**
2. Update webhook URL:
   - OLD: `https://interview-app-indol.vercel.app/api/webhooks/livekit`
   - NEW: `https://yourdomain.com/api/webhooks/livekit`

**Events:**
- `egress_ended` (for recording completion)

**Impact if Not Updated:**
- ❌ Recording URLs will NOT be saved to database
- ❌ S3 uploads will NOT be tracked

---

#### B. CORS Configuration (if applicable)

If LiveKit requires CORS configuration:
1. Go to **Settings** → **CORS**
2. Add allowed origins:
   - `https://yourdomain.com`
   - `https://www.yourdomain.com`

---

## 6. Resend Email Service

### Resend Dashboard Updates

**URL:** https://resend.com/domains

#### A. Domain Verification

**If using a new domain for emails:**

1. **Add Your Domain:**
   - Go to: **Domains** → **Add Domain**
   - Enter: `yourdomain.com`

2. **Add DNS Records** (provided by Resend):
   - SPF record (TXT)
   - DKIM record (TXT)
   - DMARC record (TXT)
   - MX records (if you want to receive emails)

3. **Wait for Verification** (5-30 minutes)

4. **Update Environment Variable:**
   ```env
   RESEND_FROM_EMAIL=Vysa <noreply@yourdomain.com>
   ```

**Impact if Not Updated:**
- ❌ Emails will be sent from old domain (may look unprofessional)
- ❌ SPF/DKIM authentication may fail (emails marked as spam)

---

#### B. Webhook Configuration (optional)

If using Resend webhooks for email tracking:
1. Go to **Webhooks**
2. Update endpoint:
   - OLD: `https://interview-app-indol.vercel.app/api/webhooks/resend`
   - NEW: `https://yourdomain.com/api/webhooks/resend`

---

## 7. AWS S3 CORS

### Update S3 Bucket CORS Policy

**When Needed:** If your frontend directly accesses S3 (e.g., playing recordings)

**AWS Console:** S3 → Your Bucket → Permissions → CORS

**Current CORS Policy:**
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://interview-app-indol.vercel.app"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

**Updated CORS Policy:**
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

**Impact if Not Updated:**
- ❌ Browser will block S3 requests (CORS error)
- ❌ Recording playback will fail

---

## 8. Vercel Deployment

### Domain Configuration

1. **Add Custom Domain in Vercel:**
   - Go to: Project → **Settings** → **Domains**
   - Click **Add Domain**
   - Enter: `yourdomain.com` and `www.yourdomain.com`

2. **Update DNS Records** (at your domain registrar):
   - **A Record** or **CNAME** as provided by Vercel
   - Example:
     - Type: `A`
     - Name: `@`
     - Value: `76.76.21.21` (Vercel's IP)
     
     - Type: `CNAME`
     - Name: `www`
     - Value: `cname.vercel-dns.com`

3. **Wait for SSL Certificate** (automatic, takes ~60 seconds)

---

### Environment Variables

**Vercel Dashboard:** Project → **Settings** → **Environment Variables**

**Update These Variables for Production:**

```env
# App URL (CRITICAL)
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Stripe (verify these are set)
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_... (NEW secret from Step 4)

# Resend (update if using new domain)
RESEND_FROM_EMAIL=Vysa <noreply@yourdomain.com>

# All other existing variables (no changes needed)
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
# ... etc
```

**How to Update:**
1. Go to environment variable
2. Click **Edit**
3. Update value
4. **Redeploy** for changes to take effect

---

## 9. Testing Checklist

After updating all domain references, test these critical flows:

### Authentication
- [ ] Sign up with new account
- [ ] Sign in with existing account
- [ ] Sign out
- [ ] Password reset (if applicable)

### Credit Purchase
- [ ] Navigate to `/credits` page
- [ ] Click "Buy Credits"
- [ ] Complete Stripe checkout (use test card in test mode)
- [ ] Verify redirect back to `https://yourdomain.com/credits/success`
- [ ] Check that credits were added to account
- [ ] Check Stripe webhook logs (should show 200 success)

### Interview Flow
- [ ] Configure interview
- [ ] Start interview
- [ ] Complete interview
- [ ] Verify session report sent to API (check agent logs)
- [ ] Verify report generated in dashboard
- [ ] Verify email notification received

### Email Links
- [ ] Receive report ready email
- [ ] Click link in email
- [ ] Verify it goes to `https://yourdomain.com/reports/[id]`
- [ ] Check deletion warning email (if applicable)

### Recording Access
- [ ] Open interview report
- [ ] Play recording video
- [ ] Verify no CORS errors in browser console

### LiveKit Webhooks
- [ ] Complete an interview
- [ ] Check LiveKit webhook logs in dashboard
- [ ] Verify `egress_ended` event sent to correct URL
- [ ] Verify recording URL saved in database

---

## 📝 Quick Reference: All URLs to Update

| Service | What to Update | Old Value | New Value |
|---------|---------------|-----------|-----------|
| **Vercel Env** | `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | `https://yourdomain.com` |
| **Agent .env** | `NEXT_API_URL` | `https://interview-app-indol.vercel.app` | `https://yourdomain.com` |
| **Agent Code** | Line 501 in `agent.py` | `"https://interview-app-indol.vercel.app"` | `"https://yourdomain.com"` |
| **Clerk** | Allowed Origins | Old domain | `https://yourdomain.com` |
| **Clerk** | Sign-in URL | Old domain | `https://yourdomain.com/sign-in` |
| **Clerk** | Webhook | Old domain | `https://yourdomain.com/api/webhooks/clerk` |
| **Stripe** | Webhook URL | Old domain | `https://yourdomain.com/api/stripe/webhook` |
| **LiveKit** | Webhook URL | Old domain | `https://yourdomain.com/api/webhooks/livekit` |
| **Resend** | From Email | Old domain | `noreply@yourdomain.com` |
| **AWS S3** | CORS Origins | Old domain | `https://yourdomain.com` |

---

## 🚨 Critical Path (Don't Skip These!)

These updates will break core functionality if not completed:

1. ✅ **Agent `agent.py` line 501** - Interview reports will NOT work
2. ✅ **`NEXT_PUBLIC_APP_URL`** - Stripe redirects and emails will fail
3. ✅ **Stripe Webhook URL** - Credits will NOT be added after purchase
4. ✅ **Clerk Allowed Origins** - Users cannot sign in
5. ✅ **LiveKit Webhook URL** - Recordings will NOT be tracked

---

## 🔄 Deployment Order

**Recommended sequence to minimize downtime:**

1. **Update DNS** (point domain to Vercel) - *do this first, may take time to propagate*
2. **Update Vercel Environment Variables** (especially `NEXT_PUBLIC_APP_URL`)
3. **Deploy Next.js app** to Vercel with new env vars
4. **Update Python Agent** (`agent.py` + `.env.local`)
5. **Restart Agent Server** with new configuration
6. **Update Clerk Dashboard** (allowed origins, redirects)
7. **Update Stripe Webhook** (URL + get new signing secret)
8. **Update LiveKit Webhook** URL
9. **Update Resend Domain** (if using new email domain)
10. **Update S3 CORS** (if needed)
11. **Run Testing Checklist** above

---

## 💡 Pro Tips

1. **Keep Old Webhooks Active Temporarily:**
   - When updating Stripe/LiveKit webhooks, create a NEW webhook instead of editing the old one
   - Keep both active for 24 hours during migration
   - Delete old webhook after confirming new one works

2. **Use Environment Variables Everywhere:**
   - Avoid hardcoding URLs in code
   - Makes future domain changes much easier

3. **Test in Staging First:**
   - If possible, use a staging domain (e.g., `staging.yourdomain.com`)
   - Test all flows before switching production

4. **Monitor Webhook Logs:**
   - After going live, actively monitor webhook logs for 24-48 hours
   - Look for 404s or failed deliveries

5. **DNS Propagation:**
   - DNS changes can take 24-48 hours to fully propagate
   - Use https://dnschecker.org to verify propagation

---

## ❓ Troubleshooting

### "Stripe checkout redirects to old domain"
→ Check `NEXT_PUBLIC_APP_URL` in Vercel environment variables  
→ Redeploy after updating

### "Interview reports not generating"
→ Check agent `agent.py` line 501 has correct domain  
→ Verify agent can reach `https://yourdomain.com/api/interviews/session-report`  
→ Check agent logs for API errors

### "Cannot sign in - CORS error"
→ Update Clerk Allowed Origins to include new domain  
→ Clear browser cache and cookies

### "Credits not added after purchase"
→ Check Stripe webhook URL points to new domain  
→ Update `STRIPE_WEBHOOK_SECRET` with new secret  
→ Check Stripe webhook logs for delivery failures

### "Emails have broken links"
→ Verify `NEXT_PUBLIC_APP_URL` is set correctly  
→ Redeploy application  
→ Send test email to verify

---

## 📞 Support Resources

- **Clerk:** https://clerk.com/docs
- **Stripe:** https://stripe.com/docs/webhooks
- **LiveKit:** https://docs.livekit.io/cloud/webhooks
- **Resend:** https://resend.com/docs
- **Vercel:** https://vercel.com/docs/concepts/projects/domains

---

**Document Version:** 1.0  
**Last Updated:** January 2026  
**Created for:** Interview App Production Deployment


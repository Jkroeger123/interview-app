# Stripe Credit Billing - Testing Guide

Comprehensive testing procedures for the credit billing system.

## Prerequisites

Before testing, ensure:
- ✅ All environment variables are set (see `STRIPE_SETUP_GUIDE.md`)
- ✅ Stripe products and prices are created
- ✅ Webhook endpoint is configured
- ✅ Database schema is migrated
- ✅ Development server is running (`npm run dev`)
- ✅ Stripe CLI is running (for local testing)

## Test 1: Initial User State

**Goal**: Verify new users start with 0 credits

**Steps**:
1. Create a new account or use incognito mode
2. Sign in
3. Check navbar credit widget
4. Navigate to `/credits`

**Expected**:
- ✅ Navbar shows "0 credits"
- ✅ Credits page shows balance of 0
- ✅ Transaction history is empty
- ✅ Three credit packs are displayed

## Test 2: Purchase Credits (Success Flow)

**Goal**: Verify successful credit purchase

**Steps**:
1. Navigate to `/credits`
2. Click "Buy 10 Credits" on Starter Pack
3. Redirected to Stripe Checkout
4. Fill in test card:
   - Card: `4242 4242 4242 4242`
   - Expiry: `12/34`
   - CVC: `123`
   - ZIP: `12345`
5. Click "Pay"
6. Redirected back to app

**Expected**:
- ✅ Redirected to `/credits` page
- ✅ Balance shows 10 credits immediately
- ✅ Transaction history shows purchase
- ✅ Navbar shows "10 credits"
- ✅ Console logs show eager sync
- ✅ Stripe CLI shows webhook received

**Database Verification**:
```sql
-- Check user credits
SELECT credits, "stripeCustomerId" FROM "User" WHERE "clerkId" = 'your_clerk_id';

-- Check purchase record
SELECT * FROM "Purchase" WHERE "userId" = 'your_user_id';

-- Check ledger
SELECT * FROM "CreditLedger" WHERE "userId" = 'your_user_id' ORDER BY "createdAt" DESC;
```

## Test 3: Purchase Credits (Multiple Packs)

**Goal**: Verify credit accumulation

**Steps**:
1. Purchase 10 credits (balance: 10)
2. Purchase 50 credits (balance: 60)
3. Purchase 100 credits (balance: 160)

**Expected**:
- ✅ Credits accumulate correctly (10 → 60 → 160)
- ✅ Each purchase creates ledger entry
- ✅ Balance is accurate after each purchase
- ✅ Transaction history shows all purchases

## Test 4: Start Interview with Sufficient Credits

**Goal**: Verify credit deduction on interview start

**Steps**:
1. Ensure balance has at least 10 credits
2. Navigate to interview configuration
3. Select "Standard - 10 minutes" (10 credits)
4. Start interview

**Expected**:
- ✅ Interview starts successfully
- ✅ 10 credits are deducted
- ✅ Balance updates immediately
- ✅ Ledger shows deduction entry
- ✅ Interview record has `creditsUsed: 10`

**API Response Check** (Dev Tools Network tab):
```json
{
  "serverUrl": "wss://...",
  "roomName": "interview_...",
  "participantToken": "...",
  "participantName": "...",
  "interviewId": "uuid"
}
```

## Test 5: Start Interview with Insufficient Credits

**Goal**: Verify interview is blocked without enough credits

**Steps**:
1. Ensure balance is < 10 (e.g., 5 credits)
2. Try to start "Standard - 10 minutes" interview

**Expected**:
- ✅ Interview does NOT start
- ✅ API returns 402 Payment Required
- ✅ Error message shows:
  - Required: 10
  - Available: 5
  - Message: "You need 10 credits..."
- ✅ No credits deducted
- ✅ User shown error/redirect to buy credits

**API Response** (should be 402):
```json
{
  "error": "Insufficient credits",
  "required": 10,
  "available": 5,
  "message": "You need 10 credits for this interview, but only have 5..."
}
```

## Test 6: Different Interview Durations

**Goal**: Verify correct credit amounts for different durations

**Test Cases**:

| Duration | Credits | Test |
|----------|---------|------|
| Quick (5 min) | 5 | Start with 5+ credits |
| Standard (10 min) | 10 | Start with 10+ credits |
| Comprehensive (15 min) | 15 | Start with 15+ credits |

**Expected**:
- ✅ Each duration deducts correct amount
- ✅ Ledger description shows duration
- ✅ Interview record has correct `creditsUsed`

## Test 7: Failed Purchase (Declined Card)

**Goal**: Verify failed payment handling

**Steps**:
1. Try to purchase credits
2. Use declined card: `4000 0000 0000 0002`
3. Complete payment

**Expected**:
- ✅ Payment fails at Stripe
- ✅ User NOT charged
- ✅ Credits NOT added
- ✅ No purchase record created
- ✅ User can retry

## Test 8: Webhook Reliability

**Goal**: Verify webhooks sync data correctly

**Steps**:
1. Make a purchase
2. Immediately navigate away (don't wait for redirect)
3. Wait 5-10 seconds
4. Check credit balance

**Expected**:
- ✅ Credits appear even if user navigated away
- ✅ Webhook synced the data
- ✅ Stripe logs show successful webhook delivery

## Test 9: Credit Refund on Interview Failure

**Goal**: Verify credits are restored if interview creation fails

**Steps** (requires code modification for testing):
1. Temporarily break interview creation (e.g., invalid room name)
2. Try to start interview with 10 credits
3. Interview creation fails

**Expected**:
- ✅ Credits are deducted initially
- ✅ Credits are RESTORED when interview fails
- ✅ Ledger shows deduction + refund
- ✅ User balance is unchanged
- ✅ No interview record created

## Test 10: Concurrent Purchases

**Goal**: Verify race condition handling

**Steps**:
1. Open two browser tabs
2. Initiate purchase in both tabs simultaneously
3. Complete both payments

**Expected**:
- ✅ Both purchases succeed
- ✅ Credits from both purchases are added
- ✅ No duplicate payment processing
- ✅ All transactions recorded

## Test 11: Credit Balance Widget

**Goal**: Verify navbar widget works correctly

**Steps**:
1. Purchase credits
2. Check navbar immediately
3. Start an interview
4. Check navbar again

**Expected**:
- ✅ Widget updates after purchase
- ✅ Widget updates after interview start
- ✅ Widget is clickable and links to `/credits`
- ✅ Widget shows loading state initially

## Test 12: Transaction History

**Goal**: Verify audit trail is complete

**Steps**:
1. Purchase 10 credits
2. Start an interview (deduct 10)
3. Purchase 50 more credits
4. Check transaction history

**Expected**:
- ✅ All transactions appear in order
- ✅ Purchases show as positive (+10, +50)
- ✅ Deductions show as negative (-10)
- ✅ Running balance is accurate
- ✅ Descriptions are clear
- ✅ Timestamps are correct

## Test 13: Stripe Dashboard Verification

**Goal**: Verify Stripe data is correct

**Check in Stripe Dashboard**:
1. **Payments** tab:
   - ✅ Payment shows as succeeded
   - ✅ Amount is correct ($10, $50, or $100)

2. **Customers** tab:
   - ✅ Customer exists
   - ✅ Email matches user
   - ✅ Metadata includes `userId` and `clerkId`

3. **Events** tab:
   - ✅ `payment_intent.succeeded` event exists
   - ✅ Metadata includes `credits` field

4. **Webhooks** tab:
   - ✅ Webhook attempts show success (green checkmark)
   - ✅ Response is 200 OK
   - ✅ No failed deliveries

## Test 14: Popular Pack Badge

**Goal**: Verify UI indicates most popular pack

**Steps**:
1. Navigate to `/credits`
2. Look at the 3 credit packs

**Expected**:
- ✅ "Pro Pack" (50 credits) has "Most Popular" badge
- ✅ Badge is visually prominent
- ✅ Border is highlighted (blue)

## Test 15: Error Handling

**Test Cases**:

| Scenario | Expected Behavior |
|----------|-------------------|
| No internet during checkout | Stripe shows error, user can retry |
| Webhook fails | Eager sync ensures credits appear |
| API timeout | User sees error message |
| Invalid pack ID | 400 error, user not charged |
| Missing price ID | 500 error, clear message |

## Performance Tests

### Test 16: Page Load Performance

**Goal**: Verify credit page loads fast

**Steps**:
1. Navigate to `/credits`
2. Measure load time

**Expected**:
- ✅ Page loads in < 2 seconds
- ✅ Credit packs render immediately
- ✅ Transaction history appears quickly

### Test 17: Checkout Redirect Speed

**Goal**: Verify checkout is fast

**Steps**:
1. Click "Buy Credits"
2. Measure time to Stripe Checkout

**Expected**:
- ✅ Redirect happens in < 3 seconds
- ✅ Loading indicator is shown
- ✅ Button is disabled during loading

## Security Tests

### Test 18: Authorization

**Goal**: Verify endpoints require authentication

**Steps**:
1. Sign out
2. Try to access:
   - `/api/stripe/checkout` (POST)
   - `/api/credits/balance` (GET)
   - `/credits` page

**Expected**:
- ✅ API endpoints return 401 Unauthorized
- ✅ `/credits` page redirects to sign-in
- ✅ No credit data exposed

### Test 19: Price Tampering

**Goal**: Verify client can't manipulate prices

**Steps**:
1. Open Dev Tools
2. Modify `packId` in checkout request
3. Try to purchase

**Expected**:
- ✅ Server validates pack ID
- ✅ Correct price is charged
- ✅ Correct credits are added
- ✅ User can't buy credits at wrong price

## Regression Tests

After any code changes, run these critical tests:

- [ ] Purchase credits successfully
- [ ] Credits appear immediately
- [ ] Start interview deducts credits
- [ ] Insufficient credits blocks interview
- [ ] Transaction history is accurate
- [ ] Navbar widget updates correctly

## Bug Report Template

If you find an issue:

```markdown
**Bug**: [Brief description]

**Steps to Reproduce**:
1. ...
2. ...

**Expected**: ...
**Actual**: ...

**Environment**:
- Mode: Development / Production
- Browser: ...
- User ID: ...

**Logs**:
[Paste relevant console logs]

**Database State**:
[Paste relevant DB queries]
```

## Success Criteria

All tests should pass before deploying to production:

- ✅ Credit purchases work 100% of the time
- ✅ Credits appear immediately (< 2 seconds)
- ✅ Interview deduction is accurate
- ✅ Insufficient credits are handled gracefully
- ✅ Webhooks deliver successfully
- ✅ No race conditions in concurrent operations
- ✅ All transactions recorded in ledger
- ✅ Stripe dashboard shows correct data
- ✅ No security vulnerabilities
- ✅ Performance is acceptable (< 3s page loads)

## Automated Testing (Future)

Consider adding:
- Unit tests for credit operations
- Integration tests for Stripe API
- E2E tests for purchase flow
- Webhook simulation tests




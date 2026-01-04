# Stripe Credit Billing - Architecture Documentation

Technical documentation for developers maintaining the credit billing system.

## Philosophy

This implementation follows the "stay sane with Stripe" philosophy:

1. **Single Source of Truth**: One `syncStripeDataToPrisma()` function handles all credit syncing
2. **Eager Sync + Webhook Backup**: Sync immediately on success page, webhook provides redundancy
3. **Customer First**: Always create Stripe customer BEFORE checkout
4. **Idempotency**: Same payment never processed twice
5. **Audit Trail**: Every credit change logged in `CreditLedger`
6. **Atomic Operations**: Use Prisma transactions for credit operations
7. **Simplicity**: One-time payments only, no subscriptions

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  │
│  │ Credit Pack   │  │ Credit        │  │ Transaction   │  │
│  │ Card          │  │ Balance       │  │ History       │  │
│  └───────┬───────┘  └───────────────┘  └───────────────┘  │
│          │                                                  │
│          │ POST /api/stripe/checkout                       │
│          ▼                                                  │
└──────────┼──────────────────────────────────────────────────┘
           │
┌──────────┼──────────────────────────────────────────────────┐
│          │              Backend                             │
├──────────┼──────────────────────────────────────────────────┤
│          ▼                                                   │
│  ┌────────────────────┐                                     │
│  │ Checkout Endpoint  │                                     │
│  │ - Get/Create       │                                     │
│  │   Customer         │                                     │
│  │ - Create Session   │                                     │
│  └────────┬───────────┘                                     │
│           │                                                  │
│           │ Redirect to Stripe Checkout                     │
│           ▼                                                  │
└───────────┼──────────────────────────────────────────────────┘
            │
┌───────────┼──────────────────────────────────────────────────┐
│           │           Stripe                                 │
├───────────┼──────────────────────────────────────────────────┤
│           ▼                                                   │
│  ┌────────────────────┐                                      │
│  │ Checkout Session   │                                      │
│  │ - User pays        │                                      │
│  │ - Payment intent   │                                      │
│  │   created          │                                      │
│  └────────┬───────────┘                                      │
│           │                                                   │
│           ├──────────────┬────────────────────┐              │
│           │              │                    │              │
└───────────┼──────────────┼────────────────────┼──────────────┘
            │              │                    │
            │              │                    │
    Success │              │ Webhook            │ Cancel
    Redirect│              │ (async)            │ Redirect
            │              │                    │
┌───────────▼──────────────▼────────────────────▼──────────────┐
│                      Backend                                  │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────┐    ┌──────────────────┐                │
│  │ Success Page    │    │ Webhook Handler  │                │
│  │ - Eager sync    │    │ - Verify sig     │                │
│  │ - Immediate     │    │ - Call sync      │                │
│  │   credits       │    │ - Redundancy     │                │
│  └────────┬────────┘    └────────┬─────────┘                │
│           │                      │                           │
│           └──────────┬───────────┘                           │
│                      │                                        │
│                      ▼                                        │
│          ┌──────────────────────┐                            │
│          │ syncStripeDataToPrisma│                            │
│          │ - Fetch payments      │                            │
│          │ - Check existing      │                            │
│          │ - Create Purchase     │                            │
│          │ - Add credits         │                            │
│          │ - Create ledger       │                            │
│          └──────────┬───────────┘                            │
│                     │                                         │
│                     ▼                                         │
│          ┌─────────────────────┐                             │
│          │ Prisma Database     │                             │
│          │ - User (credits)    │                             │
│          │ - Purchase          │                             │
│          │ - CreditLedger      │                             │
│          └─────────────────────┘                             │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

## Data Flow

### Purchase Flow

```
1. User clicks "Buy Credits"
   → POST /api/stripe/checkout

2. Checkout Endpoint:
   → Get user from Prisma (or create)
   → Get/Create Stripe customer
   → Save stripeCustomerId to User
   → Create Checkout Session with metadata:
      - userId
      - credits
      - packId
   → Return checkout URL

3. User redirects to Stripe Checkout
   → User enters payment info
   → Stripe processes payment

4A. Success Path:
   → Redirect to /credits/success?session_id={id}
   → Success Page calls syncStripeDataToPrisma()
   → Credits appear IMMEDIATELY
   → Redirect to /credits

4B. Webhook Path (async):
   → Stripe sends webhook event
   → POST /api/stripe/webhook
   → Verify signature
   → Extract customer ID
   → Call syncStripeDataToPrisma()
   → Backup sync (in case user closed browser)

5. syncStripeDataToPrisma():
   → Fetch all payment intents for customer
   → For each succeeded payment:
      → Check if already in Purchase table
      → If new:
         → Create Purchase record
         → Increment User.credits
         → Create CreditLedger entry
   → Return updated credits
```

### Interview Start Flow

```
1. User clicks "Start Interview"
   → POST /api/livekit/connection-details

2. Connection Details Endpoint:
   → Get user from Prisma (with credits)
   → Determine credits required (based on duration)
   → Check: user.credits >= creditsRequired
   
3A. Sufficient Credits:
   → Start transaction:
      → Deduct credits (User.credits -= required)
      → Create CreditLedger entry (type: deduction)
      → Store ledgerEntry.id
   → Create Interview record (with creditsUsed)
   → Update ledger entry with interviewId
   → Create LiveKit room
   → Start recording
   → Return connection details

3B. Insufficient Credits:
   → Return 402 Payment Required
   → Response includes:
      - error: "Insufficient credits"
      - required: X
      - available: Y
      - message: "You need X credits..."
   → Frontend redirects to /credits

4. If Interview Creation Fails:
   → Start refund transaction:
      → Restore credits (User.credits += required)
      → Create CreditLedger entry (type: refund)
   → Return error
```

## Database Schema

### User Table Extensions

```prisma
model User {
  // ... existing fields
  
  stripeCustomerId String? @unique  // Link to Stripe customer
  credits          Int @default(0)  // Current balance
  
  purchases    Purchase[]
  creditLedger CreditLedger[]
}
```

### Purchase Table

Tracks all Stripe purchases:

```prisma
model Purchase {
  id                      String @id @default(uuid())
  userId                  String
  stripePaymentIntentId   String @unique  // From Stripe
  stripeCheckoutSessionId String? @unique // From Stripe
  amount                  Int             // Cents ($10 = 1000)
  credits                 Int             // Credits purchased
  status                  String          // completed/failed/refunded
  createdAt               DateTime
  updatedAt               DateTime
}
```

### CreditLedger Table

Complete audit trail:

```prisma
model CreditLedger {
  id          String @id @default(uuid())
  userId      String
  amount      Int         // +credits or -credits
  balance     Int         // Balance after transaction
  type        String      // purchase/deduction/refund/admin_adjustment
  description String?     // Human-readable description
  referenceId String?     // Interview ID or Payment Intent ID
  createdAt   DateTime
}
```

**Example Ledger Entries**:

```
| amount | balance | type      | description                  | referenceId     |
|--------|---------|-----------|------------------------------|-----------------|
| +10    | 10      | purchase  | Purchased 10 credits         | pi_xxxxx        |
| -10    | 0       | deduction | Interview: Student (10 min)  | interview_xxxxx |
| +50    | 50      | purchase  | Purchased 50 credits         | pi_yyyyy        |
| -5     | 45      | deduction | Interview: Tourist (5 min)   | interview_yyyyy |
| +10    | 55      | refund    | Refund: Interview failed     | interview_zzzzz |
```

### Interview Table Extension

```prisma
model Interview {
  // ... existing fields
  
  creditsUsed Int?  // Track cost of this interview
}
```

## Core Functions

### syncStripeDataToPrisma(customerId)

**Purpose**: Single source of truth for syncing Stripe payments to Prisma

**Called From**:
- Success page (eager sync)
- Webhook handler (backup sync)

**Logic**:
```typescript
1. Fetch user by stripeCustomerId
2. Fetch all payment intents from Stripe (limit: 100)
3. For each succeeded payment intent:
   - Check if already in Purchase table
   - If new:
     - Start transaction:
       - Create Purchase record
       - Increment User.credits
       - Create CreditLedger entry
     - Commit transaction
4. Return updated user with credits
```

**Why This Works**:
- Idempotent: Won't process same payment twice
- Atomic: Transaction ensures consistency
- Complete: Processes all payments
- Simple: One function, one flow

## Idempotency

**Problem**: Webhooks can be delivered multiple times. Users might refresh success page.

**Solution**: Check if payment already processed:

```typescript
const existing = await prisma.purchase.findUnique({
  where: { stripePaymentIntentId: intent.id },
});

if (existing) {
  // Already processed, skip
  continue;
}
```

**Result**: Same payment never adds credits twice.

## Error Handling

### Purchase Errors

| Error | Handling |
|-------|----------|
| Customer creation fails | Return 500, user can retry |
| Checkout session fails | Return 500, user can retry |
| Payment declined | Stripe handles, user sees error |
| Success page sync fails | Webhook provides backup |
| Webhook fails | Success page already synced |

### Interview Start Errors

| Error | Handling |
|-------|----------|
| Insufficient credits | Return 402, show purchase page |
| Credit deduction fails | Return 500, no interview created |
| Interview creation fails | Refund credits, return 500 |
| Room creation fails | Credits already deducted (consider adding refund) |

## Security Considerations

### Implemented

1. **Webhook Signature Verification**:
   ```typescript
   const event = stripe.webhooks.constructEvent(
     body,
     signature,
     process.env.STRIPE_WEBHOOK_SECRET!
   );
   ```

2. **Server-Side Validation**:
   - Pack IDs validated on server
   - Prices come from Stripe, not client
   - Credit checks on server

3. **Authentication**:
   - All endpoints require Clerk auth
   - UserId validated before operations

4. **Prisma Transactions**:
   - Credits never inconsistent
   - All-or-nothing operations

### Not Yet Implemented (Future)

- Rate limiting on checkout endpoint
- IP-based fraud detection
- Maximum credits per user
- Suspicious activity alerts

## Performance Considerations

### Database Queries

**Optimized**:
- Credit balance: Single query with select
- Transaction history: Indexed by userId, createdAt
- Purchase lookup: Unique index on stripePaymentIntentId

**Potential Improvements**:
- Cache credit balance in Redis
- Paginate transaction history
- Lazy load old transactions

### API Response Times

**Measured**:
- Credit balance API: ~50ms
- Checkout creation: ~200ms
- Success page sync: ~500ms (Stripe API call)
- Webhook processing: ~500ms

**Acceptable Because**:
- Not in critical path (interviews)
- Eager sync makes perceived time instant
- Webhooks are async

## Monitoring & Debugging

### Key Metrics to Track

1. **Revenue**:
   - Total purchases per day
   - Revenue per pack
   - Average purchase size

2. **Technical**:
   - Webhook success rate (should be ~100%)
   - Sync function execution time
   - Failed payment rate
   - Credit deduction failures

3. **User Behavior**:
   - Credits per user
   - Purchase frequency
   - Interview completion rate
   - Credit utilization

### Logs to Monitor

**Good Logs**:
```
✅ Created Stripe customer: cus_xxxxx
💰 Processing payment intent pi_xxxxx: 10 credits
🎉 Sync complete! Added 10 credits. Final balance: 10
💳 Credits check - Required: 10, Available: 10
```

**Bad Logs**:
```
❌ User not found for Stripe customer: cus_xxxxx
❌ Error deducting credits: ...
⚠️ Insufficient credits (need 10, have 5)
```

### Debugging Checklist

**Credits don't appear**:
1. Check success page logs (was sync called?)
2. Check webhook logs in Stripe (was webhook delivered?)
3. Check Purchase table (is record there?)
4. Check payment intent metadata (has credits field?)

**Credits deducted but interview failed**:
1. Check for refund ledger entry
2. Check interview creation logs
3. Verify credit balance restored

**Webhook failures**:
1. Check webhook signature is correct
2. Verify endpoint URL is accessible
3. Check for errors in webhook handler logs

## Testing Strategy

### Unit Tests (Future)

- `syncStripeDataToPrisma()` with mock Stripe
- Credit deduction logic
- Refund logic
- Ledger entry creation

### Integration Tests (Future)

- Full purchase flow with test card
- Interview deduction
- Webhook delivery
- Concurrent purchases

### Manual Testing (Current)

See `STRIPE_TESTING_GUIDE.md` for comprehensive test cases.

## Scaling Considerations

### Current Limits

- 100 payment intents per sync (Stripe API limit)
- No pagination on transaction history
- No caching of credit balance

### Future Scaling

**If we have users with >100 purchases**:
```typescript
// Paginate Stripe API calls
let hasMore = true;
let startingAfter = undefined;

while (hasMore) {
  const paymentIntents = await stripe.paymentIntents.list({
    customer: customerId,
    limit: 100,
    starting_after: startingAfter,
  });
  
  // Process payments...
  
  hasMore = paymentIntents.has_more;
  startingAfter = paymentIntents.data[paymentIntents.data.length - 1]?.id;
}
```

**If transaction history gets slow**:
- Implement pagination (skip/take)
- Add infinite scroll
- Archive old transactions

**If credit balance queries get slow**:
- Cache in Redis (invalidate on changes)
- Add read replica
- Denormalize into faster table

## Design Decisions

### Why One-Time Payments?

**Reasons**:
- Simpler to implement
- User-friendly (no recurring charges)
- No cancellation flow needed
- Credits never expire (good UX)
- Pay-as-you-go model

**Trade-offs**:
- Lower recurring revenue
- More transaction fees
- User needs to repurchase

### Why Credits Never Expire?

**Reasons**:
- Better user experience
- No complex expiration logic
- No refund requests for expired credits
- Encourages larger purchases

**Trade-offs**:
- Users might buy once and use slowly
- Lower repurchase frequency

### Why $1 Per Credit?

**Reasons**:
- Simple to understand
- Easy math (5 min = $5)
- No complex pricing tiers
- Transparent pricing

**Trade-offs**:
- Less flexibility for promotions
- Can't offer discounts easily

### Why CreditLedger Table?

**Reasons**:
- Complete audit trail
- Easier debugging
- Financial compliance
- Can show transaction history

**Trade-offs**:
- Extra database writes
- Table grows over time
- Slight performance overhead

## Future Enhancements

1. **Promotional Codes**:
   - Apply discount on checkout
   - Store promo code in Purchase
   - Track promo effectiveness

2. **Referral Bonuses**:
   - Give credits for referrals
   - Track referral source
   - Add `referral` type to ledger

3. **Subscription Plans**:
   - Monthly credit allowance
   - Rollover unused credits
   - Subscription management UI

4. **Credit Bundles**:
   - Buy X get Y free
   - Limited time offers
   - Flash sales

5. **Refund Handling**:
   - Handle Stripe refund webhooks
   - Deduct refunded credits
   - Update Purchase status

6. **Admin Panel**:
   - Manually adjust credits
   - View user transactions
   - Issue refunds
   - Generate reports

## Conclusion

This architecture provides:
- ✅ Reliable credit purchases
- ✅ Immediate credit availability
- ✅ Complete audit trail
- ✅ Idempotent operations
- ✅ Atomic transactions
- ✅ Simple pricing
- ✅ Easy to debug

The "single sync function" philosophy makes the system:
- Easy to understand
- Easy to debug
- Easy to maintain
- Hard to break

Follow this architecture when adding new features to maintain consistency and reliability.




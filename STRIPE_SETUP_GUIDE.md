# Stripe Setup Guide

Complete guide for setting up Stripe credit billing in production and development.

## Prerequisites

- A Stripe account (https://stripe.com)
- Access to your `.env.local` file
- Admin access to your Stripe Dashboard

## Step 1: Get Your API Keys

### Development (Test Mode)

1. Log in to Stripe Dashboard: https://dashboard.stripe.com/test/dashboard
2. Click **Developers** → **API keys**
3. Copy your **Publishable key** (starts with `pk_test_`)
4. Copy your **Secret key** (starts with `sk_test_`)
5. Add to `.env.local`:

```env
STRIPE_SECRET_KEY=sk_test_your_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

### Production

1. Toggle to **Live mode** in Stripe Dashboard
2. Go to **Developers** → **API keys**
3. Copy your **Live keys** (start with `pk_live_` and `sk_live_`)
4. Add to production environment variables

## Step 2: Create Products and Prices

### Create Products

1. Go to **Products** in Stripe Dashboard
2. Click **+ Add product**

Create 3 products:

#### Product 1: Starter Pack
- **Name**: Starter Pack
- **Description**: 10 interview credits - perfect for trying out the platform
- **Pricing**: One-time payment
- **Price**: $10.00 USD
- **Tax code**: (Optional) Digital goods or services
- Click **Save product**
- Copy the **Price ID** (starts with `price_`)
- Add to `.env.local`:
  ```env
  STRIPE_PRICE_ID_10=price_xxxxx
  ```

#### Product 2: Pro Pack
- **Name**: Pro Pack
- **Description**: 50 interview credits - best value for regular practice
- **Pricing**: One-time payment
- **Price**: $50.00 USD
- Click **Save product**
- Copy the **Price ID**
- Add to `.env.local`:
  ```env
  STRIPE_PRICE_ID_50=price_xxxxx
  ```

#### Product 3: Enterprise Pack
- **Name**: Enterprise Pack
- **Description**: 100 interview credits - maximum credits for serious preparation
- **Pricing**: One-time payment
- **Price**: $100.00 USD
- Click **Save product**
- Copy the **Price ID**
- Add to `.env.local`:
  ```env
  STRIPE_PRICE_ID_100=price_xxxxx
  ```

## Step 3: Configure Payment Methods

### Disable Cash App Pay (Recommended)

Per the guide, Cash App Pay can cause issues with one-time payments.

1. Go to **Settings** → **Payment methods**
2. Find **Cash App Pay**
3. Click **...** → **Remove**

### Enable Card Payments

Ensure **Cards** is enabled (should be by default):
- Credit cards
- Debit cards
- Digital wallets (Apple Pay, Google Pay)

## Step 4: Set Up Webhooks

Webhooks ensure your database stays in sync with Stripe payments.

### Development Webhooks (Local Testing)

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Run in terminal:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
3. Copy the webhook signing secret (starts with `whsec_`)
4. Add to `.env.local`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```
5. Keep the CLI running while testing locally

### Production Webhooks

1. Go to **Developers** → **Webhooks** in Stripe Dashboard
2. Click **+ Add endpoint**
3. **Endpoint URL**: `https://yourdomain.com/api/stripe/webhook`
4. **Listen to**: Select **Events on your account**
5. **Select events to listen to**:
   - ✅ `checkout.session.completed`
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
   - ✅ `payment_intent.canceled`
6. Click **Add endpoint**
7. Copy the **Signing secret** (starts with `whsec_`)
8. Add to production environment:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```

## Step 5: Environment Variables Checklist

Ensure all these variables are set:

```env
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs
STRIPE_PRICE_ID_10=price_...
STRIPE_PRICE_ID_50=price_...
STRIPE_PRICE_ID_100=price_...

# App URL (for redirect URLs)
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or your production URL
```

## Step 6: Test in Development

### Test with Stripe Test Cards

Use these test cards: https://stripe.com/docs/testing#cards

**Success Card:**
- Card number: `4242 4242 4242 4242`
- Expiry: Any future date (e.g., `12/34`)
- CVC: Any 3 digits (e.g., `123`)
- ZIP: Any 5 digits (e.g., `12345`)

**Declined Card:**
- Card number: `4000 0000 0000 0002`

### Testing Flow

1. Start your development server: `npm run dev`
2. Start Stripe CLI (in separate terminal):
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
3. Log in to your app
4. Navigate to `/credits`
5. Click **Buy 10 Credits**
6. Fill in test card information
7. Complete purchase
8. Verify:
   - ✅ Redirected to `/credits` page
   - ✅ Credits appear in balance immediately
   - ✅ Transaction appears in history
   - ✅ Console shows sync logs
   - ✅ Stripe CLI shows webhook received

9. Try to start an interview:
   - ✅ Credits are deducted
   - ✅ Interview starts successfully
   - ✅ Ledger shows deduction

## Step 7: Monitor in Production

### Stripe Dashboard Monitoring

1. **Payments**: Monitor successful payments
2. **Customers**: View customer details and metadata
3. **Logs**: Check webhook delivery status
4. **Events**: View all Stripe events

### Check These After Launch

- ✅ Webhooks are receiving events (green checkmarks)
- ✅ Customer metadata includes `userId` and `clerkId`
- ✅ Payment intents have `credits` in metadata
- ✅ No failed webhook deliveries

### Common Issues

**Webhook fails:**
- Check endpoint URL is correct
- Verify webhook secret is correct
- Check server logs for errors

**Credits don't appear:**
- Check success page sync ran (server logs)
- Check webhook was received (Stripe logs)
- Verify payment intent has credits metadata

**Customer not found:**
- Ensure user exists in Prisma before checkout
- Check upsert logic in checkout endpoint

## Security Best Practices

✅ **DO:**
- Always verify webhook signatures
- Use environment variables for secrets
- Validate price IDs on server
- Use transactions for credit operations
- Log all credit changes

❌ **DON'T:**
- Trust client-side data for amounts
- Skip webhook signature verification
- Expose secret keys in frontend
- Process webhooks without idempotency

## Support

- Stripe Docs: https://stripe.com/docs
- Stripe Testing: https://stripe.com/docs/testing
- Webhook Testing: https://stripe.com/docs/webhooks/test

## Testing Checklist

- [ ] Products created in Stripe Dashboard
- [ ] Price IDs added to environment variables
- [ ] Webhook endpoint configured
- [ ] Webhook secret added to environment
- [ ] Test purchase with test card succeeds
- [ ] Credits appear immediately after purchase
- [ ] Transaction history shows purchase
- [ ] Interview deducts correct credits
- [ ] Insufficient credits prevents interview
- [ ] Stripe dashboard shows correct metadata
- [ ] Webhooks deliver successfully
- [ ] Credit ledger maintains accurate history




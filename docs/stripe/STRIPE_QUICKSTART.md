# Stripe Credit Billing - Quick Start

Get the credit billing system running in 5 minutes.

## Prerequisites

- Stripe account (free at https://stripe.com)
- Development server ready (`npm install` completed)

## Step 1: Get Stripe API Keys (2 minutes)

1. Go to: https://dashboard.stripe.com/test/apikeys
2. Copy **Publishable key** (starts with `pk_test_`)
3. Click "Reveal test key" and copy **Secret key** (starts with `sk_test_`)
4. Add to `.env.local`:

```env
STRIPE_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
```

## Step 2: Create Products in Stripe (2 minutes)

1. Go to: https://dashboard.stripe.com/test/products
2. Click **+ Add product**

**Create 3 products**:

**Product 1: Trial Pack**

- Name: `Trial Pack`
- Price: `$5.00` (one-time)
- Copy the **Price ID** (starts with `price_`)

**Product 2: Starter Pack**

- Name: `Starter Pack`
- Price: `$10.00` (one-time)
- Copy the **Price ID**

**Product 3: Pro Pack**

- Name: `Pro Pack`
- Price: `$50.00` (one-time)
- Copy the **Price ID**

Add price IDs to `.env.local`:

```env
STRIPE_PRICE_ID_5=price_xxxxx
STRIPE_PRICE_ID_10=price_xxxxx
STRIPE_PRICE_ID_50=price_xxxxx
```

## Step 3: Set Up Local Webhook (1 minute)

**Option A: Use Stripe CLI** (recommended)

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Run in a separate terminal:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
3. Copy the webhook secret (starts with `whsec_`)
4. Add to `.env.local`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```

**Option B: Skip webhooks for now**

- Eager sync on success page will still work
- Webhooks can be set up later

## Step 4: Add App URL

Add to `.env.local`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 5: Your Complete .env.local

Verify you have all these variables:

```env
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Stripe Price IDs
STRIPE_PRICE_ID_5=price_xxxxx
STRIPE_PRICE_ID_10=price_xxxxx
STRIPE_PRICE_ID_50=price_xxxxx

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 6: Test It! (30 seconds)

1. Start dev server: `npm run dev`
2. (If using Stripe CLI) Start webhook listener in another terminal:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
3. Sign in to your app
4. Go to: http://localhost:3000/credits
5. Click **Buy 10 Credits**
6. Use test card:
   - Card: `4242 4242 4242 4242`
   - Expiry: `12/34`
   - CVC: `123`
   - ZIP: `12345`
7. Complete payment
8. ✅ Credits should appear immediately!

## What You Should See

- ✅ Redirected to `/credits` page
- ✅ Balance shows 10 credits
- ✅ Transaction history shows purchase
- ✅ Navbar shows "10 credits"
- ✅ Console logs show sync activity

## Troubleshooting

### Credits don't appear?

**Check console logs**:

- Look for "Syncing Stripe data" messages
- Check for any errors

**Check Stripe Dashboard**:

- Go to: https://dashboard.stripe.com/test/payments
- Verify payment succeeded
- Check customer metadata has `userId`

### Webhook errors?

**If using Stripe CLI**:

- Ensure it's running in separate terminal
- Check terminal output for webhook delivery
- Secret should match `.env.local`

**If not using CLI**:

- Eager sync should still work
- Credits appear from success page sync

### "Price not found" error?

- Double-check Price IDs in `.env.local`
- Make sure they start with `price_`
- Verify they're from test mode (not live)

### "Unauthorized" error?

- Verify API keys are correct
- Check they're from test mode
- Ensure keys are in `.env.local`
- Restart dev server after adding keys

## Test Different Scenarios

**Test insufficient credits**:

1. Start with 5 credits
2. Try "Standard - 10 minutes" interview
3. Should block and show error

**Test credit deduction**:

1. Have 15+ credits
2. Start any interview
3. Credits should deduct immediately

**Test multiple purchases**:

1. Buy 10 credits
2. Buy 50 credits
3. Balance should be 60 total

## Next Steps

- ✅ **You're done!** System is working
- 📖 Read `STRIPE_SETUP_GUIDE.md` for production setup
- 🧪 Run tests from `STRIPE_TESTING_GUIDE.md`
- 🚀 Deploy to production when ready

## Production Setup

When ready for production:

1. Switch Stripe to **Live mode**
2. Get live API keys
3. Create products in live mode
4. Set up production webhook
5. Update environment variables
6. Test with real card
7. Monitor Stripe Dashboard

See `STRIPE_SETUP_GUIDE.md` for details.

## Support

- Stripe test cards: https://stripe.com/docs/testing
- Stripe CLI: https://stripe.com/docs/stripe-cli
- Webhooks: https://stripe.com/docs/webhooks

## Success! 🎉

You now have a fully functional credit billing system:

- Users can purchase credits
- Credits are deducted on interview start
- Complete transaction history
- Credits never expire
- Full audit trail

Happy coding! 💳✨

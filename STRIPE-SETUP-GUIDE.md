# Stripe Payment Setup Guide 💳

## Quick Setup (5 minutes)

You already have Stripe credentials in your `.env` file! Now you just need to create the subscription products and get their price IDs.

### Step 1: Create Products in Stripe Dashboard

Go to: https://dashboard.stripe.com/products

Create 3 new products:

#### Product 1: Meowdel Purr
- Name: `Meowdel Purr`
- Description: `1,000 messages/month with Meowdel and all personalities`
- Pricing:
  - **Recurring**: $9/month
  - Click "Add pricing" → Select "Recurring" → Enter $9 → Select "Monthly"
- Click "Save product"
- **Copy the Price ID** (looks like `price_xxxxx`)

#### Product 2: Meowdel Meow
- Name: `Meowdel Meow`
- Description: `5,000 messages/month with vision and voice features`
- Pricing:
  - **Recurring**: $29/month
- Click "Save product"
- **Copy the Price ID**

#### Product 3: Meowdel Roar
- Name: `Meowdel Roar`
- Description: `Unlimited messages, phone access, and all premium features`
- Pricing:
  - **Recurring**: $99/month
- Click "Save product"
- **Copy the Price ID**

### Step 2: Add Price IDs to Code

Update `/Users/ryan/development/meowdel.ai/web-app/app/pricing/page.tsx`:

Find these lines:
```typescript
priceId: 'price_meowdel_purr_monthly', // TODO: Create in Stripe
priceId: 'price_meowdel_meow_monthly', // TODO: Create in Stripe
priceId: 'price_meowdel_roar_monthly', // TODO: Create in Stripe
```

Replace with your actual price IDs from Stripe:
```typescript
priceId: 'price_1ABC...', // Your Purr price ID
priceId: 'price_1XYZ...', // Your Meow price ID
priceId: 'price_1DEF...', // Your Roar price ID
```

### Step 3: Test with Test Card

1. Go to http://localhost:3002/pricing
2. Click on any paid plan
3. Use test card: `4242 4242 4242 4242`
4. Any future expiry date
5. Any CVC

### Step 4: Configure Webhook (For Production)

1. Go to: https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://meowdel.ai/api/webhook/stripe` (after you deploy)
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the "Signing secret" (starts with `whsec_`)
6. Add to `.env`: `STRIPE_WEBHOOK_SECRET=whsec_xxxxx`

---

## What's Already Done ✅

- ✅ Stripe API keys added to `.env`
- ✅ Checkout API endpoint created (`/api/checkout`)
- ✅ Pricing page with 4 tiers (Free, Purr, Meow, Roar)
- ✅ Success page (`/checkout/success`)
- ✅ Cancel page (`/checkout/cancel`)
- ✅ Customer portal integration ready

---

## Files Created

```
web-app/
├── app/
│   ├── api/
│   │   └── checkout/
│   │       └── route.ts         # Stripe checkout sessions
│   ├── pricing/
│   │   └── page.tsx             # Pricing page UI
│   └── checkout/
│       ├── success/
│       │   └── page.tsx         # Payment success page
│       └── cancel/
│           └── page.tsx         # Payment cancelled page
└── .env                         # API keys configured
```

---

## Revenue Tiers

| Tier | Price | Messages | Features |
|------|-------|----------|----------|
| **Free** | $0 | 100/month | Basic chat with Meowdel |
| **Purr** | $9/mo | 1,000/month | All personalities + priority |
| **Meow** | $29/mo | 5,000/month | + Vision + Voice + API |
| **Roar** | $99/mo | Unlimited | Everything + Phone + WhatsApp |

---

## After Dark Employees

After Dark Systems employees get **unlimited everything** for free when they sign in with SSO.

The code detects `@afterdarksystems.com` emails automatically (SSO integration coming next phase).

---

## Next Steps

1. ✅ Create 3 products in Stripe
2. ✅ Copy price IDs to `pricing/page.tsx`
3. ✅ Test checkout flow locally
4. 🚀 Deploy to production
5. 🎉 Start making money!

---

## Test Cards

| Card Number | Result |
|-------------|--------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 0002 | Card declined |
| 4000 0000 0000 9995 | Insufficient funds |

Use any future expiry and any CVC.

---

## Customer Portal

Your customers can manage their subscriptions at:
- Cancel subscription
- Update payment method
- View invoices
- Download receipts

This is handled automatically by Stripe's customer portal.

Access link is on the success page!

---

## Support

If you need help:
- Stripe docs: https://stripe.com/docs/billing/subscriptions/build-subscriptions
- Your Stripe dashboard: https://dashboard.stripe.com
- Test mode toggle: Top right corner of dashboard

---

**You're almost ready to start generating revenue! 🚀💰**

Just create those 3 products and you're good to go!

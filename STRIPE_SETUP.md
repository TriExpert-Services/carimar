# Stripe Payment Integration Setup

## Overview

The CARIMAR SERVICES LLC platform is ready for Stripe payment integration. To complete the payment system, you'll need to set up Stripe and add the necessary credentials.

## Setup Steps

### 1. Create a Stripe Account

1. Go to [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Create your Stripe account
3. Complete the business verification process

### 2. Get Your API Keys

1. Navigate to [https://dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
2. Copy your **Publishable key** and **Secret key**
3. For testing, use the test mode keys (starts with `pk_test_` and `sk_test_`)

### 3. Add Environment Variables

Add these variables to your `.env` file:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
```

Note: The Secret Key should NEVER be stored in the frontend. It should be used in:
- Supabase Edge Functions (for server-side payment processing)
- Backend API endpoints

### 4. Install Stripe SDK

```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

### 5. Enable Payment Methods

In your Stripe Dashboard:

1. Go to Settings → Payment methods
2. Enable:
   - **Cards** (Visa, Mastercard, American Express)
   - **Apple Pay**
   - **Google Pay**

### 6. Implement Payment Components

Create a payment component that uses Stripe Elements:

```typescript
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Use the Elements provider and CardElement for payment forms
```

### 7. Create Stripe Edge Function

Create a Supabase Edge Function to handle payment intents:

```typescript
// supabase/functions/create-payment-intent/index.ts
import Stripe from 'npm:stripe@14.14.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2023-10-16',
});

Deno.serve(async (req: Request) => {
  const { amount, booking_id } = await req.json();

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency: 'usd',
    metadata: { booking_id },
  });

  return new Response(
    JSON.stringify({ clientSecret: paymentIntent.client_secret }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
```

### 8. Configure Webhooks

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-supabase-url.supabase.co/functions/v1/stripe-webhook`
3. Select events to listen to:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`

### 9. Test Payment Flow

Use Stripe test cards:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0027 6000 3184`

Any future date for expiry, any 3 digits for CVC.

## Features Ready for Integration

The platform already has:

- ✅ Quote system with pricing calculator
- ✅ Booking management
- ✅ Payment table in database (ready for Stripe payment IDs)
- ✅ Admin dashboard for payment oversight
- ✅ Client dashboard for payment history

## Security Best Practices

1. **Never** expose your Secret Key in the frontend
2. Always validate payment amounts on the server
3. Use Stripe webhooks for payment confirmation (not just client-side)
4. Implement idempotency keys for payment requests
5. Store only necessary payment information in your database
6. Use Stripe's PCI-compliant Elements (never handle raw card data)

## Apple Pay & Google Pay

Both are automatically available through Stripe when:

1. You've enabled them in Stripe Dashboard
2. Your website uses HTTPS
3. The user's browser/device supports them

No additional integration needed beyond standard Stripe Elements!

## Support

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Support](https://support.stripe.com/)
- [Supabase Edge Functions with Stripe](https://supabase.com/docs/guides/functions/examples/stripe-webhooks)

## Cost

Stripe charges:
- **2.9% + $0.30** per successful card charge
- No monthly fees for standard integration
- Check [Stripe Pricing](https://stripe.com/pricing) for detailed information

---

**Next Steps:**
1. Create Stripe account
2. Add API keys to environment
3. Install Stripe SDK: `npm install @stripe/stripe-js @stripe/react-stripe-js`
4. Create payment components
5. Deploy Stripe Edge Function
6. Test with test cards
7. Go live with real keys when ready!

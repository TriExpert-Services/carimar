# Stripe Integration Documentation

This document explains how to set up and use Stripe payment processing in the application.

## Overview

The platform uses Stripe to process payments for orders. The integration includes:
- Payment intent creation
- Payment confirmation
- Webhook handling for payment events
- Automatic invoice status updates

## Setup

### 1. Get Stripe API Keys

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Go to [Developers > API keys](https://dashboard.stripe.com/apikeys)
3. Copy your **Secret key** (starts with `sk_`)
4. For webhooks, you'll also need the **Webhook signing secret**

### 2. Configure Supabase Secrets

Set the following environment variables in your Supabase project:

```bash
# Required for payment processing
STRIPE_SECRET_KEY=sk_test_...

# Required for webhook verification (optional but recommended)
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Note:** These secrets are automatically configured in Supabase Edge Functions.

### 3. Configure Webhook Endpoint (Optional)

To receive real-time payment updates:

1. Go to [Stripe Dashboard > Developers > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter your webhook URL:
   ```
   https://your-project.supabase.co/functions/v1/stripe-payment?action=webhook
   ```
4. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the webhook signing secret and add it to Supabase secrets as `STRIPE_WEBHOOK_SECRET`

## API Endpoints

### Create Payment Intent

Creates a Stripe payment intent for an order.

**Endpoint:** `POST /functions/v1/stripe-payment?action=create-payment-intent`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <user-jwt-token>
```

**Request Body:**
```json
{
  "order_id": "uuid-of-order"
}
```

**Response:**
```json
{
  "client_secret": "pi_xxx_secret_xxx",
  "payment_intent_id": "pi_xxx"
}
```

### Confirm Payment

Confirms that a payment was completed.

**Endpoint:** `POST /functions/v1/stripe-payment?action=confirm-payment`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <user-jwt-token>
```

**Request Body:**
```json
{
  "payment_intent_id": "pi_xxx",
  "order_id": "uuid-of-order"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment confirmed"
}
```

## Frontend Integration

### Using Stripe Elements

```typescript
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe
const stripe = await loadStripe('pk_test_...');

// Create payment intent
const response = await fetch(
  `${supabaseUrl}/functions/v1/stripe-payment?action=create-payment-intent`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ order_id: 'order-uuid' }),
  }
);

const { client_secret } = await response.json();

// Confirm payment with Stripe
const result = await stripe.confirmCardPayment(client_secret, {
  payment_method: {
    card: cardElement,
    billing_details: {
      name: 'Customer Name',
      email: 'customer@email.com',
    },
  },
});

if (result.error) {
  console.error(result.error.message);
} else {
  // Payment succeeded
  await fetch(
    `${supabaseUrl}/functions/v1/stripe-payment?action=confirm-payment`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        payment_intent_id: result.paymentIntent.id,
        order_id: 'order-uuid',
      }),
    }
  );
}
```

### Using Stripe Checkout

For a hosted payment page experience:

```typescript
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: [
    {
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Cleaning Service',
        },
        unit_amount: 15000, // $150.00
      },
      quantity: 1,
    },
  ],
  mode: 'payment',
  success_url: 'https://yoursite.com/success?session_id={CHECKOUT_SESSION_ID}',
  cancel_url: 'https://yoursite.com/cancel',
  metadata: {
    order_id: 'order-uuid',
  },
});

// Redirect to Checkout
window.location.href = session.url;
```

## Payment Flow

1. **Client requests payment**: Client clicks "Pay Now" on an order
2. **Create Payment Intent**: Frontend calls `create-payment-intent` endpoint
3. **Client enters payment details**: Using Stripe Elements or Checkout
4. **Process payment**: Stripe processes the payment securely
5. **Confirm payment**: Frontend calls `confirm-payment` endpoint
6. **Update order status**: Order payment_status updated to "paid"
7. **Update invoice**: Associated invoice marked as "paid"
8. **Send notification**: Client receives payment confirmation

## Webhook Events

The webhook endpoint handles these events:

### payment_intent.succeeded
- Updates order payment_status to "paid"
- Updates invoice status to "paid"
- Records payment date

### payment_intent.payment_failed
- Updates order payment_status to "failed"
- Sends notification to client

## Testing

### Test Cards

Use these test card numbers in test mode:

**Successful payments:**
```
4242 4242 4242 4242
```

**Requires authentication (3D Secure):**
```
4000 0025 0000 3155
```

**Declined:**
```
4000 0000 0000 9995
```

**More test cards:** [Stripe Testing Documentation](https://stripe.com/docs/testing)

### Test Mode vs Live Mode

- **Test Mode**: Use test API keys (starting with `sk_test_`)
- **Live Mode**: Use live API keys (starting with `sk_live_`)

Always test thoroughly in test mode before going live!

## Security Best Practices

1. **Never expose secret keys**: Keep `STRIPE_SECRET_KEY` server-side only
2. **Use publishable keys**: Only use `pk_` keys in frontend code
3. **Validate webhooks**: Always verify webhook signatures
4. **Use HTTPS**: Ensure all endpoints use HTTPS
5. **Handle errors gracefully**: Never expose error details to clients
6. **Log transactions**: Keep audit logs of all payment attempts

## Error Handling

Common errors and how to handle them:

### Card Declined
```typescript
if (error.code === 'card_declined') {
  alert('Your card was declined. Please try a different payment method.');
}
```

### Insufficient Funds
```typescript
if (error.code === 'insufficient_funds') {
  alert('Insufficient funds. Please use a different card.');
}
```

### Authentication Required
```typescript
if (error.code === 'authentication_required') {
  // Redirect to 3D Secure flow
}
```

## Refunds

To process refunds (admin only):

```typescript
const refund = await stripe.refunds.create({
  payment_intent: 'pi_xxx',
  amount: 5000, // $50.00 (optional, defaults to full amount)
  reason: 'requested_by_customer',
});
```

## Support

For Stripe-specific issues:
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Support](https://support.stripe.com)

For integration issues, contact the development team.

## Pricing

Stripe charges per transaction:
- **2.9% + $0.30** per successful card charge (US)
- No setup fees or monthly fees
- Additional fees for international cards

See [Stripe Pricing](https://stripe.com/pricing) for details.

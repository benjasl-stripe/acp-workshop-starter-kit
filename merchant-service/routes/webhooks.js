/**
 * Webhook Routes
 * 
 * Handles incoming webhooks from Stripe.
 * Webhooks are the source of truth for payment events.
 * 
 * Endpoints:
 * - POST /webhooks/stripe - Receive Stripe webhook events
 */
import express from 'express';
// TODO: Uncomment these imports when implementing the webhook handler:
// import Stripe from 'stripe';
// import { checkouts } from './checkout-sessions.js';

const router = express.Router();

// TODO: Uncomment these when implementing:
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
// const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * POST /webhooks/stripe - Handle Stripe webhook events
 * 
 * IMPORTANT: This route uses express.raw() middleware instead of express.json()
 * because Stripe needs the raw request body to verify the signature.
 */

// TODO: Replace this entire route handler with the webhook implementation from the workshop instructions
// The implementation should:
// 1. Handle demo mode (when webhookSecret is not configured) - parse without verification
// 2. Verify webhook signature when webhookSecret IS configured
// 3. Handle payment_intent.succeeded - find checkout, mark confirmed, record sales
// 4. Handle payment_intent.payment_failed - log the failure
// 5. Return { received: true }

router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  return res.status(501).json({
    error: 'TODO: Implement webhook handler',
    hint: 'Replace this entire route handler with the code from the workshop instructions'
  });
});

export default router;

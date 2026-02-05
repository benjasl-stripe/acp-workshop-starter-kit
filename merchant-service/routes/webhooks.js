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
import Stripe from 'stripe';
import { checkouts } from './checkouts.js';

const router = express.Router();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * POST /webhooks/stripe - Handle Stripe webhook events
 * 
 * IMPORTANT: This route uses express.raw() middleware instead of express.json()
 * because Stripe needs the raw request body to verify the signature.
 */
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  // TODO: Verify webhook signature
  // This ensures the request really came from Stripe
  // Replace this entire block with the verification code from the workshop instructions
  let event;
  return res.status(501).json({
    error: 'TODO: Implement webhook signature verification',
    hint: 'Replace this block with stripe.webhooks.constructEvent()'
  });

  // After verification, handle the event:
  // await handleEvent(event);
  // res.json({ received: true });
});

/**
 * Handle webhook events
 * Calls the Merchant Catalog API to update stock
 */
async function handleEvent(event) {
  // TODO: Handle payment_intent.succeeded event
  // - Find the checkout by payment_intent_id
  // - Mark it as webhook-confirmed
  // - Call the catalog stock endpoint to decrement stock
  // - Log the confirmation

  // TODO: (Optional) Handle payment_intent.payment_failed
  
  console.log('ℹ️ Webhook event received:', event.type);
}

export default router;

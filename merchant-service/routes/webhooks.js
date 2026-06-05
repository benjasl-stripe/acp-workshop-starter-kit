/**
 * Webhook Routes - Stripe webhook handler
 */

import express from 'express';
import Stripe from 'stripe';
import { checkouts } from './checkout-sessions.js';

const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  let event;

  if (!webhookSecret) {
    // Demo mode - parse without verification
    try {
      event = JSON.parse(req.body.toString());
      console.log('📥 Webhook received (unverified):', event.type);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid JSON' });
    }
  } else {
    // Verify webhook signature
    try {
      const sig = req.headers['stripe-signature'];
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      console.log('📥 Webhook received (verified):', event.type);
    } catch (err) {
      console.error('⚠️ Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }

  // Handle payment_intent.succeeded
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    console.log('✅ Webhook: Payment confirmed:', paymentIntent.id);
    
    for (const [checkoutId, checkout] of checkouts) {
      if (checkout.payment_intent_id === paymentIntent.id) {
        checkout.webhook_confirmed = true;
        checkout.webhook_confirmed_at = new Date().toISOString();
        
        // Record sales via catalog API
        if (!checkout.stock_reserved) {
          console.log('📦 Webhook: Recording sales via Catalog API');
          const merchantBaseUrl = `http://localhost:${process.env.PORT || 4000}`;
          const catalogName = checkout.catalog || 'skis';
          
          for (const lineItem of checkout.line_items) {
            try {
              await fetch(`${merchantBaseUrl}/api/${catalogName}/sale`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  productId: lineItem.id,
                  quantity: lineItem.item.quantity,
                  orderId: checkout.order?.id,
                }),
              });
              console.log(`   ✅ Sale recorded: ${lineItem.item.quantity}x ${lineItem.title}`);
            } catch (err) {
              console.error(`   ❌ Sale recording failed:`, err.message);
            }
          }
          checkout.stock_reserved = true;
        }
        
        console.log('🎉 Webhook: Order confirmed:', checkoutId);
        break;
      }
    }
  }

  // Handle payment failures
  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object;
    console.log('❌ Webhook: Payment failed:', paymentIntent.id);
    console.log('   Reason:', paymentIntent.last_payment_error?.message || 'Unknown');
  }

  res.json({ received: true });
});

export default router;

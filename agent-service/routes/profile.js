/**
 * Profile Route
 * 
 * Manages user profiles including:
 * - Personal info (email, name)
 * - Shipping address
 * - Shipping preference
 * - Payment method reference
 * 
 * In production, this would be stored in a database.
 * For the workshop, we use an in-memory store.
 */

import express from 'express';
import { getCustomerPaymentMethods } from './payment.js';

const router = express.Router();

// In-memory profile storage (keyed by email)
// In production, use a database!
const profiles = new Map();

/**
 * GET /api/profile
 * Retrieve a user's profile by email
 */
router.get('/', (req, res) => {
  const { email } = req.query;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  
  const profile = profiles.get(email);
  
  if (!profile) {
    // Return empty profile structure
    return res.json({
      profile: {
        email,
        name: '',
        address: null,
        shippingPreference: null,
        paymentMethodId: null,
        paymentMethodLast4: null,
      },
      exists: false,
    });
  }
  
  console.log('📋 Profile retrieved for:', email);
  res.json({ profile, exists: true });
});

/**
 * POST /api/profile
 * Save or update a user's profile
 */
router.post('/', (req, res) => {
  const { profile } = req.body;
  
  if (!profile || !profile.email) {
    return res.status(400).json({ error: 'Profile with email is required' });
  }
  
  // Merge with existing profile if it exists
  const existing = profiles.get(profile.email) || {};
  const updated = {
    ...existing,
    ...profile,
    updatedAt: new Date().toISOString(),
  };
  
  profiles.set(profile.email, updated);
  
  console.log('💾 Profile saved for:', profile.email);
  console.log('   Address:', updated.address ? '✓' : '✗');
  console.log('   Shipping:', updated.shippingPreference || '✗');
  console.log('   Payment:', updated.paymentMethodId ? '✓' : '✗');
  
  res.json({ success: true, profile: updated });
});

/**
 * DELETE /api/profile
 * Delete a user's profile
 */
router.delete('/', (req, res) => {
  const { email } = req.query;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  
  const existed = profiles.delete(email);
  
  console.log('🗑️ Profile deleted for:', email, existed ? '(existed)' : '(did not exist)');
  res.json({ success: true, existed });
});

/**
 * GET /api/profile/check
 * Quick check if user has complete profile for checkout
 * Optional: pass sessionCustomerId to also check Stripe for payment methods
 */
router.get('/check', async (req, res) => {
  const { email, sessionCustomerId } = req.query;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  
  const profile = profiles.get(email);
  
  const hasAddress = !!(profile?.address?.line_one && profile?.address?.city);
  const hasShipping = !!profile?.shippingPreference;
  
  // Check both profile.paymentMethodId AND Stripe (if sessionCustomerId provided)
  let hasPayment = !!profile?.paymentMethodId;
  let hasStripePaymentMethod = false;
  
  if (!hasPayment && sessionCustomerId) {
    try {
      const paymentMethods = await getCustomerPaymentMethods(sessionCustomerId);
      hasStripePaymentMethod = paymentMethods && paymentMethods.length > 0;
      hasPayment = hasStripePaymentMethod;
    } catch (err) {
      // Ignore errors - just means we can't check Stripe
    }
  }
  
  const isComplete = hasAddress && hasShipping && hasPayment;
  
  res.json({
    email,
    hasAddress,
    hasShipping,
    hasPayment,
    hasStripePaymentMethod,
    isComplete,
    missing: [
      !hasAddress && 'address',
      !hasShipping && 'shippingPreference',
      !hasPayment && 'paymentMethod',
    ].filter(Boolean),
  });
});

// Export profiles map for use in chat flow
export { profiles };
export default router;


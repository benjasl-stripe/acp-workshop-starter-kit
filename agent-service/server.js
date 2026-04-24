/**
 * Agent Service
 * 
 * Orchestrates the UCP checkout flow:
 * 1. Receives chat messages from frontend
 * 2. Calls OpenAI directly for AI responses with function calling
 * 3. Detects purchase intent and manages checkouts via UCP
 * 4. Creates Stripe Shared Payment Tokens (SPT) for payments
 * 
 * @see https://ucp.dev/2026-04-08/specification/checkout-rest/
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chatRouter from './routes/chat.js';
import checkoutRouter from './routes/checkout.js';
import paymentRouter from './routes/payment.js';
import profileRouter from './routes/profile.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/chat', chatRouter);
app.use('/api/checkout', checkoutRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/profile', profileRouter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Agent Service',
    version: '1.0.0',
    description: 'UCP Agent with Stripe SPT support',
    ucp: {
      version: '2026-04-08',
      spec: 'https://ucp.dev/2026-04-08/specification/checkout-rest/',
    },
    endpoints: {
      chat: 'POST /api/chat - Send messages to AI',
      checkout: {
        create: 'POST /api/checkout/create - Create checkout session',
        update: 'PUT /api/checkout/:id - Update checkout',
        complete: 'POST /api/checkout/:id/complete - Complete with SPT',
        cancel: 'POST /api/checkout/:id/cancel - Cancel checkout',
        status: 'GET /api/checkout/:id - Get checkout status',
      },
      payment: {
        saveMethod: 'POST /api/payment/save-method - Save payment method',
        getMethods: 'GET /api/payment/methods - Get saved payment methods',
        createSPT: 'POST /api/payment/create-spt - Create Shared Payment Token',
      },
    },
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    lambdaEndpoint: process.env.LAMBDA_ENDPOINT || null,
    stripeProxyUrl: process.env.STRIPE_PROXY_URL || 'http://localhost:3002',
    merchantUrl: process.env.MERCHANT_API_URL || null,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🤖 Agent Service running on http://localhost:${PORT}`);
  console.log(`💬 Chat API: http://localhost:${PORT}/api/chat`);
  console.log(`🛒 Checkout API: http://localhost:${PORT}/api/checkout`);
  console.log(`💳 Payment API: http://localhost:${PORT}/api/payment`);
  
  // Log environment configuration
  console.log(`\n📋 Environment Configuration:`);
  console.log(`   LAMBDA_ENDPOINT: ${process.env.LAMBDA_ENDPOINT || '❌ Not set'}`);
  console.log(`   STRIPE_PROXY_URL: ${process.env.STRIPE_PROXY_URL || '❌ Not set (defaulting to http://localhost:3002)'}`);
  console.log(`   MERCHANT_API_URL: ${process.env.MERCHANT_API_URL || '❌ Not set (will use frontend config)'}`);
  console.log(`   WORKSHOP_SECRET: ${process.env.WORKSHOP_SECRET ? '✅ Set' : '❌ Not set'}`);
  console.log(`   PORT: ${PORT}`);
  
  console.log(`\nPress Ctrl+C to stop\n`);
});

export default app;


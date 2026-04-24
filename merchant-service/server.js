// Must run before any local imports that read process.env at module load (e.g. Stripe in routes).
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import healthRouter from './routes/health.js';
import checkoutSessionsRouter from './routes/checkout-sessions.js';
import catalogRouter from './routes/catalog.js';
import webhooksRouter from './routes/webhooks.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors()); // Enable CORS for all routes

// IMPORTANT: Webhooks must be mounted BEFORE express.json() 
// because they need the raw request body for signature verification
app.use('/webhooks', webhooksRouter);

app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Serve static files (images, etc.)
app.use('/public', express.static('public'));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/health', healthRouter);
app.use('/checkout-sessions', checkoutSessionsRouter); // UCP Checkout Session endpoints
app.use('/api', catalogRouter); // Dynamic catalog routes: /api/{json-filename}

// UCP Discovery endpoint (required by UCP spec)
app.get('/.well-known/ucp', (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  res.json({
    ucp_version: '2026-04-08',
    rest: {
      endpoint: `${baseUrl}/checkout-sessions`
    },
    capabilities: {
      checkout: true,
      catalog_search: true,
      catalog_lookup: true
    },
    payment_handlers: {
      'com.stripe.tokenization': {
        name: 'Stripe',
        supported_methods: ['card'],
        accepts_shared_payment_tokens: true
      }
    },
    supported_currencies: ['usd'],
    merchant_of_record: true
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Merchant Backend API',
    version: '1.0.0',
    endpoints: {
      catalogs: '/api/{catalog-name}',
      health: '/api/health',
      'checkout-sessions': '/checkout-sessions',
      webhooks: '/webhooks/stripe',
      'ucp-discovery': '/.well-known/ucp',
    },
    ucp: {
      version: '2026-04-08',
      spec: 'https://ucp.dev/2026-04-08/specification/checkout-rest/',
      endpoints: {
        'POST /checkout-sessions': 'Create a Checkout Session',
        'GET /checkout-sessions/:id': 'Retrieve a Checkout Session',
        'PUT /checkout-sessions/:id': 'Update a Checkout Session',
        'POST /checkout-sessions/:id/complete': 'Complete a Checkout Session',
        'POST /checkout-sessions/:id/cancel': 'Cancel a Checkout Session',
      },
    },
    documentation: 'See MERCHANT_BACKEND_README.md',
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
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Merchant Backend running on http://localhost:${PORT}`);
  console.log(`📂 Catalogs API: http://localhost:${PORT}/api/{catalog} (e.g., /api/skis for lib/skis.json)`);
  console.log(`💚 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🛒 UCP Checkout Sessions: http://localhost:${PORT}/checkout-sessions`);
  console.log(`🔍 UCP Discovery: http://localhost:${PORT}/.well-known/ucp`);
  console.log(`🔔 Webhooks: http://localhost:${PORT}/webhooks/stripe`);
  console.log(`\nPress Ctrl+C to stop\n`);
});

export default app;


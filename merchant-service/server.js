import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import healthRouter from './routes/health.js';
import checkoutsRouter from './routes/checkouts.js';
import catalogRouter from './routes/catalog.js';
import webhooksRouter from './routes/webhooks.js';

// Load environment variables
dotenv.config();

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
app.use('/checkouts', checkoutsRouter); // ACP Checkout endpoints
app.use('/api', catalogRouter); // Dynamic catalog routes: /api/{json-filename}

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Merchant Backend API',
    version: '1.0.0',
    endpoints: {
      catalogs: '/api/{catalog-name}',
      health: '/api/health',
      checkouts: '/checkouts',
      webhooks: '/webhooks/stripe',
    },
    acp: {
      version: '1.0.0',
      endpoints: {
        'POST /checkouts': 'Create a Checkout Session',
        'GET /checkouts/:id': 'Retrieve a Checkout object',
        'PUT /checkouts/:id': 'Update a Checkout Session',
        'POST /checkouts/:id/complete': 'Complete a Checkout',
        'POST /checkouts/:id/cancel': 'Cancel a Checkout',
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
  console.log(`🛒 ACP Checkouts: http://localhost:${PORT}/checkouts`);
  console.log(`🔔 Webhooks: http://localhost:${PORT}/webhooks/stripe`);
  console.log(`\nPress Ctrl+C to stop\n`);
});

export default app;


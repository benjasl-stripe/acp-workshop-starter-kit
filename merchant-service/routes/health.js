import express from 'express';

const router = express.Router();

const startTime = new Date();

router.get('/', (req, res) => {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  
  res.json({
    status: 'healthy',
    service: 'Merchant Backend API',
    version: '1.0.0',
    uptime: `${uptime} seconds`,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

export default router;


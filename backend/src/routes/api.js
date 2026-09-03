const express = require('express');
const router = express.Router();
const {
  analyzeRoutes,
  getRules,
  getHistory
} = require('../controllers/routeController');
const { getIsPgConnected } = require('../config/db');

// Endpoints principales de AgroRoute
router.post('/routes/analyze', analyzeRoutes);
router.get('/rules', getRules);
router.get('/history', getHistory);

// Endpoint de diagnóstico y salud
router.get('/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'AgroRoute API',
    region: 'Corrientes - Litoral Argentino',
    database: {
      type: 'PostgreSQL con Row Level Security (RLS)',
      connected: getIsPgConnected(),
      mode: getIsPgConnected() ? 'postgresql_active' : 'hybrid_memory_fallback'
    },
    services: {
      osrm: 'https://router.project-osrm.org',
      openMeteo: 'https://api.open-meteo.com'
    },
    version: '1.0.0-MVP',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;


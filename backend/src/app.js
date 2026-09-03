require('dotenv').config();
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');

const app = express();

// Configuración de middlewares
app.use(cors({
  origin: '*', // Permitir conexión desde cualquier frontend local
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-user-role']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas de la API
app.use('/api', apiRoutes);

// Ruta raíz informativa
app.get('/', (req, res) => {
  res.json({
    message: 'AgroRoute API - Plataforma de Transitabilidad Rural para Corrientes',
    docs: '/api/health',
    analyze: 'POST /api/routes/analyze',
    rules: 'GET /api/rules'
  });
});

module.exports = app;


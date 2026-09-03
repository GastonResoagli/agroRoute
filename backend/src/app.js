require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const apiRoutes = require('./routes/api');

const app = express();

// Necesario en Render/plataformas detrás de proxy inverso para IP real en rate-limit
app.set('trust proxy', 1);

// -----------------------------------------------------------------------
// Seguridad: Cabeceras HTTP endurecidas (Helmet)
// -----------------------------------------------------------------------
app.use(helmet());

// -----------------------------------------------------------------------
// Seguridad: CORS restringido por lista blanca de orígenes (producción)
// Configurar CORS_ORIGIN en variables de entorno con la URL pública de Vercel
// Ej: CORS_ORIGIN=https://agroroute.vercel.app,https://agroroute-tudominio.com
// Si no se define, se permite '*' solo para desarrollo local.
// -----------------------------------------------------------------------
const allowedOrigins = (process.env.CORS_ORIGIN || '*')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origen no permitido por la política CORS de AgroRoute.'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-user-role']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -----------------------------------------------------------------------
// Seguridad: Límite de solicitudes para proteger cuotas de OSRM/Open-Meteo
// y la base de datos ante abuso o picos de tráfico.
// -----------------------------------------------------------------------
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: Number(process.env.RATE_LIMIT_MAX || 60), // 60 solicitudes/minuto por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Demasiadas solicitudes. Intente nuevamente en unos instantes.'
  }
});
app.use('/api', apiLimiter);

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


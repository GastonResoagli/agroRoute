const app = require('./app');
const { initDb } = require('./config/db');

const PORT = process.env.PORT || 4000;

async function startServer() {
  await initDb();

  const server = app.listen(PORT, () => {
    console.log(` Servidor AgroRoute escuchando en http://localhost:${PORT}`);
    console.log(` Endpoint de análisis: POST http://localhost:${PORT}/api/routes/analyze`);
    console.log(` Diagnóstico y RLS: GET http://localhost:${PORT}/api/health`);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.warn('Unhandled Rejection capturado:', reason);
  });

  process.on('uncaughtException', (err) => {
    console.warn('Uncaught Exception capturado:', err);
  });
}

startServer();


/**
 * Cliente de API para el frontend de AgroRoute
 *
 * En producción (Vercel) se debe definir la variable de entorno VITE_API_URL
 * apuntando al backend público de Render, por ejemplo:
 *   VITE_API_URL=https://agroroute-backend.onrender.com/api
 *
 * En desarrollo local, si VITE_API_URL no está definida, se usa la ruta
 * relativa '/api' que es redirigida por el proxy de vite.config.js hacia
 * http://localhost:4000.
 */

const rawBase = import.meta.env.VITE_API_URL || '/api';
const API_BASE = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase;

export async function analyzeRoutes(payload) {
  const response = await fetch(`${API_BASE}/routes/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Error al analizar la ruta.');
  }

  return data;
}

export async function getRiskRules() {
  const response = await fetch(`${API_BASE}/rules`);
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Error al obtener reglas.');
  }
  return data.rules;
}

export async function getSystemHealth() {
  const response = await fetch(`${API_BASE}/health`);
  return await response.json();
}


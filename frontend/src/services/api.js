/**
 * Cliente de API para el frontend de AgroRoute
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


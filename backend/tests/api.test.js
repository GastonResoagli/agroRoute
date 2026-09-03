const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');

let server;
let baseUrl;

test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}/api`;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test('GET /api/health devuelve estado del sistema y configuración de RLS', async () => {
  const res = await fetch(`${baseUrl}/health`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'online');
  assert.equal(data.system, 'AgroRoute API');
  assert.ok(data.database);
});

test('GET /api/rules devuelve reglas de negocio activas', async () => {
  const res = await fetch(`${baseUrl}/rules`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(Array.isArray(data.rules));
  assert.ok(data.rules.length > 0);
});

test('POST /api/routes/analyze valida coordenadas y orígenes distintos', async () => {
  const res = await fetch(`${baseUrl}/routes/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      origin: { lat: -27.469, lon: -58.830 },
      destination: { lat: -27.469, lon: -58.830 } // Mismo punto
    })
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.match(data.error, /diferentes/i);
});

test('POST /api/routes/analyze clasifica automáticamente el suelo con Open-Meteo', async () => {
  // Corrientes Capital a San Luis del Palmar sin indicar suelo (modo 'auto')
  const res = await fetch(`${baseUrl}/routes/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      origin: { name: 'Corrientes Capital', lat: -27.469, lon: -58.830 },
      destination: { name: 'San Luis del Palmar', lat: -27.509, lon: -58.555 },
      soil_state: 'auto'
    })
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(['Seco', 'Húmedo', 'Saturado'].includes(data.soilState));
  assert.equal(data.soilSource, 'automatic_open_meteo');
  assert.ok(data.soilTelemetry);
  assert.ok(typeof data.soilTelemetry.moisturePercent === 'number');
  assert.ok(data.routes.length >= 1);
  assert.ok(data.routes[0].thresholds);
});

test('POST /api/routes/analyze Corrientes -> Paso de la Patria no cruza a Chaco', async () => {
  const res = await fetch(`${baseUrl}/routes/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      origin: { name: 'Corrientes Capital', lat: -27.469, lon: -58.830 },
      destination: { name: 'Paso de la Patria', lat: -27.319, lon: -58.572 },
      soil_state: 'auto'
    })
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  
  // Ambas rutas deben mantenerse en distancias lógicas (< 60 km) en Corrientes
  for (const r of data.routes) {
    assert.ok(r.distanceKm < 70, `Ruta ${r.name} tiene ${r.distanceKm} km, no debe cruzar a Chaco`);
    // Verificar que ninguna coordenada esté en Chaco (lon < -58.836)
    for (const [lon, lat] of r.geometry.coordinates) {
      assert.ok(lon >= -58.836 || lat <= -27.55 || lat >= -27.40, 'Coordenada dentro de Chaco');
    }
  }
});

test('POST /api/routes/analyze simulación de lluvia > 30 mm devuelve Intransitable', async () => {
  const res = await fetch(`${baseUrl}/routes/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      origin: { name: 'Corrientes Capital', lat: -27.469, lon: -58.830 },
      destination: { name: 'Paso de la Patria', lat: -27.319, lon: -58.572 },
      simulated_rain_mm: 36.0
    })
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  for (const r of data.routes) {
    assert.equal(r.riskPercentage, 100);
    assert.equal(r.verdict, 'Intransitable');
  }
  assert.equal(data.recommendedRouteId, null);
  assert.ok(data.alertMessage);
});

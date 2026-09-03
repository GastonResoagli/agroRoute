const test = require('node:test');
const assert = require('node:assert/strict');
const {
  evaluateRouteRisk,
  selectRecommendedRoute,
  calculateRouteThresholds
} = require('../src/services/riskEngine');
const { classifySoilMoisture } = require('../src/services/weatherService');
const { isStrictlyInCorrientes } = require('../src/services/osrmService');

test('Clasificación Agronómica Automática de Suelo desde Open-Meteo', () => {
  // Caso Saturado
  const sat1 = classifySoilMoisture(0.38, 5.0);
  assert.equal(sat1.state, 'Saturado');
  assert.equal(sat1.moisturePercent, 38);

  const sat2 = classifySoilMoisture(0.25, 42.0); // lluvia previa > 35mm
  assert.equal(sat2.state, 'Saturado');

  // Caso Húmedo
  const hum1 = classifySoilMoisture(0.24, 4.0);
  assert.equal(hum1.state, 'Húmedo');
  assert.equal(hum1.moisturePercent, 24);

  // Caso Seco
  const sec1 = classifySoilMoisture(0.14, 2.0);
  assert.equal(sec1.state, 'Seco');
  assert.equal(sec1.moisturePercent, 14);
});

test('Aislamiento geográfico de Corrientes: descarta coordenadas en Chaco/río', () => {
  // Coordenadas válidas en Corrientes
  const ctesCoords = [
    [-58.830, -27.469],
    [-58.653, -27.458],
    [-58.572, -27.319]
  ];
  assert.equal(isStrictlyInCorrientes(ctesCoords), true);

  // Coordenadas que cruzan a Resistencia / Chaco
  const chacoCoords = [
    [-58.830, -27.469],
    [-58.980, -27.450], // Resistencia, Chaco
    [-58.572, -27.319]
  ];
  assert.equal(isStrictlyInCorrientes(chacoCoords), false);
});

test('Cálculo de umbrales admisibles de lluvia por tipo de camino', () => {
  const dirtWet = calculateRouteThresholds('secondary', 'tierra', 'Húmedo');
  assert.equal(dirtWet.highRiskThresholdMm, 15.0);
  assert.equal(dirtWet.criticalThresholdMm, 30.0);

  const asphalt = calculateRouteThresholds('primary', 'asfalto_ripio', 'Seco');
  assert.equal(asphalt.criticalThresholdMm, 30.0);
});

test('BR-015, BR-016, BR-017: Lluvia > 30 mm produce riesgo crítico (100%) e intransitable', () => {
  const result = evaluateRouteRisk({
    routeType: 'secondary',
    surfaceType: 'tierra',
    soilState: 'Seco',
    rain24hMm: 35.5
  });

  assert.equal(result.riskPercentage, 100);
  assert.equal(result.riskLevel, 'CRITICO');
  assert.equal(result.verdict, 'Intransitable');
  assert.equal(result.isPassable, false);
  assert.equal(result.ruleApplied, 'BR-015');
});

test('BR-044: Lluvia exactamente igual a 30 mm no supera el umbral crítico', () => {
  const result = evaluateRouteRisk({
    routeType: 'primary',
    surfaceType: 'asfalto_ripio',
    soilState: 'Seco',
    rain24hMm: 30.0
  });

  assert.notEqual(result.riskPercentage, 100);
  assert.equal(result.isPassable, true);
});

test('BR-045: Lluvia > 30 mm en ruta principal de asfalto/ripio es crítica e intransitable', () => {
  const result = evaluateRouteRisk({
    routeType: 'primary',
    surfaceType: 'asfalto_ripio',
    soilState: 'Seco',
    rain24hMm: 32.0
  });

  assert.equal(result.riskPercentage, 100);
  assert.equal(result.riskLevel, 'CRITICO');
  assert.equal(result.verdict, 'Intransitable');
  assert.equal(result.isPassable, false);
});

test('BR-013, BR-014: Camino secundario con suelo Húmedo y lluvia > 15 mm asigna riesgo alto del 80%', () => {
  const result = evaluateRouteRisk({
    routeType: 'secondary',
    surfaceType: 'tierra',
    soilState: 'Húmedo',
    rain24hMm: 18.4
  });

  assert.equal(result.riskPercentage, 80);
  assert.equal(result.riskLevel, 'ALTO');
  assert.equal(result.verdict, 'Transitable con alto riesgo - Desaconsejado');
  assert.equal(result.isPassable, true);
  assert.equal(result.ruleApplied, 'BR-013');
});

test('BR-043: Lluvia de 10 mm en camino secundario húmedo no supera el umbral de 15 mm', () => {
  const result = evaluateRouteRisk({
    routeType: 'secondary',
    surfaceType: 'tierra',
    soilState: 'Húmedo',
    rain24hMm: 10.0
  });

  assert.notEqual(result.riskPercentage, 80);
  assert.equal(result.riskLevel, 'MEDIO');
  assert.equal(result.isPassable, true);
});

test('BR-012: Camino secundario con suelo Seco tiene riesgo bajo', () => {
  const result = evaluateRouteRisk({
    routeType: 'secondary',
    surfaceType: 'tierra',
    soilState: 'Seco',
    rain24hMm: 5.0
  });

  assert.equal(result.riskLevel, 'BAJO');
  assert.equal(result.verdict, 'Transitable');
  assert.equal(result.isPassable, true);
});

test('BR-047: Suelo Saturado en secundaria mantiene veredicto coherente sin inventar porcentajes', () => {
  const result = evaluateRouteRisk({
    routeType: 'secondary',
    surfaceType: 'tierra',
    soilState: 'Saturado',
    rain24hMm: 12.0
  });

  assert.equal(result.riskLevel, 'ALTO');
  assert.match(result.verdict, /suelo saturado/i);
});

test('BR-035: Rechaza estado de suelo inválido', () => {
  assert.throws(() => {
    evaluateRouteRisk({
      routeType: 'primary',
      surfaceType: 'asfalto_ripio',
      soilState: 'Fangoso',
      rain24hMm: 5.0
    });
  }, /Estado de suelo inválido/);
});

test('BR-018, BR-027, BR-056: Selecciona la ruta transitable más segura como recomendada', () => {
  const assessedRoutes = [
    {
      routeIndex: 0,
      name: 'Ruta 1 (Principal)',
      routeType: 'primary',
      durationMin: 30,
      riskPercentage: 100,
      isPassable: false
    },
    {
      routeIndex: 1,
      name: 'Ruta 2 (Desvío seguro)',
      routeType: 'secondary',
      durationMin: 45,
      riskPercentage: 15,
      isPassable: true
    }
  ];

  const selection = selectRecommendedRoute(assessedRoutes);
  assert.equal(selection.recommendedRouteId, 1);
  assert.equal(selection.routes[0].isRecommended, false);
  assert.equal(selection.routes[1].isRecommended, true);
  assert.equal(selection.alertMessage, null);
});

test('BR-049: Si todas las rutas son intransitables, ninguna es recomendada y emite alerta', () => {
  const assessedRoutes = [
    {
      routeIndex: 0,
      routeType: 'primary',
      riskPercentage: 100,
      isPassable: false
    },
    {
      routeIndex: 1,
      routeType: 'secondary',
      riskPercentage: 100,
      isPassable: false
    }
  ];

  const selection = selectRecommendedRoute(assessedRoutes);
  assert.equal(selection.recommendedRouteId, null);
  assert.ok(selection.alertMessage.includes('No existe ninguna ruta transitable'));
});

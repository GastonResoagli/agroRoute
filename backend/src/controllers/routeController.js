const { getRoutes } = require('../services/osrmService');
const { calculateRouteMidpoint } = require('../services/geoService');
const { getProjectedPrecipitation24h } = require('../services/weatherService');
const {
  evaluateRouteRisk,
  selectRecommendedRoute,
  VALID_SOIL_STATES
} = require('../services/riskEngine');
const { withUserContext } = require('../config/db');

const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID || 'a0000000-0000-0000-0000-000000000001';
const DEFAULT_USER_ROLE = process.env.DEFAULT_USER_ROLE || 'producer';

/**
 * Controlador de análisis de transitabilidad de rutas
 * Incorpora detección de rutas reales (RN 12, etc.), clasificación de calzadas
 * y soporte para calibración manual de superficie por ruta si el productor lo solicita.
 */
async function analyzeRoutes(req, res) {
  try {
    const {
      origin,
      destination,
      soil_state = 'auto',
      cargo_type = 'general',
      simulated_rain_mm = null,
      surface_overrides = {}, // Permite al productor calibrar la superficie de una ruta específica
      user_id = DEFAULT_USER_ID,
      user_role = DEFAULT_USER_ROLE
    } = req.body;

    // 1. Validaciones de Origen y Destino (BR-032, BR-033, BR-034, BR-051)
    if (!origin || typeof origin.lat !== 'number' || typeof origin.lon !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'El origen es obligatorio y debe incluir coordenadas latitud y longitud válidas (BR-032).'
      });
    }

    if (!destination || typeof destination.lat !== 'number' || typeof destination.lon !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'El destino es obligatorio y debe incluir coordenadas latitud y longitud válidas (BR-033).'
      });
    }

    const latDiff = Math.abs(origin.lat - destination.lat);
    const lonDiff = Math.abs(origin.lon - destination.lon);
    if (latDiff < 0.0001 && lonDiff < 0.0001) {
      return res.status(400).json({
        success: false,
        error: 'El origen y el destino deben representar ubicaciones diferentes para que exista un trayecto a evaluar (BR-034, BR-051).'
      });
    }

    if (soil_state !== 'auto' && !VALID_SOIL_STATES.includes(soil_state)) {
      return res.status(400).json({
        success: false,
        error: `Estado de suelo inválido '${soil_state}'. Debe ser 'Seco', 'Húmedo', 'Saturado' o 'auto' (BR-035).`
      });
    }

    // 2. Obtener rutas desde OSRM con detección de rutas reales (RN 12, etc.)
    const rawRoutes = await getRoutes(origin, destination);

    // 3. Evaluar cada ruta individualmente
    const assessedRoutes = [];
    let detectedSoilGlobal = null;
    let weatherForecastGlobal = null; // pronóstico detallado para mostrar en el panel

    for (const route of rawRoutes) {
      // BR-006, BR-037: Calcular el punto medio exacto del trayecto
      const midpoint = calculateRouteMidpoint(route.geometry.coordinates);

      // BR-005, BR-025, BR-036: Consultar precipitación y telemetría de suelo en el punto medio
      const weather = await getProjectedPrecipitation24h(
        midpoint.lat,
        midpoint.lon,
        simulated_rain_mm
      );

      if (!detectedSoilGlobal) {
        detectedSoilGlobal = weather.soilData;
        // Guardar el pronóstico completo del primer trayecto (punto medio representativo)
        weatherForecastGlobal = {
          forecast6h: weather.forecast6h,
          forecast12h: weather.forecast12h,
          forecast24h: weather.forecast24h,
          maxProb6h: weather.maxProb6h,
          maxProb12h: weather.maxProb12h,
          maxProb24h: weather.maxProb24h,
          hourlyForecast: weather.hourlyForecast
        };
      }

      const effectiveSoilState = soil_state === 'auto' ? weather.soilData.state : soil_state;

      // Superficie efectiva: usar override manual si el usuario la ajustó, sino la detectada fehacientemente
      const effectiveSurfaceType = surface_overrides[route.routeIndex] || route.surfaceType;

      // Ajustar nombre si la superficie fue forzada manualmente
      let effectiveName = route.name;
      if (surface_overrides[route.routeIndex]) {
        const surfLabel = effectiveSurfaceType === 'asfalto_ripio' ? 'Asfalto' : 'Calzada de Tierra';
        effectiveName = `${route.name.split('(')[0].trim()} (${surfLabel})`;
      }

      // Evaluar riesgo determinista según reglas de negocio
      const risk = evaluateRouteRisk({
        routeType: route.routeType,
        surfaceType: effectiveSurfaceType,
        soilState: effectiveSoilState,
        rain24hMm: weather.rain24hMm
      });

      assessedRoutes.push({
        routeIndex: route.routeIndex,
        name: effectiveName,
        routeType: route.routeType,
        surfaceType: effectiveSurfaceType,
        detectedSurfaceType: route.surfaceType,
        majorRoads: route.majorRoads,
        hasNationalRoute: route.hasNationalRoute,
        pavedPercentage: route.pavedPercentage,
        distanceKm: route.distanceKm,
        durationMin: route.durationMin,
        geometry: route.geometry,
        midpoint: {
          lat: midpoint.lat,
          lon: midpoint.lon
        },
        rain24hMm: weather.rain24hMm,
        hourlyForecast: weather.hourlyForecast,
        weatherSource: weather.source,
        soilData: weather.soilData,
        effectiveSoilState,
        riskPercentage: risk.riskPercentage,
        riskLevel: risk.riskLevel,
        verdict: risk.verdict,
        isPassable: risk.isPassable,
        ruleApplied: risk.ruleApplied,
        explanation: risk.explanation,
        thresholds: risk.thresholds
      });
    }

    // 4. Seleccionar la ruta recomendada priorizando seguridad (BR-018, BR-027, BR-056)
    const selection = selectRecommendedRoute(assessedRoutes);
    const effectiveGlobalSoilState = soil_state === 'auto' ? detectedSoilGlobal?.state : soil_state;

    // 5. Persistencia en base de datos con contexto RLS
    let savedRequest = null;
    try {
      savedRequest = await withUserContext(user_id, user_role, async (client) => {
        const reqRecord = await client.saveRouteRequest({
          origin_name: origin.name || `${origin.lat.toFixed(3)}, ${origin.lon.toFixed(3)}`,
          origin_lat: origin.lat,
          origin_lon: origin.lon,
          destination_name: destination.name || `${destination.lat.toFixed(3)}, ${destination.lon.toFixed(3)}`,
          destination_lat: destination.lat,
          destination_lon: destination.lon,
          soil_state: effectiveGlobalSoilState,
          cargo_type
        });

        const assessmentRecords = selection.routes.map(r => ({
          request_id: reqRecord.id,
          route_index: r.routeIndex,
          route_type: r.routeType,
          surface_type: r.surfaceType,
          distance_km: r.distanceKm,
          duration_min: r.durationMin,
          midpoint_lat: r.midpoint.lat,
          midpoint_lon: r.midpoint.lon,
          rain_24h_mm: r.rain24hMm,
          risk_percentage: r.riskPercentage,
          risk_level: r.riskLevel,
          verdict: r.verdict,
          is_passable: r.isPassable,
          is_recommended: r.isRecommended,
          geometry: r.geometry,
          notes: r.explanation
        }));

        await client.saveRiskAssessments(assessmentRecords);
        return reqRecord;
      });
    } catch (dbErr) {
      console.warn('Aviso de persistencia:', dbErr.message);
    }

    return res.json({
      success: true,
      requestId: savedRequest ? savedRequest.id : null,
      origin,
      destination,
      soilState: effectiveGlobalSoilState,
      soilSource: soil_state === 'auto' ? 'automatic_open_meteo' : 'manual_override',
      soilTelemetry: detectedSoilGlobal,
      weatherForecast: weatherForecastGlobal,
      cargoType: cargo_type,
      simulatedRain: simulated_rain_mm !== null,
      simulatedRainMm: simulated_rain_mm,
      routes: selection.routes,
      recommendedRouteId: selection.recommendedRouteId,
      alertMessage: selection.alertMessage,
      analyzedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error en analyzeRoutes:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor al procesar la ruta.'
    });
  }
}

/**
 * Obtiene la configuración de reglas de negocio
 */
async function getRules(req, res) {
  try {
    const rules = await withUserContext(DEFAULT_USER_ID, 'producer', async (client) => {
      return await client.getRiskRules();
    });
    return res.json({ success: true, rules });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Historial de consultas del usuario autenticado (RLS)
 */
async function getHistory(req, res) {
  try {
    const userId = req.query.user_id || DEFAULT_USER_ID;
    const role = req.query.role || DEFAULT_USER_ROLE;

    const history = await withUserContext(userId, role, async (client) => {
      return await client.getRecentRequests(10);
    });
    return res.json({ success: true, history });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  analyzeRoutes,
  getRules,
  getHistory
};

/**
 * Motor de Riesgo y Reglas de Negocio para AgroRoute
 * Implementación estricta de las reglas BR-001 a BR-067
 */

const VALID_SOIL_STATES = ['Seco', 'Húmedo', 'Saturado'];

/**
 * Calcula los umbrales de lluvia admisibles para cada tipo de ruta y suelo
 * Permite responder con precisión técnica: "¿Qué pasaría si al llover cierta cantidad sería transitable?"
 */
function calculateRouteThresholds(routeType, surfaceType, soilState) {
  const isSecondary = routeType === 'secondary' || surfaceType === 'tierra';

  if (isSecondary) {
    if (soilState === 'Húmedo') {
      return {
        maxSafeRainMm: 5.0,
        highRiskThresholdMm: 15.0, // BR-013
        criticalThresholdMm: 30.0, // BR-015
        toleratedRainSummary: 'Soporta hasta 15 mm antes de pasar a Riesgo Alto (80%). Con más de 30 mm queda Intransitable.',
        safetyBreakpoints: [
          { rainMm: 0, status: 'Transitable', riskPct: 20 },
          { rainMm: 10, status: 'Transitable con precaución', riskPct: 45 },
          { rainMm: 18, status: 'Riesgo Alto - Desaconsejado', riskPct: 80 },
          { rainMm: 35, status: 'Intransitable', riskPct: 100 }
        ]
      };
    }

    if (soilState === 'Saturado') {
      return {
        maxSafeRainMm: 0.0,
        highRiskThresholdMm: 0.1, // Suelo ya saturado
        criticalThresholdMm: 30.0,
        toleratedRainSummary: 'Suelo ya saturado: riesgo inminente de huellones con cualquier lluvia adicional. Intransitable con > 30 mm.',
        safetyBreakpoints: [
          { rainMm: 0, status: 'Alto riesgo de anegamiento', riskPct: 75 },
          { rainMm: 15, status: 'Alto riesgo de empantanamiento', riskPct: 85 },
          { rainMm: 35, status: 'Intransitable', riskPct: 100 }
        ]
      };
    }

    // Suelo Seco (BR-012)
    return {
      maxSafeRainMm: 15.0,
      highRiskThresholdMm: 25.0,
      criticalThresholdMm: 30.0,
      toleratedRainSummary: 'Suelo seco con buena absorción: transitable hasta 30 mm. Con más de 30 mm queda Intransitable.',
      safetyBreakpoints: [
        { rainMm: 0, status: 'Transitable', riskPct: 10 },
        { rainMm: 15, status: 'Transitable', riskPct: 15 },
        { rainMm: 25, status: 'Transitable con precaución', riskPct: 35 },
        { rainMm: 35, status: 'Intransitable', riskPct: 100 }
      ]
    };
  }

  // Ruta Principal (Asfalto / Ripio consolidado)
  return {
    maxSafeRainMm: 20.0,
    highRiskThresholdMm: 30.0,
    criticalThresholdMm: 30.0, // BR-045: lluvia > 30 mm prevalece como crítica en asfalto
    toleratedRainSummary: 'Calzada pavimentada de alta resistencia: transitable hasta 30 mm. Con más de 30 mm se declara Intransitable por anegamiento.',
    safetyBreakpoints: [
      { rainMm: 0, status: 'Transitable sin restricciones', riskPct: 10 },
      { rainMm: 15, status: 'Transitable sin restricciones', riskPct: 15 },
      { rainMm: 25, status: 'Transitable con precaución', riskPct: 25 },
      { rainMm: 35, status: 'Intransitable', riskPct: 100 }
    ]
  };
}

/**
 * Evalúa el nivel de riesgo, veredicto y transitabilidad de una ruta individual
 * 
 * @param {Object} params
 * @param {string} params.routeType - 'primary' | 'secondary'
 * @param {string} params.surfaceType - 'asfalto_ripio' | 'tierra'
 * @param {string} params.soilState - 'Seco' | 'Húmedo' | 'Saturado'
 * @param {number} params.rain24hMm - Lluvia proyectada o simulada en el punto medio (mm)
 * @returns {{ riskPercentage: number, riskLevel: 'BAJO'|'MEDIO'|'ALTO'|'CRITICO', verdict: string, isPassable: boolean, ruleApplied: string, explanation: string, thresholds: Object }}
 */
function evaluateRouteRisk({ routeType, surfaceType, soilState, rain24hMm }) {
  // BR-035: Validación del estado del suelo
  if (!VALID_SOIL_STATES.includes(soilState)) {
    throw new Error(`Estado de suelo inválido: '${soilState}'. Debe ser Seco, Húmedo o Saturado.`);
  }

  // BR-036, BR-052: Validación de lluvia
  if (typeof rain24hMm !== 'number' || isNaN(rain24hMm) || rain24hMm < 0) {
    throw new Error('Lluvia proyectada inválida o ausente.');
  }

  const thresholds = calculateRouteThresholds(routeType, surfaceType, soilState);

  // -------------------------------------------------------------------------
  // REGLA CRÍTICA 1 (BR-015, BR-016, BR-017, BR-026, BR-045, BR-046, BR-048)
  // Lluvia proyectada > 30 mm: Prevalece como riesgo crítico (100%) e intransitable,
  // sin importar tipo de camino (asfalto o tierra) ni estado del suelo.
  // BR-044: Si es exactamente 30 mm, NO supera el umbral crítico.
  // -------------------------------------------------------------------------
  if (rain24hMm > 30.0) {
    return {
      riskPercentage: 100,
      riskLevel: 'CRITICO',
      verdict: 'Intransitable',
      isPassable: false,
      ruleApplied: 'BR-015',
      explanation: `Lluvia proyectada de ${rain24hMm} mm (> 30 mm) genera anegamiento e intransitabilidad total. Se prohíbe el tránsito.`,
      thresholds
    };
  }

  // -------------------------------------------------------------------------
  // CAMINO SECUNDARIO (TIERRA)
  // BR-010, BR-011
  // -------------------------------------------------------------------------
  if (routeType === 'secondary' || surfaceType === 'tierra') {
    // BR-013, BR-014: Suelo Húmedo y lluvia > 15 mm -> Riesgo Alto (80%)
    if (soilState === 'Húmedo' && rain24hMm > 15.0) {
      return {
        riskPercentage: 80,
        riskLevel: 'ALTO',
        verdict: 'Transitable con alto riesgo - Desaconsejado',
        isPassable: true,
        ruleApplied: 'BR-013',
        explanation: `Camino secundario de tierra con suelo Húmedo y ${rain24hMm} mm de lluvia (> 15 mm). Riesgo elevado de empantanamiento y huellones profundos.`,
        thresholds
      };
    }

    // BR-047: Suelo Saturado (sin lluvia > 30 mm)
    if (soilState === 'Saturado') {
      const risk = rain24hMm > 10 ? 85 : 75;
      return {
        riskPercentage: risk,
        riskLevel: 'ALTO',
        verdict: 'Alto riesgo de anegamiento por suelo saturado',
        isPassable: true,
        ruleApplied: 'BR-047',
        explanation: `Suelo previamente saturado con ${rain24hMm} mm adicionales. Formación inmediata de lodazal y pérdida de sustentación.`,
        thresholds
      };
    }

    // BR-012: Suelo Seco (con lluvia <= 30 mm) -> Riesgo Bajo
    if (soilState === 'Seco') {
      const risk = rain24hMm > 15 ? 25 : 15;
      return {
        riskPercentage: risk,
        riskLevel: 'BAJO',
        verdict: 'Transitable',
        isPassable: true,
        ruleApplied: 'BR-012',
        explanation: `Camino de tierra con suelo Seco con capacidad de infiltración para ${rain24hMm} mm proyectados.`,
        thresholds
      };
    }

    // Suelo Húmedo con lluvia <= 15 mm
    return {
      riskPercentage: 45,
      riskLevel: 'MEDIO',
      verdict: 'Transitable con precaución',
      isPassable: true,
      ruleApplied: 'BR-013-LIGHT',
      explanation: `Camino de tierra con suelo húmedo y lluvia moderada (${rain24hMm} mm <= 15 mm). Transitar con doble tracción y precaución.`,
      thresholds
    };
  }

  // -------------------------------------------------------------------------
  // RUTA PRINCIPAL (ASFALTO / RIPIO CONSOLIDADO)
  // BR-008, BR-009
  // -------------------------------------------------------------------------
  if (soilState === 'Saturado' && rain24hMm > 15.0) {
    return {
      riskPercentage: 35,
      riskLevel: 'MEDIO',
      verdict: 'Transitable con precaución (banquinas anegadas)',
      isPassable: true,
      ruleApplied: 'BR-009-SAT',
      explanation: `Calzada pavimentada transitable, pero se advierte anegamiento en banquinas y visibilidad reducida por ${rain24hMm} mm de lluvia.`,
      thresholds
    };
  }

  // Condiciones normales o lluvia <= 30 mm en ruta principal
  const baseRisk = rain24hMm > 15 ? 20 : 10;
  return {
    riskPercentage: baseRisk,
    riskLevel: 'BAJO',
    verdict: 'Transitable sin restricciones',
    isPassable: true,
    ruleApplied: 'BR-009-NORM',
    explanation: `Ruta principal de asfalto/ripio consolidado con drenaje adecuado para ${rain24hMm} mm de lluvia proyectada.`,
    thresholds
  };
}

/**
 * Evalúa un conjunto de rutas analizadas y selecciona la ruta recomendada
 * Cumple con BR-018, BR-027, BR-028, BR-039, BR-049, BR-056
 */
function selectRecommendedRoute(assessedRoutes) {
  if (!assessedRoutes || assessedRoutes.length === 0) {
    throw new Error('Debe existir al menos una ruta analizada para emitir una recomendación (BR-038).');
  }

  // BR-027: Filtrar únicamente rutas que NO sean intransitables
  const passableRoutes = assessedRoutes.filter(r => r.isPassable && r.riskPercentage < 100);

  // BR-049: Si todas las rutas tienen riesgo crítico (intransitables)
  if (passableRoutes.length === 0) {
    const enriched = assessedRoutes.map(r => ({
      ...r,
      isRecommended: false
    }));

    return {
      routes: enriched,
      recommendedRouteId: null,
      alertMessage: 'ALERTA DE SEGURIDAD VIAL: No existe ninguna ruta transitable identificada en este momento. Todas las vías evaluadas superan los límites de seguridad climática (riesgo crítico 100%). Se recomienda postergar el traslado de ganado y mercadería.'
    };
  }

  // BR-056: Prioridad de seguridad - menor porcentaje de riesgo
  const sortedBySafety = [...passableRoutes].sort((a, b) => {
    if (a.riskPercentage !== b.riskPercentage) {
      return a.riskPercentage - b.riskPercentage;
    }
    if (a.routeType === 'primary' && b.routeType !== 'primary') return -1;
    if (b.routeType === 'primary' && a.routeType !== 'primary') return 1;
    return a.durationMin - b.durationMin;
  });

  const bestRoute = sortedBySafety[0];

  // BR-039: El resultado debe marcar una única ruta como recomendada
  const enriched = assessedRoutes.map(r => ({
    ...r,
    isRecommended: r.routeIndex === bestRoute.routeIndex
  }));

  return {
    routes: enriched,
    recommendedRouteId: bestRoute.routeIndex,
    alertMessage: null
  };
}

module.exports = {
  VALID_SOIL_STATES,
  calculateRouteThresholds,
  evaluateRouteRisk,
  selectRecommendedRoute
};

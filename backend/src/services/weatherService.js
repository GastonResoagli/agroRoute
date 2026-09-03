/**
 * Servicio Meteorológico y de Suelos para AgroRoute
 * Conexión con Open-Meteo API
 * Cumple con BR-005, BR-006, BR-024, BR-025, BR-035, BR-036, BR-052, BR-063
 */

/**
 * Clasifica agronómicamente el estado del suelo según humedad volumétrica y lluvias recientes
 */
function classifySoilMoisture(volumetricMoisture, pastRain48hMm) {
  const moisturePct = Math.round(volumetricMoisture * 100);
  const rain48h = Number(pastRain48hMm.toFixed(1));

  if (volumetricMoisture >= 0.35 || rain48h > 35) {
    return {
      state: 'Saturado',
      moisturePercent: moisturePct,
      pastRain48hMm: rain48h,
      explanation: `Capacidad de campo colmada (${moisturePct}% humedad, ${rain48h} mm en últimas 48h). Suelo blando con nula capacidad de absorción adicional.`
    };
  }

  if (volumetricMoisture >= 0.20 || rain48h > 10) {
    return {
      state: 'Húmedo',
      moisturePercent: moisturePct,
      pastRain48hMm: rain48h,
      explanation: `Humedad moderada en capa arable (${moisturePct}% humedad, ${rain48h} mm en últimas 48h). Suelo en estado plástico; vulnerable a formación de huellones con lluvias adicionales.`
    };
  }

  return {
    state: 'Seco',
    moisturePercent: moisturePct,
    pastRain48hMm: rain48h,
    explanation: `Suelo firme con bajo tenor hídrico (${moisturePct}% humedad, ${rain48h} mm en últimas 48h). Alta capacidad de absorción para precipitaciones leves o moderadas.`
  };
}

/**
 * Consulta la precipitación acumulada proyectada de las próximas 24 horas,
 * los datos de suelo en el punto dado, y el pronóstico horario detallado.
 * 
 * @param {number} latitude 
 * @param {number} longitude 
 * @param {number|null} simulatedRainMm
 * @returns {Promise<{ rain24hMm, forecast6h, forecast12h, forecast24h, hourlyForecast, soilData, source }>}
 */
async function getProjectedPrecipitation24h(latitude, longitude, simulatedRainMm = null) {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    throw new Error('Coordenadas inválidas para la consulta climática.');
  }

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=precipitation,precipitation_probability,soil_moisture_0_to_1cm,soil_moisture_1_to_3cm,soil_moisture_3_to_9cm&past_days=2&forecast_days=2&timezone=auto`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Error en API Open-Meteo: código HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data.hourly || !data.hourly.precipitation || !Array.isArray(data.hourly.precipitation)) {
      throw new Error('Respuesta climática sin datos horarios de precipitación.');
    }

    const times = data.hourly.time || [];
    const precips = data.hourly.precipitation || [];
    const probs = data.hourly.precipitation_probability || [];
    const sm01 = data.hourly.soil_moisture_0_to_1cm || [];
    const sm13 = data.hourly.soil_moisture_1_to_3cm || [];
    const sm39 = data.hourly.soil_moisture_3_to_9cm || [];

    // Localizar el índice actual según hora ISO
    const nowIso = new Date().toISOString().slice(0, 13);
    let currentIndex = times.findIndex(t => t.startsWith(nowIso));
    if (currentIndex === -1) {
      currentIndex = Math.min(48, times.length - 1);
    }

    // 1. Lluvias pasadas de las últimas 48 horas
    const past48hPrecips = precips.slice(Math.max(0, currentIndex - 48), currentIndex);
    const pastRain48hSum = past48hPrecips.reduce((sum, val) => sum + (Number(val) || 0), 0);

    // 2. Humedad de suelo actual (promedio ponderado de los estratos superficiales 0-9 cm)
    const currentSm01 = Number(sm01[currentIndex] ?? sm01[0] ?? 0.22);
    const currentSm13 = Number(sm13[currentIndex] ?? sm13[0] ?? 0.23);
    const currentSm39 = Number(sm39[currentIndex] ?? sm39[0] ?? 0.24);
    const averageMoisture = (currentSm01 * 0.4 + currentSm13 * 0.3 + currentSm39 * 0.3);

    // Clasificar automáticamente el suelo
    const soilData = classifySoilMoisture(averageMoisture, pastRain48hSum);

    // 3. Pronóstico detallado de las próximas 24 horas con probabilidad de lluvia
    const next24hPrecips = precips.slice(currentIndex, currentIndex + 24);
    const next24hTimes = times.slice(currentIndex, currentIndex + 24);
    const next24hProbs = probs.slice(currentIndex, currentIndex + 24);

    // Acumulados por ventana temporal
    const forecast6h = Number(
      next24hPrecips.slice(0, 6).reduce((s, v) => s + (Number(v) || 0), 0).toFixed(1)
    );
    const forecast12h = Number(
      next24hPrecips.slice(0, 12).reduce((s, v) => s + (Number(v) || 0), 0).toFixed(1)
    );
    const forecast24h = Number(
      next24hPrecips.reduce((s, v) => s + (Number(v) || 0), 0).toFixed(1)
    );

    // Máxima probabilidad de lluvia en las próximas 6h, 12h y 24h
    const maxProb6h = Math.max(...(next24hProbs.slice(0, 6).map(Number) || [0]));
    const maxProb12h = Math.max(...(next24hProbs.slice(0, 12).map(Number) || [0]));
    const maxProb24h = Math.max(...(next24hProbs.map(Number) || [0]));

    let rain24hMm;
    if (simulatedRainMm !== null && simulatedRainMm !== undefined && !isNaN(Number(simulatedRainMm))) {
      rain24hMm = Number(Number(simulatedRainMm).toFixed(1));
    } else {
      rain24hMm = forecast24h;
    }

    // Pronóstico horario con precipitación y probabilidad
    const hourlyForecast = next24hTimes.map((time, idx) => ({
      time,
      precipitation: Number((next24hPrecips[idx] || 0).toFixed(1)),
      probability: Math.round(Number(next24hProbs[idx] || 0))
    }));

    return {
      rain24hMm,
      forecast6h,
      forecast12h,
      forecast24h,
      maxProb6h: Math.round(maxProb6h),
      maxProb12h: Math.round(maxProb12h),
      maxProb24h: Math.round(maxProb24h),
      hourlyForecast,
      soilData,
      isSimulatedRain: simulatedRainMm !== null && simulatedRainMm !== undefined,
      source: 'open-meteo'
    };
  } catch (error) {
    console.warn(`Aviso en Open-Meteo para [${latitude}, ${longitude}], aplicando valores seguros:`, error.message);

    const fallbackSoil = classifySoilMoisture(0.24, 2.5);
    return {
      rain24hMm: simulatedRainMm !== null ? Number(Number(simulatedRainMm).toFixed(1)) : 0.0,
      forecast6h: 0,
      forecast12h: 0,
      forecast24h: 0,
      maxProb6h: 0,
      maxProb12h: 0,
      hourlyForecast: [],
      soilData: fallbackSoil,
      isSimulatedRain: simulatedRainMm !== null,
      source: 'fallback'
    };
  }
}

module.exports = {
  getProjectedPrecipitation24h,
  classifySoilMoisture
};

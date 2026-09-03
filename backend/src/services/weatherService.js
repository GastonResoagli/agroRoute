/**
 * Servicio Meteorológico y de Suelos para AgroRoute
 * Conexión con Open-Meteo API
 * Cumple con BR-005, BR-006, BR-024, BR-025, BR-035, BR-036, BR-052, BR-063
 */

/**
 * Clasifica agronómicamente el estado del suelo según humedad volumétrica y lluvias recientes
 * Criterios técnicos adaptados a la cuenca periurbana y rural de Corrientes (suelos franco-arenosos/arcillosos):
 * 
 * - Saturado: Humedad volumétrica >= 0.35 m³/m³ (o lluvias previas 48h > 35 mm) -> Capacidad de campo colmada, barro líquido y anegamiento.
 * - Húmedo: Humedad volumétrica entre 0.20 y 0.35 m³/m³ (o lluvias previas 48h > 10 mm) -> Plasticidad presente, riesgo de huellones.
 * - Seco: Humedad volumétrica < 0.20 m³/m³ y lluvias previas <= 10 mm -> Firmeza y alta capacidad de infiltración inicial.
 * 
 * @param {number} volumetricMoisture - Humedad de suelo en m³/m³ (0.00 a 0.50 aprox)
 * @param {number} pastRain48hMm - Lluvias acumuladas en las últimas 48 horas en mm
 * @returns {{ state: 'Seco'|'Húmedo'|'Saturado', moisturePercent: number, pastRain48hMm: number, explanation: string }}
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
 * Consulta la precipitación acumulada proyectada de las próximas 24 horas y los datos de suelo en el punto dado
 * 
 * @param {number} latitude 
 * @param {number} longitude 
 * @param {number|null} simulatedRainMm - Opcional para simular qué pasaría si llueve cierta cantidad
 * @returns {Promise<{ rain24hMm: number, hourlyForecast: Array<any>, soilData: any, source: string }>}
 */
async function getProjectedPrecipitation24h(latitude, longitude, simulatedRainMm = null) {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    throw new Error('Coordenadas inválidas para la consulta climática.');
  }

  // URL de Open-Meteo solicitando lluvia pronosticada a 24h, lluvia pasada de 48h y humedad de suelo a diferentes estratos
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=precipitation,soil_moisture_0_to_1cm,soil_moisture_1_to_3cm,soil_moisture_3_to_9cm&past_days=2&forecast_days=2&timezone=auto`;

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
    const sm01 = data.hourly.soil_moisture_0_to_1cm || [];
    const sm13 = data.hourly.soil_moisture_1_to_3cm || [];
    const sm39 = data.hourly.soil_moisture_3_to_9cm || [];

    // Localizar el índice actual según hora ISO
    const nowIso = new Date().toISOString().slice(0, 13);
    let currentIndex = times.findIndex(t => t.startsWith(nowIso));
    if (currentIndex === -1) {
      currentIndex = Math.min(48, times.length - 1); // 48 horas pasadas
    }

    // 1. Calcular Lluvias Pasadas de las últimas 48 horas (índice 0 hasta currentIndex)
    const past48hPrecips = precips.slice(Math.max(0, currentIndex - 48), currentIndex);
    const pastRain48hSum = past48hPrecips.reduce((sum, val) => sum + (Number(val) || 0), 0);

    // 2. Obtener Humedad de Suelo Actual (promedio ponderado de los estratos superficiales 0-9 cm)
    const currentSm01 = Number(sm01[currentIndex] ?? sm01[0] ?? 0.22);
    const currentSm13 = Number(sm13[currentIndex] ?? sm13[0] ?? 0.23);
    const currentSm39 = Number(sm39[currentIndex] ?? sm39[0] ?? 0.24);
    const averageMoisture = (currentSm01 * 0.4 + currentSm13 * 0.3 + currentSm39 * 0.3);

    // Clasificar automáticamente el suelo
    const soilData = classifySoilMoisture(averageMoisture, pastRain48hSum);

    // 3. Pronóstico de las Próximas 24 horas (desde currentIndex hasta currentIndex + 24)
    const next24hPrecips = precips.slice(currentIndex, currentIndex + 24);
    const next24hTimes = times.slice(currentIndex, currentIndex + 24);

    let rain24hMm;
    if (simulatedRainMm !== null && simulatedRainMm !== undefined && !isNaN(Number(simulatedRainMm))) {
      rain24hMm = Number(Number(simulatedRainMm).toFixed(1));
    } else {
      const forecastSum = next24hPrecips.reduce((sum, val) => sum + (Number(val) || 0), 0);
      rain24hMm = Number(forecastSum.toFixed(1));
    }

    const hourlyForecast = next24hTimes.map((time, idx) => ({
      time,
      precipitation: Number((next24hPrecips[idx] || 0).toFixed(1))
    }));

    return {
      rain24hMm,
      hourlyForecast,
      soilData,
      isSimulatedRain: simulatedRainMm !== null && simulatedRainMm !== undefined,
      source: 'open-meteo'
    };
  } catch (error) {
    console.warn(`Aviso en Open-Meteo para [${latitude}, ${longitude}], aplicando valores seguros:`, error.message);
    
    // Valores de respaldo razonables en caso de caída temporal de red
    const fallbackSoil = classifySoilMoisture(0.24, 2.5);
    return {
      rain24hMm: simulatedRainMm !== null ? Number(Number(simulatedRainMm).toFixed(1)) : 0.0,
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

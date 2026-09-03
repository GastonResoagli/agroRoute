/**
 * Servicio de Cálculos Geográficos para AgroRoute
 * Cumple con BR-006 y BR-037: "La precipitación utilizada para evaluar una ruta debe corresponder al punto medio del trayecto"
 */

// Radio medio de la Tierra en kilómetros
const EARTH_RADIUS_KM = 6371;

/**
 * Convierte grados a radianes
 */
function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

/**
 * Calcula la distancia ortodrómica entre dos puntos mediante la fórmula de Haversine
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} distancia en kilómetros
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Calcula el punto medio exacto a lo largo de una polilínea geográfica (GeoJSON coordinates: [[lon, lat], ...])
 * Recorre la geometría acumulando distancias y realiza una interpolación lineal precisa en el 50% de la longitud total.
 * 
 * @param {Array<[number, number]>} coordinates - Array de pares [longitud, latitud] en formato GeoJSON
 * @returns {{ lat: number, lon: number, totalDistanceKm: number }}
 */
function calculateRouteMidpoint(coordinates) {
  if (!coordinates || coordinates.length === 0) {
    throw new Error('Coordenadas no provistas para el cálculo del punto medio.');
  }

  if (coordinates.length === 1) {
    return {
      lat: coordinates[0][1],
      lon: coordinates[0][0],
      totalDistanceKm: 0
    };
  }

  // 1. Calcular distancias de cada segmento y distancia acumulada total
  const segmentDistances = [];
  let totalDistanceKm = 0;

  for (let i = 0; i < coordinates.length - 1; i++) {
    const [lon1, lat1] = coordinates[i];
    const [lon2, lat2] = coordinates[i + 1];
    const dist = haversineDistance(lat1, lon1, lat2, lon2);
    segmentDistances.push(dist);
    totalDistanceKm += dist;
  }

  const targetDistanceKm = totalDistanceKm / 2;

  // 2. Localizar el segmento donde se alcanza el 50% del trayecto
  let accumulatedKm = 0;
  for (let i = 0; i < segmentDistances.length; i++) {
    const dist = segmentDistances[i];
    if (accumulatedKm + dist >= targetDistanceKm) {
      const remainingKm = targetDistanceKm - accumulatedKm;
      const ratio = dist === 0 ? 0 : remainingKm / dist;

      const [lon1, lat1] = coordinates[i];
      const [lon2, lat2] = coordinates[i + 1];

      // Interpolación lineal de latitud y longitud
      const midLat = lat1 + (lat2 - lat1) * ratio;
      const midLon = lon1 + (lon2 - lon1) * ratio;

      return {
        lat: Number(midLat.toFixed(6)),
        lon: Number(midLon.toFixed(6)),
        totalDistanceKm: Number(totalDistanceKm.toFixed(2))
      };
    }
    accumulatedKm += dist;
  }

  // Fallback si por redondeo llega al final
  const lastPoint = coordinates[coordinates.length - 1];
  return {
    lat: Number(lastPoint[1].toFixed(6)),
    lon: Number(lastPoint[0].toFixed(6)),
    totalDistanceKm: Number(totalDistanceKm.toFixed(2))
  };
}

module.exports = {
  haversineDistance,
  calculateRouteMidpoint
};


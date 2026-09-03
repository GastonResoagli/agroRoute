/**
 * Servicio de Enrutamiento OSRM para AgroRoute (Región Corrientes)
 * Integra clasificación real de calzada via Nominatim/OSM (surfaceService)
 * y garantiza alternativas de ruta dentro del territorio de Corrientes.
 * 
 * Cumple con BR-007, BR-008, BR-009, BR-010, BR-011, BR-023, BR-050, BR-062, BR-064
 */

const { classifyRouteSurface } = require('./surfaceService');

// Nodos y enlaces rurales estratégicos de la red vial de Corrientes
const CORRIENTES_RURAL_ANCHORS = [
  { id: 'santa-ana', name: 'Santa Ana de los Guácaras (RP 43)', lat: -27.458, lon: -58.653 },
  { id: 'san-cosme', name: 'San Cosme rural (RP 98 / RP 9)', lat: -27.371, lon: -58.511 },
  { id: 'san-cayetano', name: 'San Cayetano (Conexión rural sur)', lat: -27.568, lon: -58.694 },
  { id: 'laguna-brava', name: 'Laguna Brava / RP 5 rural', lat: -27.485, lon: -58.740 },
  { id: 'riachuelo-rural', name: 'Riachuelo rural (Blasco Ibáñez / RP 46)', lat: -27.585, lon: -58.720 },
  { id: 'san-luis-rural', name: 'San Luis del Palmar rural (RP 5)', lat: -27.509, lon: -58.555 }
];

/**
 * Valida si una geometría transita estrictamente por territorio de Corrientes
 * y no cruza el Río Paraná hacia la provincia de Chaco o Isla del Cerrito
 */
function isStrictlyInCorrientes(coordinates) {
  if (!coordinates || coordinates.length === 0) return false;

  for (const [lon, lat] of coordinates) {
    if (lon < -58.836 && lat > -27.55 && lat < -27.40) {
      return false; // Cruzando puente hacia Resistencia
    }
    if (lat > -27.33 && lon < -58.62) {
      return false; // Isla del Cerrito
    }
    if (lon < -58.95) {
      return false;
    }
  }
  return true;
}

/**
 * Extrae nombre de la ruta principal para display
 */
function buildDisplayName(surfaceAnalysis) {
  const { surfaceType, hasNationalRoute, majorRoads } = surfaceAnalysis;

  let label = 'Camino Rural';
  if (hasNationalRoute) {
    const rnRoad = majorRoads.find(r => /RN\s*\d+/i.test(r)) || majorRoads[0] || 'RN';
    label = `Ruta por ${rnRoad}`;
  } else if (majorRoads.length > 0) {
    label = `Vía ${majorRoads.slice(0, 2).join(' / ')}`;
  }

  if (surfaceType === 'asfalto_ripio') {
    return hasNationalRoute ? `${label} (Asfalto)` : `${label} (Asfalto / Ripio)`;
  }
  return `${label} (Tierra)`;
}

/**
 * Consulta rutas a OSRM garantizando opciones dentro de Corrientes
 * y clasifica la superficie real de calzada via Nominatim/OSM
 */
async function getRoutes(origin, destination) {
  if (!origin || !destination) {
    throw new Error('Origen y destino son requeridos.');
  }

  const oLon = Number(origin.lon).toFixed(6);
  const oLat = Number(origin.lat).toFixed(6);
  const dLon = Number(destination.lon).toFixed(6);
  const dLat = Number(destination.lat).toFixed(6);

  // 1. Consulta directa a OSRM pidiendo alternativas
  const primaryUrl = `https://router.project-osrm.org/route/v1/driving/${oLon},${oLat};${dLon},${dLat}?overview=full&geometries=geojson&steps=true&alternatives=3`;

  let validRoutes = [];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);
    const res = await fetch(primaryUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        validRoutes = data.routes.filter(r => isStrictlyInCorrientes(r.geometry?.coordinates));
      }
    }
  } catch (err) {
    console.warn('Aviso en consulta directa OSRM:', err.message);
  }

  // 2. Si OSRM sólo devolvió 1 ruta, buscamos activamente una alternativa secundaria (BR-007)
  if (validRoutes.length <= 1) {
    const midLon = (Number(oLon) + Number(dLon)) / 2;
    const midLat = (Number(oLat) + Number(dLat)) / 2;
    const dLonDelta = Number(dLon) - Number(oLon);
    const dLatDelta = Number(dLat) - Number(oLat);

    const candidateWaypoints = [
      [-58.720, -27.585], // Blasco Ibáñez / RP 46
      [midLon - dLatDelta * 0.35, midLat + dLonDelta * 0.35],
      [midLon + dLatDelta * 0.35, midLat - dLonDelta * 0.35],
      [midLon - dLatDelta * 0.6, midLat + dLonDelta * 0.6],
      [midLon + dLatDelta * 0.6, midLat - dLonDelta * 0.6],
      [-58.653, -27.458], // Santa Ana RP 43
      [-58.511, -27.371], // San Cosme
      [-58.740, -27.485]  // Laguna Brava
    ];

    const mainDist = validRoutes[0]?.distance || 10000;

    for (const [wLon, wLat] of candidateWaypoints) {
      if (wLon < -58.835) continue;

      try {
        const altUrl = `https://router.project-osrm.org/route/v1/driving/${oLon},${oLat};${wLon.toFixed(4)},${wLat.toFixed(4)};${dLon},${dLat}?overview=full&geometries=geojson&steps=true`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const altRes = await fetch(altUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (altRes.ok) {
          const altData = await altRes.json();
          if (altData.routes && altData.routes.length > 0) {
            const altRoute = altData.routes[0];
            const isCorrientes = isStrictlyInCorrientes(altRoute.geometry?.coordinates);
            const distDiff = Math.abs(altRoute.distance - mainDist);

            if (isCorrientes && distDiff > 300 && altRoute.distance < mainDist * 2.5) {
              validRoutes.push(altRoute);
              break;
            }
          }
        }
      } catch { /* continuar */ }
    }
  }

  if (validRoutes.length === 0) {
    throw new Error('No se pudo calcular una ruta transitable dentro de la red vial de Corrientes.');
  }

  // 3. Clasificar superficie real de cada ruta usando Nominatim/OSM
  //    (secuencialmente para respetar el rate limit de Nominatim: 1 req/seg)
  const analyzedRoutes = [];

  for (let i = 0; i < validRoutes.length; i++) {
    const route = validRoutes[i];
    const distanceKm = Number((route.distance / 1000).toFixed(2));
    const durationMin = Math.round(route.duration / 60);

    // Análisis de superficie real via Nominatim/OSM
    const surfaceAnalysis = await classifyRouteSurface(route);
    const displayName = buildDisplayName(surfaceAnalysis);

    analyzedRoutes.push({
      routeIndex: i,
      routeType: i === 0 ? 'primary' : 'secondary',
      distanceKm,
      durationMin,
      geometry: route.geometry,
      surfaceType: surfaceAnalysis.surfaceType,
      majorRoads: surfaceAnalysis.majorRoads,
      pavedPercentage: surfaceAnalysis.pavedPercent,
      hasNationalRoute: surfaceAnalysis.hasNationalRoute,
      osmSurfaceData: surfaceAnalysis.osmSurfaceData,
      name: displayName
    });
  }

  return analyzedRoutes;
}

module.exports = {
  getRoutes,
  isStrictlyInCorrientes,
  CORRIENTES_RURAL_ANCHORS
};

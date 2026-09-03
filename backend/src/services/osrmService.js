/**
 * Servicio de Enrutamiento OSRM para AgroRoute (Región Corrientes)
 * Cumple con BR-007, BR-008, BR-009, BR-010, BR-011, BR-023, BR-050, BR-062, BR-064
 */

// Nodos y enlaces rurales estratégicos de la red vial de Corrientes
// Garantizan que los desvíos secundarios de tierra/ripio se mantengan estrictamente dentro de la provincia
const CORRIENTES_RURAL_ANCHORS = [
  { id: 'santa-ana', name: 'Santa Ana de los Guácaras (RP 43)', lat: -27.458, lon: -58.653 },
  { id: 'san-cosme', name: 'San Cosme rural (RP 98 / RP 9)', lat: -27.371, lon: -58.511 },
  { id: 'san-cayetano', name: 'San Cayetano (Conexión rural sur)', lat: -27.568, lon: -58.694 },
  { id: 'laguna-brava', name: 'Laguna Brava / RP 5 rural', lat: -27.485, lon: -58.740 },
  { id: 'riachuelo-rural', name: 'Riachuelo rural', lat: -27.581, lon: -58.745 },
  { id: 'san-luis-rural', name: 'San Luis del Palmar rural (RP 5)', lat: -27.509, lon: -58.555 }
];

/**
 * Valida si una geometría transita estrictamente por territorio de Corrientes
 * y no cruza el Río Paraná hacia la provincia de Chaco o Isla del Cerrito
 * 
 * En Corrientes Capital / Norte:
 * - Longitud < -58.836 indica cruce del puente interprovincial General Belgrano hacia Resistencia/Barranqueras (Chaco).
 * - Latitud > -27.35 con longitud < -58.60 en el cuadrante del río Paraná indica incursión fluvial o en Isla del Cerrito.
 */
function isStrictlyInCorrientes(coordinates) {
  if (!coordinates || coordinates.length === 0) return false;

  for (const [lon, lat] of coordinates) {
    // Cruzando el puente hacia Chaco (Resistencia/Barranqueras)
    if (lon < -58.836 && lat > -27.55 && lat < -27.40) {
      return false;
    }
    // Incursión en Isla del Cerrito / Chaco norte
    if (lat > -27.33 && lon < -58.62) {
      return false;
    }
    // Fuera de los límites generales de la región evaluada
    if (lon < -58.95) {
      return false;
    }
  }
  return true;
}

/**
 * Encuentra el mejor nodo rural intermedio de Corrientes para generar un desvío secundario realista
 */
function findBestCorrientesRuralAnchor(origin, destination) {
  const oLat = origin.lat;
  const oLon = origin.lon;
  const dLat = destination.lat;
  const dLon = destination.lon;

  // Centro geométrico entre origen y destino
  const midLat = (oLat + dLat) / 2;
  const midLon = (oLon + dLon) / 2;

  let bestAnchor = null;
  let bestScore = Infinity;

  for (const anchor of CORRIENTES_RURAL_ANCHORS) {
    // Evitar que el nodo coincida con el origen o destino
    const distToO = Math.hypot(anchor.lat - oLat, anchor.lon - oLon);
    const distToD = Math.hypot(anchor.lat - dLat, anchor.lon - dLon);

    if (distToO < 0.03 || distToD < 0.03) {
      continue;
    }

    // Calcular distancia al punto medio del trayecto
    const distToMid = Math.hypot(anchor.lat - midLat, anchor.lon - midLon);
    
    // Penalizar si el ancla se desvía demasiado lejos del eje de viaje
    const totalExtraDist = distToO + distToD;

    if (totalExtraDist < bestScore) {
      bestScore = totalExtraDist;
      bestAnchor = anchor;
    }
  }

  return bestAnchor || CORRIENTES_RURAL_ANCHORS[0];
}

/**
 * Consulta rutas a OSRM garantizando que todas las alternativas se mantengan en Corrientes
 * 
 * @param {{ lat: number, lon: number }} origin 
 * @param {{ lat: number, lon: number }} destination 
 * @returns {Promise<Array<{ routeIndex: number, routeType: string, surfaceType: string, distanceKm: number, durationMin: number, geometry: any, name: string }>>}
 */
async function getRoutes(origin, destination) {
  if (!origin || !destination) {
    throw new Error('Origen y destino son requeridos.');
  }

  const oLon = Number(origin.lon).toFixed(6);
  const oLat = Number(origin.lat).toFixed(6);
  const dLon = Number(destination.lon).toFixed(6);
  const dLat = Number(destination.lat).toFixed(6);

  // 1. Consulta inicial directa con alternativas
  const primaryUrl = `https://router.project-osrm.org/route/v1/driving/${oLon},${oLat};${dLon},${dLat}?overview=full&geometries=geojson&alternatives=true`;

  let validRoutes = [];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(primaryUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        // Filtrar rutas que no crucen a Chaco ni se salgan de Corrientes
        validRoutes = data.routes.filter(r => isStrictlyInCorrientes(r.geometry?.coordinates));
      }
    }
  } catch (err) {
    console.warn('Aviso en consulta directa OSRM:', err.message);
  }

  // 2. Si no hay alternativas válidas dentro de Corrientes, consultamos vía nodo rural de Corrientes (RP 43, etc.)
  if (validRoutes.length <= 1) {
    try {
      const ruralAnchor = findBestCorrientesRuralAnchor(origin, destination);

      if (ruralAnchor) {
        const aLon = Number(ruralAnchor.lon).toFixed(6);
        const aLat = Number(ruralAnchor.lat).toFixed(6);

        const altUrl = `https://router.project-osrm.org/route/v1/driving/${oLon},${oLat};${aLon},${aLat};${dLon},${dLat}?overview=full&geometries=geojson`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const altRes = await fetch(altUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (altRes.ok) {
          const altData = await altRes.json();
          if (altData.routes && altData.routes.length > 0) {
            const altRoute = altData.routes[0];
            
            // Validar que no cruce a Chaco y que la distancia sea razonable (máximo 2.2x la principal)
            const isCorrientes = isStrictlyInCorrientes(altRoute.geometry?.coordinates);
            const mainDistance = validRoutes[0]?.distance || 50000;
            const isReasonableDistance = altRoute.distance < mainDistance * 2.2;

            if (isCorrientes && isReasonableDistance) {
              validRoutes.push(altRoute);
            }
          }
        }
      }
    } catch (err) {
      console.warn('No se pudo generar ruta secundaria complementaria en Corrientes:', err.message);
    }
  }

  if (validRoutes.length === 0) {
    throw new Error('No se pudo calcular una ruta transitable dentro de la red vial de Corrientes.');
  }

  // 3. Ordenar rutas por duración (la más rápida es la principal - BR-008)
  const sorted = [...validRoutes].sort((a, b) => a.duration - b.duration);

  // 4. Mapear y clasificar calzadas según reglas de negocio
  return sorted.map((route, index) => {
    const isPrimary = index === 0;
    const distanceKm = Number((route.distance / 1000).toFixed(2));
    const durationMin = Math.round(route.duration / 60);

    return {
      routeIndex: index,
      // BR-008, BR-010: Ruta más rápida es principal, el resto secundarias
      routeType: isPrimary ? 'primary' : 'secondary',
      // BR-009, BR-011: Principal es asfalto/ripio, alternativas son tierra
      surfaceType: isPrimary ? 'asfalto_ripio' : 'tierra',
      distanceKm,
      durationMin,
      geometry: route.geometry,
      name: isPrimary
        ? 'Ruta Principal (Asfalto / Ripio consolidado)'
        : `Ruta Secundaria ${index} (Camino de tierra / Desvío rural Corrientes)`
    };
  });
}

module.exports = {
  getRoutes,
  isStrictlyInCorrientes,
  CORRIENTES_RURAL_ANCHORS
};

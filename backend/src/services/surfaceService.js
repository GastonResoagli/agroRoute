/**
 * Servicio de Clasificación de Superficie de Calzada — AgroRoute
 * 
 * Usa Nominatim (OpenStreetMap) para identificar el tipo OSM de highway
 * en los puntos medios de cada tramo (step) de la ruta devuelta por OSRM.
 * 
 * Tipos OSM -> Clasificación de Superficie:
 *   motorway, trunk, primary, secondary, tertiary, residential  -> Asfalto / Ripio Consolidado
 *   unclassified, track, path, bridleway                        -> Tierra / Ripio sin consolidar
 */

// Tipos de highway de OSM que corresponden a calzadas pavimentadas o ripio consolidado
const PAVED_OSM_HIGHWAY_TYPES = new Set([
  'motorway', 'motorway_link',
  'trunk', 'trunk_link',
  'primary', 'primary_link',
  'secondary', 'secondary_link',
  'tertiary', 'tertiary_link',
  'residential',
  'living_street',
  'service'
]);

// Tipos de highway de OSM que corresponden a caminos de tierra o ripio sin consolidar
const UNPAVED_OSM_HIGHWAY_TYPES = new Set([
  'track',
  'path',
  'footway',
  'cycleway',
  'bridleway',
  'unclassified',
  'road'
]);

// Etiquetas de nombre y ref de rutas nacionales para enriquecer la identificación
const NATIONAL_ROUTE_REGEX = /\b(RN\s*\d+|Ruta Nacional \d+)\b/i;
const PROVINCIAL_ROUTE_REGEX = /\b(RP\s*\d+|Ruta Provincial \d+)\b/i;

/**
 * Consulta Nominatim para obtener el tipo OSM de la vía en una coordenada
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<{ category: string, type: string, isPaved: boolean, roadName: string }>}
 */
async function classifyPointOSM(lat, lon) {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=jsonv2`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'AgroRoute/1.0 (Corrientes, Argentina - Transitabilidad Rural)' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) return null;

    const data = await res.json();
    const category = data.category || '';
    const type = data.type || '';
    const isPaved = category === 'highway' && PAVED_OSM_HIGHWAY_TYPES.has(type);
    const isUnpaved = UNPAVED_OSM_HIGHWAY_TYPES.has(type);
    const roadName = data.address?.road || data.display_name?.split(',')[0] || '';

    return { category, type, isPaved, isUnpaved, roadName };
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}

/**
 * Clasifica la superficie de una ruta OSRM completa usando muestreo de tramos con Nominatim
 * 
 * Estrategia:
 * 1. Filtrar pasos significativos (> 300 m)
 * 2. Consultar Nominatim para el punto medio de hasta 5 pasos
 * 3. Calcular proporción de km pavimentados vs tierra
 * 4. Resultado: 'asfalto_ripio' si >= 40% es pavimentado, 'tierra' si predomina sin pavimentar
 * 
 * @param {object} osrmRoute - Objeto de ruta de OSRM con legs y steps
 * @param {string} fallbackRef - Ref/nombre del paso principal (ej. 'RN12')
 * @returns {Promise<{ surfaceType: 'asfalto_ripio'|'tierra', majorRoads: string[], osmSurfaceData: object[] }>}
 */
async function classifyRouteSurface(osrmRoute, fallbackRef) {
  const steps = osrmRoute.legs?.flatMap(l => l.steps || []) || [];

  // Recopilar refs y nombres del análisis de texto (heurística rápida)
  const majorRoads = new Set();
  let hasNationalRouteByRef = false;
  let pavedDistByRef = 0;
  let unpavedDistByRef = 0;

  for (const step of steps) {
    const name = (step.name || '').trim();
    const ref = (step.ref || '').trim();
    const dist = step.distance || 0;

    if (NATIONAL_ROUTE_REGEX.test(ref) || NATIONAL_ROUTE_REGEX.test(name)) {
      hasNationalRouteByRef = true;
      if (ref) majorRoads.add(ref);
      pavedDistByRef += dist;
    } else if (PROVINCIAL_ROUTE_REGEX.test(ref) || PROVINCIAL_ROUTE_REGEX.test(name)) {
      if (ref) majorRoads.add(ref);
      pavedDistByRef += dist;
    } else if (/Avenida|Autovía|Autopista/i.test(name)) {
      pavedDistByRef += dist;
    } else if (/picada|tierra|huella|barro/i.test(name)) {
      unpavedDistByRef += dist;
    }
  }

  // Obtener pasos más largos para muestrear con Nominatim
  const candidateSteps = steps
    .filter(s => s.distance > 300 && s.geometry?.coordinates?.length > 0)
    .sort((a, b) => b.distance - a.distance)
    .slice(0, 4); // Máximo 4 queries a Nominatim (respetando rate limit)

  const osmSurfaceData = [];
  let pavedDistOSM = 0;
  let unpavedDistOSM = 0;
  let unknownDist = 0;

  for (const step of candidateSteps) {
    // Respetar el rate limit de Nominatim (1 req/s)
    await new Promise(resolve => setTimeout(resolve, 1100));

    const coords = step.geometry.coordinates;
    const midIdx = Math.floor(coords.length / 2);
    const [mLon, mLat] = coords[midIdx];

    const result = await classifyPointOSM(mLat, mLon);

    if (result) {
      const stepData = {
        step_name: step.name || '',
        step_ref: step.ref || '',
        step_dist_m: step.distance,
        osm_category: result.category,
        osm_type: result.type,
        road_name: result.roadName,
        is_paved: result.isPaved,
        is_unpaved: result.isUnpaved
      };

      osmSurfaceData.push(stepData);

      if (result.isPaved) {
        pavedDistOSM += step.distance;
        if (result.roadName) majorRoads.add(result.roadName);
      } else if (result.isUnpaved) {
        unpavedDistOSM += step.distance;
      } else {
        // Categoría desconocida (ej. boundary): pesa neutral
        unknownDist += step.distance;
      }
    }
  }

  // Calcular decisión final de superficie
  const totalSampled = pavedDistOSM + unpavedDistOSM;
  let surfaceType;

  if (hasNationalRouteByRef) {
    // Las Rutas Nacionales en Argentina son siempre pavimentadas
    surfaceType = 'asfalto_ripio';
  } else if (totalSampled > 0) {
    // Usar datos reales de Nominatim si hay suficiente cobertura
    const pavedRatio = pavedDistOSM / totalSampled;
    surfaceType = pavedRatio >= 0.4 ? 'asfalto_ripio' : 'tierra';
  } else {
    // Fallback: análisis por ref/nombre
    const totalRef = pavedDistByRef + unpavedDistByRef;
    surfaceType = totalRef === 0 || (pavedDistByRef / (totalRef || 1)) >= 0.4
      ? 'asfalto_ripio'
      : 'tierra';
  }

  return {
    surfaceType,
    majorRoads: Array.from(majorRoads).filter(Boolean),
    osmSurfaceData,
    hasNationalRoute: hasNationalRouteByRef,
    pavedPercent: totalSampled > 0 ? Math.round((pavedDistOSM / totalSampled) * 100) : null
  };
}

module.exports = { classifyRouteSurface, classifyPointOSM, PAVED_OSM_HIGHWAY_TYPES, UNPAVED_OSM_HIGHWAY_TYPES };

/**
 * Presets geográficos de Corrientes y escenarios de simulación
 * Cumple con BR-023, BR-064, BR-065, BR-066
 */

export const CORRIENTES_LOCATIONS = [
  {
    id: 'ctes-cap',
    name: 'Corrientes Capital',
    description: 'Nodo logístico y puerto regional',
    lat: -27.469,
    lon: -58.830
  },
  {
    id: 'san-luis',
    name: 'San Luis del Palmar',
    description: 'Zona ganadera y cuenca del Riachuelo',
    lat: -27.509,
    lon: -58.555
  },
  {
    id: 'riachuelo',
    name: 'Riachuelo',
    description: 'Área periurbana y paso de hacienda',
    lat: -27.581,
    lon: -58.745
  },
  {
    id: 'san-cayetano',
    name: 'San Cayetano',
    description: 'Zona rural y productiva',
    lat: -27.568,
    lon: -58.694
  },
  {
    id: 'santa-ana',
    name: 'Santa Ana de los Guácaras',
    description: 'Conexión por caminos secundarios y ripio',
    lat: -27.458,
    lon: -58.653
  },
  {
    id: 'paso-patria',
    name: 'Paso de la Patria',
    description: 'Acceso norte Río Paraná',
    lat: -27.319,
    lon: -58.572
  },
  {
    id: 'empedrado',
    name: 'Empedrado',
    description: 'Ruta 12 sur y zonas arroceras/ganaderas',
    lat: -27.954,
    lon: -58.804
  }
];

export const SIMULATION_SCENARIOS = [
  {
    id: 'scen-real',
    title: 'Pronóstico Real en Vivo (Open-Meteo)',
    description: 'Consulta el pronóstico climático satelital en vivo para las próximas 24h.',
    soilState: 'Seco',
    simulatedRainMm: null,
    icon: 'Satellite'
  },
  {
    id: 'scen-br012',
    title: 'BR-012: Suelo Seco (Riesgo Bajo)',
    description: 'Camino secundario con suelo seco y lluvia moderada (8 mm). Transitable.',
    soilState: 'Seco',
    simulatedRainMm: 8.0,
    icon: 'Sun'
  },
  {
    id: 'scen-br013',
    title: 'BR-013: Suelo Húmedo + Lluvia > 15 mm (80% Riesgo Alto)',
    description: 'Lluvia de 18 mm sobre suelo húmedo. Camino secundario con alto riesgo de empantanamiento.',
    soilState: 'Húmedo',
    simulatedRainMm: 18.0,
    icon: 'CloudRain'
  },
  {
    id: 'scen-br015',
    title: 'BR-015: Lluvia Torrencial > 30 mm (100% Intransitable)',
    description: 'Precipitación proyectada de 36 mm. Veredicto intransitable en toda ruta analizada.',
    soilState: 'Saturado',
    simulatedRainMm: 36.0,
    icon: 'AlertTriangle'
  }
];


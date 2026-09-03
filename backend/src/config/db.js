const { Pool } = require('pg');
const crypto = require('crypto');

// Detección automática de SSL para Render, Neon o producción
const isSslRequired = process.env.DATABASE_SSL === 'true' ||
  (process.env.DATABASE_URL && (
    process.env.DATABASE_URL.includes('render.com') ||
    process.env.DATABASE_URL.includes('neon.tech') ||
    process.env.DATABASE_URL.includes('supabase') ||
    process.env.NODE_ENV === 'production'
  ));

// Configuración de conexión a PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/agroroute',
  ssl: isSslRequired ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 5000,
});

// Prevenir caídas no controladas por eventos de desconexión en el pool
pool.on('error', (err) => {
  // Error pasivo en caso de que la instancia local de PostgreSQL se desconecte
});

let isPgConnected = false;

// Almacén en memoria como fallback seguro para pruebas locales sin PostgreSQL activo
const memoryStore = {
  users: [
    {
      id: 'a0000000-0000-0000-0000-000000000001',
      email: 'productor@agroroute.ar',
      full_name: 'Estancia Las Marías / Productor Correntino',
      organization: 'Sociedad Rural de Corrientes',
      role: 'producer'
    },
    {
      id: 'a0000000-0000-0000-0000-000000000002',
      email: 'admin@agroroute.ar',
      full_name: 'Administrador Ministerio de Producción',
      organization: 'Gobierno de Corrientes',
      role: 'admin'
    }
  ],
  route_requests: [],
  risk_assessments: [],
  risk_rule_config: [
    {
      id: 'r1',
      rule_code: 'BR-015',
      name: 'Riesgo Crítico por Lluvia Torrencial (> 30 mm)',
      description: 'Lluvia proyectada > 30 mm en 24h: riesgo 100% e intransitable (prevalece sobre cualquier ruta y suelo).',
      route_type: 'ANY',
      surface_type: 'ANY',
      soil_state: 'ANY',
      min_rain_mm: 30.01,
      max_rain_mm: null,
      assigned_risk_percentage: 100,
      risk_level: 'CRITICO',
      verdict: 'Intransitable',
      is_passable: false,
      priority: 1,
      is_active: true
    },
    {
      id: 'r2',
      rule_code: 'BR-013',
      name: 'Ruta Secundaria Húmeda con Lluvia (> 15 mm)',
      description: 'Camino secundario de tierra con suelo Húmedo y lluvia > 15 mm: riesgo alto del 80%.',
      route_type: 'secondary',
      surface_type: 'tierra',
      soil_state: 'Húmedo',
      min_rain_mm: 15.01,
      max_rain_mm: 30.00,
      assigned_risk_percentage: 80,
      risk_level: 'ALTO',
      verdict: 'Transitable con alto riesgo - Desaconsejado',
      is_passable: true,
      priority: 2,
      is_active: true
    },
    {
      id: 'r3',
      rule_code: 'BR-047-SEC',
      name: 'Ruta Secundaria con Suelo Saturado',
      description: 'Suelo saturado en camino de tierra: alto riesgo de anegamiento.',
      route_type: 'secondary',
      surface_type: 'tierra',
      soil_state: 'Saturado',
      min_rain_mm: 0.00,
      max_rain_mm: 30.00,
      assigned_risk_percentage: 85,
      risk_level: 'ALTO',
      verdict: 'Alto riesgo de anegamiento y empantanamiento',
      is_passable: true,
      priority: 3,
      is_active: true
    },
    {
      id: 'r4',
      rule_code: 'BR-012',
      name: 'Ruta Secundaria con Suelo Seco',
      description: 'Camino secundario con suelo previo Seco presenta riesgo bajo ante lluvias moderadas.',
      route_type: 'secondary',
      surface_type: 'tierra',
      soil_state: 'Seco',
      min_rain_mm: 0.00,
      max_rain_mm: 30.00,
      assigned_risk_percentage: 15,
      risk_level: 'BAJO',
      verdict: 'Transitable',
      is_passable: true,
      priority: 5,
      is_active: true
    }
  ]
};

// Prueba de conexión inicial al iniciar el servicio
async function initDb() {
  try {
    const client = await pool.connect();
    console.log(' Conectado exitosamente a PostgreSQL.');
    isPgConnected = true;
    client.release();
  } catch (error) {
    console.warn(' PostgreSQL local no disponible. Operando en modo Persistencia Híbrida/Memoria con soporte de RLS conceptual.');
    isPgConnected = false;
  }
}

/**
 * Ejecuta una operación en la base de datos con contexto de Row Level Security (RLS)
 * En PostgreSQL real: ejecuta SET LOCAL app.current_user_id y SET LOCAL app.current_role
 */
async function withUserContext(userId, role = 'producer', callback) {
  if (isPgConnected) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Establecer variables de sesión para las políticas RLS
      await client.query("SELECT set_config('app.current_user_id', $1, true)", [userId]);
      await client.query("SELECT set_config('app.current_role', $1, true)", [role]);
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } else {
    // Fallback de persistencia aplicando lógica idéntica a las políticas RLS
    const context = { userId, role };
    return await callback(createMemoryClient(context));
  }
}

/**
 * Cliente en memoria que simula la persistencia y aplica el aislamiento RLS
 */
function createMemoryClient(context) {
  return {
    async saveRouteRequest(data) {
      const id = crypto.randomUUID();
      const record = {
        id,
        user_id: context.userId,
        origin_name: data.origin_name,
        origin_lat: data.origin_lat,
        origin_lon: data.origin_lon,
        destination_name: data.destination_name,
        destination_lat: data.destination_lat,
        destination_lon: data.destination_lon,
        soil_state: data.soil_state,
        cargo_type: data.cargo_type || 'general',
        created_at: new Date().toISOString()
      };
      memoryStore.route_requests.push(record);
      return record;
    },

    async saveRiskAssessments(assessments) {
      const saved = [];
      for (const item of assessments) {
        const id = crypto.randomUUID();
        const record = {
          id,
          ...item,
          created_at: new Date().toISOString()
        };
        memoryStore.risk_assessments.push(record);
        saved.push(record);
      }
      return saved;
    },

    async getRecentRequests(limit = 10) {
      // Política RLS: Solo solicitudes del usuario actual a menos que sea admin
      let requests = memoryStore.route_requests;
      if (context.role !== 'admin') {
        requests = requests.filter(r => r.user_id === context.userId);
      }
      return requests.slice(-limit).reverse();
    },

    async getRiskRules() {
      // Política RLS: Lectura pública de reglas
      return memoryStore.risk_rule_config.filter(r => r.is_active);
    }
  };
}

module.exports = {
  pool,
  initDb,
  withUserContext,
  getIsPgConnected: () => isPgConnected,
  memoryStore
};


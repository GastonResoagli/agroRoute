-- =====================================================================
-- AgroRoute - Datos Semilla (Seed Data)
-- Reglas de negocio predeterminadas y usuarios de prueba
-- =====================================================================

-- Usuario productor de prueba (Corrientes)
INSERT INTO users (id, email, full_name, organization, role) VALUES
('a0000000-0000-0000-0000-000000000001', 'productor@agroroute.ar', 'Estancia Las Marías / Productor Correntino', 'Sociedad Rural de Corrientes', 'producer'),
('a0000000-0000-0000-0000-000000000002', 'admin@agroroute.ar', 'Administrador Ministerio de Producción', 'Gobierno de Corrientes', 'admin')
ON CONFLICT (id) DO NOTHING;

-- Configuración inicial de reglas de riesgo (risk_rule_config)
-- Ordenadas por prioridad (las de mayor prioridad se evalúan primero)
INSERT INTO risk_rule_config 
(rule_code, name, description, route_type, surface_type, soil_state, min_rain_mm, max_rain_mm, assigned_risk_percentage, risk_level, verdict, is_passable, priority)
VALUES
-- BR-015, BR-016, BR-017, BR-026, BR-045: Lluvia superior a 30 mm (prevalece como crítica sobre cualquier ruta y suelo)
(
    'BR-015',
    'Riesgo Crítico por Lluvia Torrencial (> 30 mm)',
    'Cuando la lluvia proyectada supere los 30 mm en 24h, la ruta se clasifica con riesgo crítico (100%) y es intransitable.',
    'ANY',
    'ANY',
    'ANY',
    30.01,
    NULL,
    100,
    'CRITICO',
    'Intransitable',
    FALSE,
    1
),
-- BR-013, BR-014: Camino secundario (tierra) con suelo Húmedo y lluvia superior a 15 mm
(
    'BR-013',
    'Ruta Secundaria Húmeda con Lluvia (> 15 mm)',
    'Camino secundario de tierra con suelo Húmedo y lluvia proyectada superior a 15 mm se clasifica con riesgo alto del 80%.',
    'secondary',
    'tierra',
    'Húmedo',
    15.01,
    30.00,
    80,
    'ALTO',
    'Transitable con alto riesgo - Desaconsejado',
    TRUE,
    2
),
-- BR-047: Suelo Saturado en camino secundario con lluvia moderada
(
    'BR-047-SEC',
    'Ruta Secundaria con Suelo Saturado',
    'Suelo previamente saturado en camino secundario de tierra con lluvias proyectadas hasta 30 mm.',
    'secondary',
    'tierra',
    'Saturado',
    0.00,
    30.00,
    85,
    'ALTO',
    'Alto riesgo de anegamiento y empantanamiento',
    TRUE,
    3
),
-- Camino secundario húmedo con lluvia leve (<= 15 mm)
(
    'BR-013-LIGHT',
    'Ruta Secundaria Húmeda con Lluvia Leve (<= 15 mm)',
    'Camino secundario con suelo Húmedo y precipitación inferior o igual a 15 mm.',
    'secondary',
    'tierra',
    'Húmedo',
    0.01,
    15.00,
    45,
    'MEDIO',
    'Transitable con precaución',
    TRUE,
    4
),
-- BR-012: Camino secundario con suelo Seco y lluvia leve/moderada (<= 30 mm)
(
    'BR-012',
    'Ruta Secundaria con Suelo Seco',
    'Un camino secundario con suelo previo Seco presenta riesgo bajo ante precipitaciones de hasta 30 mm.',
    'secondary',
    'tierra',
    'Seco',
    0.00,
    30.00,
    15,
    'BAJO',
    'Transitable',
    TRUE,
    5
),
-- Ruta principal (asfalto/ripio consolidado) con lluvia <= 30 mm y suelo Saturado
(
    'BR-009-SAT',
    'Ruta Principal Asfalto/Ripio con Suelo Saturado',
    'Ruta principal de asfalto o ripio consolidado en zona con suelo saturado y lluvia moderada.',
    'primary',
    'asfalto_ripio',
    'Saturado',
    0.00,
    30.00,
    35,
    'MEDIO',
    'Transitable con precaución (posible agua en banquinas)',
    TRUE,
    6
),
-- Ruta principal (asfalto/ripio consolidado) estándar con lluvia <= 30 mm
(
    'BR-009-NORM',
    'Ruta Principal Asfalto/Ripio Segura',
    'Ruta principal consolidada en condiciones normales de suelo Seco o Húmedo.',
    'primary',
    'asfalto_ripio',
    'ANY',
    0.00,
    30.00,
    10,
    'BAJO',
    'Transitable sin restricciones',
    TRUE,
    7
)
ON CONFLICT (rule_code) DO NOTHING;


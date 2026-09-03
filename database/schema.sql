-- =====================================================================
-- AgroRoute - Esquema de Base de Datos PostgreSQL con Row Level Security (RLS)
-- Plataforma de Transitabilidad Rural para Productores Agropecuarios
-- Región: Corrientes y Litoral Argentino
-- =====================================================================

-- Extensión para generación de UUIDs si no está habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Limpieza preventiva en caso de reinstalación limpia
DROP TABLE IF EXISTS risk_assessments CASCADE;
DROP TABLE IF EXISTS route_requests CASCADE;
DROP TABLE IF EXISTS risk_rule_config CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ---------------------------------------------------------------------
-- 1. TABLA: users
-- Almacena a los productores agropecuarios, transportistas y administradores.
-- ---------------------------------------------------------------------
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    organization VARCHAR(150),
    role VARCHAR(50) NOT NULL DEFAULT 'producer' CHECK (role IN ('producer', 'transporter', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 2. TABLA: route_requests
-- Registra cada solicitud de análisis realizada por los productores.
-- Cumple con BR-003, BR-004, BR-024, BR-032, BR-033, BR-035.
-- ---------------------------------------------------------------------
CREATE TABLE route_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    origin_name VARCHAR(255) NOT NULL,
    origin_lat DOUBLE PRECISION NOT NULL,
    origin_lon DOUBLE PRECISION NOT NULL,
    destination_name VARCHAR(255) NOT NULL,
    destination_lat DOUBLE PRECISION NOT NULL,
    destination_lon DOUBLE PRECISION NOT NULL,
    soil_state VARCHAR(20) NOT NULL CHECK (soil_state IN ('Seco', 'Húmedo', 'Saturado')),
    cargo_type VARCHAR(100) DEFAULT 'general', -- 'hacienda', 'granos', 'general' (BR-002)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 3. TABLA: risk_assessments
-- Almacena el veredicto y métricas de cada ruta evaluada (principal y alternativas).
-- Cumple con BR-007..BR-022, BR-039..BR-042.
-- ---------------------------------------------------------------------
CREATE TABLE risk_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES route_requests(id) ON DELETE CASCADE,
    route_index INTEGER NOT NULL,
    route_type VARCHAR(20) NOT NULL CHECK (route_type IN ('primary', 'secondary')),
    surface_type VARCHAR(50) NOT NULL CHECK (surface_type IN ('asfalto_ripio', 'tierra')),
    distance_km NUMERIC(8, 2) NOT NULL,
    duration_min NUMERIC(8, 2) NOT NULL,
    midpoint_lat DOUBLE PRECISION NOT NULL,
    midpoint_lon DOUBLE PRECISION NOT NULL,
    rain_24h_mm NUMERIC(6, 2) NOT NULL,
    risk_percentage INTEGER NOT NULL CHECK (risk_percentage >= 0 AND risk_percentage <= 100),
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('BAJO', 'MEDIO', 'ALTO', 'CRITICO')),
    verdict VARCHAR(150) NOT NULL,
    is_passable BOOLEAN NOT NULL DEFAULT TRUE,
    is_recommended BOOLEAN NOT NULL DEFAULT FALSE,
    geometry JSONB NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 4. TABLA: risk_rule_config
-- Configuración dinámica de umbrales y reglas de negocio.
-- Cumple con BR-012 a BR-017, BR-043 a BR-048.
-- ---------------------------------------------------------------------
CREATE TABLE risk_rule_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    route_type VARCHAR(20) NOT NULL DEFAULT 'ANY' CHECK (route_type IN ('ANY', 'primary', 'secondary')),
    surface_type VARCHAR(50) NOT NULL DEFAULT 'ANY' CHECK (surface_type IN ('ANY', 'asfalto_ripio', 'tierra')),
    soil_state VARCHAR(20) NOT NULL DEFAULT 'ANY' CHECK (soil_state IN ('ANY', 'Seco', 'Húmedo', 'Saturado')),
    min_rain_mm NUMERIC(6, 2) DEFAULT 0,
    max_rain_mm NUMERIC(6, 2), -- NULL significa sin límite superior
    assigned_risk_percentage INTEGER NOT NULL CHECK (assigned_risk_percentage >= 0 AND assigned_risk_percentage <= 100),
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('BAJO', 'MEDIO', 'ALTO', 'CRITICO')),
    verdict VARCHAR(150) NOT NULL,
    is_passable BOOLEAN NOT NULL DEFAULT TRUE,
    priority INTEGER NOT NULL DEFAULT 10,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- ÍNDICES PARA ALTO RENDIMIENTO
-- ---------------------------------------------------------------------
CREATE INDEX idx_route_requests_user ON route_requests(user_id);
CREATE INDEX idx_route_requests_created ON route_requests(created_at DESC);
CREATE INDEX idx_risk_assessments_request ON risk_assessments(request_id);
CREATE INDEX idx_risk_assessments_recommended ON risk_assessments(is_recommended);
CREATE INDEX idx_risk_rule_config_active ON risk_rule_config(is_active, priority ASC);

-- =====================================================================
-- CONFIGURACIÓN DE ROW LEVEL SECURITY (RLS)
-- =====================================================================

-- Habilitar RLS en las tablas transaccionales y de reglas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_rule_config ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------
-- Políticas para users
-- Un usuario solo puede ver su propio perfil; admins pueden ver todos.
-- ---------------------------------------------------------------------
CREATE POLICY users_select_own ON users
    FOR SELECT
    USING (
        id::text = current_setting('app.current_user_id', true)
        OR current_setting('app.current_role', true) = 'admin'
    );

CREATE POLICY users_update_own ON users
    FOR UPDATE
    USING (id::text = current_setting('app.current_user_id', true));

-- ---------------------------------------------------------------------
-- Políticas para route_requests
-- Productores solo consultan e insertan sus propias solicitudes.
-- ---------------------------------------------------------------------
CREATE POLICY route_requests_select_own ON route_requests
    FOR SELECT
    USING (
        user_id::text = current_setting('app.current_user_id', true)
        OR current_setting('app.current_role', true) = 'admin'
    );

CREATE POLICY route_requests_insert_own ON route_requests
    FOR INSERT
    WITH CHECK (
        user_id::text = current_setting('app.current_user_id', true)
        OR current_setting('app.current_role', true) = 'admin'
    );

-- ---------------------------------------------------------------------
-- Políticas para risk_assessments
-- Las evaluaciones heredan la propiedad de la solicitud padre.
-- ---------------------------------------------------------------------
CREATE POLICY risk_assessments_select_own ON risk_assessments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM route_requests
            WHERE route_requests.id = risk_assessments.request_id
            AND (
                route_requests.user_id::text = current_setting('app.current_user_id', true)
                OR current_setting('app.current_role', true) = 'admin'
            )
        )
    );

CREATE POLICY risk_assessments_insert_own ON risk_assessments
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM route_requests
            WHERE route_requests.id = risk_assessments.request_id
            AND (
                route_requests.user_id::text = current_setting('app.current_user_id', true)
                OR current_setting('app.current_role', true) = 'admin'
            )
        )
    );

-- ---------------------------------------------------------------------
-- Políticas para risk_rule_config
-- Lectura pública para cualquier usuario autenticado;
-- Escritura/Modificación reservada únicamente a administradores.
-- ---------------------------------------------------------------------
CREATE POLICY risk_rule_config_read_all ON risk_rule_config
    FOR SELECT
    USING (true);

CREATE POLICY risk_rule_config_write_admin ON risk_rule_config
    FOR ALL
    USING (current_setting('app.current_role', true) = 'admin')
    WITH CHECK (current_setting('app.current_role', true) = 'admin');

-- =====================================================================
-- FUNCIÓN AUXILIAR: Contexto de sesión para simular autenticación con RLS
-- =====================================================================
CREATE OR REPLACE FUNCTION set_app_user_context(p_user_id UUID, p_role VARCHAR)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_user_id', p_user_id::text, false);
    PERFORM set_config('app.current_role', p_role, false);
END;
$$ LANGUAGE plpgsql;


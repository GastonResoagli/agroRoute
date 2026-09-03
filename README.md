# AgroRoute — Plataforma de Transitabilidad Rural (Corrientes)

> **MVP de Transitabilidad Rural y Gestión de Caminos para Productores Agropecuarios en Corrientes y la Región del Litoral.**

> 🚀 **¿Quieren publicar esta app con una URL pública en menos de 1 hora?** Sigan la guía paso a paso en [`DEPLOYMENT.md`](./DEPLOYMENT.md) (Vercel + Render + Neon, planes gratuitos).


---

## 1. Arquitectura y Stack Tecnológico

- **Frontend**:
  - React 18 + Vite
  - Tailwind CSS (Diseño responsive y mobile-first)
  - React Leaflet + Leaflet (Visualización cartográfica centrada en `[-27.469, -58.830]`)
  - Lucide React (Iconografía semafórica y de transporte agropecuario)
- **Backend**:
  - Node.js + Express
  - RESTful API (`/api/routes/analyze`, `/api/rules`, `/api/history`, `/api/health`)
  - Motor determinista de cálculo de riesgo según especificaciones (`riskEngine.js`)
- **Base de Datos & Seguridad**:
  - PostgreSQL con **Row Level Security (RLS)** activado
  - Tablas transaccionales: `route_requests`, `risk_assessments`, `risk_rule_config` y `users`
  - Aislamiento de consultas por productor y políticas restrictivas de administración
  - Script DDL completo en `database/schema.sql` y datos semilla en `database/seed.sql`
- **Servicios Externos Integrados**:
  - **OSRM (Open Source Routing Machine)**: Cálculo en tiempo real de ruta principal y alternativas/desvíos rurales
  - **Open-Meteo**: Pronóstico horario satelital a 24 horas sobre el **punto medio exacto** de cada trazado geométrico

---

## 2. Reglas de Negocio Implementadas (BR-001 a BR-067)

| Regla | Condición | Riesgo | Veredicto | Transitabilidad |
|---|---|---|---|---|
| **BR-015 / BR-026 / BR-045** | Lluvia proyectada en 24h **> 30 mm** (Prevalece sobre cualquier ruta/suelo) | **100% (Crítico)** | **Intransitable** | ❌ No transitable |
| **BR-013 / BR-014** | Camino secundario (tierra) + Suelo **Húmedo** + Lluvia **> 15 mm** | **80% (Alto)** | **Transitable con alto riesgo - Desaconsejado** | ⚠️ Precaución extrema |
| **BR-012** | Camino secundario (tierra) + Suelo **Seco** + Lluvia &le; 30 mm | **15% (Bajo)** | **Transitable** |  Transitable |
| **BR-047** | Camino secundario (tierra) + Suelo **Saturado** | **85% (Alto)** | **Alto riesgo de anegamiento por suelo saturado** | ⚠️ Precaución extrema |
| **BR-009-NORM** | Ruta principal (asfalto/ripio consolidado) + Lluvia &le; 30 mm | **10% - 20% (Bajo)** | **Transitable sin restricciones** |  Transitable |
| **BR-018 / BR-056** | **Selección de Ruta Recomendada** | — | — | Solo se eligen rutas transitables (riesgo < 100%), priorizando seguridad sobre velocidad |
| **BR-049** | Si todas las rutas son intransitables | — | — | Ninguna se recomienda y se emite alerta crítica de seguridad vial |

---

## 3. Estructura del Proyecto

```
agroRoute/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                 # Conexión PostgreSQL con RLS y fallback resiliente
│   │   ├── controllers/
│   │   │   └── routeController.js    # Endpoint de análisis de transitabilidad
│   │   ├── services/
│   │   │   ├── osrmService.js        # Integración OSRM y clasificación de rutas
│   │   │   ├── weatherService.js     # Consulta a Open-Meteo para acumulado 24h
│   │   │   ├── geoService.js         # Cálculo del punto medio exacto en la geometría
│   │   │   └── riskEngine.js         # Motor determinista de reglas agropecuarias
│   │   ├── routes/
│   │   │   └── api.js                # Router Express (/api/routes/analyze, /api/rules)
│   │   ├── app.js
│   │   └── server.js                 # Servidor en puerto 4000
│   └── tests/
│       ├── riskEngine.test.js        # Pruebas unitarias de las reglas BR
│       └── api.test.js               # Pruebas de integración de endpoints
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx            # Encabezado con estado RLS y ubicación Litoral
│   │   │   ├── ControlPanel.jsx      # Selector origen/destino, suelo (Seco/Húmedo/Saturado) y simulaciones
│   │   │   ├── ResultsPanel.jsx      # Panel de resultados y banners de recomendación
│   │   │   ├── MapView.jsx           # Mapa React-Leaflet centrado en [-27.469, -58.830]
│   │   │   ├── RouteCard.jsx         # Card comparativa con métricas y veredicto
│   │   │   ├── RiskBadge.jsx         # Badge semafórico de nivel de riesgo
│   │   │   └── RulesModal.jsx        # Modal con el pliego de especificaciones
│   │   ├── data/
│   │   │   └── presets.js            # Presets geográficos de Corrientes y escenarios BR
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── vite.config.js                # Proxy configurado hacia el backend
├── database/
│   ├── schema.sql                    # DDL con tablas, índices y políticas RLS
│   └── seed.sql                      # Datos semilla con usuarios y reglas
└── package.json                      # Scripts concurrentes para desarrollo
```

---

## 4. Instrucciones de Instalación y Ejecución

### Requisitos previos
- Node.js v18+ o v24+
- (Opcional) PostgreSQL v14+ para persistencia relacional con RLS

### 1. Iniciar el Backend
```bash
cd backend
npm install
npm run dev
# Servidor activo en http://localhost:4000
```

### 2. Iniciar el Frontend
```bash
cd frontend
npm install
npm run dev
# Aplicación web activa en http://localhost:3000
```

### 3. Ejecutar las Pruebas Automatizadas
```bash
cd backend
npm test
# Ejecuta 15 pruebas unitarias y de integración certificando todas las reglas BR
```

---

## 5. Endpoints de la API

- `POST /api/routes/analyze`:
  - **Body**:
    ```json
    {
      "origin": { "name": "Corrientes Capital", "lat": -27.469, "lon": -58.830 },
      "destination": { "name": "San Luis del Palmar", "lat": -27.509, "lon": -58.555 },
      "soil_state": "Húmedo",
      "cargo_type": "hacienda",
      "simulated_rain_mm": null
    }
    ```
- `GET /api/rules`: Devuelve la matriz de configuración de reglas activas.
- `GET /api/history`: Historial de solicitudes del productor (aislado por RLS).
- `GET /api/health`: Estado del sistema, base de datos y servicios satelitales.
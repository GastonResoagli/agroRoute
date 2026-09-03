# 🚀 Guía de Despliegue en 1 Hora — AgroRoute

> Guía paso a paso, literal y sin atajos, para poner AgroRoute en producción con una **URL pública activa**, usando exclusivamente planes **gratuitos**: **Vercel** (frontend), **Render** (backend) y **Neon** (PostgreSQL).
> Pensada para alguien que **nunca hizo un deployment**. Seguí los pasos en orden, sin saltarte ninguno.

```
Usuario
  ↓
Vercel — React (frontend)
  ↓ HTTPS
Render — Node.js + Express (backend/API)
  ↓
Neon — PostgreSQL (con Row Level Security)
  ↓
OSRM / Open-Meteo  ← servicios externos gratuitos de terceros
```

⏱️ **Tiempo estimado total: ~60 minutos** (repartidos en 5 bloques de 10-15 min).

---

## 0. Antes de empezar — Checklist de información que el equipo debe completar

Guarden estos datos a medida que los vayan generando. Los van a necesitar varias veces durante la guía.

| # | Dato | Dónde se genera | Ejemplo | Su valor real |
|---|------|------------------|---------|----------------|
| 1 | Repositorio de GitHub (usuario/organización + nombre) | GitHub | `GastonResoagli/agroRoute` | _____________ |
| 2 | Proveedor de base de datos elegido | Neon | Neon (PostgreSQL serverless) | Neon |
| 3 | `DATABASE_URL` de Neon (con `sslmode=require`) | Neon Dashboard → Connection string | `postgresql://usuario:pass@ep-xxxx.neon.tech/agroroute?sslmode=require` | _____________ |
| 4 | Nombre del servicio backend en Render | Render Dashboard | `agroroute-backend` | _____________ |
| 5 | URL pública del backend (Render) | Render Dashboard, tras el deploy | `https://agroroute-backend.onrender.com` | _____________ |
| 6 | Nombre del proyecto frontend en Vercel | Vercel Dashboard | `agroroute` | _____________ |
| 7 | URL pública del frontend (Vercel) | Vercel Dashboard, tras el deploy | `https://agroroute.vercel.app` | _____________ |
| 8 | Dominio propio (opcional) | Su proveedor de dominios (si tienen uno) | `www.agroroute.com.ar` | _____________ (opcional) |
| 9 | Variables de entorno del backend (Render) | Ver sección 3.4 | Ver tabla completa abajo | _____________ |
| 10 | Variables de entorno del frontend (Vercel) | Ver sección 4.3 | `VITE_API_URL` | _____________ |

> 🔑 **Regla de oro**: la URL pública de Vercel (#7) se necesita para configurar `CORS_ORIGIN` en Render, y la URL pública de Render (#5) se necesita para configurar `VITE_API_URL` en Vercel. Van a ir y volver entre ambas plataformas — es normal y esperado.

---

## 1. Requisitos previos (5 min)

1. Cuenta de **GitHub** con el repositorio del proyecto ya subido (rama `main` actualizada con los últimos cambios de esta guía).
2. Cuenta gratuita en **[neon.tech](https://neon.tech)** (podés registrarte con tu cuenta de GitHub).
3. Cuenta gratuita en **[render.com](https://render.com)** (podés registrarte con tu cuenta de GitHub).
4. Cuenta gratuita en **[vercel.com](https://vercel.com)** (podés registrarte con tu cuenta de GitHub).
5. Verificá que el repositorio tenga esta estructura (ya viene así):
   ```
   agroRoute/
     backend/
     frontend/
     database/
     render.yaml
   ```

> ⚠️ Todas las cuentas se crean gratis y no requieren tarjeta de crédito para los planes usados en esta guía.

---

## 2. Paso 1 — Base de datos en Neon (10 min)

### 2.1 Crear el proyecto
1. Entrá a **https://console.neon.tech/** y hacé login (con GitHub es más rápido).
2. Click en **"Create a project"** (o "New Project").
3. Completá:
   - **Project name**: `agroroute` (o el nombre que prefieran — dato #2 de la tabla).
   - **Postgres version**: dejá la versión por defecto (16 o superior).
   - **Region**: elegí la más cercana a Render (recomendado: `US East` si van a usar Render en Oregon/US, para reducir latencia).
4. Click en **"Create Project"**. Esperá unos segundos a que se aprovisione.

### 2.2 Obtener la cadena de conexión
1. En el dashboard del proyecto, buscá la sección **"Connection string"**.
2. Seleccioná el dropdown **"Pooled connection"** (recomendado para apps web) y rol `neondb_owner` (o el que Neon haya creado).
3. Copiá el string completo. Se ve así:
   ```
   postgresql://neondb_owner:AbCdEf123456@ep-cool-forest-12345.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. **Guardalo** — es el dato #3 de la tabla del punto 0. Lo van a pegar en Render en el paso 3.

### 2.3 Crear las tablas (schema) y datos semilla
Tienen dos formas de hacerlo. Usen la que les resulte más simple:

**Opción A — Editor SQL de Neon (recomendado, sin instalar nada):**
1. En el dashboard de Neon, abrí la pestaña **"SQL Editor"**.
2. Abrí el archivo `agroRoute/database/schema.sql` de su repositorio, copiá **todo** el contenido y pegalo en el editor SQL de Neon.
3. Click en **"Run"**. Debería ejecutar sin errores y crear las tablas `users`, `route_requests`, `risk_assessments`, `risk_rule_config` con las políticas RLS.
4. Repetí el mismo proceso con el archivo `agroRoute/database/seed.sql` (copiar contenido → pegar en el SQL Editor → Run). Esto carga los usuarios de prueba y las reglas de negocio iniciales.

**Opción B — Desde tu computadora con `psql`** (si ya tenés PostgreSQL client instalado):
```bash
psql "postgresql://neondb_owner:AbCdEf123456@ep-cool-forest-12345.us-east-2.aws.neon.tech/neondb?sslmode=require" -f agroRoute/database/schema.sql
psql "postgresql://neondb_owner:AbCdEf123456@ep-cool-forest-12345.us-east-2.aws.neon.tech/neondb?sslmode=require" -f agroRoute/database/seed.sql
```
(Reemplazá la cadena de conexión por la que copiaste en el paso 2.2)

### 2.4 Verificar
En el SQL Editor de Neon corré:
```sql
SELECT rule_code, name FROM risk_rule_config;
```
Deberías ver 7 filas con códigos como `BR-015`, `BR-013`, etc. Si las ves, la base de datos está lista. ✅

---

## 3. Paso 2 — Backend en Render (15 min)

### 3.1 Crear el Web Service
1. Entrá a **https://dashboard.render.com/** y hacé login.
2. Click en **"New +"** → **"Web Service"**.
3. Conectá tu cuenta de GitHub si no lo hiciste antes (Render te va a pedir autorización) y seleccioná el repositorio del proyecto (dato #1 de la tabla, ej: `GastonResoagli/agroRoute`).
4. Si Render pregunta por permisos de acceso, elegí **"All repositories"** o seleccioná específicamente el repo de AgroRoute.

### 3.2 Configurar el servicio
Completá el formulario exactamente así:

| Campo | Valor |
|---|---|
| **Name** | `agroroute-backend` (dato #4 de la tabla) |
| **Region** | Oregon (US West) — o la más cercana disponible en el plan gratuito |
| **Branch** | `main` (o `deploy-prep` si todavía no mergearon esta rama) |
| **Root Directory** | `agroRoute` ⚠️ **muy importante**: es la raíz del proyecto, **NO** `agroRoute/backend`. El `package.json` de la raíz ya tiene el script `postinstall` que instala las dependencias de `backend/` y el script `start` que ejecuta `node backend/src/server.js`. |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` |

> 💡 Si su repositorio de GitHub ya apunta directo a la carpeta `agroRoute` (es decir, `backend/` y `package.json` están en la raíz del repo), entonces el Root Directory se deja **vacío** (la raíz del repo). Si en cambio el repo tiene `agroRoute/` como subcarpeta, el Root Directory debe ser `agroRoute`.

### 3.3 NO hagas click en "Create Web Service" todavía
Antes bajá a la sección **"Environment Variables"** (o "Advanced") del mismo formulario y agregá las variables de entorno del punto 3.4. Así el primer deploy ya arranca bien configurado.

### 3.4 Variables de entorno del backend (dato #9 de la tabla)

Click en **"Add Environment Variable"** y agregá una por una:

| Key | Value | Notas |
|---|---|---|
| `NODE_ENV` | `production` | |
| `PORT` | `4000` | Render también expone su propio `PORT`; Express ya lee `process.env.PORT`, así que funciona igual. |
| `DATABASE_URL` | *(pegar la cadena de Neon del paso 2.2)* | Dato #3 de la tabla. |
| `DATABASE_SSL` | `true` | **Obligatorio** para conectar con Neon. |
| `CORS_ORIGIN` | `*` (temporal) | ⚠️ Lo van a cambiar en el **Paso 5** por la URL real de Vercel. Por ahora pongan `*` para poder probar. |
| `DEFAULT_USER_ID` | `a0000000-0000-0000-0000-000000000001` | Usuario productor de prueba (ya cargado en el seed). |
| `DEFAULT_USER_ROLE` | `producer` | |
| `RATE_LIMIT_MAX` | `60` | Límite de solicitudes por minuto por IP (protege OSRM/Open-Meteo/Neon de abuso). |

### 3.5 Configurar el Health Check (opcional pero recomendado)
En la sección **"Health Check Path"** (puede estar en "Advanced"), poné:
```
/api/health
```
Esto le permite a Render reiniciar el servicio automáticamente si se cae.

### 3.6 Crear el servicio
1. Click en **"Create Web Service"**.
2. Render va a clonar el repo, correr `npm install` y luego `npm start`. Esto tarda **2-5 minutos** la primera vez.
3. Mirá los logs en la pestaña **"Logs"**. Deberías ver algo como:
   ```
   Servidor AgroRoute escuchando en http://localhost:4000
   Conectado exitosamente a PostgreSQL.
   ```
4. Cuando el estado pase a **"Live"** (círculo verde), copiá la URL pública que te da Render, arriba del todo, con forma:
   ```
   https://agroroute-backend.onrender.com
   ```
   **Guardala** — es el dato #5 de la tabla.

### 3.7 Verificar que el backend funciona
Abrí en el navegador (o con `curl`):
```
https://agroroute-backend.onrender.com/api/health
```
Deberías ver un JSON con `"status": "online"` y `"connected": true` en la sección `database`. Si `connected` sale `false`, revisá que `DATABASE_URL` y `DATABASE_SSL=true` estén bien copiados (paso 3.4).

> ⚠️ **Nota sobre el plan gratuito de Render**: el servicio "duerme" tras ~15 minutos sin tráfico y demora unos 30-50 segundos en "despertar" ante la primera solicitud. Es normal y esperado en el plan free; no es un error.

---

## 4. Paso 3 — Frontend en Vercel (15 min)

### 4.1 Preparar el proyecto en Vercel
1. Entrá a **https://vercel.com/new** (o Dashboard → "Add New..." → "Project").
2. Conectá tu cuenta de GitHub si no lo hiciste, y seleccioná el mismo repositorio del proyecto.
3. Vercel va a detectar automáticamente que es un proyecto. Click en **"Import"**.

### 4.2 Configurar el build
En la pantalla de configuración del proyecto, completá:

| Campo | Valor |
|---|---|
| **Project Name** | `agroroute` (dato #6 de la tabla) |
| **Framework Preset** | `Vite` (Vercel debería detectarlo solo) |
| **Root Directory** | `agroRoute/frontend` ⚠️ Click en "Edit" al lado de Root Directory para cambiarlo |
| **Build Command** | `npm run build` (por defecto) |
| **Output Directory** | `dist` (por defecto para Vite) |
| **Install Command** | `npm install` (por defecto) |

> 💡 Igual que con Render: si en su repo de GitHub la carpeta `frontend` está en la raíz, el Root Directory es `frontend`. Si está dentro de `agroRoute/`, es `agroRoute/frontend`.

### 4.3 Variables de entorno del frontend (dato #10 de la tabla)
Antes de desplegar, en la misma pantalla, abrí la sección **"Environment Variables"** y agregá:

| Key | Value |
|---|---|
| `VITE_API_URL` | `https://agroroute-backend.onrender.com/api` |

⚠️ Usá la URL real que copiaste en el paso 3.6, **agregando el sufijo `/api` al final**. Sin ese sufijo la app no va a poder llamar a la API.

Marcá que aplique a los 3 entornos: **Production**, **Preview** y **Development** (checkbox que aparece al agregar la variable).

### 4.4 Desplegar
1. Click en **"Deploy"**.
2. Vercel va a instalar dependencias y correr el build. Tarda **1-3 minutos**.
3. Al finalizar vas a ver un mensaje de éxito con un botón **"Visit"** y una URL pública tipo:
   ```
   https://agroroute.vercel.app
   ```
   **Guardala** — es el dato #7 de la tabla. **Esta es la URL pública final que van a compartir con el equipo/usuarios.**

### 4.5 Verificar el frontend
1. Abrí `https://agroroute.vercel.app` en el navegador.
2. Deberían ver el mapa de Corrientes cargando y, tras unos segundos, una ruta calculada automáticamente entre "Corrientes Capital" y "San Luis del Palmar".
3. Si ven un error de red en la consola del navegador (F12 → pestaña "Console" o "Network") tipo `CORS` o `Failed to fetch`, es porque falta el paso 5 (restringir CORS en el backend con la URL real de Vercel) — es normal en este punto, lo resolvemos ahora.

---

## 5. Paso 4 — Conectar y cerrar el círculo de seguridad (10 min)

Este paso es clave: hasta ahora el backend acepta pedidos de **cualquier origen** (`CORS_ORIGIN=*`), lo cual es inseguro para producción. Ahora lo restringimos a la URL real del frontend.

### 5.1 Actualizar `CORS_ORIGIN` en Render
1. Volvé a **Render Dashboard** → tu servicio `agroroute-backend` → pestaña **"Environment"**.
2. Editá la variable `CORS_ORIGIN` y reemplazá `*` por la URL exacta de Vercel (dato #7), **sin barra final**:
   ```
   https://agroroute.vercel.app
   ```
   Si tienen un dominio propio además (dato #8), separen con comas sin espacios:
   ```
   https://agroroute.vercel.app,https://www.agroroute.com.ar
   ```
3. Guardá los cambios. Render va a redesplegar automáticamente el servicio (30-60 seg).

### 5.2 Volver a verificar el frontend
1. Refrescá `https://agroroute.vercel.app` (Ctrl+Shift+R para forzar recarga sin caché).
2. El mapa y el análisis de rutas deberían funcionar sin errores de CORS en la consola.

### 5.3 Resumen de protocolos de seguridad aplicados
Estos ya están implementados en el código y activos tras el deploy:

| Capa | Medida de seguridad | Dónde |
|---|---|---|
| Transporte | HTTPS obligatorio (provisto automáticamente por Vercel y Render) | Vercel + Render |
| Backend (headers) | `helmet` — cabeceras HTTP endurecidas (X-Frame-Options, X-Content-Type-Options, etc.) | `backend/src/app.js` |
| Backend (CORS) | Lista blanca de orígenes (`CORS_ORIGIN`), rechaza cualquier dominio no autorizado | `backend/src/app.js` |
| Backend (abuso) | Rate limiting: máx. 60 solicitudes/minuto por IP (`RATE_LIMIT_MAX`) — protege cuotas de OSRM/Open-Meteo y la base de datos | `backend/src/app.js` |
| Base de datos | Conexión SSL obligatoria (`DATABASE_SSL=true`) hacia Neon | `backend/src/config/db.js` |
| Base de datos | **Row Level Security (RLS)** en PostgreSQL: cada productor solo ve sus propias solicitudes (`route_requests`, `risk_assessments`); solo admins ven todo | `database/schema.sql` |
| Frontend (headers) | Cabeceras de seguridad adicionales vía `vercel.json` (X-Frame-Options: DENY, Referrer-Policy, Permissions-Policy) | `frontend/vercel.json` |
| Secretos | Ninguna credencial (`DATABASE_URL`, etc.) queda en el código fuente; todo vía variables de entorno en Render/Vercel | `.env.example` (plantillas, sin valores reales) |

### 5.4 Aviso de servicios externos (ya incluido en la interfaz)
El frontend ya muestra, de forma permanente, un aviso en la parte superior de la aplicación aclarando que **OSRM** (cálculo de rutas) y **Open-Meteo** (clima) son servicios externos gratuitos de terceros, sujetos a disponibilidad, latencia y límites de uso fuera del control del equipo. Si alguno de estos servicios falla temporalmente, el backend ya tiene manejo de fallback con valores de respaldo (ver `backend/src/services/weatherService.js` y `osrmService.js`).

---

## 6. Checklist final (5 min)

Marquen cada ítem antes de considerar el deployment terminado:

- [ ] Neon: proyecto creado, `schema.sql` y `seed.sql` ejecutados sin error.
- [ ] Neon: `SELECT rule_code FROM risk_rule_config;` devuelve 7 filas.
- [ ] Render: servicio `agroroute-backend` en estado **Live**.
- [ ] Render: `GET /api/health` responde `"status": "online"` y `"connected": true`.
- [ ] Render: variables `DATABASE_URL`, `DATABASE_SSL=true`, `CORS_ORIGIN` (con la URL real de Vercel) configuradas.
- [ ] Vercel: proyecto desplegado, build exitoso, estado **Ready**.
- [ ] Vercel: variable `VITE_API_URL` apunta a `https://<su-backend>.onrender.com/api`.
- [ ] La URL pública de Vercel carga el mapa y calcula rutas sin errores en la consola del navegador.
- [ ] El aviso de "servicios externos (OSRM/Open-Meteo)" es visible en la interfaz.
- [ ] Se probó desde un celular o red distinta (no solo localhost) que la URL pública responde.

---

## 7. Problemas comunes (troubleshooting rápido)

| Síntoma | Causa probable | Solución |
|---|---|---|
| `Failed to fetch` / error de CORS en consola del navegador | `CORS_ORIGIN` en Render no coincide exactamente con la URL de Vercel | Revisar que no tenga barra final `/` ni typos; debe ser el dominio exacto |
| El mapa carga pero nunca calcula rutas, tarda 30-50s la primera vez | Render "dormido" (plan free) | Es normal; esperar. Si tarda más de 2 min, revisar logs en Render |
| `database.connected: false` en `/api/health` | `DATABASE_URL` mal copiada o falta `DATABASE_SSL=true` | Volver a copiar la cadena completa de Neon, verificar `sslmode=require` |
| Error 500 al analizar rutas, mensaje sobre OSRM o Open-Meteo | Servicio externo caído o con rate-limit propio | Esperar unos minutos; el sistema aplica valores de respaldo automáticamente |
| Vercel build falla con "vite: not found" o similar | Root Directory mal configurado | Verificar que apunte exactamente a la carpeta que contiene `frontend/package.json` |
| Render build falla con "Cannot find module" | Root Directory mal configurado | Verificar que el Root Directory sea la **raíz del repo** (`agroRoute`, o vacío si el repo ya empieza ahí), NO `agroRoute/backend`. El `package.json` raíz es el que orquesta la instalación de `backend/` vía `postinstall`. |

---

## 8. Actualizaciones futuras (redeploy)

Una vez configurado, **no hay que repetir esta guía**. Ambas plataformas están conectadas a la rama `main` de GitHub:

- Cada `git push` a `main` dispara automáticamente un nuevo build y deploy en **Vercel** y en **Render**.
- Si cambian variables de entorno, hay que actualizarlas manualmente en el dashboard correspondiente (no viven en el código).
- Si cambian el esquema de la base (`schema.sql`), hay que volver a correr las migraciones manualmente en el SQL Editor de Neon (no es automático).

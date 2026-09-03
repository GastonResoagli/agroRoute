
# Product Brief — AgroRoute: Plataforma de Transitabilidad Rural y Gestión de Actividades


---


## 1. Visión del Producto


Empoderar a productores agropecuarios, transportistas y comunidades del área periurbana de Corrientes con una herramienta que **anticipe el estado de los caminos rurales** según el clima, ofrezca **rutas seguras alternativas** y centralice la **gestión de actividades y eventos** del sector, reduciendo pérdidas económicas por empantanamiento y mejorando la coordinación logística regional.


---


## 2. Objetivos


| # | Objetivo | Horizonte |
|---|----------|-----------|
| O1 | Proveer predicciones de transitabilidad confiables con al menos 72 h de anticipación para 5-8 tramos críticos. | Lanzamiento (MVP) |


---


## 3. Usuarios Objetivo


### 3.1 Participante


- **Perfil**: Productor agropecuario, transportista de hacienda/granos, vecino rural o agente del ministerio de produccion
- **Necesidades clave**:
  - Analizar la situación climática y del terreno, y genera alertas de rutas intransitables
  - Obtener rutas alternativas seguras cuando su camino habitual esté comprometido.






---


## 4. Funcionalidades Principales


### F1 — Mapa Semáforo Predictivo con Slider Temporal


- Mapa interactivo centrado en el área periurbana de Corrientes (Riachuelo, San Cayetano, San Luis del Palmar, Santa Ana).
- Visualización de **5 a 8 tramos de caminos reales** con código de colores semáforo:
  - 🟢 **Verde** — Transitable sin restricciones.
  - 🟡 **Amarillo** — Transitable con precaución; posible deterioro.
  - 🔴 **Rojo (parpadeante)** — Intransitable; riesgo de empantanamiento.
- **Control deslizante temporal** con cuatro posiciones: *Hoy → +24 h → +48 h → +72 h*.
- Al desplazar el slider, el estado de cada tramo se actualiza en tiempo real según la lluvia pronosticada y el tipo de superficie del camino.
- Clasificación de superficie:
  - **Asfalto** (rutas nacionales/provinciales): alta tolerancia a lluvias.
  - **Ripio / Consolidado**: tolerancia media.
  - **Tierra / Arena arcillosa**: baja tolerancia; se degrada rápidamente con lluvias moderadas.


### F2 — Asistente de Desvío Seguro


- El usuario selecciona un **punto de partida(ubicacion del usuario)** y un **destino** dentro de la zona cubierta.
- Si la ruta directa presenta tramos en estado Rojo, el sistema:
  - **Bloquea visualmente la ruta** comprometida.
  - Muestra una **alerta crítica** con el motivo (lluvia proyectada, tipo de camino).
  - **Sugiere una ruta alternativa** priorizando caminos de asfalto o ripio en buen estado.
- Indicación clara de la diferencia de distancia/tiempo entre la ruta directa y el desvío sugerido.
---

#Consideraciones:
1. El objetivo de esta app es simular un sistema de recomendación de rutas para productores agropecuarios durante eventos climáticos adversos, para el transporte de mercaderìa y el traslado de ganado en caso de alertas meteorologicas que amenacen inundacion de los campos
2. La aplicación debe ser de una sola página (Single Page Application) y ejecutarse completamente en el frontend. No requiere conexión a bases de datos ni APIs externas; utiliza datos simulados (mock data).
3. Necesitamos almacenar informacion actualizada cada X horas accesible desde datos meteorologicos 
4.  
Problema: Que datos usar para basarnos en el algoritmo de recomendacion ?  
Considerar: indice de humedad antecedente, acceso a relieve, tener mapeadas las relieves,
Capa 1: Infraestructura y Caminos (La Topología)
Necesitas saber por dónde se puede ir, qué caminos existen y de qué material son.

Datos específicos: Trazado de rutas, caminos vecinales, picadas, tipo de superficie (asfalto, ripio, tierra), ubicación de puentes y tranqueras.

Fuentes gratuitas:

OpenStreetMap (OSM): A través de la Overpass API, puedes hacer consultas específicas como: "Descargame todos los caminos etiquetados como 'dirt' (tierra) o 'unclassified' en la provincia de Corrientes".

IGN (Instituto Geográfico Nacional): El IGN de Argentina tiene shapefiles (archivos de mapas) gratuitos y oficiales con la red vial nacional y provincial, incluyendo caminos secundarios y terciarios.

Trazas manuales (GeoJSON): Como hablamos antes, los caminos internos de las estancias los armas vos o el productor dibujándolos o usando el GPS.

Capa 2: Clima y Pronóstico (El evento dinámico)
Necesitas la lluvia pasada reciente y la predicción a muy corto plazo (nowcasting).

Datos específicos: Precipitación acumulada de las últimas 24/48 horas (en mm), y pronóstico por hora para las próximas 12 a 24 horas (en mm/hora).

Fuentes de datos (APIs): 

OpenWeatherMap o WeatherAPI: Tienen planes gratuitos excelentes que te devuelven un archivo JSON con el pronóstico hora por hora de cualquier coordenada GPS.


Tomorrow.io: Es una API muy usada en el agro porque tiene pronósticos hiperlocales de muy alta resolución (ideal para "llueve en mi campo pero no en el tuyo").

Capa 3: Suelo y Topografía (El "Ancho de Banda" del camino)
Saber cuánto llueve no sirve si no sabes dónde cae el agua y qué tan rápido se seca.

Datos específicos:

Tipo de suelo: Si es franco, arenoso (drena rápido) o arcilloso (retiene agua y hace barro).

Humedad antecedente: Qué tan llena está la "esponja" antes de que llueva.

Modelo de Elevación Digital (DEM): Para saber dónde están las pendientes y los "bajos" que se inundan.

Fuentes de datos:

Google Earth Engine (GEE): Es la herramienta definitiva. Es gratuita para desarrollo e investigación. Te permite cruzar el mapa de tus caminos con imágenes satelitales en tiempo real.

INTA (SEPA - Herramientas Satelitales): El INTA tiene mapas de agua en el suelo, perfiles de humedad y tipos de suelo de toda la Argentina, listos para consultar.

NASA SMAP / Misión SAOCOM (CONAE): Estos satélites miden específicamente la humedad del suelo. Los datos de CONAE (Agencia Espacial Argentina) son públicos y perfectos para medir cuán saturada está la tierra en la región pampeana y el litoral.



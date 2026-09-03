# Reglas de negocio — AgroRoute

## Alcance

Estas reglas se derivan exclusivamente del brief de producto de AgroRoute. Describen el comportamiento esperado de una herramienta de recomendación de transitabilidad rural y desvíos seguros para el área periurbana de Corrientes.

## Reglas explícitas

- **BR-001 — Propósito del servicio:** La solución debe anticipar el estado de los caminos rurales según las condiciones climáticas, ofrecer alternativas seguras y centralizar actividades y eventos del sector.
- **BR-002 — Área cubierta:** La visualización y las recomendaciones deben centrarse en el área periurbana de Corrientes, incluyendo Riachuelo, San Cayetano, San Luis del Palmar y Santa Ana.
- **BR-003 — Horizonte de predicción:** El servicio debe ofrecer predicciones de transitabilidad con hasta 72 horas de anticipación.
- **BR-004 — Cobertura mínima del MVP:** El MVP debe contemplar entre 5 y 8 tramos críticos de caminos reales.
- **BR-005 — Estados de transitabilidad:** Cada tramo debe clasificarse en uno de tres estados: verde, amarillo o rojo.
- **BR-006 — Significado del estado verde:** Un tramo verde se considera transitable sin restricciones.
- **BR-007 — Significado del estado amarillo:** Un tramo amarillo se considera transitable con precaución y con posibilidad de deterioro.
- **BR-008 — Significado del estado rojo:** Un tramo rojo se considera intransitable por riesgo de empantanamiento.
- **BR-009 — Momentos de consulta:** La persona usuaria debe poder consultar el estado para Hoy, +24 horas, +48 horas y +72 horas.
- **BR-010 — Actualización por momento:** Al cambiar el momento consultado, el estado de cada tramo debe actualizarse según la lluvia pronosticada y el tipo de superficie.
- **BR-011 — Superficie asfáltica:** Los caminos de asfalto deben considerarse de alta tolerancia a la lluvia.
- **BR-012 — Superficie de ripio o consolidada:** Los caminos de ripio o consolidados deben considerarse de tolerancia media a la lluvia.
- **BR-013 — Superficie de tierra o arena arcillosa:** Los caminos de tierra o arena arcillosa deben considerarse de baja tolerancia y susceptibles de deteriorarse rápidamente con lluvias moderadas.
- **BR-014 — Selección del trayecto:** La persona usuaria debe poder indicar una ubicación de partida y un destino dentro del área cubierta.
- **BR-015 — Detección de compromiso:** Si el trayecto directo contiene al menos un tramo rojo, el sistema debe considerarlo comprometido.
- **BR-016 — Bloqueo visual del trayecto:** Cuando el trayecto directo esté comprometido, debe mostrarse visualmente como bloqueado.
- **BR-017 — Alerta crítica:** Cuando el trayecto directo esté comprometido, debe emitirse una alerta crítica que informe el motivo, incluyendo la lluvia proyectada y el tipo de camino involucrado.
- **BR-018 — Recomendación de desvío:** Ante un trayecto directo comprometido, el sistema debe sugerir una ruta alternativa.
- **BR-019 — Prioridad del desvío:** La ruta alternativa debe priorizar caminos de asfalto o ripio que se encuentren en buen estado.
- **BR-020 — Comparación de trayectos:** La recomendación debe informar la diferencia de distancia y de tiempo entre el trayecto directo y el desvío sugerido.
- **BR-021 — Usuarios destinatarios:** La solución debe contemplar las necesidades de productores agropecuarios, transportistas de hacienda o granos, vecinos rurales y agentes del Ministerio de Producción.
- **BR-022 — Finalidad preventiva:** Las alertas y recomendaciones deben orientarse a reducir pérdidas por empantanamiento y mejorar la coordinación logística regional.

## Restricciones

- **BR-023 — Alcance geográfico restringido:** No debe presentarse la cobertura como válida fuera del área periurbana definida y sus cuatro localidades mencionadas.
- **BR-024 — Alcance temporal restringido:** Las posiciones de consulta deben limitarse a Hoy, +24 horas, +48 horas y +72 horas.
- **BR-025 — Datos simulados para el MVP:** La experiencia del MVP debe funcionar con datos simulados y sin depender de una conexión a bases de datos o servicios externos.
- **BR-026 — Aplicación de una sola página:** La solución debe operar como una única página.
- **BR-027 — Criterios de transitabilidad:** La clasificación debe considerar conjuntamente la lluvia y la superficie del camino; no debe basarse únicamente en uno de esos factores.
- **BR-028 — Restricción de ruta insegura:** Un trayecto directo con un tramo rojo no debe presentarse como alternativa segura.
- **BR-029 — Naturaleza de la recomendación:** La solución debe simular una recomendación para transporte de mercadería y traslado de ganado durante eventos climáticos adversos.

## Validaciones

- **BR-030 — Validación de ubicación de partida:** La ubicación de partida debe pertenecer al área cubierta para poder solicitar una recomendación.
- **BR-031 — Validación de destino:** El destino debe pertenecer al área cubierta para poder solicitar una recomendación.
- **BR-032 — Validación de tramo considerado:** Solo deben considerarse en el mapa los 5 a 8 tramos críticos definidos para el MVP.
- **BR-033 — Validación de superficie:** Cada tramo considerado debe tener identificada una superficie dentro de las categorías asfalto, ripio/consolidado o tierra/arena arcillosa.
- **BR-034 — Validación del momento:** La consulta debe corresponder a uno de los cuatro momentos habilitados.
- **BR-035 — Validación de alerta crítica:** La alerta crítica debe indicar tanto la lluvia proyectada como el tipo de camino que origina o contribuye al riesgo.
- **BR-036 — Validación de desvío:** La ruta alternativa solo debe sugerirse cuando el trayecto directo contenga un tramo rojo.
- **BR-037 — Validación de comparación:** Toda ruta alternativa sugerida debe incluir la diferencia de distancia y tiempo respecto del trayecto directo.

## Casos borde

- **BR-038 — Partida o destino fuera de cobertura:** Si la partida o el destino están fuera del área cubierta, no debe emitirse una recomendación de ruta dentro del servicio.
- **BR-039 — Trayecto directo sin tramos rojos:** Si todos los tramos del trayecto directo están verdes o amarillos, no corresponde activar la alerta crítica ni exigir un desvío.
- **BR-040 — Trayecto con varios tramos rojos:** Si el trayecto directo contiene más de un tramo rojo, la alerta debe reflejar que el trayecto está comprometido y el desvío debe evitar los tramos rojos identificados.
- **BR-041 — Deterioro por lluvia moderada:** Un tramo de tierra o arena arcillosa puede pasar a una condición de mayor riesgo ante lluvia moderada, aunque un tramo de asfalto o ripio reciba una lluvia comparable.
- **BR-042 — Consulta a +72 horas:** La consulta de +72 horas debe seguir siendo válida aunque represente el límite máximo de anticipación del servicio.
- **BR-043 — Ausencia de desvío seguro:** Si no existe una ruta alternativa que priorice asfalto o ripio en buen estado, el servicio no debe presentarla como segura.
- **BR-044 — Diferencia de trayectos no disponible:** No debe mostrarse una recomendación completa si no es posible informar la diferencia de distancia y tiempo requerida.
- **BR-045 — Riesgo de inundación:** Cuando las condiciones meteorológicas amenacen con inundaciones de los campos, las alertas deben tratar el escenario como un evento climático adverso relevante para la decisión de transporte.

## Reglas implícitas necesarias

- **BR-046 — Estado único por consulta:** Cada tramo debe mostrar un único estado para cada momento seleccionado, de modo que la persona usuaria pueda tomar una decisión clara.
- **BR-047 — Coherencia temporal:** La predicción mostrada debe corresponder al momento seleccionado y no mezclar estados de distintos horizontes.
- **BR-048 — Priorización de seguridad:** La seguridad y la transitabilidad deben prevalecer sobre la menor distancia o el menor tiempo cuando se compare un trayecto directo con un desvío.
- **BR-049 — Trazabilidad del riesgo:** Toda clasificación roja debe poder asociarse a una condición climática proyectada y a una superficie de camino que expliquen el riesgo.
- **BR-050 — Información para la decisión:** La información presentada debe permitir comparar el estado del camino, el motivo de la alerta y el costo de tomar el desvío.
- **BR-051 — Contexto de uso:** Las recomendaciones deben interpretarse como apoyo a la decisión de productores, transportistas, vecinos rurales y agentes públicos, especialmente ante lluvias, empantanamiento o inundación.
- **BR-052 — Datos territoriales complementarios:** Para mejorar la evaluación del riesgo, deben considerarse la humedad antecedente, el tipo de suelo, el relieve, las pendientes y los bajos con potencial de inundación.

## Sugerencias de herramientas y fuentes para Corrientes, Argentina

Las siguientes sugerencias se limitan a las fuentes mencionadas en el brief y se entienden como insumos para mantener actualizada la información del dominio.

- **BR-053 — Caminos y superficies:** Usar OpenStreetMap para relevar caminos etiquetados como tierra o no clasificados en Corrientes y complementar la red vial con datos oficiales del Instituto Geográfico Nacional.
- **BR-054 — Caminos internos:** Incorporar trazas manuales en GeoJSON o registros obtenidos mediante GPS de productores para representar caminos internos de estancias cuando no estén disponibles en las fuentes generales.
- **BR-055 — Pronóstico horario:** Consultar OpenWeatherMap o WeatherAPI para obtener lluvia acumulada reciente y pronósticos horarios de corto plazo para las coordenadas de la zona cubierta.
- **BR-056 — Pronóstico hiperlocal:** Evaluar Tomorrow.io cuando se requiera diferenciar precipitaciones entre campos o ubicaciones cercanas.
- **BR-057 — Suelo y humedad:** Consultar las herramientas satelitales del INTA (SEPA) para acceder a información sobre agua en el suelo, humedad y tipos de suelo de la región.
- **BR-058 — Humedad satelital:** Considerar datos públicos de NASA SMAP y de la misión SAOCOM/CONAE como apoyo para estimar la humedad del suelo en el Litoral.
- **BR-059 — Relieve y bajos:** Utilizar un modelo digital de elevación para identificar pendientes y zonas bajas que puedan influir en el anegamiento de caminos.
- **BR-060 — Actualización de información:** Mantener actualizados los datos meteorológicos y territoriales con una periodicidad definida por el equipo, de forma que la información disponible refleje las condiciones más recientes.

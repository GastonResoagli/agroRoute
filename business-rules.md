# Reglas de negocio — Ruta Segura

## Alcance

Estas reglas se derivan exclusivamente de `prompt.md`. Describen una solución que recomienda rutas para productores agropecuarios evaluando el clima y la saturación del suelo.

## Reglas explícitas

- **BR-001 — Propósito de la solución:** La solución debe recomendar la mejor ruta disponible para productores agropecuarios considerando el clima y la saturación del suelo.
- **BR-002 — Tipo de traslado:** Las recomendaciones deben contemplar el traslado de mercadería y de ganado durante condiciones que puedan producir anegamiento.
- **BR-003 — Datos de la solicitud:** Cada solicitud debe incluir un origen, un destino y el estado previo del suelo.
- **BR-004 — Estados previos del suelo:** El estado previo del suelo debe clasificarse como Seco, Húmedo o Saturado.
- **BR-005 — Clima considerado:** La evaluación debe considerar la precipitación acumulada proyectada para las próximas 24 horas.
- **BR-006 — Ubicación de la lluvia:** La precipitación utilizada para evaluar una ruta debe corresponder al punto medio del trayecto.
- **BR-007 — Rutas analizadas:** La recomendación debe analizar la ruta principal y las rutas alternativas disponibles.
- **BR-008 — Ruta principal:** La ruta más rápida debe considerarse la ruta principal.
- **BR-009 — Superficie asumida para la ruta principal:** La ruta principal debe considerarse de asfalto o ripio consolidado.
- **BR-010 — Rutas alternativas:** Las rutas alternativas deben considerarse caminos secundarios.
- **BR-011 — Superficie asumida para alternativas:** Los caminos secundarios deben considerarse de tierra.
- **BR-012 — Riesgo en camino secundario seco:** Un camino secundario con suelo Seco debe clasificarse con riesgo bajo.
- **BR-013 — Riesgo en camino secundario húmedo:** Un camino secundario con suelo Húmedo y lluvia proyectada superior a 10 mm debe clasificarse con riesgo alto.
- **BR-014 — Porcentaje de riesgo alto:** El riesgo alto definido para un camino secundario con suelo Húmedo y lluvia superior a 10 mm debe expresarse como 80%.
- **BR-015 — Riesgo crítico por lluvia:** Cuando la lluvia proyectada supere los 30 mm, la ruta debe clasificarse con riesgo crítico.
- **BR-016 — Porcentaje de riesgo crítico:** El riesgo crítico producido por lluvia superior a 30 mm debe expresarse como 100%.
- **BR-017 — Intransitabilidad:** Una ruta con riesgo crítico debe considerarse intransitable.
- **BR-018 — Ruta recomendada:** La solución debe identificar cuál de las rutas analizadas es la ruta recomendada.
- **BR-019 — Información de cada ruta:** El resultado debe informar la geometría, la distancia total, la lluvia esperada en el trayecto, el porcentaje de riesgo y el veredicto de cada ruta analizada.
- **BR-020 — Representación de la ruta recomendada:** La ruta recomendada debe diferenciarse visualmente de las demás rutas.
- **BR-021 — Representación del riesgo:** Las rutas con riesgo alto deben diferenciarse visualmente mediante una señal de riesgo.
- **BR-022 — Veredicto:** Cada ruta analizada debe tener un veredicto coherente con su nivel de riesgo y su transitabilidad.
- **BR-023 — Zona de referencia:** La solución debe tomar como referencia geográfica el Litoral, incluyendo la zona de Corrientes.

## Restricciones

- **BR-024 — Restricción del suelo:** El estado del suelo solo puede ser Seco, Húmedo o Saturado.
- **BR-025 — Restricción temporal:** La evaluación climática debe limitarse a la precipitación proyectada de las próximas 24 horas.
- **BR-026 — Restricción del criterio crítico:** Una lluvia proyectada superior a 30 mm debe prevalecer como condición de riesgo crítico, independientemente de que la ruta sea principal o alternativa.
- **BR-027 — Restricción de transitabilidad:** Una ruta intransitable no debe identificarse como ruta recomendada.
- **BR-028 — Restricción de recomendación:** La ruta recomendada debe seleccionarse únicamente entre las rutas que hayan sido analizadas.
- **BR-029 — Restricción de cobertura informativa:** No debe emitirse un resultado completo si faltan el origen, el destino, el estado previo del suelo o la lluvia esperada del trayecto.
- **BR-030 — Restricción de interpretación:** La solución debe presentar una recomendación para apoyar la decisión de traslado, no una garantía de transitabilidad real.
- **BR-031 — Restricción de fuentes del alcance:** Para el MVP, la información debe basarse en los datos y servicios indicados en `prompt.md`.

## Validaciones

- **BR-032 — Validación de origen:** Debe verificarse que la solicitud contenga un origen identificable.
- **BR-033 — Validación de destino:** Debe verificarse que la solicitud contenga un destino identificable.
- **BR-034 — Validación de origen y destino distintos:** El origen y el destino deben representar ubicaciones diferentes para que exista un trayecto que evaluar.
- **BR-035 — Validación del estado del suelo:** Debe rechazarse cualquier estado del suelo distinto de Seco, Húmedo o Saturado.
- **BR-036 — Validación climática:** Debe existir una precipitación acumulada proyectada para las próximas 24 horas antes de emitir riesgos.
- **BR-037 — Validación de ubicación climática:** La lluvia utilizada debe estar asociada al punto medio del trayecto evaluado.
- **BR-038 — Validación de rutas:** Debe existir al menos una ruta analizada para poder emitir una recomendación.
- **BR-039 — Validación de ruta recomendada:** El resultado debe marcar una única ruta como recomendada.
- **BR-040 — Validación de riesgo:** El porcentaje informado debe coincidir con el nivel de riesgo determinado para las condiciones de la ruta.
- **BR-041 — Validación de intransitabilidad:** Toda ruta con riesgo crítico debe mostrar un veredicto de intransitable.
- **BR-042 — Validación de resultados:** Cada ruta devuelta debe incluir distancia, lluvia esperada, porcentaje de riesgo y veredicto.

## Casos borde

- **BR-043 — Lluvia exactamente igual a 10 mm:** Una lluvia proyectada de 10 mm no supera el umbral de riesgo alto indicado para el camino secundario con suelo Húmedo.
- **BR-044 — Lluvia exactamente igual a 30 mm:** Una lluvia proyectada de 30 mm no supera el umbral que define el riesgo crítico.
- **BR-045 — Lluvia superior a 30 mm en ruta principal:** La ruta principal debe clasificarse como crítica e intransitable aunque se considere de asfalto o ripio consolidado.
- **BR-046 — Lluvia superior a 30 mm en ruta alternativa:** La ruta alternativa debe clasificarse como crítica e intransitable aunque el suelo previo sea Seco.
- **BR-047 — Suelo Saturado sin lluvia superior a 30 mm:** El prompt no define un porcentaje específico para esta combinación; debe evitarse asignar un valor inventado y conservarse un veredicto coherente con la información disponible.
- **BR-048 — Camino secundario seco con lluvia superior a 30 mm:** La condición de riesgo crítico debe prevalecer sobre la clasificación de riesgo bajo asociada al suelo Seco.
- **BR-049 — Varias rutas con riesgo crítico:** No debe recomendarse una ruta que tenga riesgo crítico; si todas las rutas resultan intransitables, debe informarse que no existe una alternativa transitable identificada.
- **BR-050 — Ausencia de rutas alternativas:** La ruta principal puede analizarse, pero no debe afirmarse que existe un desvío si no hay rutas alternativas disponibles.
- **BR-051 — Origen igual al destino:** La solicitud debe considerarse inválida porque no define un trayecto.
- **BR-052 — Lluvia no disponible:** No debe calcularse ni mostrarse un porcentaje de riesgo basado en una precipitación ausente.
- **BR-053 — Diferencias entre rutas:** Si las rutas tienen distinta distancia o lluvia esperada, cada una debe conservar sus propios valores en el resultado.

## Reglas implícitas necesarias

- **BR-054 — Comparabilidad:** Todas las rutas comparadas deben evaluarse con el mismo origen, destino, estado previo del suelo y horizonte de lluvia.
- **BR-055 — Consistencia del veredicto:** El veredicto debe reflejar el nivel de riesgo y no contradecir la condición de intransitabilidad.
- **BR-056 — Prioridad de seguridad:** La recomendación debe priorizar que la ruta sea transitable por encima de que sea la más rápida cuando ambas condiciones entren en conflicto.
- **BR-057 — Explicabilidad:** La recomendación debe poder justificarse mediante la lluvia esperada, el estado del suelo, la distancia y el riesgo de cada ruta.
- **BR-058 — Separación de estados:** El estado previo del suelo debe representar la condición existente antes de la lluvia proyectada y no confundirse con el pronóstico climático.
- **BR-059 — Actualidad de la evaluación:** La lluvia esperada debe corresponder al horizonte de 24 horas utilizado para la solicitud, para evitar decisiones basadas en un período diferente.
- **BR-060 — Tratamiento conservador de incertidumbre:** Cuando el prompt no define una combinación de condiciones, no deben inventarse porcentajes ni umbrales adicionales.
- **BR-061 — Transparencia de alcance:** El resultado debe dejar claro que la evaluación es una recomendación basada en las condiciones suministradas.

## Sugerencias de uso de herramientas para Corrientes, Argentina

Estas sugerencias se limitan a las herramientas y fuentes mencionadas en `prompt.md`.

- **BR-062 — Cálculo de trayectos:** Usar OSRM para obtener la ruta principal y las rutas alternativas entre ubicaciones de Corrientes y del Litoral.
- **BR-063 — Información meteorológica:** Usar Open-Meteo para consultar la precipitación acumulada proyectada de las próximas 24 horas en el punto medio de cada trayecto.
- **BR-064 — Uso regional:** Configurar las consultas de rutas y clima para ubicaciones de Corrientes, tomando como referencia inicial el área del Litoral indicada en el prompt.
- **BR-065 — Simulación del suelo:** Usar el selector de estado previo del suelo para representar en las pruebas las condiciones Seco, Húmedo y Saturado.
- **BR-066 — Pruebas de decisión:** Probar como mínimo los escenarios de camino secundario con suelo Seco, camino secundario con suelo Húmedo y lluvia superior a 10 mm, y lluvia superior a 30 mm.
- **BR-067 — Presentación para usuarios móviles:** Organizar la información de las rutas para que productores agropecuarios puedan comparar distancia, lluvia, riesgo y veredicto desde una experiencia orientada a dispositivos móviles.

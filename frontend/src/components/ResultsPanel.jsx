import React from 'react';
import RouteCard from './RouteCard';
import RainSensitivityCard from './RainSensitivityCard';
import { AlertOctagon, CheckCircle2, ShieldAlert, Route } from 'lucide-react';

export default function ResultsPanel({ 
  routes = [], 
  recommendedRouteId, 
  alertMessage, 
  selectedRouteIndex, 
  onSelectRoute,
  currentRainForecast = 0,
  simulatedRain,
  onSimulateRain,
  detectedSoilState
}) {
  if (!routes || routes.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
        <Route className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="font-bold text-slate-700 text-base">Esperando análisis de transitabilidad</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Selecciona un origen y destino en Corrientes. El sistema capturará automáticamente el clima y estado del suelo para evaluar las rutas.
        </p>
      </div>
    );
  }

  // Ordenar para mostrar la recomendada primero si existe
  const sortedRoutes = [...routes].sort((a, b) => {
    if (a.isRecommended) return -1;
    if (b.isRecommended) return 1;
    return a.riskPercentage - b.riskPercentage;
  });

  return (
    <div className="space-y-4">
      {/* Banner de Alerta Crítica (BR-049) */}
      {alertMessage && (
        <div className="rounded-xl p-4 bg-red-600 text-white shadow-md flex items-start gap-3 border border-red-700 animate-pulse">
          <AlertOctagon className="w-6 h-6 shrink-0 mt-0.5 text-red-200" />
          <div>
            <h4 className="font-black text-sm uppercase tracking-wide">
              Aviso Crítico de Transitabilidad
            </h4>
            <p className="text-xs text-red-100 mt-1 leading-relaxed">
              {alertMessage}
            </p>
          </div>
        </div>
      )}

      {/* Banner de Recomendación Exitosa (BR-018, BR-056) */}
      {!alertMessage && recommendedRouteId !== null && (
        <div className="rounded-xl p-3.5 bg-emerald-700 text-white shadow-sm flex items-center justify-between border border-emerald-800">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-emerald-200">
                Ruta Segura Seleccionada
              </div>
              <div className="text-sm font-black">
                {routes.find(r => r.routeIndex === recommendedRouteId)?.name || 'Opción Recomendada'}
              </div>
            </div>
          </div>
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-800 font-bold border border-emerald-600">
            Prioridad Seguridad
          </span>
        </div>
      )}

      {/* SIMULADOR DE IMPACTO: ¿QUÉ PASARÍA SI LLUEVE CIERTA CANTIDAD? */}
      <RainSensitivityCard
        currentRainForecast={currentRainForecast}
        simulatedRain={simulatedRain}
        onSimulateRain={onSimulateRain}
        routes={routes}
        detectedSoilState={detectedSoilState}
      />

      {/* Listado de Rutas Analizadas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider px-1">
          <span>Opciones de Rutas ({routes.length})</span>
          <span className="text-[11px] text-slate-400 font-normal">Haz clic para enfocar en mapa</span>
        </div>

        {sortedRoutes.map((route) => (
          <RouteCard
            key={`route-${route.routeIndex}`}
            route={route}
            isSelected={selectedRouteIndex === route.routeIndex}
            onSelect={() => onSelectRoute(route.routeIndex)}
          />
        ))}
      </div>
    </div>
  );
}

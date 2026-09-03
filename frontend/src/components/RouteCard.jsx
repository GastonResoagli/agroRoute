import React from 'react';
import RiskBadge from './RiskBadge';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  CloudRain, 
  ShieldAlert, 
  Layers,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export default function RouteCard({ route, isSelected, onSelect }) {
  const isRecommended = route.isRecommended;
  const isCritical = route.riskPercentage === 100 || !route.isPassable;
  const isHighRisk = route.riskPercentage >= 80;

  // Color de borde y fondo según recomendación y riesgo
  let cardBorderClass = 'border-slate-200 hover:border-slate-300 bg-white';
  if (isRecommended) {
    cardBorderClass = 'border-2 border-emerald-500 bg-emerald-50/40 shadow-sm ring-1 ring-emerald-500/20';
  } else if (isCritical) {
    cardBorderClass = 'border-2 border-red-400 bg-red-50/30';
  } else if (isHighRisk) {
    cardBorderClass = 'border border-orange-300 bg-orange-50/20';
  }

  const thresholds = route.thresholds;

  return (
    <div 
      onClick={() => onSelect(route)}
      className={`rounded-xl p-4 transition-all cursor-pointer ${cardBorderClass} ${
        isSelected ? 'ring-2 ring-offset-1 ring-slate-400' : ''
      }`}
    >
      {/* Cabecera de la Tarjeta */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
              route.routeType === 'primary' 
                ? 'bg-slate-800 text-white' 
                : 'bg-amber-100 text-amber-900 border border-amber-300'
            }`}>
              {route.routeType === 'primary' ? 'Ruta Principal' : 'Camino Secundario'}
            </span>
            <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
              <Layers className="w-3 h-3 text-slate-400" />
              {route.surfaceType === 'asfalto_ripio' ? 'Asfalto / Ripio consolidado' : 'Calzada de Tierra'}
            </span>
          </div>
          <h3 className="font-bold text-sm text-slate-900 mt-1">
            {route.name}
          </h3>
        </div>

        {/* Badge Recomendada */}
        {isRecommended && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 animate-pulse">
            <CheckCircle2 className="w-3.5 h-3.5" />
            RECOMENDADA
          </span>
        )}
      </div>

      {/* Veredicto y Nivel de Riesgo (BR-022, BR-040) */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <RiskBadge 
          level={route.riskLevel} 
          percentage={route.riskPercentage} 
          isPassable={route.isPassable} 
        />
        <span className={`text-xs font-bold ${
          isCritical 
            ? 'text-red-700' 
            : isHighRisk 
              ? 'text-orange-700' 
              : 'text-emerald-800'
        }`}>
          Veredicto: {route.verdict}
        </span>
      </div>

      {/* Métricas Principales (BR-019, BR-042) */}
      <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-lg p-2.5 text-center border border-slate-100 mb-3">
        {/* Distancia */}
        <div>
          <div className="text-[10px] uppercase font-bold text-slate-400">Distancia</div>
          <div className="font-extrabold text-sm text-slate-800">{route.distanceKm} km</div>
        </div>
        {/* Tiempo estimado */}
        <div>
          <div className="text-[10px] uppercase font-bold text-slate-400">Tiempo Est.</div>
          <div className="font-extrabold text-sm text-slate-800 flex items-center justify-center gap-0.5">
            <Clock className="w-3 h-3 text-slate-400" />
            {route.durationMin} min
          </div>
        </div>
        {/* Lluvia en Punto Medio */}
        <div>
          <div className="text-[10px] uppercase font-bold text-slate-400">Lluvia 24h</div>
          <div className={`font-extrabold text-sm flex items-center justify-center gap-0.5 ${
            route.rain24hMm > 30 ? 'text-red-600' : route.rain24hMm > 15 ? 'text-orange-600' : 'text-blue-600'
          }`}>
            <CloudRain className="w-3 h-3" />
            {route.rain24hMm} mm
          </div>
        </div>
      </div>

      {/* Umbrales de Tolerancia del Camino */}
      {thresholds && (
        <div className="bg-slate-50/80 rounded-lg p-2 mb-2.5 border border-slate-200/60 text-[11px] text-slate-600 flex items-start gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-700">Tolerancia de lluvia: </span>
            {thresholds.toleratedRainSummary}
          </div>
        </div>
      )}

      {/* Barra visual de riesgo */}
      <div className="space-y-1 mb-2.5">
        <div className="flex justify-between text-[11px] text-slate-500 font-medium">
          <span>Índice de Riesgo de Intransitabilidad</span>
          <span className="font-bold">{route.riskPercentage}%</span>
        </div>
        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${
              route.riskPercentage >= 100 
                ? 'bg-red-600' 
                : route.riskPercentage >= 80 
                  ? 'bg-orange-500' 
                  : route.riskPercentage >= 40 
                    ? 'bg-amber-400' 
                    : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.max(5, route.riskPercentage)}%` }}
          />
        </div>
      </div>

      {/* Explicación y Justificación (BR-057) */}
      <div className="text-xs text-slate-600 bg-white/80 rounded p-2 border border-slate-100 flex items-start gap-1.5">
        {isCritical ? (
          <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
        ) : isHighRisk ? (
          <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        )}
        <div>
          <span className="font-semibold text-slate-700">Evaluación: </span>
          {route.explanation}
          {route.ruleApplied && (
            <span className="ml-1 text-[10px] font-mono text-slate-400">({route.ruleApplied})</span>
          )}
        </div>
      </div>
    </div>
  );
}

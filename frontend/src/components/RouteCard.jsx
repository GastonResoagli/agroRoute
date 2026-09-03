import React from 'react';
import RiskBadge from './RiskBadge';
import { 
  CheckCircle2, 
  Clock, 
  CloudRain, 
  Milestone
} from 'lucide-react';

export default function RouteCard({ 
  route, 
  isSelected, 
  onSelect,
  onUpdateSurface
}) {
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

  const majorRoads = route.majorRoads || [];

  const handleSurfaceChange = (e) => {
    e.stopPropagation();
    if (onUpdateSurface) {
      onUpdateSurface(route.routeIndex, e.target.value);
    }
  };

  return (
    <div 
      onClick={() => onSelect(route)}
      className={`rounded-xl p-4 transition-all cursor-pointer ${cardBorderClass} ${
        isSelected ? 'ring-2 ring-offset-1 ring-slate-400' : ''
      }`}
    >
      {/* Cabecera de la Tarjeta */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          {/* Insignias de Rutas principales si las hay (ej. RN 12) */}
          {majorRoads.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              {majorRoads.map((road, idx) => (
                <span 
                  key={`road-badge-${idx}`}
                  className={`text-[10px] px-2 py-0.5 rounded font-black border flex items-center gap-1 ${
                    road.includes('RN') 
                      ? 'bg-blue-600 text-white border-blue-700 shadow-xs' 
                      : 'bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                >
                  <Milestone className="w-3 h-3" />
                  {road}
                </span>
              ))}
            </div>
          )}

          <h3 className="font-bold text-sm text-slate-900">
            {route.name}
          </h3>
        </div>

        {/* Badge Recomendada */}
        {isRecommended && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 animate-pulse shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
            RECOMENDADA
          </span>
        )}
      </div>

      {/* Selector de Calzada Simplificado */}
      <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-200/80 mb-3 text-xs">
        <span className="text-slate-600 font-medium">Calzada:</span>
        <select
          value={route.surfaceType}
          onChange={handleSurfaceChange}
          onClick={(e) => e.stopPropagation()}
          className="text-xs font-bold rounded border-slate-300 bg-white py-1 px-2.5 shadow-xs focus:ring-emerald-500 focus:border-emerald-500"
        >
          <option value="asfalto_ripio">Asfalto / Ripio</option>
          <option value="tierra">Tierra</option>
        </select>
      </div>

      {/* Riesgo en Porcentaje y Veredicto (Limpio y directo) */}
      <div className="flex items-center gap-2 mb-3">
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
          {route.verdict}
        </span>
      </div>

      {/* Métricas Principales (Distancia, Tiempo, Lluvia) */}
      <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-lg p-2.5 text-center border border-slate-100 mb-3">
        <div>
          <div className="text-[10px] uppercase font-bold text-slate-400">Distancia</div>
          <div className="font-extrabold text-sm text-slate-800">{route.distanceKm} km</div>
        </div>
        <div>
          <div className="text-[10px] uppercase font-bold text-slate-400">Tiempo Est.</div>
          <div className="font-extrabold text-sm text-slate-800 flex items-center justify-center gap-0.5">
            <Clock className="w-3 h-3 text-slate-400" />
            {route.durationMin} min
          </div>
        </div>
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

      {/* Barra visual de riesgo */}
      <div className="space-y-1">
        <div className="flex justify-between text-[11px] text-slate-500 font-medium">
          <span>Nivel de Riesgo</span>
          <span className="font-bold text-slate-800">{route.riskPercentage}%</span>
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
    </div>
  );
}

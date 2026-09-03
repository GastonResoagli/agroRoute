import React from 'react';
import { CloudRain, AlertTriangle, AlertOctagon, CheckCircle2, Sliders, Info, ArrowRight } from 'lucide-react';

export default function RainSensitivityCard({
  currentRainForecast = 0,
  simulatedRain,
  onSimulateRain,
  routes = [],
  detectedSoilState = 'Húmedo'
}) {
  const activeRain = simulatedRain !== null && simulatedRain !== undefined ? simulatedRain : currentRainForecast;
  const isSimulated = simulatedRain !== null && simulatedRain !== undefined;

  // Presets rápidos de lluvia para probar umbrales clave
  const presets = [
    { label: 'Pronóstico Real', value: null, mm: currentRainForecast },
    { label: '5 mm (Leve)', value: 5.0, mm: 5 },
    { label: '15 mm (Límite Tierra)', value: 15.0, mm: 15 },
    { label: '18 mm (> 15 mm)', value: 18.0, mm: 18 },
    { label: '25 mm (Fuerte)', value: 25.0, mm: 25 },
    { label: '35 mm (Crítico > 30 mm)', value: 35.0, mm: 35 }
  ];

  // Evaluar impacto en base al valor actual de activeRain y el estado del suelo
  const getImpactSummary = (rainMm) => {
    if (rainMm > 30) {
      return {
        level: 'CRITICO',
        title: 'Corte Total — Ambas Rutas Intransitables',
        badgeColor: 'bg-red-600 text-white',
        description: `Con ${rainMm} mm proyectados (> 30 mm), el volumen de agua sobrepasa la capacidad de drenaje tanto en asfalto como en tierra. Se declara Intransitabilidad Total (100% de riesgo).`,
        primaryState: 'Intransitable (100%)',
        secondaryState: 'Intransitable (100%)'
      };
    }

    if (rainMm > 15) {
      return {
        level: 'ALTO',
        title: 'Camino Secundario con Riesgo Alto (80%)',
        badgeColor: 'bg-orange-600 text-white',
        description: `Con ${rainMm} mm (> 15 mm), el camino de tierra con suelo ${detectedSoilState} se degrada formando huellones y lodazal (80% riesgo). La ruta principal de asfalto permanece transitable (20% riesgo).`,
        primaryState: 'Transitable (20% riesgo)',
        secondaryState: 'Transitable con Alto Riesgo (80%)'
      };
    }

    return {
      level: 'BAJO',
      title: 'Condición Favorable — Rutas Transitables',
      badgeColor: 'bg-emerald-600 text-white',
      description: `Con ${rainMm} mm (<= 15 mm), tanto la ruta principal de asfalto como los caminos secundarios de tierra tienen capacidad de absorción y se mantienen transitables.`,
      primaryState: 'Transitable sin restricciones (10%)',
      secondaryState: detectedSoilState === 'Saturado' ? 'Precaución por suelo saturado (75%)' : 'Transitable (15% a 25%)'
    };
  };

  const impact = getImpactSummary(activeRain);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5 space-y-4">
      {/* Cabecera del Simulador */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
            <CloudRain className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              ¿Qué pasaría si llueve cierta cantidad?
            </h3>
            <p className="text-[11px] text-slate-500">
              Análisis dinámico de tolerancia y umbrales de transitabilidad
            </p>
          </div>
        </div>

        {isSimulated && (
          <button
            type="button"
            onClick={() => onSimulateRain(null)}
            className="text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200"
          >
            Restablecer Pronóstico Real
          </button>
        )}
      </div>

      {/* Control Deslizante (Slider) */}
      <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-600 font-semibold flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            Lluvia a simular en 24h:
          </span>
          <span className="font-black text-base text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200 shadow-xs">
            {activeRain} mm
          </span>
        </div>

        <input
          type="range"
          min="0"
          max="45"
          step="1"
          value={activeRain}
          onChange={(e) => onSimulateRain(Number(e.target.value))}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />

        {/* Marcas de umbrales en el slider */}
        <div className="flex justify-between text-[10px] text-slate-400 font-semibold px-0.5">
          <span>0 mm</span>
          <span className="text-orange-600">15 mm (Umbral Tierra)</span>
          <span className="text-red-600">30 mm (Corte Total)</span>
          <span>45 mm</span>
        </div>
      </div>

      {/* Botones de Presets Rápidos */}
      <div className="flex flex-wrap gap-1.5">
        {presets.map((preset, idx) => {
          const isCurrentActive =
            (preset.value === null && !isSimulated) ||
            (preset.value !== null && isSimulated && simulatedRain === preset.value);

          return (
            <button
              key={`preset-${idx}`}
              type="button"
              onClick={() => onSimulateRain(preset.value)}
              className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all ${
                isCurrentActive
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs font-bold'
                  : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {/* Tarjeta de Impacto Proyectado */}
      <div className={`p-3.5 rounded-xl border ${
        impact.level === 'CRITICO'
          ? 'bg-red-50/70 border-red-300 text-red-900'
          : impact.level === 'ALTO'
            ? 'bg-orange-50/70 border-orange-300 text-orange-900'
            : 'bg-emerald-50/70 border-emerald-300 text-emerald-900'
      }`}>
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 font-bold text-xs">
            {impact.level === 'CRITICO' ? (
              <AlertOctagon className="w-4 h-4 text-red-600" />
            ) : impact.level === 'ALTO' ? (
              <AlertTriangle className="w-4 h-4 text-orange-600" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            )}
            <span>{impact.title}</span>
          </div>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${impact.badgeColor}`}>
            Simulando {activeRain} mm
          </span>
        </div>

        <p className="text-xs leading-relaxed opacity-90 mb-2.5">
          {impact.description}
        </p>

        {/* Resumen por tipo de calzada */}
        <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-current/10">
          <div className="bg-white/80 p-2 rounded border border-current/10">
            <div className="font-semibold text-slate-700">Ruta Asfalto/Ripio:</div>
            <div className="font-bold text-slate-900">{impact.primaryState}</div>
          </div>
          <div className="bg-white/80 p-2 rounded border border-current/10">
            <div className="font-semibold text-slate-700">Camino de Tierra:</div>
            <div className="font-bold text-slate-900">{impact.secondaryState}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { CORRIENTES_LOCATIONS } from '../data/presets';
import { 
  Navigation, 
  Sun, 
  CloudRain, 
  Waves, 
  Play, 
  RotateCcw,
  MousePointerClick,
  Satellite,
  ChevronDown,
  ChevronUp,
  Clock,
  Wind,
  Droplets
} from 'lucide-react';

export default function ControlPanel({
  origin,
  setOrigin,
  destination,
  setDestination,
  soilState,
  setSoilState,
  soilTelemetry,
  soilSource,
  weatherForecast,
  onAnalyze,
  isLoading,
  mapClickMode,
  setMapClickMode
}) {
  const [showManualSoil, setShowManualSoil] = useState(false);

  const handleOriginChange = (e) => {
    const loc = CORRIENTES_LOCATIONS.find(l => l.id === e.target.value);
    if (loc) setOrigin({ name: loc.name, lat: loc.lat, lon: loc.lon });
  };

  const handleDestinationChange = (e) => {
    const loc = CORRIENTES_LOCATIONS.find(l => l.id === e.target.value);
    if (loc) setDestination({ name: loc.name, lat: loc.lat, lon: loc.lon });
  };

  const handleSwap = () => {
    const temp = { ...origin };
    setOrigin({ ...destination });
    setDestination(temp);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5 space-y-4">

      {/* Selector de Trayecto */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-emerald-600" />
            Trayecto (Corrientes)
          </label>
          <button
            type="button"
            onClick={handleSwap}
            className="text-xs text-emerald-700 hover:text-emerald-900 font-medium flex items-center gap-1 hover:underline"
          >
            <RotateCcw className="w-3 h-3" /> Invertir
          </button>
        </div>

        {/* Origen */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="font-semibold flex items-center gap-1 text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
              Punto A — Origen
            </span>
            <button
              type="button"
              onClick={() => setMapClickMode(mapClickMode === 'origin' ? null : 'origin')}
              className={`text-[11px] px-2 py-0.5 rounded border transition-colors flex items-center gap-1 ${
                mapClickMode === 'origin' 
                  ? 'bg-emerald-600 text-white border-emerald-600' 
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              <MousePointerClick className="w-3 h-3" />
              {mapClickMode === 'origin' ? 'Haz clic en el mapa' : 'Fijar en mapa'}
            </button>
          </div>
          <select
            value={CORRIENTES_LOCATIONS.find(l => Math.abs(l.lat - origin.lat) < 0.001)?.id || 'custom'}
            onChange={handleOriginChange}
            className="w-full text-sm rounded-lg border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 bg-slate-50 p-2 border"
          >
            {CORRIENTES_LOCATIONS.map(loc => (
              <option key={`orig-${loc.id}`} value={loc.id}>
                {loc.name} ({loc.description})
              </option>
            ))}
            {!CORRIENTES_LOCATIONS.some(l => Math.abs(l.lat - origin.lat) < 0.001) && (
              <option value="custom">Personalizado ({origin.lat.toFixed(3)}, {origin.lon.toFixed(3)})</option>
            )}
          </select>
        </div>

        {/* Destino */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="font-semibold flex items-center gap-1 text-blue-700">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
              Punto B — Destino
            </span>
            <button
              type="button"
              onClick={() => setMapClickMode(mapClickMode === 'destination' ? null : 'destination')}
              className={`text-[11px] px-2 py-0.5 rounded border transition-colors flex items-center gap-1 ${
                mapClickMode === 'destination' 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              <MousePointerClick className="w-3 h-3" />
              {mapClickMode === 'destination' ? 'Haz clic en el mapa' : 'Fijar en mapa'}
            </button>
          </div>
          <select
            value={CORRIENTES_LOCATIONS.find(l => Math.abs(l.lat - destination.lat) < 0.001)?.id || 'custom'}
            onChange={handleDestinationChange}
            className="w-full text-sm rounded-lg border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 bg-slate-50 p-2 border"
          >
            {CORRIENTES_LOCATIONS.map(loc => (
              <option key={`dest-${loc.id}`} value={loc.id}>
                {loc.name} ({loc.description})
              </option>
            ))}
            {!CORRIENTES_LOCATIONS.some(l => Math.abs(l.lat - destination.lat) < 0.001) && (
              <option value="custom">Personalizado ({destination.lat.toFixed(3)}, {destination.lon.toFixed(3)})</option>
            )}
          </select>
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* ESTADO DEL SUELO: DETECCIÓN SATELITAL */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Satellite className="w-3.5 h-3.5 text-blue-600" />
            Estado del Suelo
          </label>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 font-bold text-blue-800">
            {soilSource === 'manual_override' ? 'Calibrado manualmente' : 'Detección Satelital'}
          </span>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {soilState === 'Saturado' ? (
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Waves className="w-4 h-4" />
                </div>
              ) : soilState === 'Húmedo' ? (
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <CloudRain className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Sun className="w-4 h-4" />
                </div>
              )}
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Humedad de Campo</div>
                <div className="text-sm font-black text-slate-900">Suelo {soilState || '...'}</div>
              </div>
            </div>

            {soilTelemetry && (
              <div className="text-right text-xs">
                <div className="font-bold text-slate-800">{soilTelemetry.moisturePercent}% humedad</div>
                <div className="text-[10px] text-slate-500">{soilTelemetry.pastRain48hMm} mm en 48h previas</div>
              </div>
            )}
          </div>

          {soilTelemetry?.explanation && (
            <p className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-100 leading-snug">
              {soilTelemetry.explanation}
            </p>
          )}

          <button
            type="button"
            onClick={() => setShowManualSoil(!showManualSoil)}
            className="text-[11px] text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1 hover:underline"
          >
            {showManualSoil ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {showManualSoil ? 'Ocultar ajuste manual' : '¿Probar con otro estado de suelo?'}
          </button>

          {showManualSoil && (
            <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-200">
              {['Seco', 'Húmedo', 'Saturado'].map((st) => (
                <button
                  key={`soil-${st}`}
                  type="button"
                  onClick={() => setSoilState(st)}
                  className={`py-1.5 px-2 rounded-lg border text-xs font-bold transition-all ${
                    soilState === st
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Probabilidad de lluvia y mm por llover en esas horas */}
      {weatherForecast && (
        <>
          <hr className="border-slate-100" />

          <div className="grid grid-cols-3 gap-2">
            {/* 6 Horas */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-2.5 text-center">
              <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center justify-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                6 Horas
              </div>
              <div className="text-lg font-black text-slate-900 mt-0.5">
                {weatherForecast.forecast6h} <span className="text-[11px] font-bold text-slate-500">mm</span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium">por llover</div>
              <div className="mt-1.5 text-xs font-bold text-blue-700 bg-blue-50 py-0.5 px-1 rounded-md border border-blue-100 flex items-center justify-center gap-1">
                <Droplets className="w-3 h-3 text-blue-500" />
                {weatherForecast.maxProb6h || 0}% prob.
              </div>
            </div>

            {/* 12 Horas */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-2.5 text-center">
              <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center justify-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                12 Horas
              </div>
              <div className="text-lg font-black text-slate-900 mt-0.5">
                {weatherForecast.forecast12h} <span className="text-[11px] font-bold text-slate-500">mm</span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium">por llover</div>
              <div className="mt-1.5 text-xs font-bold text-blue-700 bg-blue-50 py-0.5 px-1 rounded-md border border-blue-100 flex items-center justify-center gap-1">
                <Droplets className="w-3 h-3 text-blue-500" />
                {weatherForecast.maxProb12h || 0}% prob.
              </div>
            </div>

            {/* 24 Horas */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-2.5 text-center">
              <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center justify-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                24 Horas
              </div>
              <div className="text-lg font-black text-slate-900 mt-0.5">
                {weatherForecast.forecast24h} <span className="text-[11px] font-bold text-slate-500">mm</span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium">por llover</div>
              <div className="mt-1.5 text-xs font-bold text-blue-700 bg-blue-50 py-0.5 px-1 rounded-md border border-blue-100 flex items-center justify-center gap-1">
                <Droplets className="w-3 h-3 text-blue-500" />
                {weatherForecast.maxProb24h ?? weatherForecast.maxProb12h ?? 0}% prob.
              </div>
            </div>
          </div>
        </>
      )}

      {/* Botón Principal */}
      <button
        type="button"
        onClick={onAnalyze}
        disabled={isLoading}
        className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Consultando rutas y calzadas...</span>
          </>
        ) : (
          <>
            <Play className="w-4 h-4 fill-white" />
            <span>Consultar Rutas y Transitabilidad</span>
          </>
        )}
      </button>
    </div>
  );
}

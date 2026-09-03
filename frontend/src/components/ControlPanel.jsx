import React, { useState } from 'react';
import { CORRIENTES_LOCATIONS } from '../data/presets';
import { 
  Navigation, 
  MapPin, 
  Sun, 
  CloudRain, 
  Waves, 
  Beef, 
  Wheat, 
  Truck, 
  Play, 
  RotateCcw,
  Sparkles,
  MousePointerClick,
  Satellite,
  CheckCircle2,
  ChevronDown,
  ChevronUp
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
  cargoType,
  setCargoType,
  onAnalyze,
  isLoading,
  mapClickMode,
  setMapClickMode
}) {
  const [showManualSoil, setShowManualSoil] = useState(false);

  const handleOriginChange = (e) => {
    const loc = CORRIENTES_LOCATIONS.find(l => l.id === e.target.value);
    if (loc) {
      setOrigin({ name: loc.name, lat: loc.lat, lon: loc.lon });
    }
  };

  const handleDestinationChange = (e) => {
    const loc = CORRIENTES_LOCATIONS.find(l => l.id === e.target.value);
    if (loc) {
      setDestination({ name: loc.name, lat: loc.lat, lon: loc.lon });
    }
  };

  const handleSwap = () => {
    const temp = { ...origin };
    setOrigin({ ...destination });
    setDestination(temp);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5 space-y-5">
      {/* Selector de Trayecto en Corrientes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-emerald-600" />
            Trayecto del Productor (Corrientes)
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSwap}
              className="text-xs text-emerald-700 hover:text-emerald-900 font-medium flex items-center gap-1 hover:underline"
              title="Invertir origen y destino"
            >
              <RotateCcw className="w-3 h-3" /> Invertir
            </button>
          </div>
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
              {mapClickMode === 'origin' ? 'Clic en el mapa activo' : 'Fijar en mapa'}
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
              {mapClickMode === 'destination' ? 'Clic en el mapa activo' : 'Fijar en mapa'}
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

      {/* ESTADO DEL SUELO: DETECCIÓN Y CLASIFICACIÓN AUTOMÁTICA */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Satellite className="w-3.5 h-3.5 text-blue-600" />
            Estado del Suelo (Detección Automática)
          </label>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 font-bold text-blue-800">
            Open-Meteo Satelital
          </span>
        </div>

        {/* Tarjeta de Telemetría Real de Suelo */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
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
                <div className="text-[10px] uppercase font-bold text-slate-400">
                  Clasificación Agronómica
                </div>
                <div className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  Suelo {soilState}
                  <span className="text-[10px] font-normal px-2 py-0.2 rounded-full bg-slate-200 text-slate-700">
                    {soilSource === 'manual_override' ? 'Modo Calibración' : 'Automático'}
                  </span>
                </div>
              </div>
            </div>

            {/* Datos cuantitativos */}
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

          {/* Toggle para sobrescribir manualmente si se desea calibrar */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowManualSoil(!showManualSoil)}
              className="text-[11px] text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1 hover:underline"
            >
              {showManualSoil ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {showManualSoil ? 'Ocultar ajuste manual' : '¿Deseas forzar otro estado de suelo para probar?'}
            </button>

            {showManualSoil && (
              <div className="grid grid-cols-3 gap-1.5 mt-2 pt-2 border-t border-slate-200">
                {['Seco', 'Húmedo', 'Saturado'].map((st) => (
                  <button
                    key={`soil-override-${st}`}
                    type="button"
                    onClick={() => setSoilState(st)}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-bold transition-all ${
                      soilState === st
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
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
      </div>

      <hr className="border-slate-100" />

      {/* Tipo de Carga / Traslado (BR-002) */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Truck className="w-3.5 h-3.5 text-emerald-600" />
          Tipo de Traslado (BR-002)
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setCargoType('hacienda')}
            className={`p-2 rounded-lg border text-xs font-medium flex flex-col items-center gap-1 transition-all ${
              cargoType === 'hacienda'
                ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm ring-1 ring-emerald-500'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Beef className="w-4 h-4 text-amber-700" />
            <span>Hacienda</span>
          </button>
          <button
            type="button"
            onClick={() => setCargoType('granos')}
            className={`p-2 rounded-lg border text-xs font-medium flex flex-col items-center gap-1 transition-all ${
              cargoType === 'granos'
                ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm ring-1 ring-emerald-500'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Wheat className="w-4 h-4 text-amber-500" />
            <span>Granos</span>
          </button>
          <button
            type="button"
            onClick={() => setCargoType('general')}
            className={`p-2 rounded-lg border text-xs font-medium flex flex-col items-center gap-1 transition-all ${
              cargoType === 'general'
                ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm ring-1 ring-emerald-500'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Truck className="w-4 h-4 text-slate-500" />
            <span>General</span>
          </button>
        </div>
      </div>

      {/* Botón Principal de Análisis */}
      <button
        type="button"
        onClick={onAnalyze}
        disabled={isLoading}
        className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Analizando caminos y telemetría de suelo...</span>
          </>
        ) : (
          <>
            <Play className="w-4 h-4 fill-white" />
            <span>Evaluar Transitabilidad en Tiempo Real</span>
          </>
        )}
      </button>
    </div>
  );
}

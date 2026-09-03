import React from 'react';
import { X, BookOpen, ShieldCheck, Database, CloudRain, CheckCircle2 } from 'lucide-react';

export default function RulesModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
        {/* Cabecera */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">Reglas de Negocio — AgroRoute</h3>
              <p className="text-xs text-slate-500">Criterios agropecuarios para la región de Corrientes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido Scrollable */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700 leading-relaxed">
          {/* Clasificación de Rutas */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <h4 className="font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              1. Enrutamiento y Superficies (BR-007 a BR-011)
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li><strong>Ruta Principal:</strong> La más rápida calculada por OSRM. Se asume como calzada de <strong>asfalto o ripio consolidado</strong>.</li>
              <li><strong>Rutas Alternativas:</strong> Desvíos secundarios. Se asumen como <strong>calzadas de tierra</strong>.</li>
            </ul>
          </div>

          {/* Criterios Climáticos y Suelo */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <h4 className="font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
              <CloudRain className="w-4 h-4 text-blue-600" />
              2. Umbrales de Riesgo y Transitabilidad (BR-012 a BR-017)
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li><strong>Lluvia &gt; 30 mm:</strong> Riesgo <strong>Crítico (100%)</strong> y veredicto <strong>Intransitable</strong>. Prevalece sobre cualquier ruta y suelo (BR-015, BR-026, BR-045).</li>
              <li><strong>Camino de tierra + Suelo Húmedo + Lluvia &gt; 15 mm:</strong> Riesgo <strong>Alto (80%)</strong> por formación de huellones y lodo (BR-013, BR-014).</li>
              <li><strong>Camino de tierra + Suelo Seco + Lluvia &le; 30 mm:</strong> Riesgo <strong>Bajo (15%)</strong> con veredicto transitable (BR-012).</li>
              <li><strong>Punto Medio:</strong> El pronóstico se consulta a Open-Meteo exactamente en el 50% del recorrido geométrico (BR-006, BR-037).</li>
            </ul>
          </div>

          {/* Criterio de Selección */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <h4 className="font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              3. Prioridad de Seguridad (BR-018, BR-056)
            </h4>
            <p className="text-slate-600">
              La ruta recomendada se selecciona únicamente entre opciones transitables, priorizando la seguridad y el menor riesgo sobre la velocidad. Si todas las rutas superan los 30 mm, ninguna se recomienda y se activa la alerta de inundación (BR-049).
            </p>
          </div>

          {/* Persistencia y RLS */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <h4 className="font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-purple-600" />
              4. Persistencia en PostgreSQL con Row Level Security (RLS)
            </h4>
            <p className="text-slate-600">
              Aislamiento de solicitudes por productor agropecuario mediante políticas RLS en las tablas <code>route_requests</code> y <code>risk_assessments</code>, con lectura de reglas públicas en <code>risk_rule_config</code>.
            </p>
          </div>
        </div>

        {/* Pie */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}


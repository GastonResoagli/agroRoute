import React from 'react';
import { AlertOctagon, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export default function RiskBadge({ level, percentage, isPassable = true }) {
  if (level === 'CRITICO' || percentage >= 100 || !isPassable) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-300 animate-pulse">
        <AlertOctagon className="w-3.5 h-3.5" />
        Crítico {percentage}% — Intransitable
      </span>
    );
  }

  if (level === 'ALTO' || percentage >= 80) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-300">
        <AlertTriangle className="w-3.5 h-3.5" />
        Riesgo Alto {percentage}%
      </span>
    );
  }

  if (level === 'MEDIO' || percentage >= 40) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
        <Info className="w-3.5 h-3.5" />
        Precaución {percentage}%
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
      <CheckCircle className="w-3.5 h-3.5" />
      Riesgo Bajo {percentage}% — Seguro
    </span>
  );
}


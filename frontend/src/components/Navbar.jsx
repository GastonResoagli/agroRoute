import React from 'react';
import { Navigation, MapPin, ShieldCheck, Database, HelpCircle } from 'lucide-react';

export default function Navbar({ onOpenHelp, dbStatus }) {
  return (
    <header className="bg-emerald-900 text-white shadow-md sticky top-0 z-30 border-b border-emerald-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo y Nombre */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center shadow-inner">
            <Navigation className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-white">AgroRoute</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-700/80 font-semibold text-emerald-200 border border-emerald-600">
                Corrientes MVP
              </span>
            </div>
            <p className="text-xs text-emerald-200/80 hidden sm:block">
              Transitabilidad rural y gestión de caminos agropecuarios
            </p>
          </div>
        </div>

        {/* Indicadores de Estado */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-700 text-emerald-200">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>Zona Litoral [-27.469, -58.830]</span>
          </div>

          <div 
            title="PostgreSQL con Row Level Security (RLS) activo"
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-700 text-emerald-300"
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono">RLS Security</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>

          <button
            onClick={onOpenHelp}
            className="p-1.5 rounded-lg bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 transition-colors"
            title="Ver reglas de negocio y ayuda"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}


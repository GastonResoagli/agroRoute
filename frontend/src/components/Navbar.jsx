import React from 'react';
import { Navigation } from 'lucide-react';

export default function Navbar() {
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
                Corrientes
              </span>
            </div>
            <p className="text-xs text-emerald-200/80 hidden sm:block">
              Transitabilidad rural y estado de caminos
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import ControlPanel from './components/ControlPanel';
import ResultsPanel from './components/ResultsPanel';
import MapView from './components/MapView';
import RulesModal from './components/RulesModal';
import { analyzeRoutes } from './services/api';
import { Sliders, Map, BarChart3, AlertCircle } from 'lucide-react';

export default function App() {
  // Estado de origen y destino centrado en Corrientes
  const [origin, setOrigin] = useState({
    name: 'Corrientes Capital',
    lat: -27.469,
    lon: -58.830
  });

  const [destination, setDestination] = useState({
    name: 'San Luis del Palmar',
    lat: -27.509,
    lon: -58.555
  });

  // Estado del suelo: por defecto 'auto' (captura y clasifica desde Open-Meteo)
  const [soilState, setSoilState] = useState('auto');
  const [soilTelemetry, setSoilTelemetry] = useState(null);
  const [soilSource, setSoilSource] = useState('automatic_open_meteo');

  const [cargoType, setCargoType] = useState('hacienda');
  const [simulatedRain, setSimulatedRain] = useState(null);
  const [currentRainForecast, setCurrentRainForecast] = useState(0);

  // Estados de resultados
  const [routes, setRoutes] = useState([]);
  const [recommendedRouteId, setRecommendedRouteId] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);

  // Estados de UI y control
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [mapClickMode, setMapClickMode] = useState(null);
  const [activeMobileTab, setActiveMobileTab] = useState('map'); // 'controls', 'map', 'results'

  // Función principal de análisis
  const handleAnalyze = async (rainOverride) => {
    setIsLoading(true);
    setError(null);
    setMapClickMode(null);

    const rainToUse = rainOverride !== undefined ? rainOverride : simulatedRain;

    try {
      const data = await analyzeRoutes({
        origin,
        destination,
        soil_state: soilState,
        cargo_type: cargoType,
        simulated_rain_mm: rainToUse
      });

      setRoutes(data.routes || []);
      setRecommendedRouteId(data.recommendedRouteId);
      setAlertMessage(data.alertMessage);

      // Guardar telemetría y clasificación de suelo devuelta por el backend
      if (data.soilTelemetry) {
        setSoilTelemetry(data.soilTelemetry);
      }
      if (data.soilState) {
        // Reflejar el estado real clasificado
        if (soilState === 'auto') {
          setSoilState(data.soilState);
        }
      }
      setSoilSource(data.soilSource || 'automatic_open_meteo');

      // Si no es lluvia simulada, guardar la lluvia real pronosticada
      if (rainToUse === null && data.routes && data.routes[0]) {
        setCurrentRainForecast(data.routes[0].rain24hMm || 0);
      }

      // Enfocar automáticamente la ruta recomendada o la primera
      if (data.recommendedRouteId !== null) {
        setSelectedRouteIndex(data.recommendedRouteId);
      } else if (data.routes && data.routes.length > 0) {
        setSelectedRouteIndex(data.routes[0].routeIndex);
      }

      // En móvil, alternar al mapa tras calcular
      if (window.innerWidth < 1024) {
        setActiveMobileTab('map');
      }
    } catch (err) {
      console.error('Error al analizar rutas:', err);
      setError(err.message || 'Ocurrió un error inesperado al calcular las rutas.');
    } finally {
      setIsLoading(false);
    }
  };

  // Manejador del simulador interactivo de lluvia "¿Qué pasaría si llueve X mm?"
  const handleSimulateRain = (rainMm) => {
    setSimulatedRain(rainMm);
    handleAnalyze(rainMm);
  };

  // Carga inicial automática al montar la aplicación
  useEffect(() => {
    handleAnalyze();
  }, []);

  // Manejador de clics en el mapa
  const handleMapClick = (lat, lon) => {
    if (mapClickMode === 'origin') {
      setOrigin({
        name: `Punto [${lat.toFixed(3)}, ${lon.toFixed(3)}]`,
        lat: Number(lat.toFixed(6)),
        lon: Number(lon.toFixed(6))
      });
      setMapClickMode(null);
    } else if (mapClickMode === 'destination') {
      setDestination({
        name: `Punto [${lat.toFixed(3)}, ${lon.toFixed(3)}]`,
        lat: Number(lat.toFixed(6)),
        lon: Number(lon.toFixed(6))
      });
      setMapClickMode(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 font-sans">
      <Navbar onOpenHelp={() => setIsRulesModalOpen(true)} />

      {/* Barra de pestañas para vista Mobile */}
      <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-around text-xs font-bold sticky top-16 z-20 shadow-sm">
        <button
          onClick={() => setActiveMobileTab('controls')}
          className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg transition-colors ${
            activeMobileTab === 'controls' ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Filtros / Suelo</span>
        </button>

        <button
          onClick={() => setActiveMobileTab('map')}
          className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg transition-colors ${
            activeMobileTab === 'map' ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Map className="w-4 h-4" />
          <span>Mapa Semáforo</span>
        </button>

        <button
          onClick={() => setActiveMobileTab('results')}
          className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg transition-colors ${
            activeMobileTab === 'results' ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Resultados ({routes.length})</span>
        </button>
      </div>

      {/* Mensaje de error general si ocurre */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 w-full">
          <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-xl flex items-center gap-2 text-xs">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Contenedor Principal Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Columna Izquierda: Panel de Control y Resultados (Desktop) */}
        <div className="lg:col-span-5 space-y-5 flex flex-col">
          {/* En Mobile se muestra condicionalmente según la pestaña activa */}
          <div className={`${activeMobileTab === 'controls' ? 'block' : 'hidden'} lg:block`}>
            <ControlPanel
              origin={origin}
              setOrigin={setOrigin}
              destination={destination}
              setDestination={setDestination}
              soilState={soilState}
              setSoilState={setSoilState}
              soilTelemetry={soilTelemetry}
              soilSource={soilSource}
              cargoType={cargoType}
              setCargoType={setCargoType}
              onAnalyze={() => handleAnalyze()}
              isLoading={isLoading}
              mapClickMode={mapClickMode}
              setMapClickMode={setMapClickMode}
            />
          </div>

          <div className={`${activeMobileTab === 'results' ? 'block' : 'hidden'} lg:block flex-1`}>
            <ResultsPanel
              routes={routes}
              recommendedRouteId={recommendedRouteId}
              alertMessage={alertMessage}
              selectedRouteIndex={selectedRouteIndex}
              onSelectRoute={(idx) => {
                setSelectedRouteIndex(idx);
                if (window.innerWidth < 1024) setActiveMobileTab('map');
              }}
              currentRainForecast={currentRainForecast}
              simulatedRain={simulatedRain}
              onSimulateRain={handleSimulateRain}
              detectedSoilState={soilState}
            />
          </div>
        </div>

        {/* Columna Derecha: Mapa Interactivo Leaflet */}
        <div className={`lg:col-span-7 flex flex-col h-[520px] lg:h-[calc(100vh-130px)] sticky top-20 ${
          activeMobileTab === 'map' ? 'block' : 'hidden'
        } lg:block`}>
          <MapView
            origin={origin}
            destination={destination}
            routes={routes}
            selectedRouteIndex={selectedRouteIndex}
            onSelectRoute={(idx) => setSelectedRouteIndex(idx)}
            mapClickMode={mapClickMode}
            onMapClick={handleMapClick}
          />
        </div>
      </main>

      {/* Modal Informativo de Reglas de Negocio */}
      <RulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
      />
    </div>
  );
}

import React, { useEffect } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Polyline, 
  Marker, 
  Popup, 
  Tooltip, 
  useMap, 
  useMapEvents 
} from 'react-leaflet';
import L from 'leaflet';
import { CloudRain, AlertTriangle, ShieldCheck, MapPin, CheckCircle } from 'lucide-react';

// Icono personalizado para Origen (Verde)
const originIcon = L.divIcon({
  className: 'custom-map-icon',
  html: `
    <div style="
      background-color: #10b981; 
      color: white; 
      width: 32px; 
      height: 32px; 
      border-radius: 50%; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      font-weight: bold; 
      font-size: 13px; 
      box-shadow: 0 3px 8px rgba(0,0,0,0.35); 
      border: 2px solid white;
    ">A</div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

// Icono personalizado para Destino (Azul)
const destinationIcon = L.divIcon({
  className: 'custom-map-icon',
  html: `
    <div style="
      background-color: #2563eb; 
      color: white; 
      width: 32px; 
      height: 32px; 
      border-radius: 50%; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      font-weight: bold; 
      font-size: 13px; 
      box-shadow: 0 3px 8px rgba(0,0,0,0.35); 
      border: 2px solid white;
    ">B</div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

// Icono para punto medio de monitoreo climático
const createMidpointIcon = (rainMm, isCritical) => {
  const bgColor = isCritical ? '#dc2626' : rainMm > 15 ? '#ea580c' : '#0284c7';
  return L.divIcon({
    className: 'custom-midpoint-icon',
    html: `
      <div style="
        background-color: ${bgColor}; 
        color: white; 
        padding: 2px 6px; 
        border-radius: 12px; 
        font-weight: 800; 
        font-size: 10px; 
        box-shadow: 0 2px 6px rgba(0,0,0,0.3); 
        border: 1.5px solid white; 
        display: flex; 
        align-items: center; 
        gap: 3px; 
        white-space: nowrap;
      ">
        <span>🌧️</span> ${rainMm} mm
      </div>
    `,
    iconSize: [60, 24],
    iconAnchor: [30, 12]
  });
};

// Componente para ajustar el mapa a los límites de las rutas
function MapBoundsUpdater({ routes, origin, destination }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    if (routes && routes.length > 0) {
      const allCoords = [];
      routes.forEach(r => {
        if (r.geometry && r.geometry.coordinates) {
          r.geometry.coordinates.forEach(([lon, lat]) => {
            allCoords.push([lat, lon]);
          });
        }
      });

      if (allCoords.length > 0) {
        const bounds = L.latLngBounds(allCoords);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      }
    } else if (origin && destination) {
      const bounds = L.latLngBounds([
        [origin.lat, origin.lon],
        [destination.lat, destination.lon]
      ]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
    }
  }, [routes, origin, destination, map]);

  return null;
}

// Escuchador de clics en el mapa para fijar origen o destino
function MapClickHandler({ mapClickMode, onMapClick }) {
  useMapEvents({
    click(e) {
      if (mapClickMode) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    }
  });
  return null;
}

export default function MapView({
  origin,
  destination,
  routes = [],
  selectedRouteIndex,
  onSelectRoute,
  mapClickMode,
  onMapClick
}) {
  // Centro inicial fijado en [-27.469, -58.830] (Corrientes, Argentina)
  const initialCenter = [-27.469, -58.830];
  const initialZoom = 10;

  return (
    <div className="relative w-full h-full min-h-[420px] rounded-xl overflow-hidden shadow-sm border border-slate-200">
      {/* Banner de modo clic si está activo */}
      {mapClickMode && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900/90 text-white text-xs px-4 py-1.5 rounded-full shadow-lg border border-slate-700 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>Haz clic en el mapa para fijar el <strong>{mapClickMode === 'origin' ? 'Punto de Origen (A)' : 'Punto de Destino (B)'}</strong></span>
        </div>
      )}

      <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapBoundsUpdater 
          routes={routes} 
          origin={origin} 
          destination={destination} 
        />

        <MapClickHandler 
          mapClickMode={mapClickMode} 
          onMapClick={onMapClick} 
        />

        {/* Marcador de Origen */}
        {origin && (
          <Marker position={[origin.lat, origin.lon]} icon={originIcon}>
            <Popup>
              <div className="text-xs">
                <strong className="text-emerald-700">Punto A — Origen</strong>
                <div>{origin.name || `${origin.lat.toFixed(4)}, ${origin.lon.toFixed(4)}`}</div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Marcador de Destino */}
        {destination && (
          <Marker position={[destination.lat, destination.lon]} icon={destinationIcon}>
            <Popup>
              <div className="text-xs">
                <strong className="text-blue-700">Punto B — Destino</strong>
                <div>{destination.name || `${destination.lat.toFixed(4)}, ${destination.lon.toFixed(4)}`}</div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Renderizado de Polylines de cada ruta */}
        {routes.map((route) => {
          if (!route.geometry || !route.geometry.coordinates) return null;

          // Convertir GeoJSON [lon, lat] a formato Leaflet [lat, lon]
          const latLngs = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
          const isRecommended = route.isRecommended;
          const isCritical = route.riskPercentage === 100 || !route.isPassable;
          const isHighRisk = route.riskPercentage >= 80;
          const isSelected = selectedRouteIndex === route.routeIndex;

          // Reglas de Estilo Visual (BR-020, BR-021):
          // - Recomendada: Verde y con mayor grosor (weight: 7)
          // - Riesgo Alto: Naranja o Rojo
          // - Crítica: Rojo discontinuo
          let color = '#475569';
          let weight = 4;
          let opacity = 0.75;
          let dashArray = null;

          if (isRecommended) {
            color = '#10b981'; // Verde esmeralda
            weight = 7;
            opacity = 0.95;
          } else if (isCritical) {
            color = '#dc2626'; // Rojo intenso
            weight = 5;
            opacity = 0.85;
            dashArray = '8, 8';
          } else if (isHighRisk) {
            color = '#ea580c'; // Naranja
            weight = 5;
            opacity = 0.85;
          }

          if (isSelected) {
            weight += 2;
          }

          return (
            <React.Fragment key={`poly-${route.routeIndex}`}>
              <Polyline
                positions={latLngs}
                pathOptions={{
                  color,
                  weight,
                  opacity,
                  dashArray
                }}
                eventHandlers={{
                  click: () => onSelectRoute(route.routeIndex)
                }}
              >
                <Tooltip sticky>
                  <div className="text-xs">
                    <strong>{route.name}</strong>
                    <div>Veredicto: {route.verdict} ({route.riskPercentage}%)</div>
                    <div>Lluvia esperada: {route.rain24hMm} mm</div>
                  </div>
                </Tooltip>
              </Polyline>

              {/* Marcador en el Punto Medio Climático (BR-006, BR-037) */}
              {route.midpoint && (
                <Marker
                  position={[route.midpoint.lat, route.midpoint.lon]}
                  icon={createMidpointIcon(route.rain24hMm, isCritical)}
                >
                  <Popup>
                    <div className="text-xs space-y-1">
                      <strong className="text-slate-800">Punto Medio Climático</strong>
                      <div className="text-[11px] text-slate-500">
                        Coord: [{route.midpoint.lat.toFixed(4)}, {route.midpoint.lon.toFixed(4)}]
                      </div>
                      <div className="font-semibold text-blue-700">
                        Precipitación 24h: {route.rain24hMm} mm
                      </div>
                      <div className="text-slate-600">
                        {route.name}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )}
            </React.Fragment>
          );
        })}
      </MapContainer>

      {/* Leyenda Semafórica en el Mapa */}
      <div className="absolute bottom-4 right-4 z-[1000] bg-white/95 backdrop-blur-sm p-2.5 rounded-lg shadow-md border border-slate-200 text-xs space-y-1.5 pointer-events-auto">
        <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
          Referencia de Rutas
        </div>
        <div className="flex items-center gap-2">
          <span className="w-5 h-2 rounded bg-emerald-500 inline-block shadow-sm"></span>
          <span className="text-slate-700 font-medium">Recomendada / Segura</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-5 h-1.5 rounded bg-orange-500 inline-block"></span>
          <span className="text-slate-700">Riesgo Alto (&gt;80%)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-5 h-1.5 border-b-2 border-dashed border-red-600 inline-block"></span>
          <span className="text-slate-700">Intransitable (100%)</span>
        </div>
      </div>
    </div>
  );
}


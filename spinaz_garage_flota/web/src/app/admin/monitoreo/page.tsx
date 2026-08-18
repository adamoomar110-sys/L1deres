'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Navigation, ShieldAlert, ShieldCheck, Search, Activity, History, Map as MapIcon, Settings, X, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import 'leaflet/dist/leaflet.css';

// Fix for Leaflet icons in Next.js (Only import in browser)
let L: any;
if (typeof window !== 'undefined') {
  L = require('leaflet');
}

// Dynamic import for Leaflet (client-side only)
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });
const Circle = dynamic(() => import('react-leaflet').then(mod => mod.Circle), { ssr: false });
const Polyline = dynamic(() => import('react-leaflet').then(mod => mod.Polyline), { ssr: false });

const ROUTE_COLORS = [
  '#3B82F6', // Azul Eléctrico
  '#10B981', // Verde Esmeralda
  '#EC4899', // Rosa Intenso
  '#F59E0B', // Ámbar/Naranja
  '#8B5CF6', // Violeta Neón
  '#06B6D4', // Turquesa/Cian
  '#EF4444', // Rojo Coral
];

// Move hooks to a place where they can be imported correctly
// Note: We'll use these inside components that are only rendered on the client
import { useMap, useMapEvents } from 'react-leaflet';

function MapCenterTracker({ onCenterChange }: { onCenterChange: (c: [number, number]) => void }) {
  useMapEvents({
    moveend: (e: any) => {
      const center = e.target.getCenter();
      onCenterChange([center.lat, center.lng]);
    }
  });
  return null;
}

function MapFlyTo({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 14, { duration: 1.5 });
    }
  }, [center, map]);
  return null;
}



export default function MonitoreoAdmin() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [vehiclePaths, setVehiclePaths] = useState<{ [key: string]: [number, number][] }>({});

  // ADJUSTABLE CORRALITOS
  interface Geofence { id: number; lat: number; lng: number; radius: number; name: string; }
  const [geofences, setGeofences] = useState<Geofence[]>([
    { id: 1, lat: -34.6037, lng: -58.3816, radius: 5000, name: 'Base Principal' }
  ]);
  const [currentMapCenter, setCurrentMapCenter] = useState<[number, number]>([-34.6037, -58.3816]);
  const [flyToCenter, setFlyToCenter] = useState<[number, number] | null>(null);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [geofenceIndex, setGeofenceIndex] = useState(0);


  useEffect(() => {
    setIsMounted(true);
    fetchVehicles();
    const subscription = supabase
      .channel('locations')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'locations' }, fetchVehicles)
      .subscribe();
    return () => { supabase.removeChannel(subscription); };
  }, []);

  const fetchVehicles = async () => {
    const [vehiclesRes, profilesRes] = await Promise.all([
      supabase.from('vehicles').select('*').eq('status', 'active'),
      supabase.from('profiles').select('*').eq('role', 'driver')
    ]);

    if (vehiclesRes.data) {
      const driverMap = new Map();
      if (profilesRes.data) {
        profilesRes.data.forEach((p: any) => {
          if (p.vehicle_id) {
            driverMap.set(p.vehicle_id, p);
          }
        });
      }

      const vehicleData = vehiclesRes.data.map((v: any) => ({
        ...v,
        profiles: driverMap.get(v.id) || null
      }));

      setVehicles(vehicleData);
      
      // Obtener recorridos históricos de la tabla locations para trazar las rutas en el mapa
      const vehicleIds = vehicleData.map((v: any) => v.id);
      if (vehicleIds.length > 0) {
        const { data: locData, error: locError } = await supabase
          .from('locations')
          .select('vehicle_id, lat, lng, timestamp')
          .in('vehicle_id', vehicleIds)
          .order('timestamp', { ascending: true });
          
        if (locData && !locError) {
          const paths: { [key: string]: [number, number][] } = {};
          locData.forEach((loc: any) => {
            if (!paths[loc.vehicle_id]) {
              paths[loc.vehicle_id] = [];
            }
            paths[loc.vehicle_id].push([loc.lat, loc.lng]);
          });
          setVehiclePaths(paths);
        }
      }
    }
    setLoading(false);
  };

  const isOutsideCorralito = (lat: number, lng: number) => {
    if (geofences.length === 0) return false;
    // Si está dentro de AL MENOS UNO, no está fuera.
    return !geofences.some(gf => {
      const dx = (lat - gf.lat) * 111320;
      const dy = (lng - gf.lng) * 111320 * Math.cos(lat * Math.PI / 180);
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance <= gf.radius;
    });
  };

  if (!isMounted) return null; // Evita renderizar en SSR (para Vercel)

  return (
    <div className="flex h-full bg-[#030303] overflow-hidden">
      {/* Sidebar Monitoring */}
      <div className="w-80 border-r border-white/5 bg-black/40 backdrop-blur-xl flex flex-col z-20">
         <div className="p-6 border-b border-white/5">
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
               <Navigation size={20} className="text-yellow-500" /> GPS EN VIVO
            </h2>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">Monitoreo de Corralito</p>
         </div>

         <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {vehicles.map((v, idx) => {
               const isOut = isOutsideCorralito(v.last_lat || -34.6, v.last_lng || -58.4);
               const routeColor = ROUTE_COLORS[idx % ROUTE_COLORS.length];
               return (
                 <button 
                  key={v.id} 
                  onClick={() => setSelectedVehicle(v)}
                  className={`w-full p-4 rounded-2xl border text-left transition-all ${selectedVehicle?.id === v.id ? 'bg-white/5 border-yellow-500/50 shadow-inner' : 'bg-transparent border-white/5 hover:bg-white/5'}`}
                 >
                    <div className="flex justify-between items-start mb-2">
                       <span className="font-black text-sm text-white flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-[0_0_8px_rgba(255,255,255,0.4)]" style={{ backgroundColor: routeColor }} />
                          {v.plate}
                       </span>
                       {isOut ? (
                          <span className="flex items-center gap-1 text-[8px] font-black text-red-500 uppercase tracking-widest bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                             <ShieldAlert size={10} /> Fuera de Rango
                          </span>
                       ) : (
                          <span className="flex items-center gap-1 text-[8px] font-black text-green-500 uppercase tracking-widest bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                             <ShieldCheck size={10} /> En Corralito
                          </span>
                       )}
                    </div>
                    <p className="text-xs text-zinc-500 font-bold uppercase">{v.brand} {v.model}</p>
                    <div className="flex items-center gap-2 mt-3 text-[10px] text-zinc-600 font-medium italic">
                       <Activity size={10} className="text-green-500 animate-pulse" /> Activo ahora
                    </div>
                 </button>
               );
            })}
         </div>

         <div className="p-6 bg-black/60 border-t border-white/5">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">
               <span>Alertas Críticas</span>
               <span className="text-red-500">{vehicles.filter(v => isOutsideCorralito(v.last_lat || -34.6, v.last_lng || -58.4)).length}</span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
               <div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${(vehicles.filter(v => isOutsideCorralito(v.last_lat || -34.6, v.last_lng || -58.4)).length / vehicles.length) * 100}%` }} />
            </div>
         </div>
      </div>

      {/* Map View Area */}
      <div className="flex-1 relative">
         {/* Top Info Bar on Map */}
         <div className="absolute top-6 left-6 right-6 z-[1000] flex justify-between pointer-events-none">
            <div className="flex gap-3 pointer-events-auto">
               <div className="bg-black/80 backdrop-blur-md border border-white/10 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-4">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-ping" />
                  <p className="text-xs font-black uppercase tracking-widest text-white whitespace-nowrap">Servicio de Geofencing Activo</p>
               </div>

               <button 
                 onClick={() => {
                    if (geofences.length > 0) {
                      const nextIdx = (geofenceIndex + 1) % geofences.length;
                      setGeofenceIndex(nextIdx);
                      setFlyToCenter([geofences[nextIdx].lat, geofences[nextIdx].lng]);
                    }
                 }}
                 className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-3 rounded-2xl shadow-[0_0_30px_rgba(234,179,8,0.2)] flex items-center gap-3 transition-all transform hover:scale-105 active:scale-95 group"
                 title="Cambiar Centro"
               >
                 <MapPin size={18} className="animate-bounce" />
                 <span className="text-xs font-black uppercase tracking-widest">Cambiar Centro</span>
               </button>
            </div>
            
            <div className="flex gap-2 pointer-events-auto">
               <button 
                 onClick={() => setIsAdjusting(!isAdjusting)}
                 className={`backdrop-blur-md border border-white/10 p-3 rounded-2xl transition-all shadow-xl ${isAdjusting ? 'bg-yellow-500 text-black' : 'bg-zinc-900/90 text-zinc-400 hover:text-white'}`}
                 title="Ajustar Corralito"
               >
                 <Settings size={20}/>
               </button>
               <button className="bg-zinc-900/90 backdrop-blur-md border border-white/10 p-3 rounded-2xl text-zinc-400 hover:text-white transition-all shadow-xl"><MapIcon size={20}/></button>
               <button className="bg-zinc-900/90 backdrop-blur-md border border-white/10 p-3 rounded-2xl text-zinc-400 hover:text-white transition-all shadow-xl"><History size={20}/></button>
            </div>
         </div>


         {/* ADJUSTMENT PANEL */}
         {isAdjusting && (
           <div className="absolute top-24 right-6 z-[1000] w-80 animate-in fade-in slide-in-from-top-4 duration-300">
             <div className="bg-zinc-900/95 backdrop-blur-2xl border border-white/10 p-6 rounded-[2rem] shadow-3xl">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-black text-white uppercase tracking-widest">Bases / Geofences</h4>
                  <button onClick={() => setIsAdjusting(false)} className="text-zinc-500 hover:text-white"><X size={16} /></button>
                </div>
                
                <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar mb-4">
                   {geofences.length === 0 && (
                     <p className="text-xs text-zinc-500 italic text-center py-4">No hay bases configuradas.</p>
                   )}
                   {geofences.map(gf => (
                      <div key={gf.id} className="bg-black/50 p-4 rounded-2xl border border-white/5 relative">
                         <button 
                           onClick={() => setGeofences(geofences.filter(g => g.id !== gf.id))}
                           className="absolute top-4 right-4 text-zinc-600 hover:text-red-500 transition-colors"
                         >
                           <X size={16} />
                         </button>
                         <input 
                           type="text" 
                           value={gf.name} 
                           onChange={e => setGeofences(geofences.map(g => g.id === gf.id ? {...g, name: e.target.value} : g))}
                           className="bg-transparent border-none text-white font-bold text-sm w-5/6 focus:outline-none mb-2 focus:border-b focus:border-yellow-500/50"
                         />
                         <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase mb-2 mt-2">
                            <span>Radio</span>
                            <span className="text-yellow-500">{(gf.radius / 1000).toFixed(1)} km</span>
                         </div>
                         <input 
                           type="range" 
                           min="500" 
                           max="50000" 
                           step="500" 
                           value={gf.radius} 
                           onChange={(e) => setGeofences(geofences.map(g => g.id === gf.id ? {...g, radius: parseInt(e.target.value)} : g))}
                           className="w-full accent-yellow-500 bg-black/50 rounded-full h-1.5"
                         />
                      </div>
                   ))}
                </div>

                <button 
                  onClick={() => setGeofences([...geofences, { id: Date.now(), lat: currentMapCenter[0], lng: currentMapCenter[1], radius: 3000, name: `Nueva Base ${geofences.length + 1}` }])}
                  className="w-full bg-yellow-500 text-black font-black py-3 rounded-xl shadow-xl shadow-yellow-500/20 hover:bg-yellow-400 transition-all text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                >
                   <Plus size={16} /> AÑADIR NUEVO CENTRO AQUÍ
                </button>
                <p className="text-[9px] text-zinc-600 font-medium leading-relaxed italic text-center mt-4">
                   Centrá la mira en el mapa y apretá el botón para añadir una nueva base operativa.
                </p>
             </div>
           </div>
         )}

         <MapContainer 
           center={[-34.6037, -58.3816]} 
           zoom={13} 
           style={{ height: '100%', width: '100%' }}
         >
            <TileLayer
               url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
               attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            
            <MapCenterTracker onCenterChange={setCurrentMapCenter} />
            {flyToCenter && <MapFlyTo center={flyToCenter} />}
            
            {/* CORRALITO CIRCLES */}
            {geofences.map(gf => (
              <Circle 
                 key={gf.id}
                 center={[gf.lat, gf.lng]}
                 radius={gf.radius}
                 pathOptions={{ 
                    fillColor: 'rgba(234, 179, 8, 0.03)', 
                    color: 'rgba(234, 179, 8, 0.4)', 
                    weight: 2,
                    dashArray: '10, 10' 
                 }}
              />
            ))}

            {/* DIBUJO DE RECORRIDOS (POLYLINES) */}
            {vehicles.map((v, idx) => {
               const path = vehiclePaths[v.id];
               if (!path || path.length < 2) return null;
               return (
                  <Polyline 
                     key={`path-${v.id}`}
                     positions={path}
                     pathOptions={{ 
                        color: ROUTE_COLORS[idx % ROUTE_COLORS.length], 
                        weight: 4, 
                        opacity: 0.85,
                        lineJoin: 'round'
                     }}
                  />
               );
            })}

            {vehicles.map((v, idx) => {
               const routeColor = ROUTE_COLORS[idx % ROUTE_COLORS.length];
               const isOut = isOutsideCorralito(v.last_lat || -34.6, v.last_lng || -58.4);
               return (
                  <Marker 
                    key={v.id} 
                    position={[v.last_lat || -34.6, v.last_lng || -58.4]}
                    icon={L.divIcon({
                       className: 'custom-icon',
                       html: `
                          <div class="relative flex items-center justify-center">
                             <div class="absolute w-10 h-10 rounded-full animate-pulse" style="background-color: ${routeColor}20"></div>
                             <div class="w-6 h-6 rounded-xl flex items-center justify-center border-2 border-white shadow-2xl" style="background-color: ${routeColor}">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-1.1 0-2 .9-2 2v7c0 1.1.9 2 2 2h10c0-1.1.9-2 2-2z"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
                             </div>
                             ${isOut ? '<div class="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white"></div>' : ''}
                          </div>
                       `,
                       iconSize: [24, 24]
                    })}
                  >
                  <Popup className="custom-popup">
                     <div className="bg-zinc-950 p-4 rounded-xl border border-white/10 min-w-[200px]">
                        <h4 className="font-black text-white text-lg mb-1">{v.plate}</h4>
                        <p className="text-xs text-zinc-500 font-bold uppercase mb-3">{v.brand} {v.model}</p>
                        <div className="space-y-2 border-t border-white/5 pt-3">
                           <div className="flex justify-between text-[10px]">
                              <span className="text-zinc-500">Chofer:</span>
                              <span className="text-white font-bold">{v.profiles?.full_name || 'N/A'}</span>
                           </div>
                           <div className="flex justify-between text-[10px]">
                              <span className="text-zinc-500">Ubicación:</span>
                              <span className={isOutsideCorralito(v.last_lat || -34.6, v.last_lng || -58.4) ? 'text-red-500 font-bold' : 'text-green-500 font-bold'}>
                                 {isOutsideCorralito(v.last_lat || -34.6, v.last_lng || -58.4) ? 'FUERA DE RANGO' : 'ZONA SEGURA'}
                              </span>
                           </div>
                        </div>
                     </div>
                  </Popup>
               </Marker>
               );
            })}
         </MapContainer>

         {/* CROSSHAIR FOR ADJUSTING */}
         {isAdjusting && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-[400]">
               <div className="relative flex items-center justify-center">
                  <div className="w-12 h-12 border-2 border-yellow-500/50 rounded-full animate-pulse" />
                  <div className="absolute w-2 h-2 bg-yellow-500 rounded-full shadow-[0_0_10px_rgba(234,179,8,1)]" />
                  <div className="absolute w-16 h-[2px] bg-yellow-500/30" />
                  <div className="absolute h-16 w-[2px] bg-yellow-500/30" />
               </div>
            </div>
         )}

         {/* Vehicle Detail Overlay (Bottom Right) */}
         {selectedVehicle && (
            <div className="absolute bottom-10 right-10 z-[1000] w-96 animate-in slide-in-from-right-10 duration-500">
               <div className="bg-zinc-900/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-3xl">
                  <div className="flex justify-between items-start mb-6">
                     <div>
                        <span className="text-yellow-500 font-black text-[10px] uppercase tracking-widest block mb-1">Unidad Seleccionada</span>
                        <h3 className="text-3xl font-black text-white tracking-tighter leading-none">{selectedVehicle.plate}</h3>
                     </div>
                     <button onClick={() => setSelectedVehicle(null)} className="text-zinc-600 hover:text-white transition-colors">Cerrar</button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-8">
                     <div className="bg-black/50 p-4 rounded-2xl border border-white/5">
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Km Actual</p>
                        <p className="text-xl font-black text-white">42.500</p>
                     </div>
                     <div className="bg-black/50 p-4 rounded-2xl border border-white/5">
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Velocidad</p>
                        <p className="text-xl font-black text-green-500">0 km/h</p>
                     </div>
                  </div>

                  <button className="w-full bg-yellow-500 text-black font-black py-4 rounded-2xl shadow-xl shadow-yellow-500/20 hover:bg-yellow-400 transition-all flex items-center justify-center gap-2">
                     VER RECORRIDO HISTÓRICO <History size={18} />
                  </button>
               </div>
            </div>
         )}
      </div>

      <style jsx global>{`
        .leaflet-container {
           background: #f8fafc !important;
        }
        .custom-popup .leaflet-popup-content-wrapper {
           background: transparent !important;
           padding: 0 !important;
           border: none !important;
           box-shadow: none !important;
        }
        .custom-popup .leaflet-popup-tip {
           background: #09090b !important;
           border: 2px solid rgba(255,255,255,0.1);
           width: 20px !important;
           height: 20px !important;
        }
        .custom-icon {
           background: transparent !important;
           border: none !important;
        }
      `}</style>
    </div>
  );
}

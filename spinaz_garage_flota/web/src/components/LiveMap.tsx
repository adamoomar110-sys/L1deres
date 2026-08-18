'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '@/lib/supabase';

// Leaflet marker fix
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function LiveMap() {
  const [vehicles, setVehicles] = useState<any[]>([]);

  useEffect(() => {
    // 1. Initial fetch of latest locations
    const fetchLocations = async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('timestamp', { ascending: false });
      
      if (data) {
        // Group by vehicle_id and get latest
        const latest = Object.values(
          data.reduce((acc: any, loc: any) => {
            if (!acc[loc.vehicle_id] || new Date(loc.timestamp) > new Date(acc[loc.vehicle_id].timestamp)) {
              acc[loc.vehicle_id] = loc;
            }
            return acc;
          }, {})
        );
        setVehicles(latest);
      }
    };

    fetchLocations();

    // 2. Real-time subscription
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'locations' },
        (payload) => {
          setVehicles((current) => {
            const updated = current.filter(v => v.vehicle_id !== payload.new.vehicle_id);
            return [...updated, payload.new];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="h-full w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
      <MapContainer 
        center={[-34.6037, -58.3816]} // Default: Buenos Aires
        zoom={13} 
        style={{ height: '100%', width: '100%', background: '#1a1a1a' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {vehicles.map((v) => (
          <Marker key={v.id} position={[v.lat, v.lng]} icon={icon}>
            <Popup className="custom-popup">
              <div className="p-2">
                <h3 className="font-bold text-gray-900">Vehículo: {v.vehicle_id}</h3>
                <p className="text-sm text-gray-600">Velocidad: {v.speed?.toFixed(1)} km/h</p>
                <p className="text-xs text-gray-400 mt-1">Última act: {new Date(v.timestamp).toLocaleTimeString()}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

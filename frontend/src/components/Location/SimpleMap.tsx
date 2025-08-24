import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Location {
  id: number;
  name: string;
  type: string;
  coordinates?: { lat: number; lng: number };
  assetCount: number;
}

interface SimpleMapProps {
  locations: Location[];
  height?: string;
}

const LOCATION_COLORS: Record<string, string> = {
  AREA: '#1976d2',
  BUILDING: '#9c27b0',
  FLOOR: '#2196f3',
  ZONE: '#ff9800',
  ROOM: '#4caf50',
};

export default function SimpleMap({ locations, height = '500px' }: SimpleMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    // Only initialize if we have a container and no existing map
    if (!mapContainerRef.current || mapRef.current) return;

    console.log('🗺️ SimpleMap: Initializing map');

    // Filter locations with coordinates
    const mappableLocations = locations.filter(loc => loc.coordinates);
    if (mappableLocations.length === 0) {
      console.log('🗺️ SimpleMap: No mappable locations');
      return;
    }

    // Calculate center
    const lats = mappableLocations.map(loc => loc.coordinates!.lat);
    const lngs = mappableLocations.map(loc => loc.coordinates!.lng);
    const centerLat = lats.reduce((sum, lat) => sum + lat, 0) / lats.length;
    const centerLng = lngs.reduce((sum, lng) => sum + lng, 0) / lngs.length;

    // Create map
    const map = L.map(mapContainerRef.current).setView([centerLat, centerLng], 13);
    mapRef.current = map;

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add markers
    mappableLocations.forEach(location => {
      const color = LOCATION_COLORS[location.type] || '#666';
      const size = Math.max(25, Math.min(40, location.assetCount / 5 + 25));
      
      const icon = L.divIcon({
        html: `
          <div style="
            background-color: ${color};
            border: 3px solid white;
            border-radius: 50%;
            width: ${size}px;
            height: ${size}px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 12px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          ">
            ${location.assetCount}
          </div>
        `,
        className: 'custom-location-marker',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([location.coordinates!.lat, location.coordinates!.lng], { icon })
        .addTo(map)
        .bindPopup(`
          <div>
            <strong>${location.name}</strong><br/>
            Type: ${location.type}<br/>
            Assets: ${location.assetCount}
          </div>
        `);
      
      markersRef.current.push(marker);
    });

    // Force a resize after a short delay
    setTimeout(() => {
      map.invalidateSize();
      console.log('🗺️ SimpleMap: Map resized');
    }, 100);

    // Cleanup function
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersRef.current = [];
      }
    };
  }, [locations]);

  // Handle resize on container changes
  useEffect(() => {
    if (!mapRef.current) return;

    const handleResize = () => {
      mapRef.current?.invalidateSize();
    };

    window.addEventListener('resize', handleResize);
    
    // Also resize when the component might have changed size
    const resizeTimer = setTimeout(handleResize, 500);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  return (
    <div 
      ref={mapContainerRef} 
      style={{ 
        height, 
        width: '100%',
        position: 'relative',
        borderRadius: '8px',
        overflow: 'hidden'
      }}
    />
  );
}
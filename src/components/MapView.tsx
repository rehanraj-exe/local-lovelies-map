import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { mockShops, Shop } from '@/lib/mockData';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapViewProps {
  onShopClick: (shopId: string) => void;
  shops?: Shop[];
}

const MapView = ({ onShopClick, shops = mockShops }: MapViewProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current).setView([28.6139, 77.2090], 14);
    mapInstanceRef.current = map;

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Create custom icons for different shop types
    const createCustomIcon = (color: string, hasOffer: boolean) => {
      const pulseClass = hasOffer ? 'animate-pulse-soft' : '';
      return L.divIcon({
        className: 'custom-marker',
        html: `
          <div class="relative ${pulseClass}">
            <div class="w-10 h-10 rounded-full shadow-medium flex items-center justify-center" 
                 style="background-color: ${color}">
              <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
            ${hasOffer ? `
              <div class="absolute -top-1 -right-1 w-5 h-5 bg-success rounded-full border-2 border-white flex items-center justify-center">
                <span class="text-xs font-bold text-white">%</span>
              </div>
            ` : ''}
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      });
    };

    // Add markers for shops
    shops.forEach((shop) => {
      const color = shop.offer
        ? 'hsl(142, 71%, 45%)' // Green for deals
        : shop.verified
        ? 'hsl(195, 100%, 47%)' // Blue for verified
        : 'hsl(38, 92%, 50%)'; // Yellow for normal

      const marker = L.marker([shop.latitude, shop.longitude], {
        icon: createCustomIcon(color, !!shop.offer),
      }).addTo(map);

      marker.on('click', () => {
        onShopClick(shop.id);
      });

      // Add tooltip
      marker.bindTooltip(shop.name, {
        permanent: false,
        direction: 'top',
        className: 'custom-tooltip',
      });
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [onShopClick, shops]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full rounded-2xl overflow-hidden shadow-medium" />
      
      {/* Map Legend */}
      <div className="absolute bottom-6 left-6 bg-card p-4 rounded-2xl shadow-medium border border-border">
        <h3 className="text-sm font-semibold mb-3">Map Legend</h3>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-success"></div>
            <span>Active Deal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-primary"></div>
            <span>Verified Shop</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-warning"></div>
            <span>New Shop</span>
          </div>
        </div>
      </div>

      {/* Center to Location Button */}
      <button 
        className="absolute bottom-6 right-6 bg-card p-3 rounded-full shadow-medium border border-border hover:bg-accent transition-colors"
        onClick={() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([28.6139, 77.2090], 14);
          }
        }}
      >
        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </div>
  );
};

export default MapView;

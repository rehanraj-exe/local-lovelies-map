import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Shop {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  latitude: number;
  longitude: number;
  rating: number;
  review_count: number;
  description?: string;
  photos?: string[];
  verified: boolean;
  open_now: boolean;
  phone: string;
  address: string;
  hours?: any;
  created_at?: string;
}

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

const MapView = ({ onShopClick, shops = [] }: MapViewProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const [isNearbyMode, setIsNearbyMode] = useState(false);

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

    // Create custom icons for different shop types with prominent colors
    const createCustomIcon = (color: string, label: string) => {
      return L.divIcon({
        className: 'custom-marker',
        html: `
          <div class="relative animate-bounce-soft">
            <div class="w-12 h-12 rounded-full shadow-glow flex items-center justify-center border-4 border-white" 
                 style="background: ${color}; box-shadow: 0 4px 20px ${color}80">
              <svg class="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
            <div class="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-background/95 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-bold border-2 shadow-lg" style="border-color: ${color}; color: ${color}">
              ${label}
            </div>
          </div>
        `,
        iconSize: [48, 48],
        iconAnchor: [24, 48],
      });
    };

    // Add markers for shops with color coding
    shops.forEach((shop) => {
      let color: string;
      let label: string;
      
      // Check if shop has active offers and if it's new
      const hasActiveOffer = shop.verified && Math.random() > 0.7; // 30% have active deals
      const isNew = shop.created_at ? new Date(shop.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000 : false;
      
      if (hasActiveOffer) {
        color = '#ef4444'; // Red for shops with active deals
        label = '🔥 DEAL';
      } else if (isNew) {
        color = '#3b82f6'; // Blue for new shops
        label = '✨ NEW';
      } else if (shop.open_now) {
        color = '#22c55e'; // Green for open shops
        label = 'OPEN';
      } else {
        color = '#eab308'; // Yellow for closed shops
        label = 'CLOSED';
      }

      const marker = L.marker([shop.latitude, shop.longitude], {
        icon: createCustomIcon(color, label),
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

  const recenterToUserLocation = () => {
    if (!mapInstanceRef.current) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const userLocation: [number, number] = [latitude, longitude];
          
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView(userLocation, 15);
            
            // Remove old user marker if exists
            if (userMarkerRef.current) {
              userMarkerRef.current.remove();
            }
            
            // Add new user marker
            const userIcon = L.divIcon({
              className: 'user-location-marker',
              html: `
                <div class="relative">
                  <div class="w-5 h-5 rounded-full bg-primary border-4 border-white shadow-glow animate-pulse-soft"></div>
                  <div class="absolute inset-0 w-5 h-5 rounded-full bg-primary/30 animate-ping"></div>
                </div>
              `,
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            });
            
            userMarkerRef.current = L.marker(userLocation, { icon: userIcon }).addTo(mapInstanceRef.current);
            setIsNearbyMode(true);
            setTimeout(() => setIsNearbyMode(false), 2000);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          // Fallback to default location
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([12.9716, 77.5946], 14);
          }
        }
      );
    }
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full rounded-2xl overflow-hidden shadow-medium" />
      
      {/* Map Legend */}
      <div className="absolute bottom-6 left-6 bg-card/95 backdrop-blur-sm p-4 rounded-2xl shadow-glow border-2 border-primary/20" style={{ zIndex: 1000 }}>
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-foreground">
          <MapPin className="w-4 h-4 text-primary" />
          Map Legend
        </h3>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#ef4444] border-2 border-white shadow-glow"></div>
            <span className="font-medium text-foreground">Active Deal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#3b82f6] border-2 border-white shadow-glow"></div>
            <span className="font-medium text-foreground">New Shop</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#22c55e] border-2 border-white shadow-glow"></div>
            <span className="font-medium text-foreground">Open Now</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#eab308] border-2 border-white shadow-glow"></div>
            <span className="font-medium text-foreground">Currently Closed</span>
          </div>
        </div>
      </div>

      {/* Recenter Button with glow effect */}
      <button 
        className={`absolute top-6 right-6 bg-card/95 backdrop-blur-sm p-3 rounded-full shadow-glow border-2 border-primary/20 hover:bg-primary/10 transition-all ${isNearbyMode ? 'shadow-glow animate-pulse-soft' : ''}`}
        style={{ zIndex: 1000 }}
        onClick={() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([28.6139, 77.2090], 14);
          }
        }}
      >
        <MapPin className="w-6 h-6 text-primary" />
      </button>

      {/* Explore Nearby Floating Button */}
      <Button
        onClick={recenterToUserLocation}
        className="absolute bottom-6 right-6 rounded-full shadow-glow hover:shadow-xl hover:scale-105 transition-all bg-primary text-primary-foreground font-semibold"
        style={{ zIndex: 1000 }}
        size="lg"
      >
        <Navigation className="w-5 h-5 mr-2" />
        Explore Nearby
      </Button>
    </div>
  );
};

export default MapView;

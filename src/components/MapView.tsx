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

    // Add markers for shops with offers check
    shops.forEach((shop) => {
      const hasOffer = false; // Can be extended later to check offers table
      const color = hasOffer
        ? 'hsl(142, 71%, 45%)' // Green for deals
        : shop.verified
        ? 'hsl(195, 100%, 47%)' // Blue for verified
        : 'hsl(38, 92%, 50%)'; // Yellow for normal

      const marker = L.marker([shop.latitude, shop.longitude], {
        icon: createCustomIcon(color, hasOffer),
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
            <div className="w-5 h-5 rounded-full bg-[hsl(142,71%,45%)] border-2 border-white shadow-sm"></div>
            <span className="font-medium text-foreground">Active Deal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[hsl(195,100%,47%)] border-2 border-white shadow-sm"></div>
            <span className="font-medium text-foreground">Verified Shop</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[hsl(38,92%,50%)] border-2 border-white shadow-sm"></div>
            <span className="font-medium text-foreground">New Shop</span>
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

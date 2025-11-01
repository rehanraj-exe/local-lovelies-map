import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Shop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  category: string;
  verified: boolean;
  rating: number;
  offer?: {
    title: string;
    discount_value: string;
  };
  photos?: string[];
}

interface GoogleMapProps {
  shops: Shop[];
  onShopClick: (shopId: string) => void;
  center?: { lat: number; lng: number };
  zoom?: number;
}

const GoogleMap = ({ shops, onShopClick, center, zoom = 14 }: GoogleMapProps) => {
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isNearbyMode, setIsNearbyMode] = useState(false);

  // Initialize Google Maps
  useEffect(() => {
    // Check if Google Maps is already loaded
    if ((window as any).google?.maps) {
      setIsLoaded(true);
      return;
    }

    // Load Google Maps script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      setIsLoaded(true);
    };
    
    script.onerror = () => {
      console.error('Error loading Google Maps');
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup script on unmount
      const scriptElement = document.querySelector(`script[src^="https://maps.googleapis.com/maps/api/js"]`);
      if (scriptElement) {
        document.head.removeChild(scriptElement);
      }
    };
  }, []);

  // Create map and markers
  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current) return;

    const mapCenter = center || { lat: 28.6139, lng: 77.2090 };
    
    const map = new google.maps.Map(mapRef.current, {
      center: mapCenter,
      zoom: zoom,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: true,
    });

    mapInstanceRef.current = map;
    infoWindowRef.current = new google.maps.InfoWindow();

    // Add markers for shops
    shops.forEach((shop) => {
      const markerColor = shop.offer
        ? '#10b981' // Green for deals
        : shop.verified
        ? '#0ea5e9' // Blue for verified
        : '#f59e0b'; // Yellow for normal

      const marker = new google.maps.Marker({
        position: { lat: shop.latitude, lng: shop.longitude },
        map: map,
        title: shop.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: markerColor,
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          scale: 10,
        },
        animation: shop.offer ? google.maps.Animation.BOUNCE : undefined,
      });

      marker.addListener('click', () => {
        const contentString = `
          <div style="padding: 12px; max-width: 300px;">
            ${shop.photos?.[0] ? `
              <img src="${shop.photos[0]}" alt="${shop.name}" 
                   style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px; margin-bottom: 12px;" />
            ` : ''}
            <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #1f2937;">${shop.name}</h3>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <span style="color: #f59e0b;">★</span>
              <span style="color: #6b7280; font-size: 14px;">${shop.rating} • ${shop.category}</span>
            </div>
            ${shop.offer ? `
              <div style="background: #10b981; color: white; padding: 8px 12px; border-radius: 6px; margin-bottom: 12px; font-size: 14px;">
                <strong>${shop.offer.discount_value} OFF</strong> - ${shop.offer.title}
              </div>
            ` : ''}
            <button 
              onclick="window.viewShopDetails('${shop.id}')"
              style="width: 100%; background: #3b82f6; color: white; border: none; padding: 10px; border-radius: 6px; cursor: pointer; font-weight: 500; font-size: 14px;">
              View Details
            </button>
          </div>
        `;

        if (infoWindowRef.current) {
          infoWindowRef.current.setContent(contentString);
          infoWindowRef.current.open(map, marker);
        }
      });

      markersRef.current.push(marker);
    });

    // Global function for view details button
    (window as any).viewShopDetails = (shopId: string) => {
      navigate(`/shop/${shopId}`);
      infoWindowRef.current?.close();
    };

    return () => {
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    };
  }, [isLoaded, shops, onShopClick, center, zoom]);

  // Recenter to user location
  const recenterToUserLocation = () => {
    if (navigator.geolocation && mapInstanceRef.current) {
      setIsNearbyMode(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          mapInstanceRef.current?.setCenter(userLocation);
          mapInstanceRef.current?.setZoom(15);

          // Remove old user marker if exists
          if (userMarkerRef.current) {
            userMarkerRef.current.setMap(null);
          }

          // Add user location marker
          userMarkerRef.current = new google.maps.Marker({
            position: userLocation,
            map: mapInstanceRef.current,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: '#3b82f6',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 3,
              scale: 8,
            },
            title: 'Your Location',
            animation: google.maps.Animation.DROP,
          });

          setTimeout(() => setIsNearbyMode(false), 2000);
        },
        (error) => {
          console.error('Error getting location:', error);
          setIsNearbyMode(false);
        }
      );
    }
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full rounded-2xl overflow-hidden shadow-medium" />
      
      {/* Map Legend */}
      <div className="absolute bottom-6 left-6 bg-card p-4 rounded-2xl shadow-medium border border-border backdrop-blur-sm bg-opacity-95 transition-all hover:shadow-glow">
        <h3 className="text-sm font-semibold mb-3">Map Legend</h3>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-success animate-pulse-soft"></div>
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

      {/* GPS Button */}
      <button 
        className={`absolute bottom-6 right-6 bg-card p-3 rounded-full shadow-medium border border-border hover:bg-accent transition-all hover:scale-110 ${
          isNearbyMode ? 'shadow-glow animate-pulse-soft' : ''
        }`}
        onClick={recenterToUserLocation}
        title="Find shops near me"
      >
        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {/* Explore Nearby Floating Button */}
      <button 
        className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-6 py-3 rounded-full shadow-glow hover:shadow-[0_0_40px_hsl(var(--primary-glow)/_0.5)] transition-all hover:scale-105 font-semibold flex items-center gap-2 animate-float"
        onClick={recenterToUserLocation}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        Explore Nearby
      </button>
    </div>
  );
};

export default GoogleMap;

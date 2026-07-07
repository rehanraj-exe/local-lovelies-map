import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MapView from '@/components/MapView';
import ShopQuickView from '@/components/ShopQuickView';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Map as MapIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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

const MapPage = () => {
  const navigate = useNavigate();
  const [shops, setShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [mapFilter, setMapFilter] = useState<'all' | 'deals' | 'new' | 'open' | 'closed'>('all');

  useEffect(() => {
    const fetchShops = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('verified', true);

      if (error) {
        console.error('Error fetching shops:', error);
      } else {
        setShops(data || []);
      }
      setIsLoading(false);
    };

    fetchShops();
  }, []);

  const selectedShop = selectedShopId
    ? shops.find((shop) => shop.id === selectedShopId)
    : null;

  const filteredShops = shops.filter((shop) => {
    const isNew = new Date(shop.created_at || '').getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000;
    return (
      mapFilter === 'all' ||
      (mapFilter === 'deals' && shop.verified) || // placeholder logic
      (mapFilter === 'new' && isNew) ||
      (mapFilter === 'open' && shop.open_now) ||
      (mapFilter === 'closed' && !shop.open_now)
    );
  });

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border shadow-soft p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <MapIcon className="w-5 h-5 text-primary" />
              Shop Map
            </h1>
          </div>
          
          {/* Map Filter Buttons */}
          <div className="hidden md:flex gap-2">
            <Button
              variant={mapFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMapFilter('all')}
              className="rounded-full"
            >
              All Shops
            </Button>
            <Button
              variant={mapFilter === 'deals' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMapFilter('deals')}
              className="rounded-full"
            >
              🔥 Active Deals
            </Button>
            <Button
              variant={mapFilter === 'open' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMapFilter('open')}
              className="rounded-full"
            >
              Open Now
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile Map Filters */}
      <div className="md:hidden p-4 flex gap-2 overflow-x-auto border-b border-border bg-card">
        <Button
          variant={mapFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMapFilter('all')}
          className="rounded-full whitespace-nowrap"
        >
          All
        </Button>
        <Button
          variant={mapFilter === 'deals' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMapFilter('deals')}
          className="rounded-full whitespace-nowrap"
        >
          🔥 Deals
        </Button>
        <Button
          variant={mapFilter === 'open' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMapFilter('open')}
          className="rounded-full whitespace-nowrap"
        >
          Open Now
        </Button>
      </div>

      {/* Map View */}
      <div className="flex-1 relative h-full w-full">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-muted-foreground">Loading map...</div>
          </div>
        ) : (
          <MapView 
            shops={filteredShops} 
            onShopClick={(shopId) => setSelectedShopId(shopId)}
          />
        )}
      </div>

      {/* Quick View Modal */}
      {selectedShop && (
        <ShopQuickView
          shop={selectedShop}
          onClose={() => setSelectedShopId(null)}
        />
      )}
    </div>
  );
};

export default MapPage;

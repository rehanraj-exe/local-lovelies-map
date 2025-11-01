import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import MapView from '@/components/MapView';
import ShopQuickView from '@/components/ShopQuickView';
import TopLocalPicks from '@/components/TopLocalPicks';
import { AIChatAssistant } from '@/components/AIChatAssistant';
import { DiscountCarousel } from '@/components/DiscountCarousel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, User, Grid, Map, Briefcase, Store, LogOut, Clock, Filter } from 'lucide-react';
import heroImage from '@/assets/hero-town.jpg';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

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

const Index = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [shops, setShops] = useState<Shop[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOpenOnly, setShowOpenOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch shops from database
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

  // Get unique categories from shops
  const categories = ['All', ...Array.from(new Set(shops.map(shop => shop.category)))];

  // Filter shops based on category, search, and open status with memoization
  const filteredShops = useMemo(() => {
    return shops.filter((shop) => {
      const matchesCategory = selectedCategory === 'All' || shop.category === selectedCategory;
      const matchesSearch = searchQuery === '' || 
        shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shop.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shop.subcategory?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesOpenStatus = !showOpenOnly || shop.open_now;
      
      return matchesCategory && matchesSearch && matchesOpenStatus;
    });
  }, [shops, selectedCategory, searchQuery, showOpenOnly]);

  // Count active offers (you can fetch this from offers table later)
  const activeOffers = 0; // Placeholder for now

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      {/* Hero Section */}
      <div className="relative h-64 overflow-hidden">
        <img
          src={heroImage}
          alt="Re:Local Community"
          className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background"></div>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2 drop-shadow-lg">
            Re:Local
          </h1>
          <p className="text-lg md:text-xl text-foreground/90 drop-shadow-md">
            Discover Local. Empower Local.
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border shadow-soft">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search with autocomplete */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search shops, categories, or areas..."
                className="pl-10 rounded-full border-border"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Open Now Filter */}
            <Button
              variant={showOpenOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowOpenOnly(!showOpenOnly)}
              className="rounded-full"
            >
              <Clock className="w-4 h-4 mr-2" />
              Open Now
            </Button>

            {/* View Toggle */}
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'map' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('map')}
                className="rounded-full"
              >
                <Map className="w-4 h-4 mr-2" />
                Map
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-full"
              >
                <Grid className="w-4 h-4 mr-2" />
                List
              </Button>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/jobs')}
                className="rounded-full"
              >
                <Briefcase className="w-4 h-4 mr-2" />
                Jobs
              </Button>
              
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-full">
                      <User className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                      <Store className="w-4 h-4 mr-2" />
                      My Shop
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/register-shop')}>
                      <Store className="w-4 h-4 mr-2" />
                      Register New Shop
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={signOut}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => navigate('/auth')}
                  className="rounded-full"
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Active Offers Banner */}
      {activeOffers > 0 && (
        <div className="bg-success/10 border-y border-success/20 py-3">
          <div className="container mx-auto px-4">
            <p className="text-center text-sm font-medium text-success">
              🔥 {activeOffers} active deals near you - Limited time offers!
            </p>
          </div>
        </div>
      )}

      {/* Category Filter Chips - Only show in List view */}
      {viewMode === 'list' && (
        <div className="container mx-auto px-4 py-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                className="cursor-pointer whitespace-nowrap px-4 py-2 rounded-full hover:shadow-soft transition-all"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-muted-foreground">Loading shops...</div>
          </div>
        ) : viewMode === 'map' ? (
          <div className="space-y-6">
            {/* Discount Carousel */}
            <DiscountCarousel />

            {/* Top Local Picks */}
            <TopLocalPicks />

            {/* Map View */}
            <div className="relative h-[600px] mb-24 rounded-2xl shadow-medium border border-border z-0">
              <MapView 
                shops={filteredShops} 
                onShopClick={(shopId) => navigate(`/shop/${shopId}`)}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredShops.map((shop, index) => (
              <div
                key={shop.id}
                className="bg-card rounded-2xl overflow-hidden shadow-soft hover:shadow-glow transition-all duration-300 cursor-pointer border border-border hover:scale-105 hover:-translate-y-1 animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => navigate(`/shop/${shop.id}`)}
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={shop.photos?.[0] || '/placeholder.svg'}
                    alt={shop.name}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                  />
                  {!shop.open_now && (
                    <Badge variant="destructive" className="absolute top-3 right-3">
                      Closed
                    </Badge>
                  )}
                  {shop.open_now && (
                    <Badge variant="success" className="absolute top-3 right-3 animate-pulse-soft">
                      Open Now
                    </Badge>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg">{shop.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {shop.category}
                    {shop.subcategory && ` • ${shop.subcategory}`}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1">
                      <span className="text-warning">★</span>
                      <span className="font-medium">{shop.rating}</span>
                      <span className="text-xs text-muted-foreground">({shop.review_count})</span>
                    </div>
                    {shop.verified && (
                      <Badge variant="outline" className="text-xs">
                        ✓ Verified
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick View Modal */}
      {selectedShop && (
        <ShopQuickView
          shop={selectedShop}
          onClose={() => setSelectedShopId(null)}
        />
      )}

      {/* AI Chat Assistant */}
      <AIChatAssistant />
    </div>
  );
};

export default Index;

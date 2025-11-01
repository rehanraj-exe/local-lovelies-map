import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MapView from '@/components/MapView';
import ShopQuickView from '@/components/ShopQuickView';
import TopLocalPicks from '@/components/TopLocalPicks';
import { mockShops } from '@/lib/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, User, Grid, Map, Briefcase, Store, LogOut } from 'lucide-react';
import heroImage from '@/assets/hero-town.jpg';
import { useAuth } from '@/hooks/useAuth';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const Index = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const selectedShop = selectedShopId
    ? mockShops.find((shop) => shop.id === selectedShopId)
    : null;

  const categories = ['All', 'Bakery', 'Clothing', 'Grocery', 'Café', 'Bookstore'];

  const activeOffers = mockShops.filter((shop) => shop.offer).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-64 overflow-hidden">
        <img
          src={heroImage}
          alt="Re:Local Community"
          className="w-full h-full object-cover"
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
            {/* Search */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search shops, offers, or jobs..."
                className="pl-10 rounded-full border-border"
              />
            </div>

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
                    <DropdownMenuItem onClick={() => navigate('/register-shop')}>
                      <Store className="w-4 h-4 mr-2" />
                      Register Shop
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

      {/* Category Filter Chips */}
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

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-8">
        {viewMode === 'map' ? (
          <div className="space-y-6">
            {/* Top Local Picks */}
            <TopLocalPicks />

            {/* Map View */}
            <div className="h-[600px] rounded-2xl overflow-hidden shadow-medium border border-border">
              <MapView onShopClick={setSelectedShopId} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockShops.map((shop) => (
              <div
                key={shop.id}
                className="bg-card rounded-2xl overflow-hidden shadow-soft hover:shadow-medium transition-all cursor-pointer border border-border"
                onClick={() => setSelectedShopId(shop.id)}
              >
                <div className="relative h-48">
                  <img
                    src={shop.image}
                    alt={shop.name}
                    className="w-full h-full object-cover"
                  />
                  {shop.offer && (
                    <Badge variant="deal" className="absolute top-3 right-3">
                      {shop.offer.discount} OFF
                    </Badge>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg">{shop.name}</h3>
                  <p className="text-sm text-muted-foreground">{shop.category} • {shop.distance}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1">
                      <span className="text-warning">★</span>
                      <span className="font-medium">{shop.rating}</span>
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
    </div>
  );
};

export default Index;

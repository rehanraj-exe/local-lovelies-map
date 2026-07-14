import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Fuse from 'fuse.js';
import { useQuery } from '@tanstack/react-query';
import MapView from '@/components/MapView';
import ShopQuickView from '@/components/ShopQuickView';
import TopLocalPicks from '@/components/TopLocalPicks';
import { AIChatAssistant } from '@/components/AIChatAssistant';
import { DiscountCarousel } from '@/components/DiscountCarousel';
import Footer from '@/components/Footer';
import { SearchResults } from '@/components/SearchResults';
import { Cart } from '@/components/Cart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, User, Grid, Map, Briefcase, Store, LogOut, Clock, Filter, Package, Wallet, Crown, Sparkles, Check, MapPin, Mic, Loader2, Camera } from 'lucide-react';
import heroImage from '@/assets/hero-town.jpg';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { LanguageSelector } from '@/components/LanguageSelector';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { useImageSearch } from '@/hooks/useImageSearch';
import { useSmartSearch } from '@/hooks/useSmartSearch';
import { toast } from 'sonner';
import { CameraSearch } from '@/components/CameraSearch';
import { VoiceSearch } from '@/components/VoiceSearch';

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

const Index = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>(() => sessionStorage.getItem('index_selectedCategory') || 'All');
  const { data: shops = [], isLoading: isLoadingShops } = useQuery({
    queryKey: ['shops', 'verified'],
    queryFn: async () => {
      const { data, error } = await supabase.from('shops').select('*').eq('verified', true);
      if (error) throw error;
      return data as Shop[];
    }
  });

  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*, shop:shops(id, name)').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const isLoading = isLoadingShops || isLoadingProducts;
  const [searchQuery, setSearchQuery] = useState(() => sessionStorage.getItem('index_searchQuery') || '');
  const [mapFilter, setMapFilter] = useState<'all' | 'deals' | 'new' | 'open' | 'closed'>(() => (sessionStorage.getItem('index_mapFilter') as any) || 'all');

  useEffect(() => {
    sessionStorage.setItem('index_selectedCategory', selectedCategory);
  }, [selectedCategory]);

  useEffect(() => {
    sessionStorage.setItem('index_searchQuery', searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    sessionStorage.setItem('index_mapFilter', mapFilter);
  }, [mapFilter]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLFormElement>(null);

  const { isProcessing: isImageProcessing, searchByImage } = useImageSearch();

  // Smart Search hook
  const {
    isSearching: isAISearching,
    aiMatches,
    setAiMatches,
    isSmartMode,
    setIsSmartMode,
    performSmartSearch,
    clearSmartSearch
  } = useSmartSearch();

  // Automatically reset smart search when search query is cleared
  useEffect(() => {
    if (!searchQuery.trim()) {
      clearSmartSearch();
    }
  }, [searchQuery]);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      if (isSmartMode) {
        await performSmartSearch(searchQuery);
      }
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  // Scroll on category change
  useEffect(() => {
    if (selectedCategory !== 'All') {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [selectedCategory]);

  const toggleSmartSearch = async () => {
    if (isSmartMode) {
      clearSmartSearch();
    } else {
      setIsSmartMode(true);
      if (searchQuery.trim()) {
        await performSmartSearch(searchQuery);
      } else {
        toast.info('Enter a search query', {
          description: 'Type what you are looking for (e.g. "something spicy to eat") and hit the AI search button!'
        });
      }
    }
  };

  const handleVoiceTranscript = (text: string) => {
    setSearchQuery(text);
    setIsSmartMode(false);
  };

  const handleImageSearch = async (imageData: string) => {
    const results = await searchByImage(imageData);
    if (results.matches && results.matches.length > 0) {
      setSearchQuery(results.analysis?.guess || 'Image search results');

      // Update smart search state with the matches from the image LLM call
      setIsSmartMode(true);
      const matchesDict: Record<string, { score: number; reason: string }> = {};
      results.matches.forEach((m: any) => {
        matchesDict[m.id] = { score: m.score, reason: m.reason };
      });
      setAiMatches(matchesDict);
    }
  };



  const selectedShop = selectedShopId
    ? shops.find((shop) => shop.id === selectedShopId)
    : null;

  // Get unique categories from shops
  const categories = ['All', ...Array.from(new Set(shops.map(shop => shop.category)))];

  // Configure fuzzy search for shops
  const shopFuse = useMemo(() => {
    return new Fuse(shops, {
      keys: ['name', 'category', 'subcategory', 'address', 'description'],
      threshold: 0.3,
      includeScore: true,
    });
  }, [shops]);

  // Filter out products that are out of stock or belong to unverified/deleted shops
  const validProducts = useMemo(() => {
    const validShopIds = new Set(shops.map(shop => shop.id));
    return products.filter(product => product.in_stock && validShopIds.has(product.shop_id));
  }, [products, shops]);

  // Configure fuzzy search for products
  const productFuse = useMemo(() => {
    return new Fuse(validProducts, {
      keys: ['name', 'description', 'category'],
      threshold: 0.3,
      includeScore: true,
    });
  }, [validProducts]);

  // Generate dynamic search suggestions
  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim() || isSmartMode) return [];
    
    const shopResults = shopFuse.search(searchQuery).map(result => ({ item: result.item, type: 'shop', score: result.score }));
    const productResults = productFuse.search(searchQuery).map(result => ({ item: result.item, type: 'product', score: result.score }));
    
    // Combine, sort by score, and take top 8
    return [...shopResults, ...productResults]
      .sort((a, b) => (a.score || 0) - (b.score || 0))
      .slice(0, 8);
  }, [searchQuery, shopFuse, productFuse, isSmartMode]);

  // Filter shops based on category, search, and open status with fuzzy matching or AI smart search
  const filteredShops = useMemo(() => {
    let results = shops;

    // Apply search query
    if (searchQuery.trim()) {
      if (isSmartMode) {
        // Filter and sort by AI match score
        results = results
          .filter(shop => shop.id in aiMatches)
          .sort((a, b) => (aiMatches[b.id]?.score || 0) - (aiMatches[a.id]?.score || 0));
      } else {
        // Fallback to standard fuzzy search (only strong matches)
        const fuseResults = shopFuse.search(searchQuery);
        results = fuseResults.filter(r => (r.score || 1) < 0.25).map(result => result.item);
      }
    }

    // Apply other filters
    return results.filter((shop) => {
      const matchesCategory = selectedCategory === 'All' || shop.category === selectedCategory;

      // Apply map filter
      const isNew = new Date(shop.created_at || '').getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000;
      const matchesMapFilter =
        mapFilter === 'all' ||
        (mapFilter === 'deals' && shop.verified) ||
        (mapFilter === 'new' && isNew) ||
        (mapFilter === 'open' && shop.open_now) ||
        (mapFilter === 'closed' && !shop.open_now);

      return matchesCategory && matchesMapFilter;
    });
  }, [shops, shopFuse, selectedCategory, searchQuery, mapFilter, isSmartMode, aiMatches]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim() || isSmartMode) return [];

    // Strategy: Show products from shops that matched the search (primary),
    // supplemented by products whose name/description directly matched (secondary).
    // This ensures searching "food" shows food products, not random fuzzy matches.

    const matchedShopIds = new Set(filteredShops.map(s => s.id));
    const resultIds = new Set<string>();
    const combined: typeof validProducts = [];

    // Primary: all products from shops that matched the search
    for (const product of validProducts) {
      if (matchedShopIds.has(product.shop_id) && !resultIds.has(product.id)) {
        resultIds.add(product.id);
        combined.push(product);
      }
    }

    // Secondary: add direct product name/description matches (not already included)
    const fuseResults = productFuse.search(searchQuery);
    for (const result of fuseResults) {
      if (!resultIds.has(result.item.id)) {
        // Only add if the match score is very strong (< 0.2) to avoid loose matches
        if ((result.score || 1) < 0.2) {
          resultIds.add(result.item.id);
          combined.push(result.item);
        }
      }
    }

    // Apply category filter if one is selected
    if (selectedCategory !== 'All') {
      return combined.filter(product => {
        const shop = shops.find(s => s.id === product.shop_id);
        return shop?.category === selectedCategory;
      });
    }

    return combined;
  }, [productFuse, searchQuery, isSmartMode, selectedCategory, shops, filteredShops, validProducts]);

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
            {/* Search with voice */}
            <form ref={searchContainerRef} onSubmit={handleSearchSubmit} className="relative flex-1 w-full flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder={isSmartMode ? "Describe what you want (e.g. delicious warm coffee)..." : "Search shops, categories, or areas..."}
                  className={`pl-10 pr-4 rounded-full border-border transition-all ${isSmartMode ? 'ring-2 ring-purple-500/50 border-purple-500' : ''}`}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                />
                
                {/* Search Suggestions Dropdown */}
                {showSuggestions && searchSuggestions.length > 0 && !isSmartMode && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50 animate-fade-in">
                    {searchSuggestions.map((suggestion, idx) => {
                      const isShop = suggestion.type === 'shop';
                      const item = suggestion.item;
                      return (
                        <div
                          key={`${suggestion.type}-${item.id}`}
                          className={`px-4 py-3 cursor-pointer hover:bg-muted transition-colors flex items-center gap-3 ${idx !== searchSuggestions.length - 1 ? 'border-b border-border/50' : ''}`}
                          onClick={() => {
                            setSearchQuery(item.name);
                            setShowSuggestions(false);
                            navigate(isShop ? `/shop/${item.id}` : `/shop/${item.shop_id || item.shop?.id}`);
                          }}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isShop ? 'bg-primary/10' : 'bg-blue-500/10'}`}>
                            {isShop ? <Store className="w-4 h-4 text-primary" /> : <Package className="w-4 h-4 text-blue-500" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{item.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {isShop ? `${item.category} • ${item.address}` : `Product • ${(item.shop?.name || 'Unknown Shop')}`}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <Button
                variant={isSmartMode ? "default" : "outline"}
                size="icon"
                type="button"
                onClick={toggleSmartSearch}
                className={`rounded-full transition-all ${isSmartMode
                    ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 hover:from-purple-700 hover:to-pink-700 text-white border-transparent shadow-glow animate-pulse-soft'
                    : ''
                  }`}
                title={isSmartMode ? "Smart AI Search Active (Click to disable)" : "Enable Smart AI Search"}
                disabled={isAISearching}
              >
                {isAISearching ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                type="button"
                onClick={() => setIsCameraOpen(true)}
                disabled={isImageProcessing}
                className={`rounded-full transition-all ${isImageProcessing ? 'opacity-50' : ''}`}
                title="Search by image"
              >
                <Camera className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                type="button"
                onClick={() => setIsVoiceOpen(true)}
                className="rounded-full transition-all"
                title="Voice search"
              >
                <Mic className="w-5 h-5" />
              </Button>
            </form>

            {/* Map Link */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/map')}
              className="hidden md:flex rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-700 hover:bg-blue-100 transition-all"
            >
              <Map className="w-4 h-4 mr-2" />
              View on Map
            </Button>

            {/* Actions */}
            <div className="flex gap-2 items-center">
              <LanguageSelector />
              <Cart />

              <Button
                variant="default"
                size="sm"
                onClick={() => navigate('/premium')}
                className="rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg animate-pulse-soft"
              >
                <Crown className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Go Premium</span>
              </Button>

              {user && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/wallet')}
                  className="hidden md:flex rounded-full"
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  Wallet
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/jobs')}
                className="hidden md:flex rounded-full"
              >
                <Briefcase className="w-4 h-4 mr-2" />
                Jobs
              </Button>

              {user && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/orders')}
                  className="hidden md:flex rounded-full"
                >
                  <Package className="w-4 h-4 mr-2" />
                  Orders
                </Button>
              )}

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="hidden md:flex rounded-full">
                      <User className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate('/premium')}>
                      <Crown className="w-4 h-4 mr-2" />
                      Go Premium
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/wallet')}>
                      <Wallet className="w-4 h-4 mr-2" />
                      Re:Wallet
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/orders')}>
                      <Package className="w-4 h-4 mr-2" />
                      My Orders
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/delivery-addresses')}>
                      <MapPin className="w-4 h-4 mr-2" />
                      Delivery Addresses
                    </DropdownMenuItem>
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
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/auth')}
                  className="hidden md:flex rounded-full"
                >
                  <User className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Shopkeeper Registration CTA */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-y border-primary/20 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <h3 className="text-xl font-bold mb-1 flex items-center justify-center md:justify-start gap-2">
                <Store className="w-5 h-5 text-primary" />
                Own a Local Business?
              </h3>
              <p className="text-sm text-muted-foreground">
                Join Re:Local and reach thousands of local customers. Get verified, post offers & jobs!
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => navigate(user ? '/register-shop' : '/auth')}
              className="rounded-full shadow-glow hover:shadow-medium transition-all"
            >
              <Store className="w-4 h-4 mr-2" />
              {user ? 'Register Your Shop' : 'Sign Up to Register'}
            </Button>
          </div>
        </div>
      </div>

      {/* Premium Banner */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 text-white py-8 animate-fade-in">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left flex-1">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <Crown className="w-6 h-6 animate-pulse" />
                <h3 className="text-2xl font-bold">Upgrade to Premium Today!</h3>
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <p className="text-white/90 text-lg">
                Get exclusive deals, priority support, and ad-free experience starting at just ₹99/month
              </p>
              <div className="flex gap-4 justify-center md:justify-start mt-3 text-sm">
                <span className="flex items-center gap-1">
                  <Check className="w-4 h-4" /> Ad-Free
                </span>
                <span className="flex items-center gap-1">
                  <Check className="w-4 h-4" /> Early Access
                </span>
                <span className="flex items-center gap-1">
                  <Check className="w-4 h-4" /> AI Recommendations
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Button
                size="lg"
                onClick={() => navigate('/premium')}
                className="bg-white text-purple-600 hover:bg-white/90 rounded-full shadow-2xl hover:scale-105 transition-all text-lg px-8 py-6"
              >
                <Crown className="w-5 h-5 mr-2" />
                View Premium Plans
              </Button>
              <p className="text-white/80 text-xs text-center">
                Save up to ₹289 on yearly plans
              </p>
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
              onClick={() => {
                setSelectedCategory(category);
                setSearchQuery('');
              }}
            >
              {category}
            </Badge>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div ref={resultsRef} className="container mx-auto px-4 pb-8">
        {isLoading || isAISearching || isImageProcessing ? (
          <div className="flex items-center justify-center h-96">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <div className="text-muted-foreground font-medium animate-pulse">
                {isImageProcessing ? 'Analyzing image...' : isAISearching ? 'AI is searching...' : 'Loading shops...'}
              </div>
            </div>
          </div>
        ) : searchQuery.trim() ? (
          /* Search Results View */
          <SearchResults shops={filteredShops} products={filteredProducts} searchQuery={searchQuery} />
        ) : (
          <div className="space-y-8">
            {selectedCategory === 'All' && (
              <>
                {/* Discount Carousel */}
                <DiscountCarousel />

                {/* Top Local Picks */}
                <TopLocalPicks category={selectedCategory} searchQuery={searchQuery} />
              </>
            )}

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
                    <div className="flex items-center gap-1 mt-2 text-xs font-medium text-primary">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{shop.hours?.monday?.open || '9:00 AM'} - {shop.hours?.monday?.close || '9:00 PM'}</span>
                    </div>
                    {isSmartMode && aiMatches[shop.id] && (
                      <div className="mt-2.5 px-3 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-700 dark:text-purple-300 flex items-start gap-1.5 animate-fade-in">
                        <Sparkles className="w-3.5 h-3.5 mt-0.5 text-purple-500 flex-shrink-0" />
                        <span>{aiMatches[shop.id].reason}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
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

      {/* Camera Search Modal */}
      <CameraSearch
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onImageCapture={handleImageSearch}
      />

      {/* Voice Search Modal */}
      <VoiceSearch
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onTranscript={handleVoiceTranscript}
      />

      <Footer />
    </div>
  );
};

export default Index;


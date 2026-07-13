import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, MapPin, Clock, Phone, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SearchResultsProps {
  shops: Shop[];
  products?: any[];
  searchQuery: string;
}

export const SearchResults = ({ shops, products = [], searchQuery }: SearchResultsProps) => {
  const navigate = useNavigate();

  const handleAddToCart = async (e: React.MouseEvent, product: any, redirect: boolean = false) => {
    e.stopPropagation(); // Prevent navigating to shop profile
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Logged-in user: save to database
        const { data: existing } = await supabase
          .from('cart_items')
          .select('id, quantity')
          .eq('user_id', user.id)
          .eq('product_id', product.id)
          .single();

        if (existing) {
          await supabase
            .from('cart_items')
            .update({ quantity: existing.quantity + 1 })
            .eq('id', existing.id);
        } else {
          await supabase
            .from('cart_items')
            .insert({
              user_id: user.id,
              product_id: product.id,
              shop_id: product.shop_id,
              quantity: 1
            });
        }
      } else {
        // Guest user: save to localStorage
        const CART_KEY = 'guest_cart';
        const cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
        const existingIndex = cart.findIndex((item: any) => item.product_id === product.id);
        
        if (existingIndex >= 0) {
          cart[existingIndex].quantity += 1;
        } else {
          cart.push({
            product_id: product.id,
            shop_id: product.shop_id,
            quantity: 1,
            product: {
              id: product.id,
              name: product.name,
              price: product.price,
              image_url: product.image_url
            },
            shop: product.shop ? {
              id: product.shop.id,
              name: product.shop.name
            } : null
          });
        }
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
      }
      
      if (redirect) {
        navigate('/checkout');
      } else {
        toast.success('Added to cart!');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart');
    }
  };

  // Group shops by category
  const shopsByCategory = shops.reduce((acc, shop) => {
    if (!acc[shop.category]) {
      acc[shop.category] = [];
    }
    acc[shop.category].push(shop);
    return acc;
  }, {} as Record<string, Shop[]>);

  const totalShopResults = shops.length;
  const totalProductResults = products.length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Search Summary */}
      <div className="border-b border-border pb-4">
        <p className="text-sm text-muted-foreground">
          Found <span className="font-semibold text-foreground">{totalShopResults}</span> shops and <span className="font-semibold text-foreground">{totalProductResults}</span> products for{' '}
          <span className="font-semibold text-foreground">"{searchQuery}"</span>
        </p>
      </div>

      <div className="space-y-12 w-full mt-6">
        {totalShopResults > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">Shops ({totalShopResults})</h2>
          {/* Results by Category */}
          {Object.entries(shopsByCategory).map(([category, categoryShops]) => (
            <div key={category} className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">{category}</h3>
                <Badge variant="secondary" className="text-xs">
                  {categoryShops.length} {categoryShops.length === 1 ? 'shop' : 'shops'}
                </Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categoryShops.map((shop, index) => (
                  <Card
                    key={shop.id}
                    className="overflow-hidden cursor-pointer hover:shadow-glow transition-all duration-300 hover:scale-105 hover:-translate-y-1 animate-slide-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                    onClick={() => navigate(`/shop/${shop.id}`)}
                  >
                    {/* Shop Image */}
                    <div className="relative h-40 overflow-hidden">
                      <img
                        src={shop.photos?.[0] || '/placeholder.svg'}
                        alt={shop.name}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent"></div>
                      
                      {/* Badges */}
                      <div className="absolute top-3 right-3 flex gap-2">
                        {shop.verified && (
                          <Badge variant="default" className="bg-primary/90 backdrop-blur-sm">
                            <Sparkles className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                        {shop.open_now && (
                          <Badge variant="outline" className="bg-success/90 text-white border-success backdrop-blur-sm">
                            <Clock className="w-3 h-3 mr-1" />
                            Open
                          </Badge>
                        )}
                      </div>

                      {/* Shop Name Overlay */}
                      <div className="absolute bottom-3 left-3 right-3">
                        <h4 className="font-bold text-white text-lg drop-shadow-lg">
                          {shop.name}
                        </h4>
                      </div>
                    </div>

                    {/* Shop Details */}
                    <div className="p-4 space-y-3">
                      {/* Rating & Category */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-warning text-warning" />
                          <span className="font-semibold text-sm">{shop.rating}</span>
                          <span className="text-xs text-muted-foreground">
                            ({shop.review_count})
                          </span>
                        </div>
                        {shop.subcategory && (
                          <Badge variant="outline" className="text-xs">
                            {shop.subcategory}
                          </Badge>
                        )}
                      </div>

                      {/* Description */}
                      {shop.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {shop.description}
                        </p>
                      )}

                      {/* Location */}
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground line-clamp-1">{shop.address}</span>
                      </div>

                      {/* Phone */}
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground">{shop.phone}</span>
                      </div>

                      {/* Opening Hours */}
                      <div className="flex items-center gap-2 text-sm font-medium text-primary">
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        <span>{shop.hours?.monday?.open || '9:00 AM'} - {shop.hours?.monday?.close || '9:00 PM'}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}

          {totalShopResults === 0 && (
            <div className="text-center py-12 border rounded-xl border-dashed">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Store className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No shops found</h3>
              <p className="text-muted-foreground">
                Try searching with different keywords
              </p>
            </div>
          )}
          </div>
        )}

        {totalProductResults > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">Products ({totalProductResults})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {products.map((product, index) => (
              <Card 
                key={product.id} 
                className="overflow-hidden group cursor-pointer animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => navigate(`/shop/${product.shop_id}`)}
              >
                <div className="aspect-[4/3] relative overflow-hidden bg-muted">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  {!product.in_stock && (
                    <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center">
                      <Badge variant="destructive" className="text-lg">Out of Stock</Badge>
                    </div>
                  )}
                  {product.shop && (
                    <Badge variant="secondary" className="absolute top-3 right-3 shadow-md bg-background/90 backdrop-blur-sm">
                      {product.shop.name}
                    </Badge>
                  )}
                </div>
                <div className="p-4">
                  <h4 className="font-semibold mb-2">{product.name}</h4>
                  {product.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{product.description}</p>
                  )}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-bold text-primary">₹{product.price}</span>
                    {product.featured && (
                      <Badge variant="default">Featured</Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline"
                      className="w-full text-xs sm:text-sm" 
                      onClick={(e) => handleAddToCart(e, product, false)}
                      disabled={!product.in_stock}
                    >
                      {product.in_stock ? 'Add to Cart' : 'Out of Stock'}
                    </Button>
                    <Button 
                      className="w-full text-xs sm:text-sm" 
                      onClick={(e) => handleAddToCart(e, product, true)}
                      disabled={!product.in_stock}
                    >
                      Buy Now
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {totalProductResults === 0 && (
            <div className="text-center py-12 border rounded-xl border-dashed">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Package className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground">
                Try searching with different keywords
              </p>
            </div>
          )}
          </div>
        )}
      </div>
    </div>
  );
};

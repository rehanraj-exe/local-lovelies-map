import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Clock, Phone, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
}

interface SearchResultsProps {
  shops: Shop[];
  searchQuery: string;
}

export const SearchResults = ({ shops, searchQuery }: SearchResultsProps) => {
  const navigate = useNavigate();

  // Group shops by category
  const shopsByCategory = shops.reduce((acc, shop) => {
    if (!acc[shop.category]) {
      acc[shop.category] = [];
    }
    acc[shop.category].push(shop);
    return acc;
  }, {} as Record<string, Shop[]>);

  const totalResults = shops.length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Search Summary */}
      <div className="border-b border-border pb-4">
        <p className="text-sm text-muted-foreground">
          Found <span className="font-semibold text-foreground">{totalResults}</span> results for{' '}
          <span className="font-semibold text-foreground">"{searchQuery}"</span>
        </p>
      </div>

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
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* No Results */}
      {totalResults === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No results found</h3>
          <p className="text-muted-foreground">
            Try searching with different keywords or browse all shops
          </p>
        </div>
      )}
    </div>
  );
};

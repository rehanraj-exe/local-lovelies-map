import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Star, MapPin, Phone, Clock, Briefcase, X } from 'lucide-react';

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

interface ShopQuickViewProps {
  shop: Shop;
  onClose: () => void;
}

const ShopQuickView = ({ shop, onClose }: ShopQuickViewProps) => {
  const navigate = useNavigate();

  const handleViewProfile = () => {
    navigate(`/shop/${shop.id}`);
  };

  const getOfferTimeRemaining = (expiresAt: Date) => {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d left`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m left`;
    }
    return `${minutes}m left`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm animate-slide-up">
      <div className="w-full max-w-2xl bg-card rounded-t-3xl shadow-glow border-t border-border max-h-[85vh] overflow-y-auto">
        {/* Header with close button */}
        <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border px-6 py-4 flex justify-between items-center z-10">
          <h2 className="text-xl font-semibold">Quick View</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Image */}
          <div className="relative h-48 rounded-2xl overflow-hidden">
            <img
              src={shop.photos?.[0] || '/placeholder.svg'}
              alt={shop.name}
              className="w-full h-full object-cover"
            />
            {shop.verified && (
              <Badge variant="featured" className="absolute top-4 left-4">
                ✓ Verified
              </Badge>
            )}
            {shop.open_now && (
              <Badge variant="success" className="absolute top-4 right-4">
                🟢 Open Now
              </Badge>
            )}
          </div>

          {/* Basic Info */}
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-bold">{shop.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {shop.category}
                  {shop.subcategory && ` • ${shop.subcategory}`}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 fill-warning text-warning" />
                <span className="font-semibold">{shop.rating}</span>
                <span className="text-sm text-muted-foreground">({shop.review_count})</span>
              </div>
            </div>

            <p className="text-foreground/80">{shop.description || 'No description available'}</p>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{shop.address}</span>
              </div>
              <div className="flex items-center gap-1">
                <Phone className="w-4 h-4" />
                <span>{shop.phone}</span>
              </div>
            </div>
          </div>

          {/* Note: Offers and Jobs will be fetched separately in future */}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="gap-2"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.open(`tel:${shop.phone}`);
              }}
            >
              <Phone className="w-4 h-4" />
              Call
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const url = `https://www.google.com/maps/dir/?api=1&destination=${shop.latitude},${shop.longitude}`;
                window.open(url, '_blank', 'noopener,noreferrer');
              }}
            >
              <MapPin className="w-4 h-4" />
              Directions
            </Button>
          </div>

          <Button
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={handleViewProfile}
          >
            View Full Profile
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ShopQuickView;

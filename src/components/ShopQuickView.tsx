import { Shop } from '@/lib/mockData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Star, MapPin, Phone, Clock, Briefcase, X } from 'lucide-react';

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
              src={shop.image}
              alt={shop.name}
              className="w-full h-full object-cover"
            />
            {shop.verified && (
              <Badge variant="featured" className="absolute top-4 left-4">
                ✓ Verified
              </Badge>
            )}
            {shop.offer && (
              <Badge variant="deal" className="absolute top-4 right-4">
                🔥 {shop.offer.discount} OFF
              </Badge>
            )}
          </div>

          {/* Basic Info */}
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-bold">{shop.name}</h3>
                <p className="text-sm text-muted-foreground">{shop.category}</p>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 fill-warning text-warning" />
                <span className="font-semibold">{shop.rating}</span>
                <span className="text-sm text-muted-foreground">({shop.reviewCount})</span>
              </div>
            </div>

            <p className="text-foreground/80">{shop.description}</p>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{shop.distance}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{shop.hours}</span>
              </div>
            </div>
          </div>

          {/* Offer Section */}
          {shop.offer && (
            <div className="bg-success/10 border border-success/20 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-success">🎉 {shop.offer.title}</h4>
                <Badge variant="success" className="text-xs">
                  {getOfferTimeRemaining(shop.offer.expiresAt)}
                </Badge>
              </div>
              <p className="text-sm text-foreground/70">
                Limited time offer - don't miss out!
              </p>
              <Button className="w-full bg-success hover:bg-success/90 text-success-foreground">
                Copy Coupon Code
              </Button>
            </div>
          )}

          {/* Jobs Section */}
          {shop.jobs && shop.jobs.length > 0 && (
            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" />
                <h4 className="font-semibold text-primary">Hiring Now</h4>
              </div>
              {shop.jobs.map((job, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{job.title}</p>
                    <p className="text-xs text-muted-foreground">{job.type} • {job.wage}</p>
                  </div>
                  <Button size="sm" variant="outline">
                    Apply
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => window.open(`tel:${shop.phone}`)}
            >
              <Phone className="w-4 h-4" />
              Call
            </Button>
            <Button
              variant="outline"
              className="gap-2"
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

import { mockShops } from '@/lib/mockData';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TopLocalPicks = () => {
  const navigate = useNavigate();
  
  // Sort by rating and take top 3
  const topShops = [...mockShops]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">✨ Top Local Picks</h2>
        <Badge variant="outline" className="text-xs">
          AI Recommended
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {topShops.map((shop) => (
          <Card
            key={shop.id}
            className="overflow-hidden cursor-pointer hover:shadow-glow transition-all hover:-translate-y-1"
            onClick={() => navigate(`/shop/${shop.id}`)}
          >
            <div className="relative h-40">
              <img
                src={shop.image}
                alt={shop.name}
                className="w-full h-full object-cover"
              />
              {shop.offer && (
                <Badge variant="deal" className="absolute top-2 right-2">
                  {shop.offer.discount} OFF
                </Badge>
              )}
            </div>
            
            <div className="p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{shop.name}</h3>
                  <p className="text-xs text-muted-foreground">{shop.category}</p>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Star className="w-4 h-4 fill-warning text-warning" />
                  <span className="font-medium">{shop.rating}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3" />
                <span>{shop.distance}</span>
              </div>

              {shop.verified && (
                <Badge variant="outline" className="text-xs">
                  ✓ Verified
                </Badge>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TopLocalPicks;

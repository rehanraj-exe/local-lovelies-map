import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TopLocalPicks = () => {
  const navigate = useNavigate();
  const [topShops, setTopShops] = useState<any[]>([]);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-recommendations', {
        body: {
          userLocation: { lat: 28.6139, lng: 77.2090 },
          userPreferences: {}
        }
      });

      if (error) throw error;

      if (data?.recommendations) {
        setTopShops(data.recommendations.slice(0, 3));
      }
      if (data?.aiInsight) {
        setAiInsight(data.aiInsight);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">✨ Top Local Picks</h2>
          <Badge variant="outline" className="text-xs">
            <Sparkles className="w-3 h-3 mr-1" />
            AI Recommended
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">Loading recommendations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">✨ Top Local Picks</h2>
          {aiInsight && (
            <p className="text-sm text-muted-foreground mt-1">{aiInsight}</p>
          )}
        </div>
        <Badge variant="outline" className="text-xs">
          <Sparkles className="w-3 h-3 mr-1" />
          AI Recommended
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {topShops.length === 0 ? (
          <p className="col-span-3 text-center text-muted-foreground py-8">
            No recommendations available at the moment
          </p>
        ) : (
          topShops.map((shop) => (
          <Card
            key={shop.id}
            className="overflow-hidden cursor-pointer hover:shadow-glow transition-all hover:-translate-y-1"
            onClick={() => navigate(`/shop/${shop.id}`)}
          >
            <div className="relative h-40">
              <img
                src={shop.photos?.[0] || '/placeholder.svg'}
                alt={shop.name}
                className="w-full h-full object-cover"
              />
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
                <span>{shop.address}</span>
              </div>

              {shop.verified && (
                <Badge variant="outline" className="text-xs">
                  ✓ Verified
                </Badge>
              )}
            </div>
          </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default TopLocalPicks;

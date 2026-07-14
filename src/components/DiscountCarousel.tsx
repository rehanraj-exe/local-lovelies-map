import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Tag, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Offer {
  id: string;
  title: string;
  description: string;
  discount_value: string;
  end_at: string;
  shop_id: string;
  shops: {
    id: string;
    name: string;
    photos: string[];
    category: string;
  };
}

export const DiscountCarousel = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOffers();
  }, []);

  useEffect(() => {
    if (offers.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % offers.length);
    }, 5000); // auto-move slowly every 5 seconds
    return () => clearInterval(timer);
  }, [offers]);

  const fetchOffers = async () => {
    const { data, error } = await supabase
      .from('offers')
      .select(`
        *,
        shops (
          id,
          name,
          photos,
          category
        )
      `)
      .eq('active', true)
      .gt('end_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(6);

    if (data && !error) {
      setOffers(data);
    }
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % offers.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + offers.length) % offers.length);
  };

  const getTimeRemaining = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days > 1) return `${days} days left`;
    if (days === 1) return '1 day left';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    return `${hours} hours left`;
  };

  if (offers.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Tag className="w-5 h-5 text-primary" />
        <h2 className="text-2xl font-bold">Hot Deals & Discounts</h2>
        <Badge variant="secondary" className="ml-2">Limited Time</Badge>
      </div>

      <div className="relative group">
        <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate(`/shop/${offers[currentIndex].shop_id}`)}>
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/3 h-48 md:h-auto relative overflow-hidden">
              <img
                src={offers[currentIndex].shops.photos[0] || '/placeholder.svg'}
                alt={offers[currentIndex].shops.name}
                className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
              />
              <Badge className="absolute top-3 right-3 bg-red-500 text-white font-bold px-3 py-1">
                {offers[currentIndex].discount_value}
              </Badge>
            </div>
            
            <div className="md:w-2/3 p-6">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <Badge variant="outline" className="mb-2">
                    {offers[currentIndex].shops.category}
                  </Badge>
                  <h3 className="text-2xl font-bold mb-1">
                    {offers[currentIndex].title}
                  </h3>
                  <p className="text-muted-foreground mb-2">
                    at {offers[currentIndex].shops.name}
                  </p>
                </div>
              </div>
              
              <p className="text-foreground mb-4">
                {offers[currentIndex].description}
              </p>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{getTimeRemaining(offers[currentIndex].end_at)}</span>
              </div>
            </div>
          </div>
        </Card>

        {offers.length > 1 && (
          <>
            <Button
              variant="outline"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm"
              onClick={(e) => {
                e.stopPropagation();
                prevSlide();
              }}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm"
              onClick={(e) => {
                e.stopPropagation();
                nextSlide();
              }}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>

            <div className="flex justify-center gap-2 mt-4">
              {offers.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex
                      ? 'bg-primary w-8'
                      : 'bg-muted-foreground/30'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

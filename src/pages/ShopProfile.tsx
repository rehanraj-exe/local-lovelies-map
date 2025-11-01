import { useParams, useNavigate } from 'react-router-dom';
import { mockShops } from '@/lib/mockData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Star, MapPin, Phone, Clock, Share2, Heart, Briefcase } from 'lucide-react';

const ShopProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const shop = mockShops.find((s) => s.id === id);

  if (!shop) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Shop not found</h2>
          <Button onClick={() => navigate('/')}>Go Back Home</Button>
        </div>
      </div>
    );
  }

  const getOfferTimeRemaining = (expiresAt: Date) => {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `Ends in ${days} days`;
    }
    if (hours > 0) {
      return `Ends in ${hours}h ${minutes}m`;
    }
    return `Ends in ${minutes} minutes`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Image */}
      <div className="relative h-80 overflow-hidden">
        <img
          src={shop.image}
          alt={shop.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent"></div>
        
        {/* Back Button */}
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-6 left-6 rounded-full shadow-medium"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        {/* Action Buttons */}
        <div className="absolute top-6 right-6 flex gap-2">
          <Button variant="secondary" size="icon" className="rounded-full shadow-medium">
            <Share2 className="w-5 h-5" />
          </Button>
          <Button variant="secondary" size="icon" className="rounded-full shadow-medium">
            <Heart className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 -mt-20 relative z-10 pb-8">
        <Card className="p-6 shadow-glow border-border">
          {/* Header Info */}
          <div className="space-y-4 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{shop.name}</h1>
                  {shop.verified && (
                    <Badge variant="featured">✓ Verified</Badge>
                  )}
                </div>
                <p className="text-muted-foreground">{shop.category}</p>
              </div>
              
              <div className="flex items-center gap-2 bg-warning/10 px-4 py-2 rounded-full">
                <Star className="w-5 h-5 fill-warning text-warning" />
                <span className="font-bold text-lg">{shop.rating}</span>
                <span className="text-sm text-muted-foreground">({shop.reviewCount})</span>
              </div>
            </div>

            <p className="text-foreground/80">{shop.description}</p>

            {/* Quick Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-full">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Distance</p>
                  <p className="font-semibold">{shop.distance}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hours</p>
                  <p className="font-semibold">{shop.hours}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contact</p>
                  <p className="font-semibold text-sm">{shop.phone}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
              <Button className="bg-primary hover:bg-primary/90">
                <Phone className="w-4 h-4 mr-2" />
                Call
              </Button>
              <Button variant="outline">
                <MapPin className="w-4 h-4 mr-2" />
                Directions
              </Button>
              <Button variant="outline">Order</Button>
              <Button variant="outline">Share</Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="offers" className="mt-6">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
              <TabsTrigger value="offers" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                Offers
              </TabsTrigger>
              <TabsTrigger value="jobs" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                Jobs
              </TabsTrigger>
              <TabsTrigger value="about" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                About
              </TabsTrigger>
              <TabsTrigger value="reviews" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                Reviews
              </TabsTrigger>
            </TabsList>

            <TabsContent value="offers" className="mt-6 space-y-4">
              {shop.offer ? (
                <Card className="p-6 bg-success/10 border-success/20">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-success mb-2">
                          🎉 {shop.offer.title}
                        </h3>
                        <p className="text-foreground/70">
                          Get {shop.offer.discount} discount on select items!
                        </p>
                      </div>
                      <Badge variant="success">
                        {getOfferTimeRemaining(shop.offer.expiresAt)}
                      </Badge>
                    </div>
                    
                    <div className="bg-card p-4 rounded-xl border border-border">
                      <p className="text-xs text-muted-foreground mb-2">COUPON CODE</p>
                      <div className="flex items-center justify-between">
                        <code className="text-lg font-mono font-bold">SAVE{shop.offer.discount}</code>
                        <Button size="sm" className="bg-success hover:bg-success/90">
                          Copy Code
                        </Button>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      * Terms and conditions apply. Valid for in-store purchases only.
                    </p>
                  </div>
                </Card>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No active offers at the moment</p>
                  <p className="text-sm text-muted-foreground mt-2">Check back soon for great deals!</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="jobs" className="mt-6 space-y-4">
              {shop.jobs && shop.jobs.length > 0 ? (
                shop.jobs.map((job, index) => (
                  <Card key={index} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex gap-4">
                        <div className="p-3 bg-primary/10 rounded-full">
                          <Briefcase className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg mb-1">{job.title}</h3>
                          <div className="flex gap-3 text-sm text-muted-foreground">
                            <span>{job.type}</span>
                            <span>•</span>
                            <span className="font-semibold text-primary">{job.wage}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-sm text-foreground/70 mb-4">
                      Join our team! We're looking for enthusiastic individuals to help grow our business.
                    </p>

                    <Button className="w-full bg-primary hover:bg-primary/90">
                      Apply Now
                    </Button>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No job openings at the moment</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="about" className="mt-6">
              <Card className="p-6">
                <h3 className="font-bold text-lg mb-4">About {shop.name}</h3>
                <p className="text-foreground/80 mb-6">{shop.description}</p>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Categories</h4>
                    <div className="flex flex-wrap gap-2">
                      {shop.tags.map((tag) => (
                        <Badge key={tag} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Opening Hours</h4>
                    <p className="text-foreground/70">{shop.hours}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Contact</h4>
                    <p className="text-foreground/70">{shop.phone}</p>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="reviews" className="mt-6">
              <Card className="p-6">
                <div className="text-center py-12">
                  <div className="mb-4">
                    <div className="text-4xl font-bold mb-2">{shop.rating}</div>
                    <div className="flex items-center justify-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-5 h-5 ${
                            star <= Math.floor(shop.rating)
                              ? 'fill-warning text-warning'
                              : 'text-muted-foreground'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">{shop.reviewCount} reviews</p>
                  </div>
                  <p className="text-muted-foreground">Reviews feature coming soon!</p>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default ShopProfile;

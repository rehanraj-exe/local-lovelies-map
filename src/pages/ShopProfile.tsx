import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { ArrowLeft, Star, MapPin, Phone, Clock, Share2, Heart, Briefcase, Navigation, X, ShoppingCart } from 'lucide-react';

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

interface Product {
  id: string;
  shop_id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  featured: boolean;
  in_stock: boolean;
}

interface Offer {
  id: string;
  shop_id: string;
  title: string;
  description?: string;
  discount_type: string;
  discount_value: string;
  start_at: string;
  end_at: string;
  active: boolean;
}

interface Review {
  id: string;
  shop_id: string;
  user_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  profiles?: {
    full_name?: string;
  };
}

const ShopProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDirections, setShowDirections] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [shopOwnerPlan, setShopOwnerPlan] = useState<string>('free');

  useEffect(() => {
    const fetchShopData = async () => {
      if (!id) return;

      setIsLoading(true);
      
      try {
        // Fetch all data in parallel for better performance
        const [
          { data: shopData, error: shopError },
          { data: productsData },
          { data: offersData },
          { data: reviewsData }
        ] = await Promise.all([
          // Fetch shop
          supabase
            .from('shops')
            .select('*')
            .eq('id', id)
            .maybeSingle(),
          
          // Fetch products
          supabase
            .from('products')
            .select('*')
            .eq('shop_id', id)
            .eq('in_stock', true)
            .limit(6),
          
          // Fetch active offers
          supabase
            .from('offers')
            .select('*')
            .eq('shop_id', id)
            .eq('active', true)
            .gt('end_at', new Date().toISOString()),
          
          // Fetch reviews with profiles in one query (optimized)
          supabase
            .from('reviews')
            .select('*, profiles(full_name)')
            .eq('shop_id', id)
            .order('created_at', { ascending: false })
        ]);

        if (shopError || !shopData) {
          console.error('Error fetching shop:', shopError);
          toast.error('Shop not found');
          navigate('/');
          return;
        }

        setShop(shopData);
        if (productsData) setProducts(productsData);
        if (offersData) setOffers(offersData);
        if (reviewsData) setReviews(reviewsData as Review[]);

        // Track shop view for analytics
        await supabase.rpc('track_shop_view', { shop_uuid: id });

        // Check shop owner's premium status
        if (shopData.owner_id) {
          const { data: subData } = await supabase
            .from('subscriptions')
            .select('plan')
            .eq('user_id', shopData.owner_id)
            .eq('status', 'active')
            .gt('expires_at', new Date().toISOString())
            .maybeSingle();

          if (subData) {
            setShopOwnerPlan(subData.plan);
          }
        }
      } catch (error) {
        console.error('Error fetching shop data:', error);
        toast.error('Failed to load shop data');
      }

      setIsLoading(false);
    };

    fetchShopData();
  }, [id, navigate]);

  const handleSubmitReview = async () => {
    if (!user) {
      toast.error('Please login to leave a review');
      navigate('/auth');
      return;
    }

    if (!id) return;

    const { error } = await supabase
      .from('reviews')
      .insert([
        {
          shop_id: id,
          user_id: user.id,
          rating: newReview.rating,
          comment: newReview.comment,
        },
      ]);

    if (error) {
      toast.error('Failed to submit review');
      return;
    }

    toast.success('Review submitted successfully!');
    setReviewDialogOpen(false);
    setNewReview({ rating: 5, comment: '' });
    
    // Refresh reviews
    const { data: reviewsData } = await supabase
      .from('reviews')
      .select('*')
      .eq('shop_id', id)
      .order('created_at', { ascending: false });

    if (reviewsData) {
      const reviewsWithProfiles = await Promise.all(
        reviewsData.map(async (review) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', review.user_id)
            .single();
          
          return { ...review, profiles: profileData };
        })
      );
      setReviews(reviewsWithProfiles as Review[]);
    }
  };

  const openDirections = () => {
    if (shop) {
      // Track click for analytics
      supabase.rpc('track_shop_click', { shop_uuid: shop.id });
      
      const url = `https://www.google.com/maps/dir/?api=1&destination=${shop.latitude},${shop.longitude}`;
      window.open(url, '_blank');
    }
  };

  const handleCallClick = () => {
    if (shop) {
      // Track click for analytics
      supabase.rpc('track_shop_click', { shop_uuid: shop.id });
      
      window.location.href = `tel:${shop.phone}`;
    }
  };

  const handleShare = async () => {
    if (!shop) return;

    const shareUrl = window.location.href;
    const shareTitle = shop.name;
    const shareText = `Check out ${shop.name} - ${shop.description || shop.category}`;

    // Track share action for analytics
    supabase.rpc('track_shop_click', { shop_uuid: shop.id });

    // Check if Web Share API is available (mobile browsers)
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        toast.success('Shared successfully!');
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          // Fallback to clipboard if share was not cancelled
          copyToClipboard(shareUrl);
        }
      }
    } else {
      // Fallback for desktop: copy to clipboard
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast.success('Link copied to clipboard!');
      },
      () => {
        toast.error('Failed to copy link');
      }
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading shop details...</p>
        </div>
      </div>
    );
  }

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

  const getOfferTimeRemaining = (endAt: string) => {
    const now = new Date();
    const end = new Date(endAt);
    const diff = end.getTime() - now.getTime();
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
    <div className="min-h-screen bg-background animate-fade-in">
      {/* Hero Image */}
      <div className="relative h-80 overflow-hidden">
        <img
          src={shop.photos?.[0] || '/placeholder.svg'}
          alt={shop.name}
          className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent"></div>
        
        {/* Back Button */}
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-6 left-6 rounded-full shadow-medium hover:shadow-glow transition-all hover:scale-110"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        {/* Action Buttons */}
        <div className="absolute top-6 right-6 flex gap-2">
          <Button 
            variant="secondary" 
            size="icon" 
            className="rounded-full shadow-medium hover:shadow-glow transition-all hover:scale-110"
            onClick={handleShare}
          >
            <Share2 className="w-5 h-5" />
          </Button>
          <Button variant="secondary" size="icon" className="rounded-full shadow-medium hover:shadow-glow transition-all hover:scale-110">
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
                  {shopOwnerPlan === 'shop_premium' && (
                    <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
                      ✨ Premium
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground">{shop.category}</p>
              </div>
              
              <div className="flex items-center gap-2 bg-warning/10 px-4 py-2 rounded-full">
                <Star className="w-5 h-5 fill-warning text-warning" />
                <span className="font-bold text-lg">{shop.rating}</span>
                <span className="text-sm text-muted-foreground">({shop.review_count})</span>
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
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-semibold text-sm">{shop.address}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-semibold">{shop.open_now ? 'Open Now' : 'Closed'}</p>
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
              <Button className="bg-primary hover:bg-primary/90" onClick={handleCallClick}>
                <Phone className="w-4 h-4 mr-2" />
                Call
              </Button>
              <Button variant="outline" onClick={openDirections}>
                <MapPin className="w-4 h-4 mr-2" />
                Directions
              </Button>
              <Button variant="outline" onClick={() => navigate('/checkout')}>
                <ShoppingCart className="w-4 h-4 mr-2" />
                Cart
              </Button>
              <Button variant="outline" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
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
              {offers.length > 0 ? (
                offers.map((offer) => (
                  <Card key={offer.id} className="p-6 bg-success/10 border-success/20 animate-slide-up hover:shadow-glow transition-all">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-success mb-2">
                            🎉 {offer.title}
                          </h3>
                          <p className="text-foreground/70">
                            {offer.description || `Get ${offer.discount_value} discount!`}
                          </p>
                        </div>
                        <Badge variant="success">
                          {getOfferTimeRemaining(offer.end_at)}
                        </Badge>
                      </div>
                      
                      <div className="bg-card p-4 rounded-xl border border-border">
                        <p className="text-xs text-muted-foreground mb-2">DISCOUNT</p>
                        <div className="flex items-center justify-between">
                          <code className="text-lg font-mono font-bold">{offer.discount_value}</code>
                          <Button size="sm" className="bg-success hover:bg-success/90">
                            Claim Offer
                          </Button>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        * Terms and conditions apply. Valid for in-store purchases only.
                      </p>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No active offers at the moment</p>
                  <p className="text-sm text-muted-foreground mt-2">Check back soon for great deals!</p>
                </div>
              )}

              {/* Products Section */}
              {products.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-xl font-bold mb-4">Popular Products</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map((product, index) => (
                      <Card key={product.id} className="overflow-hidden hover:shadow-glow transition-all animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                        {product.image_url && (
                          <div className="relative h-40 overflow-hidden">
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                            />
                          </div>
                        )}
                        <div className="p-4">
                          <h4 className="font-semibold mb-2">{product.name}</h4>
                          {product.description && (
                            <p className="text-sm text-muted-foreground mb-3">{product.description}</p>
                          )}
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-lg font-bold text-primary">₹{product.price}</span>
                            {product.featured && (
                              <Badge variant="default">Featured</Badge>
                            )}
                          </div>
                          <Button 
                            className="w-full" 
                            onClick={async () => {
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
                                        shop_id: shop.id,
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
                                      shop_id: shop.id,
                                      quantity: 1,
                                      product: {
                                        id: product.id,
                                        name: product.name,
                                        price: product.price,
                                        image_url: product.image_url
                                      },
                                      shop: {
                                        id: shop.id,
                                        name: shop.name
                                      }
                                    });
                                  }
                                  localStorage.setItem(CART_KEY, JSON.stringify(cart));
                                }
                                
                                toast.success('Added to cart!');
                              } catch (error) {
                                console.error('Error adding to cart:', error);
                                toast.error('Failed to add to cart');
                              }
                            }}
                            disabled={!product.in_stock}
                          >
                            {product.in_stock ? 'Add to Cart' : 'Out of Stock'}
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="jobs" className="mt-6 space-y-4">
              <div className="text-center py-12">
                <p className="text-muted-foreground">Job listings feature coming soon!</p>
                <p className="text-sm text-muted-foreground mt-2">Check the Jobs page for current openings</p>
                <Button 
                  className="mt-4" 
                  onClick={() => navigate('/jobs')}
                >
                  View All Jobs
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="about" className="mt-6">
              <Card className="p-6 animate-slide-up">
                <h3 className="font-bold text-lg mb-4">About {shop.name}</h3>
                <p className="text-foreground/80 mb-6">{shop.description}</p>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Category</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="default">{shop.category}</Badge>
                      {shop.subcategory && (
                        <Badge variant="outline">{shop.subcategory}</Badge>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Status</h4>
                    <Badge variant={shop.open_now ? 'success' : 'destructive'}>
                      {shop.open_now ? 'Currently Open' : 'Currently Closed'}
                    </Badge>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Contact</h4>
                    <p className="text-foreground/70">{shop.phone}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Address</h4>
                    <p className="text-foreground/70">{shop.address}</p>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="reviews" className="mt-6">
              <Card className="p-6 animate-slide-up">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-4 mb-2">
                      <div className="text-4xl font-bold">{shop.rating}</div>
                      <div>
                        <div className="flex items-center gap-1 mb-1">
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
                        <p className="text-sm text-muted-foreground">{reviews.length} reviews</p>
                      </div>
                    </div>
                  </div>
                  
                  <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>Write a Review</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Write a Review for {shop.name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Rating</label>
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => setNewReview({ ...newReview, rating: star })}
                                className="transition-transform hover:scale-110"
                              >
                                <Star
                                  className={`w-8 h-8 ${
                                    star <= newReview.rating
                                      ? 'fill-warning text-warning'
                                      : 'text-muted-foreground'
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Your Review</label>
                          <Textarea
                            value={newReview.comment}
                            onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                            placeholder="Share your experience..."
                            rows={4}
                          />
                        </div>
                        <Button onClick={handleSubmitReview} className="w-full">
                          Submit Review
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {reviews.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <Card key={review.id} className="p-4">
                        <div className="flex items-start gap-3">
                          <Avatar>
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {review.profiles?.full_name?.[0]?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="font-semibold">{review.profiles?.full_name || 'Anonymous'}</p>
                                <div className="flex items-center gap-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`w-4 h-4 ${
                                        star <= review.rating
                                          ? 'fill-warning text-warning'
                                          : 'text-muted-foreground'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {new Date(review.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            {review.comment && (
                              <p className="text-sm text-muted-foreground">{review.comment}</p>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default ShopProfile;

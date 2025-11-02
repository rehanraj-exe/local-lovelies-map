import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Edit, Trash, Store, Tag, Clock, Package, Eye, MousePointer, TrendingUp } from 'lucide-react';

const ShopDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [shop, setShop] = useState<any>(null);
  const [offers, setOffers] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<any>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchShopData();
  }, [user]);

  const fetchShopData = async () => {
    if (!user) return;

    setLoading(true);
    const { data: shopData, error: shopError } = await supabase
      .from('shops')
      .select('*')
      .eq('owner_id', user.id)
      .single();

    if (shopError) {
      if (shopError.code === 'PGRST116') {
        toast.error('No shop found. Please register your shop first.');
        navigate('/register-shop');
      }
      setLoading(false);
      return;
    }

    setShop(shopData);

    const { data: offersData } = await supabase
      .from('offers')
      .select('*')
      .eq('shop_id', shopData.id)
      .order('created_at', { ascending: false });

    const { data: jobsData } = await supabase
      .from('jobs')
      .select('*')
      .eq('shop_id', shopData.id)
      .order('created_at', { ascending: false });

    const { data: productsData } = await supabase
      .from('products')
      .select('*')
      .eq('shop_id', shopData.id)
      .order('created_at', { ascending: false });

    // Fetch analytics for last 7 days
    const { data: analyticsData } = await supabase
      .from('shop_analytics')
      .select('*')
      .eq('shop_id', shopData.id)
      .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('date', { ascending: false });

    // Calculate total analytics
    const totalViews = analyticsData?.reduce((sum, day) => sum + day.views, 0) || 0;
    const totalClicks = analyticsData?.reduce((sum, day) => sum + day.clicks, 0) || 0;
    const totalRedemptions = analyticsData?.reduce((sum, day) => sum + day.offer_redemptions, 0) || 0;

    setOffers(offersData || []);
    setJobs(jobsData || []);
    setProducts(productsData || []);
    setAnalytics({ totalViews, totalClicks, totalRedemptions, daily: analyticsData || [] });
    setLoading(false);
  };

  const handleSaveShop = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const { error } = await supabase
      .from('shops')
      .update({
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        phone: formData.get('phone') as string,
        address: formData.get('address') as string,
        hours: formData.get('hours') as string,
      })
      .eq('id', shop.id);

    if (error) {
      toast.error('Failed to update shop');
      return;
    }

    toast.success('Shop updated successfully!');
    fetchShopData();
  };

  const handleSaveOffer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const offerData = {
      shop_id: shop.id,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      discount_type: formData.get('discount_type') as string,
      discount_value: formData.get('discount_value') as string,
      start_at: new Date(formData.get('start_at') as string).toISOString(),
      end_at: new Date(formData.get('end_at') as string).toISOString(),
      terms: formData.get('terms') as string,
      active: true,
    };

    if (editingOffer) {
      const { error } = await supabase
        .from('offers')
        .update(offerData)
        .eq('id', editingOffer.id);

      if (error) {
        toast.error('Failed to update offer');
        return;
      }
      toast.success('Offer updated!');
    } else {
      const { error } = await supabase
        .from('offers')
        .insert([offerData]);

      if (error) {
        toast.error('Failed to create offer');
        return;
      }
      toast.success('Offer created!');
    }

    setOfferDialogOpen(false);
    setEditingOffer(null);
    fetchShopData();
  };

  const handleDeleteOffer = async (offerId: string) => {
    const { error } = await supabase
      .from('offers')
      .delete()
      .eq('id', offerId);

    if (error) {
      toast.error('Failed to delete offer');
      return;
    }

    toast.success('Offer deleted');
    fetchShopData();
  };

  const handleSaveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const productData = {
      shop_id: shop.id,
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      price: parseFloat(formData.get('price') as string),
      image_url: formData.get('image_url') as string,
      in_stock: true,
      featured: false,
    };

    if (editingProduct) {
      const { error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', editingProduct.id);

      if (error) {
        toast.error('Failed to update product');
        return;
      }
      toast.success('Product updated!');
    } else {
      const { error } = await supabase
        .from('products')
        .insert([productData]);

      if (error) {
        toast.error('Failed to create product');
        return;
      }
      toast.success('Product created!');
    }

    setProductDialogOpen(false);
    setEditingProduct(null);
    fetchShopData();
  };

  const handleDeleteProduct = async (productId: string) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) {
      toast.error('Failed to delete product');
      return;
    }

    toast.success('Product deleted');
    fetchShopData();
  };

  const handleToggleStock = async (productId: string, currentStock: boolean) => {
    const { error } = await supabase
      .from('products')
      .update({ in_stock: !currentStock })
      .eq('id', productId);

    if (error) {
      toast.error('Failed to update stock status');
      return;
    }

    toast.success(currentStock ? 'Product marked out of stock' : 'Product marked in stock');
    fetchShopData();
  };

  const getTimeRemaining = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h remaining`;
    return 'Expired';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!shop) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/')}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold">Shop Dashboard</h1>
              <p className="text-muted-foreground">Manage your shop and offers</p>
            </div>
          </div>

          {/* Analytics Dashboard */}
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Eye className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Total Views</h3>
                </div>
                <p className="text-3xl font-bold">{analytics.totalViews}</p>
                <p className="text-sm text-muted-foreground mt-1">Last 7 days</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <MousePointer className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Profile Clicks</h3>
                </div>
                <p className="text-3xl font-bold">{analytics.totalClicks}</p>
                <p className="text-sm text-muted-foreground mt-1">Last 7 days</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Offer Redemptions</h3>
                </div>
                <p className="text-3xl font-bold">{analytics.totalRedemptions}</p>
                <p className="text-sm text-muted-foreground mt-1">Last 7 days</p>
              </Card>
            </div>
          )}

          {/* Shop Details */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Store className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">Shop Details</h2>
            </div>
            
            <form onSubmit={handleSaveShop} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Shop Name</Label>
                  <Input id="name" name="name" defaultValue={shop.name} required />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" defaultValue={shop.phone} required />
                </div>
              </div>
              
              <div>
                <Label htmlFor="address">Address</Label>
                <Input id="address" name="address" defaultValue={shop.address} required />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" defaultValue={shop.description} rows={3} />
              </div>

              <div>
                <Label htmlFor="hours">Opening Hours</Label>
                <Input id="hours" name="hours" defaultValue={shop.hours} placeholder="e.g., 9:00 AM - 9:00 PM" />
              </div>

              <Button type="submit" className="w-full md:w-auto">
                Save Changes
              </Button>
            </form>
          </Card>

          {/* Products Management */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Package className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold">Products</h2>
              </div>
              
              <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingProduct(null)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingProduct ? 'Edit Product' : 'Add New Product'}
                    </DialogTitle>
                  </DialogHeader>

                  <form onSubmit={handleSaveProduct} className="space-y-4">
                    <div>
                      <Label htmlFor="product_name">Product Name</Label>
                      <Input
                        id="product_name"
                        name="name"
                        defaultValue={editingProduct?.name}
                        placeholder="e.g., Fresh Bread"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="product_description">Description</Label>
                      <Textarea
                        id="product_description"
                        name="description"
                        defaultValue={editingProduct?.description}
                        placeholder="Describe your product..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="price">Price (₹)</Label>
                      <Input
                        id="price"
                        name="price"
                        type="number"
                        step="0.01"
                        defaultValue={editingProduct?.price}
                        placeholder="99.00"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="image_url">Image URL</Label>
                      <Input
                        id="image_url"
                        name="image_url"
                        defaultValue={editingProduct?.image_url}
                        placeholder="https://example.com/image.jpg"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Paste a direct image URL (jpg, png, webp)
                      </p>
                    </div>

                    <Button type="submit" className="w-full">
                      {editingProduct ? 'Update Product' : 'Add Product'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-4">
              {products.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No products yet. Add your first product to start selling!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {products.map((product) => (
                    <Card key={product.id} className="p-4">
                      <div className="flex gap-4">
                        <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="font-semibold truncate">{product.name}</h3>
                            <Badge variant={product.in_stock ? 'success' : 'secondary'}>
                              {product.in_stock ? 'In Stock' : 'Out of Stock'}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {product.description}
                          </p>
                          
                          <p className="text-lg font-bold text-primary mb-3">₹{product.price}</p>
                          
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleStock(product.id, product.in_stock)}
                            >
                              {product.in_stock ? 'Mark Out' : 'Mark In'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingProduct(product);
                                setProductDialogOpen(true);
                              }}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteProduct(product.id)}
                            >
                              <Trash className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Offers Management */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Tag className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold">Offers</h2>
              </div>
              
              <Dialog open={offerDialogOpen} onOpenChange={setOfferDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingOffer(null)}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Offer
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingOffer ? 'Edit Offer' : 'Create New Offer'}
                    </DialogTitle>
                  </DialogHeader>

                  <form onSubmit={handleSaveOffer} className="space-y-4">
                    <div>
                      <Label htmlFor="title">Offer Title</Label>
                      <Input
                        id="title"
                        name="title"
                        defaultValue={editingOffer?.title}
                        placeholder="e.g., 20% Off All Items"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        name="description"
                        defaultValue={editingOffer?.description}
                        placeholder="Describe your offer..."
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="discount_type">Discount Type</Label>
                        <Select name="discount_type" defaultValue={editingOffer?.discount_type || 'percentage'}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">Percentage</SelectItem>
                            <SelectItem value="fixed">Fixed Amount</SelectItem>
                            <SelectItem value="bogo">Buy One Get One</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="discount_value">Discount Value</Label>
                        <Input
                          id="discount_value"
                          name="discount_value"
                          defaultValue={editingOffer?.discount_value}
                          placeholder="e.g., 20 or 100"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="start_at">Start Date</Label>
                        <Input
                          id="start_at"
                          name="start_at"
                          type="datetime-local"
                          defaultValue={editingOffer?.start_at ? new Date(editingOffer.start_at).toISOString().slice(0, 16) : ''}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="end_at">End Date</Label>
                        <Input
                          id="end_at"
                          name="end_at"
                          type="datetime-local"
                          defaultValue={editingOffer?.end_at ? new Date(editingOffer.end_at).toISOString().slice(0, 16) : ''}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="terms">Terms & Conditions</Label>
                      <Textarea
                        id="terms"
                        name="terms"
                        defaultValue={editingOffer?.terms}
                        placeholder="Enter terms and conditions..."
                        rows={2}
                      />
                    </div>

                    <Button type="submit" className="w-full">
                      {editingOffer ? 'Update Offer' : 'Create Offer'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-4">
              {offers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No offers yet. Create your first offer to attract customers!</p>
                </div>
              ) : (
                offers.map((offer) => (
                  <Card key={offer.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{offer.title}</h3>
                          {offer.active ? (
                            <Badge variant="success">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {offer.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Tag className="w-4 h-4" />
                            <span className="font-semibold">{offer.discount_value}{offer.discount_type === 'percentage' ? '%' : '₹'} OFF</span>
                          </div>
                          <div className="flex items-center gap-1 text-warning">
                            <Clock className="w-4 h-4" />
                            <span>{getTimeRemaining(offer.end_at)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setEditingOffer(offer);
                            setOfferDialogOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDeleteOffer(offer.id)}
                        >
                          <Trash className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </Card>

          {/* Jobs Preview */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Job Postings</h2>
              <div className="flex items-center gap-3">
                <Badge variant="outline">{jobs.length} active</Badge>
                <Button onClick={() => navigate('/applications')}>
                  View Applications
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Manage your job applications and hire the best candidates.
            </p>
            {jobs.length > 0 && (
              <div className="grid gap-3 mt-4">
                {jobs.slice(0, 3).map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-semibold">{job.title}</p>
                      <p className="text-sm text-muted-foreground">{job.job_type} • {job.wage}</p>
                    </div>
                    <Badge variant={job.active ? 'success' : 'secondary'}>
                      {job.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ShopDashboard;

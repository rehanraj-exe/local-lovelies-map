import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { ImageUploader } from '@/components/admin/ImageUploader';

export const ProductEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [shops, setShops] = useState<{id: string, name: string}[]>([]);

  const [formData, setFormData] = useState({
    shop_id: '',
    name: '',
    description: '',
    price: 0,
    discount_price: 0,
    category: '',
    brand: '',
    stock_quantity: 0,
    in_stock: true,
    featured: false,
    image_url: '',
    images: [] as string[],
    tags: [] as string[],
    tagsInput: '', // Temporary state for comma-separated tags
  });

  useEffect(() => {
    fetchShops();
    if (isEditing) {
      fetchProduct();
    }
  }, [id]);

  const fetchShops = async () => {
    try {
      const { data, error } = await supabase.from('shops').select('id, name').order('name');
      if (error) throw error;
      setShops(data || []);
      // Auto-select first shop if creating new product
      if (!isEditing && data && data.length > 0) {
        setFormData(prev => ({ ...prev, shop_id: data[0].id }));
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
      toast.error('Failed to load shops');
    }
  };

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
      if (error) throw error;
      if (data) {
        setFormData({
          shop_id: data.shop_id || '',
          name: data.name || '',
          description: data.description || '',
          price: data.price || 0,
          discount_price: data.discount_price || 0,
          category: data.category || '',
          brand: data.brand || '',
          stock_quantity: data.stock_quantity || 0,
          in_stock: data.in_stock ?? true,
          featured: data.featured ?? false,
          image_url: data.image_url || '',
          images: data.images || [],
          tags: data.tags || [],
          tagsInput: (data.tags || []).join(', '),
        });
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product details');
      navigate('/admin/products');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const tagsArray = formData.tagsInput.split(',').map(t => t.trim()).filter(Boolean);

      const payload = {
        shop_id: formData.shop_id,
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        discount_price: Number(formData.discount_price),
        category: formData.category,
        brand: formData.brand,
        stock_quantity: Number(formData.stock_quantity),
        in_stock: formData.in_stock,
        featured: formData.featured,
        image_url: formData.image_url,
        images: formData.images,
        tags: tagsArray,
      };

      if (isEditing) {
        const { error } = await supabase.from('products').update(payload).eq('id', id);
        if (error) throw error;
        toast.success('Product updated successfully');
      } else {
        const { error } = await supabase.from('products').insert(payload);
        if (error) throw error;
        toast.success('Product created successfully');
      }
      navigate('/admin/products');
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/products')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-3xl font-bold">{isEditing ? 'Edit Product' : 'Add New Product'}</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-8 bg-card p-6 rounded-xl border">
        {/* Images Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Images</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Primary Image (1 image)</Label>
              <ImageUploader 
                value={formData.image_url ? [formData.image_url] : []} 
                onChange={(urls) => setFormData(prev => ({ ...prev, image_url: urls[0] || '' }))} 
                maxImages={1} 
              />
            </div>
            <div className="space-y-2">
              <Label>Gallery Images (multiple)</Label>
              <ImageUploader 
                value={formData.images} 
                onChange={(urls) => setFormData(prev => ({ ...prev, images: urls }))} 
                maxImages={5} 
              />
            </div>
          </div>
        </div>

        {/* Basic Info Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="shop_id">Select Shop *</Label>
              <select
                id="shop_id"
                name="shop_id"
                value={formData.shop_id}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="" disabled>Select a shop</option>
                {shops.map(shop => (
                  <option key={shop.id} value={shop.id}>{shop.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input id="category" name="category" value={formData.category} onChange={handleChange} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={4} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input id="brand" name="brand" value={formData.brand} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tagsInput">Tags (comma-separated)</Label>
              <Input id="tagsInput" name="tagsInput" value={formData.tagsInput} onChange={handleChange} placeholder="e.g. fresh, organic, local" />
            </div>
          </div>
        </div>

        {/* Pricing & Inventory */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Pricing & Inventory</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price (₹) *</Label>
              <Input type="number" step="0.01" id="price" name="price" value={formData.price} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discount_price">Discount Price (₹)</Label>
              <Input type="number" step="0.01" id="discount_price" name="discount_price" value={formData.discount_price} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock_quantity">Stock Quantity</Label>
              <Input type="number" id="stock_quantity" name="stock_quantity" value={formData.stock_quantity} onChange={handleChange} />
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Settings</h2>
          <div className="flex flex-col gap-4">
            <div className="flex items-center space-x-2">
              <Switch 
                id="in_stock" 
                checked={formData.in_stock} 
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, in_stock: checked }))} 
              />
              <Label htmlFor="in_stock">Product is in stock</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch 
                id="featured" 
                checked={formData.featured} 
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featured: checked }))} 
              />
              <Label htmlFor="featured">Featured Product</Label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => navigate('/admin/products')}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Product
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProductEditor;

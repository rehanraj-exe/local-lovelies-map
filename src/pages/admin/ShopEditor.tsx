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
import { useAuth } from '@/hooks/useAuth';

export const ShopEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditing = !!id;

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    category: '',
    latitude: 0,
    longitude: 0,
    open_now: true,
    logo_url: '',
    cover_url: '',
    photos: [] as string[],
  });

  useEffect(() => {
    if (isEditing) {
      fetchShop();
    }
  }, [id]);

  const fetchShop = async () => {
    try {
      const { data, error } = await supabase.from('shops').select('*').eq('id', id).single();
      if (error) throw error;
      if (data) {
        setFormData({
          name: data.name || '',
          description: data.description || '',
          phone: data.phone || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          pincode: data.pincode || '',
          category: data.category || '',
          latitude: data.latitude || 0,
          longitude: data.longitude || 0,
          open_now: data.open_now ?? true,
          logo_url: data.logo_url || '',
          cover_url: data.cover_url || '',
          photos: data.photos || [],
        });
      }
    } catch (error) {
      console.error('Error fetching shop:', error);
      toast.error('Failed to load shop details');
      navigate('/admin/shops');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        category: formData.category,
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
        open_now: formData.open_now,
        logo_url: formData.logo_url,
        cover_url: formData.cover_url,
        photos: formData.photos,
        owner_id: user.id, // Set the admin as owner or preserve existing owner
      };

      if (isEditing) {
        // remove owner_id to preserve the original owner if admin is editing
        delete (payload as any).owner_id;
        const { error } = await supabase.from('shops').update(payload).eq('id', id);
        if (error) throw error;
        toast.success('Shop updated successfully');
      } else {
        const { error } = await supabase.from('shops').insert(payload);
        if (error) throw error;
        toast.success('Shop created successfully');
      }
      navigate('/admin/shops');
    } catch (error) {
      console.error('Error saving shop:', error);
      toast.error('Failed to save shop');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/shops')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-3xl font-bold">{isEditing ? 'Edit Shop' : 'Add New Shop'}</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-8 bg-card p-6 rounded-xl border">
        {/* Images Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Images</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Shop Logo (1 image)</Label>
              <ImageUploader 
                value={formData.logo_url ? [formData.logo_url] : []} 
                onChange={(urls) => setFormData(prev => ({ ...prev, logo_url: urls[0] || '' }))} 
                maxImages={1} 
              />
            </div>
            <div className="space-y-2">
              <Label>Cover Image (1 image)</Label>
              <ImageUploader 
                value={formData.cover_url ? [formData.cover_url] : []} 
                onChange={(urls) => setFormData(prev => ({ ...prev, cover_url: urls[0] || '' }))} 
                maxImages={1} 
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Gallery Photos (multiple)</Label>
              <ImageUploader 
                value={formData.photos} 
                onChange={(urls) => setFormData(prev => ({ ...prev, photos: urls }))} 
                maxImages={5} 
              />
            </div>
          </div>
        </div>

        {/* Basic Info Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Shop Name *</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Input id="category" name="category" value={formData.category} onChange={handleChange} required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={4} />
            </div>
          </div>
        </div>

        {/* Contact & Location */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Contact & Location</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Street Address *</Label>
              <Input id="address" name="address" value={formData.address} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" value={formData.city} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" name="state" value={formData.state} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pincode">Pincode</Label>
              <Input id="pincode" name="pincode" value={formData.pincode} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label>Latitude</Label>
              <Input type="number" step="any" name="latitude" value={formData.latitude} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label>Longitude</Label>
              <Input type="number" step="any" name="longitude" value={formData.longitude} onChange={handleChange} required />
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Settings</h2>
          <div className="flex items-center space-x-2">
            <Switch 
              id="open_now" 
              checked={formData.open_now} 
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, open_now: checked }))} 
            />
            <Label htmlFor="open_now">Shop is currently open</Label>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => navigate('/admin/shops')}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Shop
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ShopEditor;

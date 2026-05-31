import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft } from 'lucide-react';
import { z } from 'zod';

const categories = ['Bakery', 'Café', 'Clothing', 'Grocery', 'Bookstore', 'Restaurant', 'Services', 'Other'];

const shopSchema = z.object({
  name: z.string().trim().min(1, 'Shop name is required').max(100, 'Name must be under 100 characters'),
  category: z.string().min(1, 'Category is required').max(50),
  description: z.string().trim().max(1000, 'Description must be under 1000 characters').optional().or(z.literal('')),
  address: z.string().trim().min(5, 'Address is too short').max(300),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  phone: z.string().trim().regex(/^\+?[0-9 \-()]{7,20}$/, 'Invalid phone number'),
  hours: z.string().trim().max(100).optional().or(z.literal('')),
});


const ShopRegistration = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    address: '',
    latitude: 28.6139,
    longitude: 77.2090,
    phone: '',
    hours: '9:00 AM - 6:00 PM',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to register a shop');
      navigate('/auth');
      return;
    }

    const validation = shopSchema.safeParse(formData);
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('shops')
        .insert([
          {
            ...validation.data,
            owner_id: user.id,
            verified: false,
          }
        ]);


      if (error) throw error;

      toast.success('Shop registration submitted! Our team will review it shortly.');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Failed to register shop');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-2xl py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card className="p-8 space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Register Your Shop</h1>
            <p className="text-muted-foreground">
              Join Re:Local and connect with your community
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Shop Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Sweet Bakery"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                required
              >
                <option value="">Select a category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Tell customers about your shop..."
                rows={4}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Address</label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Main Street, City"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Latitude</label>
                <Input
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Longitude</label>
                <Input
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Phone</label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Business Hours</label>
              <Input
                value={formData.hours}
                onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                placeholder="9:00 AM - 6:00 PM"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit for Approval'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ShopRegistration;

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';

interface CartItem {
  id: string;
  quantity: number;
  product_id: string;
  shop_id: string;
  product: {
    id: string;
    name: string;
    price: number;
    image_url: string;
  };
  shop: {
    id: string;
    name: string;
  };
}

const Checkout = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCartItems();
  }, []);

  const fetchCartItems = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          id,
          quantity,
          product_id,
          shop_id,
          product:products(id, name, price, image_url),
          shop:shops(id, name)
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      setCartItems(data as any);
    } catch (error) {
      console.error('Error fetching cart:', error);
      toast({ title: 'Error loading cart', variant: 'destructive' });
    }
  };

  const getTotalPrice = () => {
    return cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  };

  const handlePlaceOrder = async () => {
    if (!address.trim() || !phone.trim()) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Group items by shop
      const itemsByShop = cartItems.reduce((acc, item) => {
        if (!acc[item.shop_id]) {
          acc[item.shop_id] = [];
        }
        acc[item.shop_id].push(item);
        return acc;
      }, {} as Record<string, CartItem[]>);

      // Create separate orders for each shop
      for (const [shopId, items] of Object.entries(itemsByShop)) {
        const totalAmount = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

        // Create order
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            user_id: user.id,
            shop_id: shopId,
            total_amount: totalAmount,
            delivery_address: address,
            delivery_phone: phone,
            delivery_notes: notes,
            status: 'pending'
          })
          .select()
          .single();

        if (orderError) throw orderError;

        // Create order items
        const orderItems = items.map(item => ({
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.product.price
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;
      }

      // Clear cart
      const { error: deleteError } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      toast({ title: 'Order placed successfully!' });
      navigate('/orders');
    } catch (error) {
      console.error('Error placing order:', error);
      toast({ title: 'Error placing order', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-3xl font-bold">Checkout</h1>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Delivery Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="address">Delivery Address *</Label>
                <Textarea
                  id="address"
                  placeholder="Enter your full delivery address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="notes">Delivery Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any special instructions for delivery"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>
                    {item.product.name} x{item.quantity}
                  </span>
                  <span>₹{(item.product.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t pt-4">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>₹{getTotalPrice().toFixed(2)}</span>
                </div>
              </div>
              <Button 
                className="w-full" 
                onClick={handlePlaceOrder}
                disabled={loading || cartItems.length === 0}
              >
                {loading ? 'Placing Order...' : 'Place Order'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

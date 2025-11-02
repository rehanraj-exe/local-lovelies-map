import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Smartphone } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

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
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'upi'>('cod');
  const [upiId, setUpiId] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCartItems();
  }, []);

  const fetchCartItems = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Redirect to auth with return path
        navigate('/auth?redirect=/checkout');
        return;
      }

      // Check for guest cart and migrate it
      const guestCart = localStorage.getItem('guest_cart');
      if (guestCart) {
        const localItems = JSON.parse(guestCart);
        for (const item of localItems) {
          const { data: existing } = await supabase
            .from('cart_items')
            .select('id, quantity')
            .eq('user_id', user.id)
            .eq('product_id', item.product_id)
            .single();

          if (existing) {
            await supabase
              .from('cart_items')
              .update({ quantity: existing.quantity + item.quantity })
              .eq('id', existing.id);
          } else {
            await supabase
              .from('cart_items')
              .insert({
                user_id: user.id,
                product_id: item.product_id,
                shop_id: item.shop_id,
                quantity: item.quantity
              });
          }
        }
        localStorage.removeItem('guest_cart');
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

  const generateUpiUrl = (amount: number) => {
    const merchantName = 'LocalShops';
    const upiParams = new URLSearchParams({
      pa: upiId || 'merchant@upi', // Payee UPI ID
      pn: merchantName,
      am: amount.toString(),
      cu: 'INR',
      tn: `Payment for order`
    });
    return `upi://pay?${upiParams.toString()}`;
  };

  const handlePlaceOrder = async () => {
    if (!address.trim() || !phone.trim()) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    if (paymentMethod === 'upi' && !upiId.trim()) {
      toast({ title: 'Please enter UPI ID', variant: 'destructive' });
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
            status: 'pending',
            payment_method: paymentMethod,
            payment_status: paymentMethod === 'cod' ? 'pending' : 'pending',
            payment_id: paymentMethod === 'upi' ? upiId : null
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

      // If UPI payment, open UPI app
      if (paymentMethod === 'upi') {
        const totalAmount = getTotalPrice();
        const upiUrl = generateUpiUrl(totalAmount);
        window.location.href = upiUrl;
      }

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

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup value={paymentMethod} onValueChange={(value: 'cod' | 'upi') => setPaymentMethod(value)}>
                <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-accent/50">
                  <RadioGroupItem value="cod" id="cod" />
                  <Label htmlFor="cod" className="flex-1 cursor-pointer">
                    <div className="font-semibold">Cash on Delivery</div>
                    <div className="text-sm text-muted-foreground">Pay when you receive</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-accent/50">
                  <RadioGroupItem value="upi" id="upi" />
                  <Label htmlFor="upi" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4" />
                      <span className="font-semibold">UPI Payment</span>
                    </div>
                    <div className="text-sm text-muted-foreground">Pay via UPI apps</div>
                  </Label>
                </div>
              </RadioGroup>

              {paymentMethod === 'upi' && (
                <div className="space-y-3 animate-in fade-in-50">
                  <div>
                    <Label htmlFor="upiId">Enter Merchant UPI ID *</Label>
                    <Input
                      id="upiId"
                      type="text"
                      placeholder="merchant@upi"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter the shop's UPI ID for payment
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <div className="text-xs text-muted-foreground w-full mb-1">Popular UPI apps:</div>
                    <div className="px-3 py-1 bg-muted rounded text-xs">GPay</div>
                    <div className="px-3 py-1 bg-muted rounded text-xs">PhonePe</div>
                    <div className="px-3 py-1 bg-muted rounded text-xs">Paytm</div>
                    <div className="px-3 py-1 bg-muted rounded text-xs">BHIM</div>
                  </div>
                </div>
              )}
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

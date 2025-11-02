import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Smartphone, Wallet } from 'lucide-react';
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
  const [paymentMethod, setPaymentMethod] = useState<'bank_upi' | 'other_upi' | 'emi' | 'cod' | 'wallet'>('cod');
  const [selectedBank, setSelectedBank] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);
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

      // Fetch wallet balance
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!walletError && wallet) {
        setWalletBalance(wallet.balance);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      toast({ title: 'Error loading cart', variant: 'destructive' });
    }
  };

  const getTotalPrice = () => {
    return cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  };

  const generateUpiUrl = (amount: number, shopUpiId: string, shopName: string, orderId: string) => {
    // Format: upi://pay?pa=<VPA>&pn=<Name>&am=<Amount>&cu=<Currency>&tn=<Note>
    const params = new URLSearchParams({
      pa: shopUpiId, // Payee VPA (UPI ID)
      pn: shopName, // Payee name
      am: amount.toFixed(2), // Amount
      cu: 'INR', // Currency
      tn: `Order ${orderId.substring(0, 8)}` // Transaction note
    });
    return `upi://pay?${params.toString()}`;
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

      // Check wallet balance if wallet payment selected
      if (paymentMethod === 'wallet') {
        const totalOrderAmount = getTotalPrice();
        if (walletBalance < totalOrderAmount) {
          toast({
            title: 'Insufficient balance',
            description: `You need ₹${(totalOrderAmount - walletBalance).toFixed(2)} more in your wallet`,
            variant: 'destructive'
          });
          setLoading(false);
          return;
        }
      }

      const createdOrders: Array<{ orderId: string; shopId: string; amount: number; shopName: string; upiId: string }> = [];

      // Create separate orders for each shop
      for (const [shopId, items] of Object.entries(itemsByShop)) {
        const currentUser = (await supabase.auth.getUser()).data.user;
        const totalAmount = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

        // Get shop details including UPI ID
        const { data: shop, error: shopError } = await supabase
          .from('shops')
          .select('upi_id, name')
          .eq('id', shopId)
          .single();

        if (shopError) throw shopError;

        // If UPI payment and shop doesn't have UPI ID, show error
        if ((paymentMethod === 'bank_upi' || paymentMethod === 'other_upi') && !shop.upi_id) {
          toast({ 
            title: 'UPI not available', 
            description: `${shop.name} doesn't accept UPI payments yet`,
            variant: 'destructive' 
          });
          setLoading(false);
          return;
        }

        // If bank UPI selected but no bank chosen, show error
        if (paymentMethod === 'bank_upi' && !selectedBank) {
          toast({ 
            title: 'Please select a bank', 
            description: 'Choose your bank to proceed with UPI payment',
            variant: 'destructive' 
          });
          setLoading(false);
          return;
        }

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
            payment_method: paymentMethod === 'bank_upi' || paymentMethod === 'other_upi' ? 'upi' : paymentMethod,
            payment_status: 'pending',
            payment_id: (paymentMethod === 'bank_upi' || paymentMethod === 'other_upi') ? shop.upi_id : null
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

        // Handle wallet payment
        if (paymentMethod === 'wallet') {
          // Check sufficient balance (should already be validated)
          if (walletBalance < totalAmount) {
            toast({
              title: 'Insufficient balance',
              description: 'Please add money to your wallet',
              variant: 'destructive'
            });
            setLoading(false);
            return;
          }

          // Deduct from wallet
          const { error: walletError } = await supabase
            .from('wallets')
            .update({ 
              balance: walletBalance - totalAmount 
            })
            .eq('user_id', user.id);

          if (walletError) throw walletError;

          // Update order payment status
          await supabase
            .from('orders')
            .update({ 
              payment_status: 'completed',
              status: 'confirmed'
            })
            .eq('id', order.id);

          // Create transaction record
          if (currentUser) {
            await supabase.from('transactions').insert({
              user_id: currentUser.id,
              shop_id: shopId,
              order_id: order.id,
              amount: totalAmount,
              payment_method: 'wallet',
              status: 'completed'
            });
          }

          // Update local wallet balance
          setWalletBalance(prev => prev - totalAmount);
        }

        // Store order details for UPI redirect
        if ((paymentMethod === 'bank_upi' || paymentMethod === 'other_upi') && shop.upi_id) {
          createdOrders.push({
            orderId: order.id,
            shopId: shopId,
            amount: totalAmount,
            shopName: shop.name,
            upiId: shop.upi_id
          });

          // Create transaction record
          if (currentUser) {
            await supabase.from('transactions').insert({
              user_id: currentUser.id,
              shop_id: shopId,
              order_id: order.id,
              amount: totalAmount,
              payment_method: paymentMethod,
              status: 'pending'
            });
          }
        }
      }

      // Clear cart
      const { error: deleteError } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // If UPI payment, redirect to UPI app
      if ((paymentMethod === 'bank_upi' || paymentMethod === 'other_upi') && createdOrders.length > 0) {
        // For now, redirect to first shop's UPI payment
        // In a real app, you might want to handle multiple shop payments differently
        const firstOrder = createdOrders[0];
        const upiUrl = generateUpiUrl(firstOrder.amount, firstOrder.upiId, firstOrder.shopName, firstOrder.orderId);
        
        toast({ 
          title: 'Redirecting to UPI...', 
          description: 'Complete payment in your UPI app' 
        });
        
        // Small delay to show the toast
        setTimeout(() => {
          window.location.href = upiUrl;
        }, 1000);
        
        return;
      }

      // Show success message based on payment method
      if (paymentMethod === 'wallet') {
        toast({ 
          title: 'Order placed successfully!',
          description: 'Payment completed via Re:Wallet'
        });
      } else {
        toast({ title: 'Order placed successfully!' });
      }
      
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
            <CardContent className="space-y-3">
              <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as any)}>
                {/* Bank UPI */}
                <div className="border rounded-lg">
                  <div className="flex items-start space-x-3 p-4 cursor-pointer hover:bg-accent/50" onClick={() => setPaymentMethod('bank_upi')}>
                    <RadioGroupItem value="bank_upi" id="bank_upi" className="mt-1" />
                    <Label htmlFor="bank_upi" className="flex-1 cursor-pointer">
                      <div className="font-semibold">Your Bank</div>
                      <div className="text-sm text-muted-foreground mb-3">Pay via your bank's UPI</div>
                      {paymentMethod === 'bank_upi' && (
                        <select 
                          value={selectedBank}
                          onChange={(e) => setSelectedBank(e.target.value)}
                          className="w-full p-2 border rounded bg-background text-sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="">Select your bank</option>
                          <option value="airtel">Airtel Payments Bank</option>
                          <option value="axis">Axis Bank</option>
                          <option value="hdfc">HDFC Bank</option>
                          <option value="icici">ICICI Bank</option>
                          <option value="kotak">Kotak Bank</option>
                          <option value="sbi">State Bank of India</option>
                          <option value="allahabad">Allahabad Bank</option>
                          <option value="andhra">Andhra Bank</option>
                          <option value="boi">Bank of India</option>
                          <option value="bom">Bank of Maharashtra</option>
                          <option value="canara">Canara Bank</option>
                          <option value="catholic">Catholic Syrian Bank</option>
                          <option value="central">Central Bank of India</option>
                          <option value="city_union">City Union Bank</option>
                          <option value="corporation">Corporation Bank</option>
                          <option value="cosmos">Cosmos Bank</option>
                          <option value="dena">Dena Bank</option>
                          <option value="federal">Federal Bank</option>
                          <option value="idbi">IDBI Bank</option>
                          <option value="indian">Indian Bank</option>
                          <option value="indusind">IndusInd Bank</option>
                          <option value="pnb">Punjab National Bank</option>
                          <option value="rbl">RBL Bank</option>
                          <option value="syndicate">Syndicate Bank</option>
                          <option value="uco">UCO Bank</option>
                          <option value="union">Union Bank of India</option>
                          <option value="yes">YES Bank</option>
                        </select>
                      )}
                    </Label>
                  </div>
                </div>

                {/* Other UPI Apps */}
                <div className="flex items-start space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent/50">
                  <RadioGroupItem value="other_upi" id="other_upi" className="mt-1" />
                  <Label htmlFor="other_upi" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4" />
                      <span className="font-semibold">Other UPI Apps</span>
                    </div>
                    <div className="text-sm text-muted-foreground">GPay, PhonePe, Paytm, BHIM & more</div>
                  </Label>
                </div>

                {/* Re:Wallet */}
                <div className={`flex items-start space-x-3 border rounded-lg p-4 cursor-pointer ${
                  walletBalance >= getTotalPrice() ? 'hover:bg-accent/50' : 'opacity-50'
                }`}>
                  <RadioGroupItem value="wallet" id="wallet" disabled={walletBalance < getTotalPrice()} className="mt-1" />
                  <Label htmlFor="wallet" className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4" />
                        <span className="font-semibold">Re:Wallet</span>
                      </div>
                      <span className="text-sm font-medium">₹{walletBalance.toFixed(2)}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {walletBalance >= getTotalPrice() 
                        ? 'Pay using your wallet balance' 
                        : `Insufficient balance. Add ₹${(getTotalPrice() - walletBalance).toFixed(2)} more`
                      }
                    </div>
                  </Label>
                </div>

                {/* EMI - Unavailable */}
                <div className="flex items-start space-x-3 border rounded-lg p-4 opacity-50">
                  <RadioGroupItem value="emi" id="emi" disabled className="mt-1" />
                  <Label htmlFor="emi" className="flex-1">
                    <div className="font-semibold">EMI Unavailable <span className="text-xs text-primary cursor-pointer">Why?</span></div>
                    <div className="text-sm text-muted-foreground">Not available for this order</div>
                  </Label>
                </div>

                {/* Cash on Delivery */}
                <div className="flex items-start space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent/50">
                  <RadioGroupItem value="cod" id="cod" className="mt-1" />
                  <Label htmlFor="cod" className="flex-1 cursor-pointer">
                    <div className="font-semibold">Cash on Delivery/Pay on Delivery</div>
                    <div className="text-sm text-muted-foreground">
                      Cash, UPI and Cards accepted. <span className="text-primary cursor-pointer">Know more.</span>
                    </div>
                  </Label>
                </div>
              </RadioGroup>

              {(paymentMethod === 'bank_upi' || paymentMethod === 'other_upi') && (
                <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground animate-in fade-in-50">
                  You will be redirected to complete payment via UPI
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

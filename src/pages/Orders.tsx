import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2, Package, Truck, Home } from 'lucide-react';
import { format } from 'date-fns';

const ORDER_STEPS = [
  { id: 'placed', label: 'Order Placed', icon: CheckCircle2 },
  { id: 'shipping', label: 'Shipping', icon: Package },
  { id: 'shipped', label: 'Shipped', icon: Truck },
  { id: 'delivered', label: 'Delivered', icon: Home },
];

const getStepIndex = (status: string) => {
  switch (status) {
    case 'pending':
    case 'placed':
    case 'confirmed': return 0;
    case 'shipping':
    case 'preparing': return 1;
    case 'shipped':
    case 'on_the_way': return 2;
    case 'delivered': return 3;
    default: return -1;
  }
};

interface Order {
  id: string;
  total_amount: number;
  delivery_address: string;
  delivery_phone: string;
  status: string;
  payment_status: string;
  payment_method: string;
  upi_transaction_id: string | null;
  created_at: string;
  shop: {
    name: string;
  };
  order_items: Array<{
    quantity: number;
    price: number;
    product: {
      name: string;
      image_url: string;
    };
  }>;
}

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          total_amount,
          delivery_address,
          delivery_phone,
          status,
          payment_status,
          payment_method,
          upi_transaction_id,
          created_at,
          shop:shops(name),
          order_items(
            quantity,
            price,
            product:products(name, image_url)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data as any);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'placed':
      case 'confirmed': return 'bg-blue-500';
      case 'shipping':
      case 'preparing': return 'bg-purple-500';
      case 'shipped':
      case 'on_the_way': return 'bg-orange-500';
      case 'delivered': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-3xl font-bold">My Orders</h1>
      </div>
      
      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No orders yet
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex justify-between items-start flex-wrap gap-4">
                  <div>
                    <CardTitle className="text-xl">{order.shop.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(order.created_at), 'PPpp')}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <Badge className={getStatusColor(order.status)}>
                      {order.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <Badge className={getPaymentStatusColor(order.payment_status)}>
                      Payment: {order.payment_status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Order Tracker */}
                  {getStepIndex(order.status) >= 0 && order.status !== 'cancelled' && (
                    <div className="py-2 mb-4">
                      <div className="relative">
                        {/* Progress Bar Background */}
                        <div className="absolute top-4 left-0 w-full h-1 bg-muted -translate-y-1/2 rounded-full" />
                        
                        {/* Active Progress Bar */}
                        <div 
                          className="absolute top-4 left-0 h-1 bg-primary -translate-y-1/2 rounded-full transition-all duration-500"
                          style={{ width: `${(getStepIndex(order.status) / (ORDER_STEPS.length - 1)) * 100}%` }}
                        />

                        <div className="relative flex justify-between">
                          {ORDER_STEPS.map((step, index) => {
                            const isCompleted = index <= getStepIndex(order.status);
                            const isActive = index === getStepIndex(order.status);
                            const StepIcon = step.icon;
                            
                            return (
                              <div key={step.id} className="flex flex-col items-center gap-2 relative bg-card px-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors z-10 ${
                                  isCompleted 
                                    ? 'bg-primary border-primary text-primary-foreground' 
                                    : 'bg-card border-muted text-muted-foreground'
                                }`}>
                                  <StepIcon className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`} />
                                </div>
                                <span className={`text-[10px] sm:text-xs font-medium text-center ${
                                  isCompleted ? 'text-foreground' : 'text-muted-foreground'
                                }`}>
                                  {step.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="font-semibold mb-3">Items</h3>
                    {order.order_items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm py-1">
                        <span>{item.product.name} x{item.quantity}</span>
                        <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>₹{order.total_amount}</span>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>Delivery Address:</strong> {order.delivery_address}</p>
                    <p><strong>Phone:</strong> {order.delivery_phone}</p>
                    <p className="capitalize"><strong>Payment Method:</strong> {order.payment_method}</p>
                    {order.upi_transaction_id && (
                      <p className="font-mono text-xs">
                        <strong>Transaction ID:</strong> {order.upi_transaction_id}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;

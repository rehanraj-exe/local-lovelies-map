import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface Order {
  id: string;
  total_amount: number;
  delivery_address: string;
  delivery_phone: string;
  status: string;
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
      case 'confirmed': return 'bg-blue-500';
      case 'preparing': return 'bg-purple-500';
      case 'on_the_way': return 'bg-orange-500';
      case 'delivered': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>
      
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
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{order.shop.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(order.created_at), 'PPpp')}
                    </p>
                  </div>
                  <Badge className={getStatusColor(order.status)}>
                    {order.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Items</h3>
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
                  <div className="text-sm text-muted-foreground">
                    <p><strong>Delivery Address:</strong> {order.delivery_address}</p>
                    <p><strong>Phone:</strong> {order.delivery_phone}</p>
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

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const PaymentProcessing = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'processing' | 'success' | 'failed'>('processing');
  const [orderIds, setOrderIds] = useState<string[]>([]);

  useEffect(() => {
    const orders = searchParams.get('orders');
    const method = searchParams.get('method');
    
    if (!orders || !method) {
      navigate('/');
      return;
    }

    const orderIdArray = orders.split(',');
    setOrderIds(orderIdArray);
    
    // Simulate payment processing
    simulatePayment(orderIdArray, method);
  }, [searchParams]);

  const simulatePayment = async (orderIdArray: string[], method: string) => {
    // Simulate realistic payment processing time
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));

    // 95% success rate for simulation
    const isSuccess = Math.random() > 0.05;

    if (isSuccess) {
      try {
        // Update all orders
        for (const orderId of orderIdArray) {
          // Update order status
          await supabase
            .from('orders')
            .update({ 
              payment_status: 'completed',
              status: 'confirmed',
              upi_transaction_id: `TXN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`
            })
            .eq('id', orderId);

          // Update transaction status
          await supabase
            .from('transactions')
            .update({ status: 'completed' })
            .eq('order_id', orderId);
        }

        setStatus('success');
        toast({
          title: 'Payment Successful!',
          description: 'Your order has been confirmed',
        });
      } catch (error) {
        console.error('Error updating payment:', error);
        setStatus('failed');
        toast({
          title: 'Payment Failed',
          description: 'Please try again or contact support',
          variant: 'destructive',
        });
      }
    } else {
      // Update transactions as failed
      for (const orderId of orderIdArray) {
        await supabase
          .from('transactions')
          .update({ status: 'failed' })
          .eq('order_id', orderId);
      }
      
      setStatus('failed');
      toast({
        title: 'Payment Failed',
        description: 'Please try again with a different method',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/10 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-12 pb-8 text-center space-y-6">
          {status === 'processing' && (
            <>
              <div className="flex justify-center">
                <Loader2 className="w-20 h-20 text-primary animate-spin" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Processing Payment</h2>
                <p className="text-muted-foreground">
                  Please wait while we verify your payment...
                </p>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="animate-pulse">Connecting to payment gateway...</p>
                <p className="animate-pulse delay-100">Verifying transaction...</p>
                <p className="animate-pulse delay-200">Confirming your order...</p>
              </div>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="flex justify-center">
                <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-4">
                  <CheckCircle2 className="w-20 h-20 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2 text-green-600 dark:text-green-400">
                  Payment Successful!
                </h2>
                <p className="text-muted-foreground mb-4">
                  Your order has been confirmed and is being prepared
                </p>
                <div className="bg-accent/50 rounded-lg p-4 text-sm">
                  <p className="font-semibold mb-1">Order ID{orderIds.length > 1 ? 's' : ''}</p>
                  {orderIds.map(id => (
                    <p key={id} className="text-muted-foreground font-mono">
                      {id.substring(0, 8)}...
                    </p>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <Button onClick={() => navigate('/orders')} className="w-full">
                  View Orders
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
                <Button variant="outline" onClick={() => navigate('/')} className="w-full">
                  Continue Shopping
                </Button>
              </div>
            </>
          )}

          {status === 'failed' && (
            <>
              <div className="flex justify-center">
                <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-4">
                  <XCircle className="w-20 h-20 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2 text-red-600 dark:text-red-400">
                  Payment Failed
                </h2>
                <p className="text-muted-foreground">
                  Your payment could not be processed. Please try again.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <Button onClick={() => navigate('/checkout')} className="w-full">
                  Try Again
                </Button>
                <Button variant="outline" onClick={() => navigate('/')} className="w-full">
                  Back to Home
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentProcessing;

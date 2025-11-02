import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Check, Crown, Store, Sparkles, TrendingUp, Zap } from 'lucide-react';

const Premium = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchSubscription();
  }, [user]);

  const fetchSubscription = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setSubscription(data);
      setCurrentPlan(data.plan);
    }
  };

  const handleSubscribe = async (plan: string, price: number, cycle: string) => {
    if (!user) return;

    setLoading(true);

    // Calculate expiry date
    const expiresAt = new Date();
    if (cycle === 'monthly') {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    } else {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    }

    try {
      // Create transaction first
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          shop_id: null,
          amount: price,
          payment_method: 'upi',
          status: 'pending',
          upi_transaction_id: `SUB-${Date.now()}`,
        });

      if (txError) throw txError;

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Success - create/update subscription
      if (subscription) {
        const { error } = await supabase
          .from('subscriptions')
          .update({
            plan: plan as 'customer_premium' | 'shop_premium',
            price,
            billing_cycle: cycle,
            expires_at: expiresAt.toISOString(),
            status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('id', subscription.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('subscriptions')
          .insert({
            user_id: user.id,
            plan: plan as 'customer_premium' | 'shop_premium',
            price,
            billing_cycle: cycle,
            expires_at: expiresAt.toISOString(),
            status: 'active',
          });

        if (error) throw error;
      }

      toast.success('Premium subscription activated! 🎉');
      fetchSubscription();
    } catch (error: any) {
      toast.error(error.message || 'Failed to process subscription');
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    {
      id: 'customer_premium',
      name: 'Customer Premium',
      icon: Crown,
      monthly: 99,
      yearly: 899,
      features: [
        'Ad-free experience',
        'Early access to exclusive offers',
        'Premium User badge',
        'Personalized AI recommendations',
        'Priority customer support',
        'Save unlimited favorites',
      ],
      color: 'from-purple-500 to-pink-500',
    },
    {
      id: 'shop_premium',
      name: 'Shopkeeper Premium',
      icon: Store,
      monthly: 299,
      yearly: 2499,
      features: [
        'Verified+ badge',
        'Priority placement on map',
        'Advanced analytics dashboard',
        'Unlimited product listings',
        'Featured banner offers',
        'Direct customer messaging',
        'Premium shop insights',
      ],
      color: 'from-orange-500 to-red-500',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold">Go Premium</h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Unlock exclusive features and grow your business
          </p>
          {currentPlan !== 'free' && (
            <Badge variant="default" className="mt-4">
              Current Plan: {currentPlan.replace('_', ' ').toUpperCase()}
            </Badge>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isActive = currentPlan === plan.id;
            
            return (
              <Card
                key={plan.id}
                className={`p-8 relative overflow-hidden ${
                  isActive ? 'ring-2 ring-primary' : ''
                }`}
              >
                {isActive && (
                  <Badge className="absolute top-4 right-4" variant="default">
                    Active
                  </Badge>
                )}

                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-6`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>

                <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>

                <div className="mb-6">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-4xl font-bold">₹{plan.monthly}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    or ₹{plan.yearly}/year (save ₹{plan.monthly * 12 - plan.yearly})
                  </div>
                </div>

                <div className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Button
                    className="w-full"
                    disabled={loading || isActive}
                    onClick={() => handleSubscribe(plan.id, plan.monthly, 'monthly')}
                  >
                    {isActive ? 'Current Plan' : `Subscribe Monthly - ₹${plan.monthly}`}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={loading || isActive}
                    onClick={() => handleSubscribe(plan.id, plan.yearly, 'yearly')}
                  >
                    {isActive ? 'Current Plan' : `Subscribe Yearly - ₹${plan.yearly}`}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Current Subscription Details */}
        {subscription && currentPlan !== 'free' && (
          <Card className="max-w-2xl mx-auto mt-12 p-6">
            <h3 className="text-xl font-bold mb-4">Subscription Details</h3>
            <div className="grid gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plan:</span>
                <span className="font-semibold">{subscription.plan.replace('_', ' ').toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Billing Cycle:</span>
                <span className="font-semibold capitalize">{subscription.billing_cycle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expires:</span>
                <span className="font-semibold">
                  {new Date(subscription.expires_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Auto-renew:</span>
                <span className="font-semibold">{subscription.auto_renew ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Premium;

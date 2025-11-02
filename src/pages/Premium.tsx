import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Check, Crown, Store, Sparkles, TrendingUp, Zap, Star, Shield, Target } from 'lucide-react';

const Premium = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
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
    if (!user) {
      toast.error('Please sign in to subscribe to premium');
      navigate('/auth');
      return;
    }

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
    <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background">
      {/* Premium Hero Banner */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 text-white py-12">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4 text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          
          <div className="text-center max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Sparkles className="w-12 h-12 animate-pulse" />
              <h1 className="text-5xl md:text-6xl font-bold">Go Premium</h1>
              <Crown className="w-12 h-12 animate-pulse" />
            </div>
            <p className="text-xl md:text-2xl mb-2">
              Unlock Exclusive Features & Grow Your Business
            </p>
            <p className="text-white/80 mb-4">
              Join thousands of premium users and shops already benefiting from our platform
            </p>
            {!user && (
              <div className="bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 inline-block">
                <p className="text-white text-sm">
                  👋 Browse plans below • Sign in to subscribe
                </p>
              </div>
            )}
            {currentPlan !== 'free' && user && (
              <Badge className="mt-4 bg-white text-purple-600 hover:bg-white text-lg px-6 py-2">
                ✨ You're Premium: {currentPlan.replace('_', ' ').toUpperCase()}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Why Go Premium Section */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="p-6 text-center hover:shadow-lg transition-all">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">Instant Benefits</h3>
            <p className="text-muted-foreground">
              Activate premium and start enjoying benefits immediately
            </p>
          </Card>
          
          <Card className="p-6 text-center hover:shadow-lg transition-all">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">Grow Faster</h3>
            <p className="text-muted-foreground">
              Premium shops get 3x more visibility and customer engagement
            </p>
          </Card>
          
          <Card className="p-6 text-center hover:shadow-lg transition-all">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">Trusted Platform</h3>
            <p className="text-muted-foreground">
              Secure payments and dedicated support for all premium members
            </p>
          </Card>
        </div>

        {/* Pricing Plans */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Choose Your Plan</h2>
          <p className="text-muted-foreground">Select the perfect plan for your needs</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isActive = currentPlan === plan.id;
            
            return (
              <Card
                key={plan.id}
                className={`p-8 relative overflow-hidden hover:scale-105 transition-all duration-300 ${
                  isActive ? 'ring-4 ring-primary shadow-2xl' : 'hover:shadow-xl'
                }`}
              >
                {isActive && (
                  <div className="absolute top-0 right-0 bg-gradient-to-br from-green-500 to-emerald-600 text-white px-6 py-2 rounded-bl-2xl">
                    <Star className="w-4 h-4 inline mr-1" />
                    Active Plan
                  </div>
                )}

                {plan.id === 'shop_premium' && !isActive && (
                  <div className="absolute top-0 right-0 bg-gradient-to-br from-yellow-500 to-orange-600 text-white px-6 py-2 rounded-bl-2xl text-sm font-bold">
                    🔥 MOST POPULAR
                  </div>
                )}

                <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-6 shadow-lg`}>
                  <Icon className="w-10 h-10 text-white" />
                </div>

                <h2 className="text-3xl font-bold mb-3">{plan.name}</h2>

                <div className="mb-6">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-5xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                      ₹{plan.monthly}
                    </span>
                    <span className="text-muted-foreground text-lg">/month</span>
                  </div>
                  <div className="text-sm bg-success/10 text-success px-3 py-2 rounded-full inline-block">
                    or ₹{plan.yearly}/year - Save ₹{plan.monthly * 12 - plan.yearly}!
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3 group">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                        <Check className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <Button
                    className={`w-full text-lg py-6 ${
                      isActive 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                        : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                    }`}
                    disabled={loading || isActive}
                    onClick={() => handleSubscribe(plan.id, plan.monthly, 'monthly')}
                  >
                    {isActive ? (
                      <>
                        <Check className="w-5 h-5 mr-2" />
                        Current Plan
                      </>
                    ) : !user ? (
                      <>
                        <Crown className="w-5 h-5 mr-2" />
                        Sign In to Subscribe
                      </>
                    ) : (
                      <>
                        <Crown className="w-5 h-5 mr-2" />
                        Subscribe Monthly - ₹{plan.monthly}
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full text-lg py-6 border-2 hover:bg-primary/10"
                    disabled={loading || isActive}
                    onClick={() => handleSubscribe(plan.id, plan.yearly, 'yearly')}
                  >
                    {isActive ? 'Current Plan' : !user ? 'Sign In to Subscribe' : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        Subscribe Yearly - ₹{plan.yearly}
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Current Subscription Details */}
        {subscription && currentPlan !== 'free' && (
          <Card className="max-w-3xl mx-auto mt-12 p-8 bg-gradient-to-r from-primary/5 to-purple-500/5 border-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold">Your Subscription</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-background p-4 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Current Plan</div>
                <div className="text-xl font-bold">{subscription.plan.replace('_', ' ').toUpperCase()}</div>
              </div>
              <div className="bg-background p-4 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Billing Cycle</div>
                <div className="text-xl font-bold capitalize">{subscription.billing_cycle}</div>
              </div>
              <div className="bg-background p-4 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Renewal Date</div>
                <div className="text-xl font-bold">
                  {new Date(subscription.expires_at).toLocaleDateString()}
                </div>
              </div>
              <div className="bg-background p-4 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Auto-Renew</div>
                <div className="text-xl font-bold">
                  {subscription.auto_renew ? (
                    <Badge variant="success">Enabled</Badge>
                  ) : (
                    <Badge variant="secondary">Disabled</Badge>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* FAQ / Benefits Section */}
        <div className="max-w-4xl mx-auto mt-16 text-center">
          <h3 className="text-2xl font-bold mb-4">Why Customers Love Premium</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <Target className="w-10 h-10 text-primary mx-auto mb-3" />
              <h4 className="font-bold mb-2">Better Recommendations</h4>
              <p className="text-sm text-muted-foreground">
                AI learns your preferences and suggests the perfect shops and deals
              </p>
            </Card>
            <Card className="p-6">
              <Star className="w-10 h-10 text-primary mx-auto mb-3" />
              <h4 className="font-bold mb-2">Early Access</h4>
              <p className="text-sm text-muted-foreground">
                Get notified about exclusive deals before anyone else
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Premium;

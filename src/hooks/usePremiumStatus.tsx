import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const usePremiumStatus = (userId?: string) => {
  const [isPremium, setIsPremium] = useState(false);
  const [plan, setPlan] = useState<string>('free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const checkPremiumStatus = async () => {
      const { data } = await supabase
        .from('subscriptions')
        .select('plan, status, expires_at')
        .eq('user_id', userId)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (data) {
        setIsPremium(data.plan !== 'free');
        setPlan(data.plan);
      }
      setLoading(false);
    };

    checkPremiumStatus();
  }, [userId]);

  return { isPremium, plan, loading };
};

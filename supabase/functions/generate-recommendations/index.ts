import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    // Require authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claims?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { userId, userLocation, userPreferences } = await req.json();

    const supabaseClient = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );


    // Fetch shops
    const { data: shops, error: shopsError } = await supabaseClient
      .from('shops')
      .select('*, offers(*), reviews(rating)')
      .eq('verified', true);

    if (shopsError) throw shopsError;

    // Calculate scores for each shop
    const scoredShops = shops?.map((shop: any) => {
      let score = 0;
      
      // Rating weight (40%)
      score += (shop.rating / 5) * 40;
      
      // Review count weight (20%)
      const reviewWeight = Math.min(shop.review_count / 100, 1) * 20;
      score += reviewWeight;
      
      // Active offers weight (20%)
      const activeOffers = shop.offers?.filter((o: any) => 
        new Date(o.end_at) > new Date() && o.active
      ).length || 0;
      score += Math.min(activeOffers / 3, 1) * 20;
      
      // Distance weight (20%) - closer is better
      if (userLocation) {
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          shop.latitude,
          shop.longitude
        );
        const distanceScore = Math.max(0, 1 - (distance / 5)) * 20;
        score += distanceScore;
      }

      return { ...shop, score };
    }) || [];

    // Sort by score and get top recommendations
    const recommendations = scoredShops
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    // Generate AI insights
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const openAiApiKey = Deno.env.get('OPENAI_API_KEY');

    let apiKey = '';
    let apiUrl = '';
    let apiModel = 'google/gemini-2.5-flash';

    if (geminiApiKey) {
      apiKey = geminiApiKey;
      apiUrl = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
      apiModel = 'gemini-2.5-flash';
    } else if (openAiApiKey) {
      apiKey = openAiApiKey;
      apiUrl = 'https://api.openai.com/v1/chat/completions';
      apiModel = 'gpt-4o-mini';
    } else if (LOVABLE_API_KEY) {
      apiKey = LOVABLE_API_KEY;
      apiUrl = 'https://ai.gateway.lovable.dev/v1/chat/completions';
      apiModel = 'google/gemini-2.5-flash';
    } else {
      throw new Error('No API key configured (GEMINI_API_KEY, OPENAI_API_KEY, or LOVABLE_API_KEY)');
    }

    const prompt = `Based on these ${recommendations.length} top-rated local shops with ratings between ${Math.min(...recommendations.map((s: any) => s.rating))} and ${Math.max(...recommendations.map((s: any) => s.rating))}, provide a brief, friendly insight (max 50 words) about why these are great local picks. Focus on variety, quality, and community value.`;

    const aiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: apiModel,
        messages: [
          { role: 'system', content: 'You are a helpful local community assistant. Be warm, concise, and enthusiastic about supporting local businesses.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    let aiInsight = '';
    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      aiInsight = aiData.choices[0]?.message?.content || '';
    }

    return new Response(
      JSON.stringify({ recommendations, aiInsight }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-recommendations:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

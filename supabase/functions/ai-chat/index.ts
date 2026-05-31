import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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

    const { message } = await req.json();
    console.log('Received message:', message);

    const supabase = createClient(supabaseUrl, supabaseKey);


    // Fetch context data from database
    const { data: shops } = await supabase
      .from('shops')
      .select('id, name, category, subcategory, rating, verified, latitude, longitude')
      .eq('verified', true)
      .limit(20);

    const { data: offers } = await supabase
      .from('offers')
      .select('title, discount_value, shop_id, shops(name)')
      .eq('active', true)
      .gte('end_at', new Date().toISOString())
      .limit(10);

    const { data: jobs } = await supabase
      .from('jobs')
      .select('title, job_type, wage, shop_id, shops(name, category)')
      .eq('active', true)
      .limit(10);

    // Build enhanced context for AI
    const contextData = {
      shops: shops || [],
      activeOffers: offers || [],
      availableJobs: jobs || [],
      totalShops: shops?.length || 0,
      categories: [...new Set(shops?.map(s => s.category) || [])],
      topRatedShops: shops?.filter(s => s.rating >= 4.5).slice(0, 5) || [],
    };

    const systemPrompt = `You are the Re:Local Assistant, a knowledgeable and friendly AI helping users discover local shops, exclusive deals, and job opportunities in their community.

🎯 Your Mission: Connect users with the best local businesses and opportunities.

📊 Live Data Available:
- ${contextData.totalShops} verified local shops
- ${contextData.categories.join(', ')} categories
- ${contextData.activeOffers.length} active deals and special offers
- ${contextData.availableJobs.length} available job openings
- Top-rated shops: ${contextData.topRatedShops.map(s => s.name).join(', ')}

💡 Response Guidelines:
- Be conversational, warm, and enthusiastic
- Recommend specific shops by name when relevant
- Highlight current deals and offers
- Provide job details when asked about employment
- Use emojis to make responses engaging
- Keep responses concise (2-3 sentences max)
- Always mention premium benefits when discussing subscriptions

🌟 Premium Features to Promote:
- Customer Premium (₹99/mo): Ad-free, early deals, AI recommendations
- Shop Premium (₹299/mo): Priority placement, analytics, unlimited listings

Available Data Context:
${JSON.stringify(contextData, null, 2)}`;

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';

    console.log('AI response generated successfully');

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-chat function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

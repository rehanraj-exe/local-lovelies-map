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
    const { message } = await req.json();
    console.log('Received message:', message);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
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

    // Build context for AI
    const contextData = {
      shops: shops || [],
      activeOffers: offers || [],
      availableJobs: jobs || [],
    };

    const systemPrompt = `You are the Re:Local Assistant, a helpful AI that helps users discover local shops, deals, and job opportunities in their area.

Available Data:
- ${contextData.shops.length} verified shops across categories like ${[...new Set(contextData.shops.map(s => s.category))].join(', ')}
- ${contextData.activeOffers.length} active offers and deals
- ${contextData.availableJobs.length} job openings

When users ask about shops, deals, or jobs, provide specific recommendations based on the available data. Be friendly, concise, and helpful. Use emojis to make responses engaging.

Current data context:
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

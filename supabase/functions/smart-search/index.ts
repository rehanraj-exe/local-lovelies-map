import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    
    if (!query || query.trim() === '') {
      throw new Error('No search query provided');
    }

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

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch shops data
    const { data: shops, error: shopsError } = await supabase
      .from('shops')
      .select('id, name, category, subcategory, description, tags, address')
      .eq('verified', true);

    if (shopsError) throw shopsError;

    // Fetch products data
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, shop_id, name, description, price, category, in_stock')
      .eq('in_stock', true);

    if (productsError) throw productsError;

    console.log(`Analyzing search query "${query}" against ${shops.length} shops and ${products?.length || 0} products...`);

    const systemPrompt = `You are a local shop and product search semantic matching assistant.
Your job is to match the user's natural language search query against a database of local shops and products.

The user query can be natural language and include price filters (e.g. "under 1000", "less than 500", "below 200"), semantic categorizations, or specific necessities (e.g. "rain coat", "something sweet to eat", "running shoes").

Analyze the provided list of shops and products and return a JSON object with two fields:
1. matches: an array of matched shops, where each item has:
   - id: the UUID of the shop
   - score: a float score from 0.0 to 1.0 (relevance of the match)
   - reason: a short 1-sentence explanation of why this shop is relevant to the query (e.g. "Offers a wide range of footwear suitable for daily use").
2. matchedProducts: an array of matched products, where each item has:
   - id: the UUID of the product
   - score: a float score from 0.0 to 1.0 (relevance of the match)
   - reason: a short 1-sentence explanation of why this product fits the criteria (e.g. "Nike sneakers priced at ₹899, which is under your ₹1000 budget").

Rules:
1. Strict Price Parsing: If the query mentions a price limit (e.g., "under 1000" or "below 500"), you MUST exclude products whose price exceeds that limit, and prioritize products that meet the requirement.
2. Semantic Necessity: Interpret terms like "rain protection" to match umbrellas or raincoats, or "sore throat" to match throat lozenges or honey tea.
3. Score Threshold: Only return shops and products that score 0.4 or higher.
4. Sorting: Sort both arrays by score in descending order.
5. JSON Output: Return ONLY strict JSON in the specified format without markdown blocks.`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: apiModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Search Query: "${query}"\n\nShops:\n${JSON.stringify(shops, null, 2)}\n\nProducts:\n${JSON.stringify(products, null, 2)}` }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiResult = await response.json();
    const analysis = JSON.parse(aiResult.choices[0].message.content);
    
    console.log('Smart search analysis:', analysis);

    return new Response(
      JSON.stringify(analysis),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in smart-search:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error', matches: [], matchedProducts: [] }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

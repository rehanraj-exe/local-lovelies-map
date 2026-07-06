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
    const { image } = await req.json();
    
    if (!image) {
      throw new Error('No image provided');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch shops data
    const { data: shops } = await supabase
      .from('shops')
      .select('id, name, category, subcategory, description, tags')
      .eq('verified', true);

    console.log('Analyzing image for product search...');

    // Use Lovable AI to analyze the image
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a product recognition AI. Analyze the image and return STRICT JSON with:
- guess: a short 2-4 word plain-language guess of what the item is (e.g. "Blue notebook", "Running shoes", "Ceramic coffee mug")
- productName: full product name
- category: broad category (electronics, clothing, food, books, stationery, etc.)
- subcategory: more specific type
- keywords: array of 5-10 relevant search keywords
- description: one short sentence describing the item`

          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'What product is in this image? Provide detailed categorization.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: image
                }
              }
            ]
          }
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
    
    console.log('Image analysis:', analysis);

    // Match shops based on analysis (case-insensitive, keyword-based, scored)
    const kw = [
      analysis.productName,
      analysis.category,
      analysis.subcategory,
      ...(Array.isArray(analysis.keywords) ? analysis.keywords : []),
    ]
      .filter(Boolean)
      .map((s: string) => String(s).toLowerCase());

    const scored = (shops || []).map((shop) => {
      const hay = [
        shop.name,
        shop.category,
        shop.subcategory,
        shop.description,
        ...(Array.isArray(shop.tags) ? shop.tags : []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      let score = 0;
      for (const term of kw) {
        if (!term) continue;
        if (hay.includes(term)) score += term === String(analysis.category).toLowerCase() ? 3 : 2;
      }
      return { shop, score };
    });

    let matchedShops = scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((s) => s.shop);

    // Fallback: if nothing matched, return top shops so the UI isn't empty
    if (matchedShops.length === 0) {
      matchedShops = (shops || []).slice(0, 5);
    }

    return new Response(
      JSON.stringify({
        analysis,
        matches: matchedShops.slice(0, 10),
        matchCount: matchedShops.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in image-search:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

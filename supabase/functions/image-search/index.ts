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
            content: `You are a product recognition AI. Analyze the image and identify:
1. The main product/item in the image
2. Product category (e.g., electronics, clothing, food, books, etc.)
3. Key features or characteristics
4. Relevant keywords

Return a JSON object with: productName, category, subcategory, keywords (array), description.`
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

    // Match shops based on analysis
    const matchedShops = shops?.filter(shop => {
      const categoryMatch = analysis.category && 
        (shop.category?.toLowerCase().includes(analysis.category.toLowerCase()) ||
         shop.subcategory?.toLowerCase().includes(analysis.category.toLowerCase()));
      
      const subcategoryMatch = analysis.subcategory &&
        shop.subcategory?.toLowerCase().includes(analysis.subcategory.toLowerCase());
      
      const keywordMatch = analysis.keywords?.some((keyword: string) =>
        shop.description?.toLowerCase().includes(keyword.toLowerCase()) ||
        shop.tags?.some((tag: string) => tag.toLowerCase().includes(keyword.toLowerCase()))
      );

      return categoryMatch || subcategoryMatch || keywordMatch;
    }) || [];

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

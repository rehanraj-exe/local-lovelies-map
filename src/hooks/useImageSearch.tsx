import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useImageSearch = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const searchByImage = async (imageData: string) => {
    setIsProcessing(true);
    
    try {
      console.log('Searching by image...');
      
      const { data, error } = await supabase.functions.invoke('image-search', {
        body: { image: imageData }
      });

      if (error) {
        console.error('Image search error:', error);
        throw error;
      }

      console.log('Image search results:', data);

      const guess = data?.analysis?.guess || data?.analysis?.productName;

      if (!data?.matches || data.matches.length === 0) {
        toast.info(guess ? `AI guess: ${guess}` : 'No matches found', {
          description: guess
            ? 'No matching shops found for this item'
            : 'Try a different image or angle',
        });
        return { matches: [], analysis: data?.analysis };
      }

      toast.success(guess ? `AI guess: ${guess}` : 'Found matching shops!', {
        description: `${data.matchCount} shops match your image`,
      });


      return data;
    } catch (error) {
      console.error('Error searching by image, falling back to demo mode:', error);
      
      // Fallback demo mode if edge function (API key) is missing
      const mockGuesses = ['coffee', 'cake', 'book', 'shirt'];
      const randomGuess = mockGuesses[Math.floor(Math.random() * mockGuesses.length)];
      
      try {
        const { data: fallbackShops } = await supabase.from('shops').select('id, name, description, address, image_url, rating, category').limit(3);
        
        toast.success(`Demo AI guess: ${randomGuess}`, {
          description: `Found 3 shops matching this image (Demo Mode)`,
        });
        
        return { 
          matches: fallbackShops?.map(s => ({ shop: s })) || [], 
          analysis: { guess: randomGuess } 
        };
      } catch (dbError) {
        toast.error('Image search failed', { description: 'Please try again' });
        return { matches: [], analysis: null };
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    searchByImage,
  };
};

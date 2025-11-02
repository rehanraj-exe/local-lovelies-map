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

      if (!data?.matches || data.matches.length === 0) {
        toast.info('No matches found', {
          description: data?.analysis?.productName 
            ? `Recognized: ${data.analysis.productName}, but no matching shops found`
            : 'Try a different image or angle'
        });
        return { matches: [], analysis: data?.analysis };
      }

      toast.success('Found matching shops!', {
        description: `${data.matchCount} shops match your image`
      });

      return data;
    } catch (error) {
      console.error('Error searching by image:', error);
      toast.error('Image search failed', {
        description: 'Please try again'
      });
      return { matches: [], analysis: null };
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    searchByImage,
  };
};

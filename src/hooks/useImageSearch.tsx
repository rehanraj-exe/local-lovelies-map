import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useImageSearch = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const captureFromCamera = async (): Promise<string | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }
      });
      
      return new Promise((resolve) => {
        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();

        video.onloadedmetadata = () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          setTimeout(() => {
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(video, 0, 0);
            
            stream.getTracks().forEach(track => track.stop());
            
            canvas.toBlob((blob) => {
              if (blob) {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
              } else {
                resolve(null);
              }
            }, 'image/jpeg', 0.8);
          }, 100);
        };
      });
    } catch (error) {
      console.error('Camera error:', error);
      toast.error('Camera access denied', {
        description: 'Please allow camera access to use image search'
      });
      return null;
    }
  };

  const selectFromGallery = async (): Promise<string | null> => {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        } else {
          resolve(null);
        }
      };
      
      input.click();
    });
  };

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
    captureFromCamera,
    selectFromGallery,
    searchByImage,
  };
};

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AIMatch {
  id: string;
  score: number;
  reason: string;
}

export const useSmartSearch = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [aiMatches, setAiMatches] = useState<Record<string, { score: number; reason: string }>>({});
  const [isSmartMode, setIsSmartMode] = useState(false);

  const performSmartSearch = async (query: string) => {
    if (!query || query.trim() === '') {
      setAiMatches({});
      setIsSmartMode(false);
      return null;
    }

    setIsSearching(true);
    setIsSmartMode(true);
    try {
      console.log('Performing AI Smart Search for:', query);
      const { data, error } = await supabase.functions.invoke('smart-search', {
        body: { query }
      });

      if (error) {
        console.error('Smart search function error:', error);
        throw error;
      }

      const matchesArray: AIMatch[] = data?.matches || [];
      console.log('AI Smart search matches:', matchesArray);

      // Convert to dictionary for easy lookup
      const matchesDict: Record<string, { score: number; reason: string }> = {};
      matchesArray.forEach(m => {
        matchesDict[m.id] = { score: m.score, reason: m.reason };
      });

      setAiMatches(matchesDict);

      if (matchesArray.length === 0) {
        toast.info('No semantic matches found', {
          description: 'Try searching for something else or turn off AI search.'
        });
      } else {
        toast.success(`AI Search found ${matchesArray.length} matches!`, {
          description: 'Shops sorted by relevance to your description.'
        });
      }

      return matchesArray;
    } catch (error) {
      console.error('Smart search failed, falling back to standard search:', error);
      // Fallback silently without throwing a disruptive error toast
      setIsSmartMode(false);
      return null;
    } finally {
      setIsSearching(false);
    }
  };

  const clearSmartSearch = () => {
    setAiMatches({});
    setIsSmartMode(false);
  };

  return {
    isSearching,
    aiMatches,
    setAiMatches,
    isSmartMode,
    setIsSmartMode,
    performSmartSearch,
    clearSmartSearch
  };
};

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AIMatch {
  id: string;
  score: number;
  reason: string;
}

export const useSmartSearch = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [aiMatches, setAiMatches] = useState<Record<string, { score: number; reason: string }>>(() => {
    try {
      const saved = sessionStorage.getItem('smartSearch_aiMatches');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [aiProductMatches, setAiProductMatches] = useState<Record<string, { score: number; reason: string }>>(() => {
    try {
      const saved = sessionStorage.getItem('smartSearch_aiProductMatches');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [isSmartMode, setIsSmartMode] = useState(() => sessionStorage.getItem('smartSearch_isSmartMode') === 'true');

  useEffect(() => {
    sessionStorage.setItem('smartSearch_aiMatches', JSON.stringify(aiMatches));
  }, [aiMatches]);

  useEffect(() => {
    sessionStorage.setItem('smartSearch_aiProductMatches', JSON.stringify(aiProductMatches));
  }, [aiProductMatches]);

  useEffect(() => {
    sessionStorage.setItem('smartSearch_isSmartMode', String(isSmartMode));
  }, [isSmartMode]);

  const performSmartSearch = async (query: string) => {
    if (!query || query.trim() === '') {
      setAiMatches({});
      setAiProductMatches({});
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
      const productMatchesArray: AIMatch[] = data?.matchedProducts || [];
      console.log('AI Smart search matches:', matchesArray);
      console.log('AI Smart search product matches:', productMatchesArray);

      // Convert to dictionary for easy lookup
      const matchesDict: Record<string, { score: number; reason: string }> = {};
      matchesArray.forEach(m => {
        matchesDict[m.id] = { score: m.score, reason: m.reason };
      });

      const productMatchesDict: Record<string, { score: number; reason: string }> = {};
      productMatchesArray.forEach(m => {
        productMatchesDict[m.id] = { score: m.score, reason: m.reason };
      });

      setAiMatches(matchesDict);
      setAiProductMatches(productMatchesDict);

      if (matchesArray.length === 0 && productMatchesArray.length === 0) {
        toast.info('No semantic matches found', {
          description: 'Try searching for something else or turn off AI search.'
        });
      } else {
        toast.success(`AI Search found ${matchesArray.length} shops and ${productMatchesArray.length} products!`, {
          description: 'Results sorted by relevance to your description.'
        });
      }

      return { matches: matchesArray, matchedProducts: productMatchesArray };
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
    setAiProductMatches({});
    setIsSmartMode(false);
  };

  return {
    isSearching,
    aiMatches,
    setAiMatches,
    aiProductMatches,
    setAiProductMatches,
    isSmartMode,
    setIsSmartMode,
    performSmartSearch,
    clearSmartSearch
  };
};

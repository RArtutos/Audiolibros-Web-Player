import { useState, useEffect } from 'react';
import { AudiobookData, SearchFilters } from '../types/audiobook';
import { getRandomSeed } from '../utils/random';

const ITEMS_PER_PAGE = 20;

export function useAudiobooks(filters: SearchFilters, page: number = 1) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [audiobooks, setAudiobooks] = useState<AudiobookData>({});
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let mounted = true;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const params = new URLSearchParams({
          page: page.toString(),
          per_page: ITEMS_PER_PAGE.toString(),
          type: filters.type,
          seed: getRandomSeed().toString() // Add daily random seed
        });
        
        if (filters.query) {
          params.append('query', filters.query);
        }
        
        const response = await fetch(`/api/audiobooks?${params}`);
        if (!response.ok) throw new Error('Error loading audiobooks');
        
        const data = await response.json();
        
        if (!mounted) return;
        
        setAudiobooks(data.data);
        setTotalPages(data.pagination.total_pages);
        setTotal(data.pagination.total);
        setError(null);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'An error occurred');
        setAudiobooks({});
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [filters, page]);

  return { audiobooks, loading, error, totalPages, total };
}
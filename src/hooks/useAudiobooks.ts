import { useState, useEffect, useCallback } from 'react';
import { AudiobookData, SearchFilters } from '../types/audiobook';

const API_URL = 'http://localhost:8000/api/audiobooks';
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
          type: filters.type
        });
        
        if (filters.query) {
          params.append('query', filters.query);
        }
        
        const response = await fetch(`${API_URL}?${params}`);
        if (!response.ok) throw new Error('Error al cargar los audiolibros');
        
        const data = await response.json();
        
        if (!mounted) return;
        
        setAudiobooks(data.data);
        setTotalPages(data.pagination.total_pages);
        setTotal(data.pagination.total);
        setError(null);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Ha ocurrido un error');
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
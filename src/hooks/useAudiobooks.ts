import { useState, useEffect } from 'react';
import { AudiobookData, SearchFilters } from '../types/audiobook';

// In development, we'll use the direct path, in production it will be /data/consolidated_data.json
const DATA_URL = import.meta.env.DEV 
  ? '/src/data/consolidated_data.json'
  : '/data/consolidated_data.json';

const ITEMS_PER_PAGE = 20;

export function useAudiobooks(filters: SearchFilters, page: number = 1) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [audiobooks, setAudiobooks] = useState<AudiobookData>({});
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const controller = new AbortController();

    const fetchAudiobooks = async () => {
      setLoading(true);
      try {
        // Fetch only the headers first to get the file size
        const headResponse = await fetch(DATA_URL, {
          method: 'HEAD',
          signal: controller.signal
        });
        
        // Use range requests to get only the needed portion
        const response = await fetch(DATA_URL, {
          signal: controller.signal,
          headers: {
            'Range': `bytes=0-${1024 * 1024 * 10}` // First 10MB only
          }
        });

        if (!response.ok) throw new Error('Error al cargar los audiolibros');

        const reader = response.body?.getReader();
        if (!reader) throw new Error('Stream no disponible');

        let result = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          result += new TextDecoder().decode(value);
          
          // Try to find a complete object
          try {
            const lastBrace = result.lastIndexOf('}');
            if (lastBrace > -1) {
              const data = JSON.parse(result.substring(0, lastBrace + 1));
              
              // Filter and paginate in memory
              const filteredData = Object.entries(data).filter(([_, book]) => {
                if (!filters.query) return true;
                
                const searchTerm = filters.query.toLowerCase();
                switch (filters.type) {
                  case 'title':
                    return book.title.toLowerCase().includes(searchTerm);
                  case 'author':
                    return book.authors.some(author => 
                      (typeof author === 'string' ? author : author.name)
                        .toLowerCase().includes(searchTerm)
                    );
                  case 'narrator':
                    return book.narrators.some(narrator => 
                      (typeof narrator === 'string' ? narrator : narrator.name)
                        .toLowerCase().includes(searchTerm)
                    );
                  case 'genre':
                    return book.genres.some(genre => 
                      genre.toLowerCase().includes(searchTerm)
                    );
                  default:
                    return true;
                }
              });

              const start = (page - 1) * ITEMS_PER_PAGE;
              const end = start + ITEMS_PER_PAGE;
              const paginatedData = Object.fromEntries(filteredData.slice(start, end));

              setAudiobooks(paginatedData);
              setTotalPages(Math.ceil(filteredData.length / ITEMS_PER_PAGE));
              break;
            }
          } catch (e) {
            // Continue reading if we don't have a complete JSON object yet
            continue;
          }
        }
        
        reader.cancel();
        setError(null);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Ha ocurrido un error');
      } finally {
        setLoading(false);
      }
    };

    fetchAudiobooks();

    return () => {
      controller.abort();
    };
  }, [filters, page]);

  return { audiobooks, loading, error, totalPages };
}
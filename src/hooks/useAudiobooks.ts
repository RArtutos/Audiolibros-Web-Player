import { useState, useEffect, useCallback } from 'react';
import { AudiobookData, SearchFilters } from '../types/audiobook';
import { searchIncludes } from '../utils/search';

const ITEMS_PER_PAGE = 20;
const CACHE_KEY = 'audiobooks_cache';
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

interface CachedData {
  timestamp: number;
  data: AudiobookData;
}

export function useAudiobooks(filters: SearchFilters, page: number = 1) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [audiobooks, setAudiobooks] = useState<AudiobookData>({});
  const [totalPages, setTotalPages] = useState(1);
  const [allData, setAllData] = useState<AudiobookData>({});

  // Memoized filter function
  const filterAudiobooks = useCallback((data: AudiobookData) => {
    if (!filters.query) return Object.entries(data);

    const searchTerm = filters.query.toLowerCase();
    return Object.entries(data).filter(([_, book]) => {
      switch (filters.type) {
        case 'title':
          return searchIncludes(book.title, searchTerm);
        case 'author':
          return book.authors.some(author => 
            searchIncludes(typeof author === 'string' ? author : author.name, searchTerm)
          );
        case 'narrator':
          return book.narrators.some(narrator => 
            searchIncludes(typeof narrator === 'string' ? narrator : narrator.name, searchTerm)
          );
        case 'genre':
          return book.genres.some(genre => searchIncludes(genre, searchTerm));
        default:
          return (
            searchIncludes(book.title, searchTerm) ||
            book.authors.some(author => 
              searchIncludes(typeof author === 'string' ? author : author.name, searchTerm)
            ) ||
            book.narrators.some(narrator => 
              searchIncludes(typeof narrator === 'string' ? narrator : narrator.name, searchTerm)
            ) ||
            book.genres.some(genre => searchIncludes(genre, searchTerm))
          );
      }
    });
  }, [filters]);

  // Load data with caching
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Check cache first
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { timestamp, data }: CachedData = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_DURATION) {
            setAllData(data);
            return;
          }
        }

        // Fetch fresh data if cache is invalid or missing
        const response = await fetch('/data/consolidated_data.json');
        if (!response.ok) throw new Error('Error al cargar los audiolibros');
        const data = await response.json();
        
        // Update cache
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          timestamp: Date.now(),
          data
        }));

        setAllData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ha ocurrido un error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Apply filters and pagination
  useEffect(() => {
    if (!Object.keys(allData).length) return;

    try {
      // Filter data
      const filteredData = filterAudiobooks(allData);
      
      // Calculate pagination
      const totalItems = filteredData.length;
      const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
      const start = (page - 1) * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE;
      
      // Get current page data
      const paginatedData = Object.fromEntries(filteredData.slice(start, end));

      setAudiobooks(paginatedData);
      setTotalPages(totalPages);
      setError(null);
    } catch (err) {
      setError('Error al procesar los datos');
    }
  }, [allData, filters, page, filterAudiobooks]);

  return { audiobooks, loading, error, totalPages };
}
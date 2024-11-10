import { useState, useEffect, useCallback } from 'react';
import { AudiobookData, SearchFilters } from '../types/audiobook';
import { searchIncludes } from '../utils/search';

const ITEMS_PER_PAGE = 50;
const INITIAL_LOAD = 200;
const CACHE_PREFIX = 'audiobooks_chunk_';
const METADATA_KEY = 'audiobooks_metadata';

interface ChunkMetadata {
  totalItems: number;
  lastUpdated: number;
  chunkSize: number;
}

export function useAudiobooks(filters: SearchFilters, page: number = 1) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [audiobooks, setAudiobooks] = useState<AudiobookData>({});
  const [totalPages, setTotalPages] = useState(1);
  const [metadata, setMetadata] = useState<ChunkMetadata | null>(null);

  // Load metadata
  useEffect(() => {
    const savedMetadata = localStorage.getItem(METADATA_KEY);
    if (savedMetadata) {
      setMetadata(JSON.parse(savedMetadata));
    }
  }, []);

  // Progressive data loading
  const loadChunk = useCallback(async (chunkIndex: number) => {
    const cacheKey = `${CACHE_PREFIX}${chunkIndex}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const start = chunkIndex * INITIAL_LOAD;
    const end = start + INITIAL_LOAD;
    
    const response = await fetch(`/data/consolidated_data.json`);
    if (!response.ok) throw new Error('Error al cargar los audiolibros');
    
    const reader = response.body?.getReader();
    if (!reader) throw new Error('Error al leer los datos');

    let result = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      result += new TextDecoder().decode(value);
      
      // Parse incrementally to avoid memory issues
      try {
        const chunk = JSON.parse(result);
        const entries = Object.entries(chunk).slice(start, end);
        const chunkData = Object.fromEntries(entries);
        
        // Cache the chunk
        localStorage.setItem(cacheKey, JSON.stringify(chunkData));
        
        // Update metadata if needed
        if (!metadata) {
          const newMetadata: ChunkMetadata = {
            totalItems: Object.keys(chunk).length,
            lastUpdated: Date.now(),
            chunkSize: INITIAL_LOAD
          };
          localStorage.setItem(METADATA_KEY, JSON.stringify(newMetadata));
          setMetadata(newMetadata);
        }
        
        return chunkData;
      } catch {
        // Continue reading if JSON is incomplete
        continue;
      }
    }
    
    return {};
  }, [metadata]);

  // Search implementation
  const searchInChunk = useCallback((chunk: AudiobookData, searchTerm: string, type: SearchFilters['type']) => {
    return Object.entries(chunk).filter(([_, book]) => {
      switch (type) {
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
  }, []);

  // Main data loading and filtering logic
  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Calculate which chunk we need based on the current page
        const chunkIndex = Math.floor((page - 1) * ITEMS_PER_PAGE / INITIAL_LOAD);
        const chunk = await loadChunk(chunkIndex);
        
        if (!mounted) return;

        let filteredData = Object.entries(chunk);
        
        // Apply search if needed
        if (filters.query) {
          filteredData = searchInChunk(chunk, filters.query.toLowerCase(), filters.type);
        }
        
        // Calculate pagination
        const totalItems = metadata?.totalItems || filteredData.length;
        const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
        
        // Get items for current page
        const start = (page - 1) * ITEMS_PER_PAGE % INITIAL_LOAD;
        const end = start + ITEMS_PER_PAGE;
        const paginatedData = Object.fromEntries(filteredData.slice(start, end));

        if (!mounted) return;
        
        setAudiobooks(paginatedData);
        setTotalPages(totalPages);
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

    loadData();

    return () => {
      mounted = false;
    };
  }, [filters, page, loadChunk, metadata, searchInChunk]);

  return { audiobooks, loading, error, totalPages };
}
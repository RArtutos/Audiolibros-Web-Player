import { useState, useEffect, useMemo } from 'react';
import { APP_CONFIG } from '../config/app.config';
import { AudiobookData, SearchFilters } from '../types/audiobook';
import audiobooksData from '../data/consolidated_data.json';
import { searchIncludes } from '../utils/search';

function calculateRelevanceScore(book: any, searchTerm: string): number {
  let score = 0;
  
  if (searchIncludes(book.title, searchTerm)) score += 10;
  if (book.authors.some((author: any) => 
    searchIncludes(typeof author === 'string' ? author : author.name, searchTerm)
  )) score += 5;
  if (book.narrators.some((narrator: any) => 
    searchIncludes(typeof narrator === 'string' ? narrator : narrator.name, searchTerm)
  )) score += 5;
  if (book.genres.some((genre: string) => searchIncludes(genre, searchTerm))) score += 3;

  return score;
}

export function useAudiobooks(filters: SearchFilters, page: number = 1) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [audiobooks, setAudiobooks] = useState<AudiobookData>({});
  const [totalPages, setTotalPages] = useState(1);

  const processedBooks = useMemo(() => {
    const allBooks = Object.entries(audiobooksData);
    
    if (!filters.query) {
      return allBooks.sort(() => Math.random() - 0.5);
    }

    return allBooks
      .filter(([_, book]) => {
        const searchTerm = filters.query.toLowerCase();
        
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
            return book.genres.some(genre => 
              searchIncludes(genre, searchTerm)
            );
          default:
            return (
              searchIncludes(book.title, searchTerm) ||
              book.authors.some(author => 
                searchIncludes(typeof author === 'string' ? author : author.name, searchTerm)
              ) ||
              book.narrators.some(narrator => 
                searchIncludes(typeof narrator === 'string' ? narrator : narrator.name, searchTerm)
              ) ||
              book.genres.some(genre => 
                searchIncludes(genre, searchTerm)
              )
            );
        }
      })
      .sort(([_, a], [__, b]) => {
        const scoreA = calculateRelevanceScore(a, filters.query);
        const scoreB = calculateRelevanceScore(b, filters.query);
        return scoreB - scoreA;
      });
  }, [filters]);

  useEffect(() => {
    setLoading(true);
    
    try {
      const start = (page - 1) * APP_CONFIG.itemsPerPage;
      const end = start + APP_CONFIG.itemsPerPage;
      
      setAudiobooks(Object.fromEntries(processedBooks.slice(start, end)));
      setTotalPages(Math.ceil(processedBooks.length / APP_CONFIG.itemsPerPage));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ha ocurrido un error');
    } finally {
      setLoading(false);
    }
  }, [processedBooks, page]);

  return { audiobooks, loading, error, totalPages };
}
import { useState, useEffect, useCallback } from 'react';
import { Audiobook } from '../types/audiobook';

const FAVORITES_KEY = 'audiobook_favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem(FAVORITES_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = useCallback((bookId: string) => {
    setFavorites(prev => 
      prev.includes(bookId) 
        ? prev.filter(id => id !== bookId)
        : [...prev, bookId]
    );
  }, []);

  const isFavorite = useCallback((bookId: string) => {
    return favorites.includes(bookId);
  }, [favorites]);

  return { favorites, toggleFavorite, isFavorite };
}
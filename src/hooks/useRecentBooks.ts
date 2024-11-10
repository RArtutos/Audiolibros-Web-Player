import { useState, useEffect, useCallback } from 'react';
import { Audiobook } from '../types/audiobook';

const MAX_RECENT_BOOKS = 5;
const RECENT_BOOKS_KEY = 'recent_books';

export function useRecentBooks() {
  const [recentBooks, setRecentBooks] = useState<Audiobook[]>(() => {
    const saved = localStorage.getItem(RECENT_BOOKS_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(RECENT_BOOKS_KEY, JSON.stringify(recentBooks));
  }, [recentBooks]);

  const addRecentBook = useCallback((book: Audiobook) => {
    setRecentBooks(prev => {
      const filtered = prev.filter(b => b.idDownload !== book.idDownload);
      return [book, ...filtered].slice(0, MAX_RECENT_BOOKS);
    });
  }, []);

  const removeRecentBook = useCallback((bookId: string) => {
    setRecentBooks(prev => prev.filter(book => book.idDownload !== bookId));
  }, []);

  return { recentBooks, addRecentBook, removeRecentBook };
}
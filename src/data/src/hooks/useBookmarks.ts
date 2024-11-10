import { useState, useEffect, useCallback } from 'react';

interface Bookmark {
  bookId: string;
  chapter: number;
  timestamp: number;
  note?: string;
  createdAt: number;
}

const BOOKMARKS_KEY = 'audiobook_bookmarks';

export function useBookmarks(bookId?: string) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    const saved = localStorage.getItem(BOOKMARKS_KEY);
    const allBookmarks = saved ? JSON.parse(saved) : [];
    return bookId 
      ? allBookmarks.filter((b: Bookmark) => b.bookId === bookId)
      : allBookmarks;
  });

  useEffect(() => {
    const saved = localStorage.getItem(BOOKMARKS_KEY);
    const allBookmarks = saved ? JSON.parse(saved) : [];
    
    if (bookId) {
      localStorage.setItem(
        BOOKMARKS_KEY,
        JSON.stringify([
          ...allBookmarks.filter((b: Bookmark) => b.bookId !== bookId),
          ...bookmarks
        ])
      );
    } else {
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
    }
  }, [bookmarks, bookId]);

  const addBookmark = useCallback((data: Omit<Bookmark, 'createdAt'>) => {
    setBookmarks(prev => [...prev, { ...data, createdAt: Date.now() }]);
  }, []);

  const removeBookmark = useCallback((timestamp: number) => {
    setBookmarks(prev => prev.filter(b => b.timestamp !== timestamp));
  }, []);

  return { bookmarks, addBookmark, removeBookmark };
}
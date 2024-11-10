import React from 'react';
import { Trash2 } from 'lucide-react';
import { useBookmarks } from '../hooks/useBookmarks';
import { Format } from '../types/audiobook';

interface BookmarksListProps {
  bookId: string;
  format: Format;
  onSelect: (timestamp: number) => void;
}

export default function BookmarksList({ bookId, format, onSelect }: BookmarksListProps) {
  const { bookmarks, removeBookmark } = useBookmarks(bookId);

  const formatTime = (timestamp: number) => {
    const hours = Math.floor(timestamp / 3600);
    const minutes = Math.floor((timestamp % 3600) / 60);
    const seconds = Math.floor(timestamp % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getChapterTitle = (chapterIndex: number) => {
    const chapter = format.chapters[chapterIndex];
    return chapter.title?.trim() ? chapter.title : `Capítulo ${chapter.number}`;
  };

  if (bookmarks.length === 0) {
    return (
      <div className="text-center py-4 text-textSecondary">
        No hay marcadores guardados
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {bookmarks
        .sort((a, b) => b.createdAt - a.createdAt)
        .map((bookmark) => (
          <div
            key={bookmark.timestamp}
            className="flex items-center justify-between p-3 bg-background rounded-lg hover:bg-opacity-70"
          >
            <button
              onClick={() => onSelect(bookmark.timestamp)}
              className="flex-1 text-left"
            >
              <div className="font-medium text-text">
                {getChapterTitle(bookmark.chapter)}
              </div>
              <div className="text-sm text-textSecondary">
                {formatTime(bookmark.timestamp)}
              </div>
            </button>
            <button
              onClick={() => removeBookmark(bookmark.timestamp)}
              className="p-2 text-textSecondary hover:text-red-500"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
    </div>
  );
}
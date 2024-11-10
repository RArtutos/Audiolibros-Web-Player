import React from 'react';
import { X, Clock, Headphones } from 'lucide-react';
import { Audiobook } from '../types/audiobook';

interface AudiobookCardProps {
  book: Audiobook;
  onClick: () => void;
  onRemove?: () => void;
  showRemoveButton?: boolean;
}

export default function AudiobookCard({ book, onClick, onRemove, showRemoveButton }: AudiobookCardProps) {
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.();
  };

  return (
    <div 
      onClick={onClick}
      className="group flex flex-col h-full transition-all duration-300 hover:scale-[1.02] cursor-pointer"
    >
      <div className="relative">
        {showRemoveButton && onRemove && (
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 z-10 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-all duration-300"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        )}
        
        <div className="relative aspect-[3/4] overflow-hidden rounded-xl">
          <img
            src={book.cover.url}
            alt={book.title}
            className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
              <div className="flex items-center gap-2 text-sm mb-2">
                <Clock className="w-4 h-4" />
                <span>{book.duration.hours}h {book.duration.minutes}m</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Headphones className="w-4 h-4" />
                <span>{book.narrators[0]?.name || book.narrators[0]}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col flex-grow mt-4 px-2">
        <h3 className="font-semibold text-text">
          {book.title}
        </h3>
        <p className="text-sm text-textSecondary mt-1">
          {book.authors.map(author => 
            typeof author === 'string' ? author : author.name
          ).join(', ')}
        </p>
      </div>
    </div>
  );
}
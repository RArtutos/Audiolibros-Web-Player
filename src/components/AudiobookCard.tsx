import React from 'react';
import { Play } from 'lucide-react';
import { Audiobook } from '../types/audiobook';

interface AudiobookCardProps {
  book: Audiobook;
  onPlay: () => void;
}

export default function AudiobookCard({ book, onPlay }: AudiobookCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105">
      <div className="relative aspect-[3/4]">
        <img
          src={book.cover.url}
          alt={book.title}
          className="w-full h-full object-cover"
        />
        <button
          onClick={onPlay}
          className="absolute bottom-4 right-4 p-3 rounded-full bg-blue-500 text-white hover:bg-blue-600 shadow-lg"
        >
          <Play className="w-6 h-6" />
        </button>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-1">{book.title}</h3>
        <p className="text-gray-600 text-sm line-clamp-2">{book.description}</p>
      </div>
    </div>
  );
}
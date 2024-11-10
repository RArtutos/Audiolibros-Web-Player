import React from 'react';
import { X, Clock, Book, Mic } from 'lucide-react';
import { Audiobook } from '../types/audiobook';
import { APP_CONFIG } from '../config/app.config';

interface AudiobookDetailsProps {
  book: Audiobook;
  onClose: () => void;
  onAuthorClick: (author: string) => void;
  onNarratorClick: (narrator: string) => void;
  onGenreClick: (genre: string) => void;
}

export default function AudiobookDetails({
  book,
  onClose,
  onAuthorClick,
  onNarratorClick,
  onGenreClick
}: AudiobookDetailsProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-1/3">
                <img
                  src={book.cover.url}
                  alt={book.title}
                  className="w-full rounded-lg shadow-lg"
                />
              </div>
              
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">{book.title}</h2>
                
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                  <Clock className="w-4 h-4" />
                  <span>
                    {book.duration.hours}h {book.duration.minutes}m
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-2">
                    <Book className="w-5 h-5 mt-1 text-gray-600" />
                    <div>
                      <h3 className="font-semibold mb-1">Authors</h3>
                      <div className="flex flex-wrap gap-2">
                        {book.authors.map((author, index) => (
                          <button
                            key={index}
                            onClick={() => onAuthorClick(typeof author === 'string' ? author : author.name)}
                            className="text-sm px-3 py-1 bg-gray-100 rounded-full hover:bg-gray-200"
                          >
                            {typeof author === 'string' ? author : author.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Mic className="w-5 h-5 mt-1 text-gray-600" />
                    <div>
                      <h3 className="font-semibold mb-1">Narrators</h3>
                      <div className="flex flex-wrap gap-2">
                        {book.narrators.map((narrator, index) => (
                          <button
                            key={index}
                            onClick={() => onNarratorClick(typeof narrator === 'string' ? narrator : narrator.name)}
                            className="text-sm px-3 py-1 bg-gray-100 rounded-full hover:bg-gray-200"
                          >
                            {typeof narrator === 'string' ? narrator : narrator.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-1">Genres</h3>
                    <div className="flex flex-wrap gap-2">
                      {book.genres.map((genre, index) => (
                        <button
                          key={index}
                          onClick={() => onGenreClick(genre)}
                          className="text-sm px-3 py-1 bg-gray-100 rounded-full hover:bg-gray-200"
                        >
                          {genre}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <p className="mt-4 text-gray-700">{book.description}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
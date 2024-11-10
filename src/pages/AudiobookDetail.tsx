import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X, Clock, Book, Mic } from 'lucide-react';
import { Audiobook } from '../types/audiobook';
import AudioPlayer from '../components/AudioPlayer';
import { usePlaybackState } from '../hooks/usePlaybackState';
import { useRecentBooks } from '../hooks/useRecentBooks';

export default function AudiobookDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<Audiobook | null>(null);
  const [currentChapter, setCurrentChapter] = useState(0);
  const { playbackState, updatePlaybackState, calculateCurrentChapter } = usePlaybackState(id);
  const { addRecentBook } = useRecentBooks();

  const handleMetadataClick = useCallback((type: 'author' | 'narrator' | 'genre', value: string) => {
    navigate('/', { 
      state: { 
        search: value,
        type 
      }
    });
  }, [navigate]);

  useEffect(() => {
    if (!id) return;

    // Fetch the JSON data dynamically
    fetch('/data/consolidated_data.json')
      .then(response => response.json())
      .then(data => {
        const foundBook = Object.values(data).find(book => book.idDownload === id);
        if (foundBook) {
          setBook(foundBook);
          addRecentBook(foundBook);
          
          if (playbackState?.bookId === id) {
            setCurrentChapter(playbackState.chapter);
          }
        }
      })
      .catch(error => {
        console.error('Error loading audiobook data:', error);
      });
  }, [id, addRecentBook, playbackState]);

  useEffect(() => {
    if (playbackState?.bookId === id) {
      setCurrentChapter(playbackState.chapter);
    }
  }, [id, playbackState]);

  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-textSecondary mb-4">Audiobook not found</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-secondary text-white rounded hover:bg-blue-600"
          >
            Return to Library
          </button>
        </div>
      </div>
    );
  }

  const audiobookFormat = book.formats.find(format => format.type === 'abook');
  if (!audiobookFormat) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Scrollable container with extra padding for mobile */}
      <div className="pb-[calc(16rem+env(safe-area-inset-bottom))] sm:pb-48 h-screen overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <button
            onClick={() => navigate('/')}
            className="mb-8 flex items-center gap-2 text-textSecondary hover:text-text"
          >
            <X className="w-5 h-5" />
            <span>Close</span>
          </button>

          <div className="bg-surface rounded-lg shadow-lg p-4 sm:p-6 border border-border mb-8">
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="w-full lg:w-1/3">
                <img
                  src={book.cover.url}
                  alt={book.title}
                  className="w-full rounded-lg shadow-lg"
                />
              </div>

              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-text">{book.title}</h1>

                <div className="flex items-center gap-2 text-sm text-textSecondary mb-6">
                  <Clock className="w-4 h-4" />
                  <span>
                    {book.duration.hours}h {book.duration.minutes}m
                  </span>
                </div>

                <div className="space-y-6">
                  <div className="flex items-start gap-2">
                    <Book className="w-5 h-5 mt-1 text-textSecondary flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2 text-text">Authors</h3>
                      <div className="flex flex-wrap gap-2">
                        {book.authors.map((author, index) => (
                          <button
                            key={index}
                            onClick={() => handleMetadataClick('author', typeof author === 'string' ? author : author.name)}
                            className="px-3 py-1 bg-background rounded-full text-sm text-textSecondary hover:bg-secondary hover:text-white transition-colors"
                          >
                            {typeof author === 'string' ? author : author.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Mic className="w-5 h-5 mt-1 text-textSecondary flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2 text-text">Narrators</h3>
                      <div className="flex flex-wrap gap-2">
                        {book.narrators.map((narrator, index) => (
                          <button
                            key={index}
                            onClick={() => handleMetadataClick('narrator', typeof narrator === 'string' ? narrator : narrator.name)}
                            className="px-3 py-1 bg-background rounded-full text-sm text-textSecondary hover:bg-secondary hover:text-white transition-colors"
                          >
                            {typeof narrator === 'string' ? narrator : narrator.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2 text-text">Genres</h3>
                    <div className="flex flex-wrap gap-2">
                      {book.genres.map((genre, index) => (
                        <button
                          key={index}
                          onClick={() => handleMetadataClick('genre', genre)}
                          className="px-3 py-1 bg-background rounded-full text-sm text-textSecondary hover:bg-secondary hover:text-white transition-colors"
                        >
                          {genre}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6">
                    <h3 className="font-semibold mb-2 text-text">Description</h3>
                    <p className="text-textSecondary text-sm sm:text-base leading-relaxed">{book.description}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Audio player fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0">
        <AudioPlayer
          audioUrl={`https://pelis.gbstream.us.kg/api/v1/redirectdownload/tituloaudilibro.mp3?a=0&id=${book.idDownload}`}
          format={audiobookFormat}
          bookId={id!}
          currentChapter={currentChapter}
          onChapterChange={setCurrentChapter}
          onTimeUpdate={(time) => {
            const chapter = calculateCurrentChapter(audiobookFormat, time);
            if (chapter !== currentChapter) {
              setCurrentChapter(chapter);
            }
            updatePlaybackState({
              chapter,
              timestamp: time
            });
          }}
        />
      </div>
    </div>
  );
}
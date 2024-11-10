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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  const fetchBookData = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/book/${encodeURIComponent(id)}`);
      
      if (!response.ok) {
        throw new Error(response.status === 404 ? 'Audiobook not found' : 'Error loading audiobook');
      }

      const bookData = await response.json();
      setBook(bookData);
      addRecentBook(bookData);

      if (playbackState?.bookId === id) {
        setCurrentChapter(playbackState.chapter);
      }
    } catch (error) {
      console.error('Error loading audiobook:', error);
      setError(error instanceof Error ? error.message : 'Error loading audiobook');
    } finally {
      setLoading(false);
    }
  }, [id, addRecentBook, playbackState]);

  useEffect(() => {
    fetchBookData();
  }, [fetchBookData]);

  useEffect(() => {
    if (playbackState?.bookId === id) {
      setCurrentChapter(playbackState.chapter);
    }
  }, [id, playbackState]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-accent/30 rounded-full animate-pulse-slow"></div>
          <div className="absolute inset-0 border-4 border-accent rounded-full animate-spin" style={{ borderRightColor: 'transparent', animationDuration: '1s' }}></div>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8 glass-effect rounded-2xl max-w-md mx-4">
          <p className="text-red-500 mb-4">{error || 'Audiobook not found'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-xl hover:opacity-90 transition-opacity"
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
          key={`${book.idDownload}-${currentChapter}`}
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
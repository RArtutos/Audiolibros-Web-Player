import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Book, Mic, Heart, Home } from 'lucide-react';
import { Audiobook } from '../types/audiobook';
import AudioPlayer from '../components/AudioPlayer';
import { usePlaybackState } from '../hooks/usePlaybackState';
import { useRecentBooks } from '../hooks/useRecentBooks';
import { useFavorites } from '../hooks/useFavorites';
import { useTheme } from '../hooks/useTheme';

const MAX_RETRIES = 5;
const RETRY_DELAY = 2000; // 2 seconds

export default function AudiobookDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [book, setBook] = useState<Audiobook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const { playbackState, updatePlaybackState, calculateCurrentChapter } = usePlaybackState(id);
  const { addRecentBook } = useRecentBooks();
  const { toggleFavorite, isFavorite } = useFavorites();

  const handleMetadataClick = useCallback((type: 'author' | 'narrator' | 'genre', value: string) => {
    navigate('/', { 
      state: { 
        search: value,
        type 
      }
    });
  }, [navigate]);

  // Fetch book details first
  useEffect(() => {
    let mounted = true;
    
    const fetchBookDetails = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);

        const bookResponse = await fetch(`/api/book/${encodeURIComponent(id)}`);
        if (!bookResponse.ok) {
          throw new Error(bookResponse.status === 404 ? 'Audiolibro no encontrado' : 'Error al cargar el audiolibro');
        }
        const bookData = await bookResponse.json();
        
        if (!mounted) return;
        
        setBook(bookData);
        addRecentBook(bookData);

        if (playbackState?.bookId === id) {
          setCurrentChapter(playbackState.chapter);
        }
      } catch (error) {
        if (!mounted) return;
        console.error('Error:', error);
        setError(error instanceof Error ? error.message : 'Ha ocurrido un error');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchBookDetails();

    return () => {
      mounted = false;
    };
  }, [id, addRecentBook]);

  // Fetch audio URL with retry logic
  const fetchAudioUrl = useCallback(async () => {
    if (!book?.idDownload) return;
    
    try {
      setIsLoadingAudio(true);
      const audioResponse = await fetch(`/api/redirect/${book.idDownload}`);
      if (!audioResponse.ok) {
        throw new Error('Error al cargar la URL del audio');
      }
      const { url } = await audioResponse.json();
      setAudioUrl(url);
      setRetryCount(0); // Reset retry count on success
    } catch (error) {
      console.error('Error loading audio URL:', error);
      if (retryCount < MAX_RETRIES) {
        console.log(`Retrying... Attempt ${retryCount + 1} of ${MAX_RETRIES}`);
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchAudioUrl();
        }, RETRY_DELAY);
      }
    } finally {
      setIsLoadingAudio(false);
    }
  }, [book?.idDownload, retryCount]);

  useEffect(() => {
    if (book) {
      fetchAudioUrl();
    }
  }, [book, fetchAudioUrl]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-accent/30 rounded-full animate-pulse-slow"></div>
          <div className="absolute inset-0 border-4 border-accent rounded-full animate-spin" style={{ borderRightColor: 'transparent', animationDuration: '1s' }}></div>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-xl hover:opacity-90 transition-opacity"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  const audiobookFormat = book.formats.find(f => f.type === 'abook')!;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 pb-40">
        {/* Header */}
        <header className="py-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className={`p-2 hover:bg-surface rounded-xl transition-colors ${theme === 'darker' ? 'text-white' : ''}`}
                title="Volver al inicio"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <button
                onClick={() => navigate('/')}
                className={`p-2 hover:bg-surface rounded-xl transition-colors ${theme === 'darker' ? 'text-white' : ''}`}
                title="Ir al menú principal"
              >
                <Home className="w-6 h-6" />
              </button>
            </div>
            <button
              onClick={() => toggleFavorite(book.idDownload)}
              className={`p-2 rounded-xl transition-colors ${
                isFavorite(book.idDownload)
                  ? 'text-red-500 hover:bg-red-500/10'
                  : 'text-textSecondary hover:bg-surface'
              }`}
            >
              <Heart className={`w-6 h-6 ${isFavorite(book.idDownload) ? 'fill-current' : ''}`} />
            </button>
          </div>
        </header>

        {/* Book details */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* Cover image */}
          <div className="w-full md:w-1/3">
            <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-xl">
              <img
                src={book.cover.url}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-text mb-4">{book.title}</h1>

            <div className="flex items-center gap-6 text-sm text-textSecondary mb-6">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{book.duration.hours}h {book.duration.minutes}m</span>
              </div>
              {book.ratings && (
                <div className="flex items-center gap-1">
                  <span>★</span>
                  <span>{book.ratings.averageRating.toFixed(1)}</span>
                  <span>({book.ratings.numberOfRatings})</span>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {/* Authors */}
              <div className="flex items-start gap-2">
                <Book className="w-5 h-5 mt-1 text-textSecondary" />
                <div>
                  <h3 className="font-medium text-text mb-2">Autores</h3>
                  <div className="flex flex-wrap gap-2">
                    {book.authors.map((author, index) => (
                      <button
                        key={index}
                        onClick={() => handleMetadataClick('author', typeof author === 'string' ? author : author.name)}
                        className="px-3 py-1 bg-surface text-textSecondary rounded-full hover:bg-border transition-colors"
                      >
                        {typeof author === 'string' ? author : author.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Narrators */}
              <div className="flex items-start gap-2">
                <Mic className="w-5 h-5 mt-1 text-textSecondary" />
                <div>
                  <h3 className="font-medium text-text mb-2">Narradores</h3>
                  <div className="flex flex-wrap gap-2">
                    {book.narrators.map((narrator, index) => (
                      <button
                        key={index}
                        onClick={() => handleMetadataClick('narrator', typeof narrator === 'string' ? narrator : narrator.name)}
                        className="px-3 py-1 bg-surface text-textSecondary rounded-full hover:bg-border transition-colors"
                      >
                        {typeof narrator === 'string' ? narrator : narrator.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Genres */}
              <div>
                <h3 className="font-medium text-text mb-2">Géneros</h3>
                <div className="flex flex-wrap gap-2">
                  {book.genres.map((genre, index) => (
                    <button
                      key={index}
                      onClick={() => handleMetadataClick('genre', genre)}
                      className="px-3 py-1 bg-surface text-textSecondary rounded-full hover:bg-border transition-colors"
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="font-medium text-text mb-2">Descripción</h3>
                <p className="text-textSecondary whitespace-pre-line">
                  {book.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Audio player */}
      {audioUrl && (
        <div className="fixed bottom-0 left-0 right-0">
          <AudioPlayer
            audioUrl={audioUrl}
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
            isLoading={isLoadingAudio}
            onRetryAudio={fetchAudioUrl}
          />
        </div>
      )}
    </div>
  );
}
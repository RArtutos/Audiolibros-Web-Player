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
  const [audioUrl, setAudioUrl] = useState<string>('');
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

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch book details
        const bookResponse = await fetch(`http://localhost:8000/api/book/${encodeURIComponent(id)}`);
        if (!bookResponse.ok) {
          throw new Error(bookResponse.status === 404 ? 'Audiobook not found' : 'Error loading audiobook');
        }
        const bookData = await bookResponse.json();
        setBook(bookData);
        addRecentBook(bookData);

        // Fetch audio URL
        const audioResponse = await fetch(`http://localhost:8000/api/redirect/${bookData.idDownload}`);
        if (!audioResponse.ok) {
          throw new Error('Error loading audio URL');
        }
        const { url } = await audioResponse.json();
        setAudioUrl(url);

        if (playbackState?.bookId === id) {
          setCurrentChapter(playbackState.chapter);
        }
      } catch (error) {
        console.error('Error:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, addRecentBook, playbackState]);

  // Rest of the component remains the same until the AudioPlayer
  
  return (
    <div className="min-h-screen bg-background">
      {/* Previous JSX remains the same */}
      
      {/* Audio player fixed at bottom */}
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
        />
      </div>
    </div>
  );
}

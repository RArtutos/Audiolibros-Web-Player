import React, { useEffect, useState } from 'react';
import { AudiobookData, Audiobook } from './types/audiobook';
import AudiobookCard from './components/AudiobookCard';
import AudioPlayer from './components/AudioPlayer';
import SearchBar from './components/SearchBar';
import { Library } from 'lucide-react';
import audiobooksData from './data/consolidated_data.json';

export default function App() {
  const [audiobooks, setAudiobooks] = useState<AudiobookData>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [currentBook, setCurrentBook] = useState<Audiobook | null>(null);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setAudiobooks(audiobooksData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load audiobooks. Please try again later.');
      setLoading(false);
    }
  }, []);

  const normalizeString = (str: string) => {
    return str.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/gi, '');
  };

  const filteredBooks = Object.entries(audiobooks).filter(([key, book]) =>
    normalizeString(book.title).includes(normalizeString(searchQuery)) ||
    normalizeString(key).includes(normalizeString(searchQuery))
  );

  const handlePlay = (book: Audiobook) => {
    setCurrentBook(book);
    setCurrentChapter(0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const audiobookFormat = currentBook?.formats.find(format => format.type === 'abook');

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <header className="bg-white shadow-sm mb-8">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Library className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Audiobook Library</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredBooks.map(([key, book]) => (
            <AudiobookCard
              key={key}
              book={book}
              onPlay={() => handlePlay(book)}
            />
          ))}
        </div>

        {filteredBooks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No audiobooks found matching your search.</p>
          </div>
        )}
      </main>

      {currentBook && audiobookFormat && (
        <AudioPlayer
          audioUrl={`https://pelis.gbstream.us.kg/api/v1/redirectdownload/tituloaudilibro.mp3?a=0&id=${currentBook.idDownload}`}
          format={audiobookFormat}
          currentChapter={currentChapter}
          onChapterChange={setCurrentChapter}
        />
      )}
    </div>
  );
}
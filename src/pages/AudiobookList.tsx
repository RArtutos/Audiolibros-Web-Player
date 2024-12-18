import React, { useState, useEffect, useCallback } from 'react';
import { Library, Search, Sun, Moon, Sunset } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SearchFilters } from '../types/audiobook';
import AudiobookCard from '../components/AudiobookCard';
import { useAudiobooks } from '../hooks/useAudiobooks';
import { useRecentBooks } from '../hooks/useRecentBooks';
import { useTheme } from '../hooks/useTheme';
import { debounce } from '../utils/search';
import Pagination from '../components/Pagination';

export default function AudiobookList() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const [searchInput, setSearchInput] = useState('');
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: '',
    type: 'all'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const { recentBooks, removeRecentBook } = useRecentBooks();
  
  const { audiobooks, loading, error, totalPages, total } = useAudiobooks(searchFilters, currentPage);

  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setSearchFilters(prev => ({ ...prev, query: value }));
      setCurrentPage(1);
    }, 300),
    []
  );

  useEffect(() => {
    if (location.state?.search && location.state?.type) {
      const { search, type } = location.state;
      setSearchInput(search);
      setSearchFilters({ query: search, type });
      setCurrentPage(1);
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate]);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    debouncedSearch(value);
  };

  const handleFilterChange = (type: SearchFilters['type']) => {
    setSearchFilters(prev => ({ ...prev, type }));
    setCurrentPage(1);
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8 glass-effect rounded-2xl max-w-md mx-4">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-xl hover:opacity-90 transition-opacity"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-surface/80 shadow-lg mb-8 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col gap-4 sm:gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-primary to-accent rounded-xl">
                  <Library className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-accent text-transparent bg-clip-text">
                  Biblioteca de Audiolibros
                </h1>
              </div>

              <div className="flex items-center gap-2 sm:ml-auto">
                <button
                  onClick={() => setTheme('light')}
                  className={`p-2 rounded-xl transition-all ${theme === 'light' ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-accent/25' : 'text-textSecondary hover:bg-surface'}`}
                >
                  <Sun className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`p-2 rounded-xl transition-all ${theme === 'dark' ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-accent/25' : 'text-textSecondary hover:bg-surface'}`}
                >
                  <Moon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setTheme('darker')}
                  className={`p-2 rounded-xl transition-all ${theme === 'darker' ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-accent/25' : 'text-textSecondary hover:bg-surface'}`}
                >
                  <Moon className="w-5 h-5 fill-current" />
                </button>
                <button
                  onClick={() => setTheme('sepia')}
                  className={`p-2 rounded-xl transition-all ${theme === 'sepia' ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-accent/25' : 'text-textSecondary hover:bg-surface'}`}
                >
                  <Sunset className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchInput}
                    onChange={handleSearchInputChange}
                    placeholder="Buscar audiolibros..."
                    className="block w-full pl-4 pr-4 py-3 border border-border bg-background rounded-xl text-text placeholder-textSecondary focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                  />
                </div>
                <div className="p-3 bg-gradient-to-r from-primary to-accent text-white rounded-xl">
                  <Search className="w-5 h-5" />
                </div>
              </div>

              <div className="flex gap-2 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0">
                {[
                  { id: 'all', label: 'Todo' },
                  { id: 'title', label: 'Título' },
                  { id: 'author', label: 'Autor' },
                  { id: 'narrator', label: 'Narrador' },
                  { id: 'genre', label: 'Género' }
                ].map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => handleFilterChange(id as SearchFilters['type'])}
                    className={`px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-all ${
                      searchFilters.type === id
                        ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-accent/25'
                        : 'bg-background text-textSecondary hover:bg-surface'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pb-12">
        {loading && !Object.keys(audiobooks).length && (
          <div className="flex items-center justify-center py-12">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-accent/30 rounded-full animate-pulse-slow"></div>
              <div className="absolute inset-0 border-4 border-accent rounded-full animate-spin" style={{ borderRightColor: 'transparent', animationDuration: '1s' }}></div>
            </div>
          </div>
        )}

        {recentBooks.length > 0 && !searchFilters.query && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-primary to-accent text-transparent bg-clip-text">
              Escuchados recientemente
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
              {recentBooks.map((book) => (
                <AudiobookCard
                  key={book.idDownload}
                  book={book}
                  onClick={() => navigate(`/book/${book.idDownload}`)}
                  onRemove={() => removeRecentBook(book.idDownload)}
                  showRemoveButton
                />
              ))}
            </div>
          </div>
        )}

        {searchFilters.query && (
          <div className="mb-6 text-textSecondary">
            Se encontraron {total} resultados para "{searchFilters.query}"
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {Object.entries(audiobooks).map(([key, book]) => (
            <AudiobookCard
              key={key}
              book={book}
              onClick={() => navigate(`/book/${book.idDownload}`)}
            />
          ))}
        </div>

        {Object.keys(audiobooks).length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-textSecondary">No se encontraron audiolibros que coincidan con tu búsqueda.</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-12">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </main>
    </div>
  );
}
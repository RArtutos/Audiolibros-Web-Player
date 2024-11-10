import { useState, useEffect } from 'react';
import { PlaybackState, Format } from '../types/audiobook';
import { APP_CONFIG } from '../config/app.config';
import { calculateChapterStart } from '../utils/time';

export function usePlaybackState(bookId?: string) {
  const [playbackState, setPlaybackState] = useState<PlaybackState | null>(() => {
    const saved = localStorage.getItem(APP_CONFIG.cacheKeys.playbackState);
    const state = saved ? JSON.parse(saved) : null;
    return state && (!bookId || state.bookId === bookId) ? state : null;
  });

  useEffect(() => {
    if (playbackState) {
      localStorage.setItem(
        APP_CONFIG.cacheKeys.playbackState,
        JSON.stringify(playbackState)
      );
    }
  }, [playbackState]);

  const updatePlaybackState = (state: Partial<PlaybackState>) => {
    setPlaybackState(prev => {
      if (!prev && !bookId) return null;
      return {
        ...prev,
        bookId: bookId || prev?.bookId || '',
        ...state,
        lastPlayed: Date.now()
      };
    });
  };

  const calculateCurrentChapter = (format: Format, currentTime: number) => {
    let totalDuration = 0;
    for (let i = 0; i < format.chapters.length; i++) {
      totalDuration += format.chapters[i].durationInSeconds;
      if (totalDuration > currentTime) {
        return i;
      }
    }
    return format.chapters.length - 1;
  };

  const clearPlaybackState = () => {
    localStorage.removeItem(APP_CONFIG.cacheKeys.playbackState);
    setPlaybackState(null);
  };

  return {
    playbackState,
    updatePlaybackState,
    calculateCurrentChapter,
    clearPlaybackState
  };
}
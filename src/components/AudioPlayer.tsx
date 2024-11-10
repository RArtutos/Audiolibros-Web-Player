import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Moon, AlertCircle } from 'lucide-react';
import { Format } from '../types/audiobook';
import { useAudioPlayer } from '../hooks/useAudioPlayer';

interface AudioPlayerProps {
  audioUrl: string;
  format: Format;
  bookId: string;
  currentChapter: number;
  onChapterChange: (chapter: number) => void;
  onTimeUpdate?: (time: number) => void;
}

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const SLEEP_TIMER_OPTIONS = [
  { label: '15 minutos', value: 15 },
  { label: '30 minutos', value: 30 },
  { label: '45 minutos', value: 45 },
  { label: '60 minutos', value: 60 }
];

export default function AudioPlayer({
  audioUrl,
  format,
  bookId,
  currentChapter = 0,
  onChapterChange,
  onTimeUpdate
}: AudioPlayerProps) {
  const {
    isPlaying,
    currentTime,
    duration,
    volume,
    playbackSpeed,
    sleepTimer,
    sleepTimerEnd,
    loadError,
    retryCount,
    hasChapters,
    totalDuration,
    togglePlayPause,
    handleProgressChange,
    handleVolumeChange,
    handleSpeedChange,
    handleSleepTimer,
    retry
  } = useAudioPlayer(audioUrl, format, currentChapter, onChapterChange, onTimeUpdate);

  let overallProgress;
  let remainingTime;

  if (hasChapters) {
    const previousChaptersDuration = format.chapters
      .slice(0, currentChapter)
      .reduce((acc, chapter) => acc + chapter.durationInSeconds, 0);
    overallProgress = ((previousChaptersDuration + currentTime) / totalDuration) * 100;
    remainingTime = (totalDuration - (previousChaptersDuration + currentTime)) / playbackSpeed;
  } else {
    overallProgress = (currentTime / totalDuration) * 100;
    remainingTime = (totalDuration - currentTime) / playbackSpeed;
  }

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getChapterTitle = (chapter: Format['chapters'][0]) => {
    return chapter.title?.trim() ? chapter.title : `Capítulo ${chapter.number}`;
  };

  const getRemainingTimerTime = () => {
    if (!sleepTimerEnd) return null;
    const remaining = Math.max(0, Math.floor((sleepTimerEnd - Date.now()) / 1000));
    return formatTime(remaining);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-surface shadow-lg border-t border-border">
      <div className="max-w-7xl mx-auto px-4 py-4">
        {loadError && (
          <div className="flex items-center justify-center gap-2 mb-4 p-2 bg-red-500/10 text-red-500 rounded-lg">
            <AlertCircle className="w-5 h-5" />
            <span>Error al cargar el audio.</span>
            <button
              onClick={retry}
              className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            >
              Reintentar
            </button>
          </div>
        )}

        {retryCount > 0 && !loadError && (
          <div className="flex items-center justify-center gap-2 mb-4 p-2 bg-yellow-500/10 text-yellow-500 rounded-lg">
            <AlertCircle className="w-5 h-5" />
            <span>Reintentando cargar el audio... (Intento {retryCount} de 10)</span>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between text-sm text-textSecondary mb-2">
            <div className="hidden sm:block">
              Progreso total: {Math.round(overallProgress)}%
            </div>
            <div>
              Tiempo restante: {formatTime(remainingTime)} ({playbackSpeed}x)
            </div>
          </div>

          <input
            type="range"
            min="0"
            max={duration}
            value={currentTime}
            onChange={(e) => handleProgressChange(parseFloat(e.target.value))}
            className="w-full"
          />

          <div className="flex flex-col sm:flex-row items-center gap-4">
            {hasChapters && (
              <select
                value={currentChapter}
                onChange={(e) => onChapterChange(Number(e.target.value))}
                className="w-full sm:w-64 rounded-md border-border bg-background text-text shadow-sm focus:border-secondary focus:ring-secondary"
              >
                {format.chapters.map((chapter, index) => (
                  <option key={chapter.number} value={index}>
                    {getChapterTitle(chapter)}
                  </option>
                ))}
              </select>
            )}

            <div className="flex items-center gap-4">
              {hasChapters && (
                <button
                  onClick={() => onChapterChange(currentChapter - 1)}
                  disabled={currentChapter === 0}
                  className="p-2 rounded-full hover:bg-background disabled:opacity-50"
                  type="button"
                >
                  <SkipBack className="w-6 h-6" />
                </button>
              )}

              <button
                onClick={togglePlayPause}
                className="p-3 rounded-full bg-secondary text-white hover:bg-opacity-90"
                type="button"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6" />
                )}
              </button>

              {hasChapters && (
                <button
                  onClick={() => onChapterChange(currentChapter + 1)}
                  disabled={currentChapter === format.chapters.length - 1}
                  className="p-2 rounded-full hover:bg-background disabled:opacity-50"
                  type="button"
                >
                  <SkipForward className="w-6 h-6" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
              <select
                value={playbackSpeed}
                onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                className="rounded-md border-border bg-background text-text shadow-sm focus:border-secondary focus:ring-secondary"
              >
                {PLAYBACK_SPEEDS.map((speed) => (
                  <option key={speed} value={speed}>
                    {speed}x
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-textSecondary" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-24"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    type="button"
                    className={`p-2 rounded-full hover:bg-background ${
                      sleepTimer ? 'text-secondary' : 'text-textSecondary'
                    }`}
                  >
                    <Moon className="w-5 h-5" />
                  </button>
                  {sleepTimer && (
                    <div className="absolute -top-2 -right-2 text-xs bg-secondary text-white px-1 rounded-full">
                      {getRemainingTimerTime()}
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  {SLEEP_TIMER_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleSleepTimer(option.value)}
                      type="button"
                      className={`px-2 py-1 text-sm rounded ${
                        sleepTimer === option.value
                          ? 'bg-secondary text-white'
                          : 'bg-background text-textSecondary hover:bg-opacity-70'
                      }`}
                    >
                      {option.value}'
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-sm text-textSecondary">
                <span>{formatTime(currentTime)}</span>
                <span className="mx-1">/</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Moon, AlertCircle, Loader } from 'lucide-react';
import { Format } from '../types/audiobook';

interface AudioPlayerProps {
  audioUrl: string;
  format: Format;
  bookId: string;
  currentChapter: number;
  onChapterChange: (chapter: number) => void;
  onTimeUpdate?: (time: number) => void;
  isLoading?: boolean;
  onRetryAudio?: () => void;
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
  onTimeUpdate,
  isLoading,
  onRetryAudio
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const adAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);
  const [sleepTimerEnd, setSleepTimerEnd] = useState<number | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isPlayingAd, setIsPlayingAd] = useState(false);
  const reloadCountRef = useRef(0);

  const hasChapters = format.chapters && format.chapters.length > 0;
  const totalDuration = format.durationInMilliseconds / 1000;

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    audio.crossOrigin = "anonymous";
    audio.preload = "auto";

    const adAudio = new Audio('/data/audiolibroAds.mp3');
    adAudioRef.current = adAudio;
    adAudio.preload = "auto";

    // Set initial properties
    audio.volume = volume;
    audio.playbackRate = playbackSpeed;
    adAudio.volume = volume;

    // Event listeners
    const updateTime = () => {
      setCurrentTime(audio.currentTime);
      onTimeUpdate?.(audio.currentTime);
    };

    const updateDuration = () => {
      setDuration(audio.duration);
      setLoadError(false);
      setRetryCount(0);
    };

    const handleError = async () => {
      console.error('Audio error:', audio.error);
      if (retryCount < 3) {
        try {
          setRetryCount(prev => prev + 1);
          onRetryAudio?.();
        } catch (err) {
          console.error('Retry failed:', err);
          setLoadError(true);
        }
      } else {
        setLoadError(true);
      }
    };

    const handleChapterEnd = async () => {
      if (hasChapters && currentChapter < format.chapters.length - 1) {
        // Pause main audio
        audio.pause();
        setIsPlaying(false);
        setIsPlayingAd(true);

        try {
          // Play ad
          await adAudio.play();

          // When ad ends
          adAudio.onended = () => {
            setIsPlayingAd(false);
            // Trigger double reload
            const performDoubleReload = () => {
              if (reloadCountRef.current < 2) {
                reloadCountRef.current += 1;
                window.location.reload();
              } else {
                // Reset counter and continue to next chapter
                reloadCountRef.current = 0;
                onChapterChange(currentChapter + 1);
                audio.play().catch(console.error);
                setIsPlaying(true);
              }
            };
            performDoubleReload();
          };
        } catch (error) {
          console.error('Error playing ad:', error);
          // If ad fails, just move to next chapter
          onChapterChange(currentChapter + 1);
          audio.play().catch(console.error);
          setIsPlaying(true);
        }
      } else {
        setIsPlaying(false);
      }
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('error', handleError);
    audio.addEventListener('ended', handleChapterEnd);

    // Set initial source
    audio.src = audioUrl;
    audio.load();

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('ended', handleChapterEnd);
      audio.pause();
      audio.src = '';
      
      if (adAudioRef.current) {
        adAudioRef.current.pause();
        adAudioRef.current.src = '';
      }
    };
  }, [audioUrl]);

  useEffect(() => {
    if (hasChapters && audioRef.current && format.chapters[currentChapter]) {
      const previousChaptersDuration = format.chapters
        .slice(0, currentChapter)
        .reduce((acc, chapter) => acc + chapter.durationInSeconds, 0);
      audioRef.current.currentTime = previousChaptersDuration;
    }
  }, [currentChapter, format.chapters, hasChapters]);

  useEffect(() => {
    if (sleepTimer && sleepTimerEnd) {
      const timeout = setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.pause();
          setIsPlaying(false);
        }
        setSleepTimer(null);
        setSleepTimerEnd(null);
      }, sleepTimerEnd - Date.now());

      return () => clearTimeout(timeout);
    }
  }, [sleepTimer, sleepTimerEnd]);

  const togglePlayPause = async () => {
    if (!audioRef.current || isLoading || isPlayingAd) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Playback error:', error);
      setLoadError(true);
    }
  };

  const handleProgressChange = (time: number) => {
    if (!audioRef.current || isLoading || isPlayingAd) return;
    
    audioRef.current.currentTime = time;
    setCurrentTime(time);
    
    if (hasChapters) {
      let totalTime = 0;
      for (let i = 0; i < format.chapters.length; i++) {
        totalTime += format.chapters[i].durationInSeconds;
        if (time < totalTime) {
          onChapterChange(i);
          break;
        }
      }
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
      if (adAudioRef.current) {
        adAudioRef.current.volume = newVolume;
      }
      setVolume(newVolume);
    }
  };

  const handleSpeedChange = (speed: number) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
    }
  };

  const handleSleepTimer = (minutes: number) => {
    if (sleepTimer === minutes) {
      setSleepTimer(null);
      setSleepTimerEnd(null);
    } else {
      setSleepTimer(minutes);
      setSleepTimerEnd(Date.now() + minutes * 60 * 1000);
    }
  };

  const retry = () => {
    if (!audioRef.current || isLoading) return;
    
    setLoadError(false);
    setRetryCount(0);
    onRetryAudio?.();
  };

  let overallProgress;
  let remainingTime;
  let currentChapterRemaining;

  if (hasChapters) {
    const previousChaptersDuration = format.chapters
      .slice(0, currentChapter)
      .reduce((acc, chapter) => acc + chapter.durationInSeconds, 0);
    const currentChapterTime = currentTime - previousChaptersDuration;
    const currentChapterDuration = format.chapters[currentChapter].durationInSeconds;
    currentChapterRemaining = (currentChapterDuration - currentChapterTime) / playbackSpeed;
    
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
        {isPlayingAd && (
          <div className="flex items-center justify-center gap-2 mb-4 p-2 bg-secondary/10 text-secondary rounded-lg">
            <span>Reproduciendo anuncio...</span>
          </div>
        )}

        {loadError && (
          <div className="flex items-center justify-center gap-2 mb-4 p-2 bg-red-500/10 text-red-500 rounded-lg">
            <AlertCircle className="w-5 h-5" />
            <span>Error al cargar el audio.</span>
            <button
              onClick={retry}
              className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                'Reintentar'
              )}
            </button>
          </div>
        )}

        {retryCount > 0 && !loadError && (
          <div className="flex items-center justify-center gap-2 mb-4 p-2 bg-yellow-500/10 text-yellow-500 rounded-lg">
            <AlertCircle className="w-5 h-5" />
            <span>Reintentando cargar el audio... (Intento {retryCount} de 3)</span>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between text-sm text-textSecondary mb-2">
            <div className="hidden sm:block">
              Progreso total: {Math.round(overallProgress)}%
            </div>
            <div className="flex flex-col sm:flex-row sm:gap-4 items-end sm:items-center">
              {currentChapterRemaining && (
                <div>
                  Tiempo restante del capítulo: {formatTime(currentChapterRemaining)}
                </div>
              )}
              <div>
                Tiempo restante total: {formatTime(remainingTime)} ({playbackSpeed}x)
              </div>
            </div>
          </div>

          <input
            type="range"
            min="0"
            max={duration}
            value={currentTime}
            onChange={(e) => handleProgressChange(parseFloat(e.target.value))}
            className="w-full"
            disabled={isLoading || isPlayingAd}
          />

          <div className="flex flex-col sm:flex-row items-center gap-4">
            {hasChapters && (
              <select
                value={currentChapter}
                onChange={(e) => onChapterChange(Number(e.target.value))}
                className="w-full sm:w-64 rounded-md border-border bg-background text-text shadow-sm focus:border-secondary focus:ring-secondary"
                disabled={isLoading || isPlayingAd}
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
                  disabled={currentChapter === 0 || isLoading || isPlayingAd}
                  className="p-2 rounded-full hover:bg-background disabled:opacity-50"
                  type="button"
                >
                  <SkipBack className="w-6 h-6" />
                </button>
              )}

              <button
                onClick={togglePlayPause}
                className="p-3 rounded-full bg-secondary text-white hover:bg-opacity-90 disabled:opacity-50"
                type="button"
                disabled={isLoading || isPlayingAd}
              >
                {isLoading ? (
                  <Loader className="w-6 h-6 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6" />
                )}
              </button>

              {hasChapters && (
                <button
                  onClick={() => onChapterChange(currentChapter + 1)}
                  disabled={currentChapter === format.chapters.length - 1 || isLoading || isPlayingAd}
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
                disabled={isLoading || isPlayingAd}
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
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    type="button"
                    className={`p-2 rounded-full hover:bg-background ${
                      sleepTimer ? 'text-secondary' : 'text-textSecondary'
                    }`}
                    disabled={isLoading || isPlayingAd}
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
                      disabled={isLoading || isPlayingAd}
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
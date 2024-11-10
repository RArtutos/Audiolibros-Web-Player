import { useState, useRef, useEffect } from 'react';
import { Format } from '../types/audiobook';

export function useAudioPlayer(
  audioUrl: string,
  format: Format,
  currentChapter: number,
  onChapterChange: (chapter: number) => void,
  onTimeUpdate?: (time: number) => void
) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);
  const [sleepTimerEnd, setSleepTimerEnd] = useState<number | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [loadError, setLoadError] = useState(false);

  const hasChapters = format.chapters && format.chapters.length > 0;
  const totalDuration = format.durationInMilliseconds / 1000;

  useEffect(() => {
    // Create audio element
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.volume = volume;
    audio.playbackRate = playbackSpeed;

    // Set up event listeners
    const updateTime = () => {
      setCurrentTime(audio.currentTime);
      onTimeUpdate?.(audio.currentTime);
    };

    const updateDuration = () => {
      setDuration(audio.duration);
      setLoadError(false);
      setRetryCount(0);
    };

    const handleError = () => {
      if (retryCount < 10) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          audio.load();
          if (isPlaying) {
            audio.play().catch(() => {});
          }
        }, 1000);
      } else {
        setLoadError(true);
      }
    };

    const handleEnded = () => {
      if (hasChapters && currentChapter < format.chapters.length - 1) {
        onChapterChange(currentChapter + 1);
      } else {
        setIsPlaying(false);
      }
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('error', handleError);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
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

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          if (retryCount < 10) {
            setRetryCount(prev => prev + 1);
            audioRef.current?.load();
          } else {
            setLoadError(true);
          }
        });
      }
    }
    setIsPlaying(!isPlaying);
  };

  const handleProgressChange = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
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
    setLoadError(false);
    setRetryCount(0);
    if (audioRef.current) {
      audioRef.current.load();
      if (isPlaying) {
        audioRef.current.play().catch(() => {});
      }
    }
  };

  return {
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
  };
}
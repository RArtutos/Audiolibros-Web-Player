import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { Format, Chapter } from '../types/audiobook';

interface AudioPlayerProps {
  audioUrl: string;
  format: Format;
  currentChapter: number;
  onChapterChange: (chapter: number) => void;
}

export default function AudioPlayer({ 
  audioUrl, 
  format,
  currentChapter = 0, 
  onChapterChange 
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    
    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
    };
  }, []);

  useEffect(() => {
    // Update audio time when chapter changes
    if (audioRef.current && format.chapters[currentChapter]) {
      const previousChaptersDuration = format.chapters
        .slice(0, currentChapter)
        .reduce((acc, chapter) => acc + chapter.durationInSeconds, 0);
      audioRef.current.currentTime = previousChaptersDuration;
    }
  }, [currentChapter, format.chapters]);

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handlePreviousChapter = () => {
    if (currentChapter > 0) {
      onChapterChange(currentChapter - 1);
    }
  };

  const handleNextChapter = () => {
    if (currentChapter < format.chapters.length - 1) {
      onChapterChange(currentChapter + 1);
    }
  };

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getChapterTitle = (chapter: Chapter) => {
    return chapter.title?.trim() ? chapter.title : `Capítulo ${chapter.number}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <select
              value={currentChapter}
              onChange={(e) => onChapterChange(Number(e.target.value))}
              className="block w-64 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {format.chapters.map((chapter, index) => (
                <option key={chapter.number} value={index}>
                  {getChapterTitle(chapter)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handlePreviousChapter}
              disabled={currentChapter === 0}
              className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50"
            >
              <SkipBack className="w-6 h-6" />
            </button>

            <button
              onClick={togglePlayPause}
              className="p-3 rounded-full bg-blue-500 text-white hover:bg-blue-600"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6" />
              )}
            </button>

            <button
              onClick={handleNextChapter}
              disabled={currentChapter === format.chapters.length - 1}
              className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50"
            >
              <SkipForward className="w-6 h-6" />
            </button>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600 flex-1 justify-end">
            <span>{formatTime(currentTime)}</span>
            <span>/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={handleNextChapter}
          className="hidden"
        />
      </div>
    </div>
  );
}
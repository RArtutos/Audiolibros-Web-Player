export function formatDuration(duration: { hours: number; minutes: number; seconds: number }) {
  const parts = [];
  
  if (duration.hours > 0) {
    parts.push(`${duration.hours}h`);
  }
  if (duration.minutes > 0 || duration.hours > 0) {
    parts.push(`${duration.minutes}m`);
  }
  if (duration.seconds > 0 || parts.length === 0) {
    parts.push(`${duration.seconds}s`);
  }
  
  return parts.join(' ');
}

export function calculateChapterStart(chapters: { durationInSeconds: number }[], chapterIndex: number): number {
  return chapters
    .slice(0, chapterIndex)
    .reduce((acc, chapter) => acc + chapter.durationInSeconds, 0);
}

export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
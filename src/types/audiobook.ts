export interface Author {
  id?: string;
  name: string;
  deepLink?: string;
}

export interface Narrator {
  id?: string;
  name: string;
  deepLink?: string;
}

export interface Chapter {
  number: number;
  title: string;
  durationInSeconds: number;
  durationInMilliseconds: number;
}

export interface Cover {
  url: string;
  width: number;
  height: number;
}

export interface Duration {
  hours: number;
  minutes: number;
  seconds: number;
}

export interface Format {
  type: string;
  durationInMilliseconds: number;
  chapters: Chapter[];
  cover: Cover;
  takedownDate?: string;
}

export interface Audiobook {
  title: string;
  authors: (string | Author)[];
  narrators: (string | Narrator)[];
  genres: string[];
  description: string;
  language: string;
  idDownload: string;
  formats: Format[];
  duration: Duration;
  cover: Cover;
  originalTitle?: string;
  isAbridged: boolean;
}

export interface AudiobookData {
  [key: string]: Audiobook;
}

export interface PlaybackState {
  bookId: string;
  chapter: number;
  timestamp: number;
  lastPlayed: number;
}

export interface SearchFilters {
  query: string;
  type: 'all' | 'title' | 'author' | 'narrator' | 'genre';
}
export const APP_CONFIG = {
  itemsPerPage: 100,
  cacheKeys: {
    lastPlayed: 'audiobook_last_played',
    playbackState: 'audiobook_playback_state',
    theme: 'preferred_theme'
  },
  themes: {
    light: {
      primary: '#000000',
      secondary: '#3B82F6',
      background: '#F9FAFB',
      surface: '#FFFFFF',
      text: '#1F2937',
      textSecondary: '#6B7280',
      border: '#E5E7EB'
    },
    dark: {
      primary: '#000000',
      secondary: '#3B82F6',
      background: '#111827',
      surface: '#1F2937',
      text: '#F9FAFB',
      textSecondary: '#D1D5DB',
      border: '#374151'
    },
    darker: {
      primary: '#000000',
      secondary: '#3B82F6',
      background: '#000000',
      surface: '#0A0A0A',
      text: '#F9FAFB',
      textSecondary: '#D1D5DB',
      border: '#1F1F1F'
    },
    sepia: {
      primary: '#78350F',
      secondary: '#B45309',
      background: '#FEFCE8',
      surface: '#FEF3C7',
      text: '#78350F',
      textSecondary: '#92400E',
      border: '#FDE68A'
    }
  }
};
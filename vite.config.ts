import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Exclude large data files from the bundle
    rollupOptions: {
      external: [/\/data\/.*\.json$/]
    }
  }
});
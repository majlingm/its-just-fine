import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Always use /its-just-fine/ for base path since we're deploying to GitHub Pages
  base: '/its-just-fine/',
});

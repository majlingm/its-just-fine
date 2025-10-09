import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Use environment variable GITHUB_PAGES for production builds
  // For Electron, always use './' to load relative paths
  base: process.env.GITHUB_PAGES === 'true' ? '/its-just-fine/' : './',
});

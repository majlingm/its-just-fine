import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/core/**', 'src/components/**', 'src/utils/**', 'src/systems/**'],
      exclude: ['**/*.test.js', '**/*.spec.js', '**/*.jsx']
    }
  }
});

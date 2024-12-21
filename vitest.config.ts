import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      include: ['src/**/*.ts'],
      exclude: ['src/**/index.ts', 'src/**/*.d.ts', 'src/**/*.test.ts', 'node_modules/**'],
      reporter: ['html', 'json', 'lcov', 'text']
    },
    globals: true
  }
});

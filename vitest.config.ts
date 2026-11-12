import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  resolve: {
    alias: {
      '@gamenglish/contracts': fileURLToPath(
        new URL('./packages/contracts/src/index.ts', import.meta.url),
      ),
      '@gamenglish/learning': fileURLToPath(
        new URL('./packages/learning/src/index.ts', import.meta.url),
      ),
      '@gamenglish/engine': fileURLToPath(
        new URL('./packages/engine/src/index.ts', import.meta.url),
      ),
    },
  },
  test: { include: ['tests/**/*.test.ts'], environment: 'node' },
});

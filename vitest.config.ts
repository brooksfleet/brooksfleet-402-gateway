import { defineConfig } from 'vitest/config';

export default defineConfig({
  // @x402/next imports the bare `next/server`, which Next's bundler resolves but
  // plain Node ESM does not. Inline it so the alias applies under test.
  resolve: { alias: { 'next/server': 'next/server.js' } },
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
    server: { deps: { inline: ['@x402/next'] } },
  },
});

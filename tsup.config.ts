import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: { index: 'src/index.ts', next: 'src/next.ts', express: 'src/express.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    sourcemap: true,
    target: 'node20',
    // Frameworks and x402 are optional peers — never bundled.
    external: ['next', 'express', /^@x402\//],
  },
  {
    entry: { cli: 'src/cli.ts' },
    format: ['esm'],
    target: 'node20',
    sourcemap: true,
  },
]);

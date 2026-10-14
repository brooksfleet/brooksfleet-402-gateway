import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: { index: 'src/index.ts', next: 'src/next.ts', express: 'src/express.ts' },
    format: ['esm', 'cjs'],
    // tsup's dts build sets baseUrl itself, which TypeScript 6 deprecates.
    dts: { compilerOptions: { ignoreDeprecations: '6.0' } },
    clean: true,
    sourcemap: true,
    target: 'node22',
    // Frameworks and x402 are optional peers — never bundled.
    external: ['next', 'express', /^@x402\//],
  },
  {
    entry: { cli: 'src/cli.ts' },
    format: ['esm'],
    target: 'node22',
    sourcemap: true,
  },
]);

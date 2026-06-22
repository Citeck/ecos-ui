import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  target: 'es2020',
  // Keep runtime deps external — consumers (web / RN) dedupe them.
  external: ['lodash', '@citeck/records-core']
});

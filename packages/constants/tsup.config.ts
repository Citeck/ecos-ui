import { defineConfig } from 'tsup';

export default defineConfig({
  // Each constant module is a subpath export (@citeck/constants/journal, ...).
  entry: ['src/*.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  target: 'es2020'
});

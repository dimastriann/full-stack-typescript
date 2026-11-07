import { resolve } from 'node:path';
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    // Nest dependency injection relies on emitted decorator metadata, which
    // Vite's default esbuild transform does not provide.
    swc.vite({
      module: { type: 'es6' },
      jsc: {
        parser: { syntax: 'typescript', decorators: true },
        transform: {
          legacyDecorator: true,
          decoratorMetadata: true,
        },
        target: 'es2023',
      },
    }),
  ],
  resolve: {
    alias: [
      { find: /^src\/(.*)$/, replacement: resolve(__dirname, 'src') + '/$1' },
      {
        find: /^prisma\/(.*)$/,
        replacement: resolve(__dirname, 'prisma') + '/$1',
      },
      {
        find: /^otplib$/,
        replacement: resolve(__dirname, 'src/test/mocks/otplib.ts'),
      },
    ],
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.spec.ts', 'src/test/**'],
    },
  },
});

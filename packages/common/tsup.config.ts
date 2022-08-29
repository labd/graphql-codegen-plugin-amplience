import graphqlLoaderPlugin from '@luckycatfactory/esbuild-graphql-loader'
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  clean: true,
  splitting: false,
  dts: true,
  sourcemap: true,
  format: ['cjs', 'esm', 'iife'],
  outDir: 'dist',
  esbuildPlugins: [(graphqlLoaderPlugin as any).default()],
})

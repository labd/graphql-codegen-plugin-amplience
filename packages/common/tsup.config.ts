import graphqlLoaderPlugin from '@luckycatfactory/esbuild-graphql-loader'
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  dts: true,
  format: 'esm',
  esbuildPlugins: [(graphqlLoaderPlugin as any).default()],
})

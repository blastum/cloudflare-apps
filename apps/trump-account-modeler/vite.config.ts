import { defineConfig } from 'vite'

export default defineConfig({
  base: '/trump-account-modeler/',
  build: {
    outDir: 'dist',
  },
  test: {
    include: ['src/**/*.test.ts', '../../shared/**/*.test.ts'],
  },
})

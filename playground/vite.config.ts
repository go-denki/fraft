import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    conditions: ['module', 'import', 'default'],
    alias: {
      'node:fs': path.resolve('./src/stubs/node-fs.ts'),
      'node:path': path.resolve('./src/stubs/node-path.ts'),
      'fs': path.resolve('./src/stubs/node-fs.ts'),
      'path': path.resolve('./src/stubs/node-path.ts'),
    },
  },
  server: {
    port: 5173,
  },
});

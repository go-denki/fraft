import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  define: {
    __CLARITY_PROJECT_ID__: JSON.stringify(process.env.FRAFT_PLAYGROUND_PROJECT_ID ?? ''),
  },
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

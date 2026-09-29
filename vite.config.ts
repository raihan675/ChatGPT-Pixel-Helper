import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: process.env.NODE_ENV !== 'production',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        sidepanel: resolve(__dirname, 'sidepanel.html'),
        devtools: resolve(__dirname, 'devtools.html'),
        'devtools-panel': resolve(__dirname, 'devtools-panel.html'),
        options: resolve(__dirname, 'options.html'),
        report: resolve(__dirname, 'report.html'),
        'background/service-worker': resolve(__dirname, 'src/background/service-worker.ts'),
        'content/content-script': resolve(__dirname, 'src/content/content-script.ts'),
        'bridge/page-bridge': resolve(__dirname, 'src/bridge/page-bridge.ts')
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (
            chunkInfo.name === 'background/service-worker' ||
            chunkInfo.name === 'content/content-script' ||
            chunkInfo.name === 'bridge/page-bridge'
          ) {
            return '[name].js';
          }
          return 'assets/[name]-[hash].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  }
});

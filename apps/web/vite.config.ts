import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('@reown') || id.includes('@walletconnect')) return 'wallet-vendor';
          if (id.includes('@supabase')) return 'supabase-vendor';
          return undefined;
        },
      },
    },
  },
});

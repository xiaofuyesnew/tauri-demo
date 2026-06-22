import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue()
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  esbuild: {
    target: 'es2020',
    keepNames: true
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2020'
    }
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.js'),
      name: 'DockManager',
      fileName: (format) => `dock-manager-plugin.${format}.js`,
      formats: ['es', 'umd', 'cjs']
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue',
        },
        banner: '/*! DockManager v1.0.0 | MIT License */'
      }
    },
    sourcemap: true,
    cssCodeSplit: true
  },
  define: {
    __VUE_PROD_DEVTOOLS__: true
  }
})

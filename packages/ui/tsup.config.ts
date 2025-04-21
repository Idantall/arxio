import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  external: [
    'react', 
    'react-dom',
    '@radix-ui/react-select',
    '@radix-ui/react-label',
    '@radix-ui/react-slot',
    '@radix-ui/react-dialog',
    '@radix-ui/react-dropdown-menu',
    '@radix-ui/react-tabs',
    '@radix-ui/react-toast',
    'react-hook-form',
    'class-variance-authority',
    'lucide-react'
  ],
}); 
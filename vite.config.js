import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // 🔴 FIX: Static assets റൂട്ട് പാത്തിൽ നിന്ന് ലോഡ് ആകാൻ ഇത് ചേർത്തു
});
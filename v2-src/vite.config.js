import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({base:'/Brawl-Helper/v2/',plugins:[react()],build:{outDir:'../v2',emptyOutDir:true}});
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
const repositoryRoot = fileURLToPath(new URL('../', import.meta.url))

export function createAppConfig(directory: URL, port: number) {
  const root = fileURLToPath(directory)
  return defineConfig({
    root,
    envDir: repositoryRoot,
    plugins: [react(), tailwindcss()],
    resolve: { alias: { '@': path.join(root, 'src') } },
    server: { port, strictPort: true },
    preview: { port: port + 1000, strictPort: true },
    build: { outDir: 'dist', emptyOutDir: true },
  })
}

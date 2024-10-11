import { defineConfig } from 'vite'

// Replace 'your-username' and 'your-repository' with your actual GitHub username and repository name
export default defineConfig({
  base: '/proto2/', // This should match your GitHub repository m
  build: {
    outDir: 'docs', // Output directory for build files
  },
})
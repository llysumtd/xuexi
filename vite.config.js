import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: '/xuexi/',  // 重要：GitHub Pages 仓库路径
  plugins: [vue()],
  server: {
    port: 3000
  }
})

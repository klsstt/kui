import { defineConfig } from 'vite';
import { resolve } from 'path';

// 使用 import.meta.dirname 获取当前目录 (Node.js 20.11+ 支持)
// 如果需要在更低版本运行，请改回: const __dirname = dirname(fileURLToPath(import.meta.url)); 并恢复相关导入
const __dirname = import.meta.dirname;

export default defineConfig({
  root: 'src', // 以 src 作为根目录
  publicDir: '../public', // 公共资源目录
  base: './', // 相对路径，方便部署到任意子目录
  
  build: {
    outDir: '../dist', // 输出目录
    assetsDir: 'assets', // 静态资源目录
    emptyOutDir: true, // 清空输出目录
    
    // 代码压缩配置
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // 生产环境保留 console
        drop_debugger: false
      }
    },
    
    // 多页应用入口配置
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'src/index.html'),
        home: resolve(__dirname, 'src/home.html'),
        iframe: resolve(__dirname, 'src/iframe.html'),
        introduction: resolve(__dirname, 'src/introduction.html'),
        locked: resolve(__dirname, 'src/locked.html'),
        login: resolve(__dirname, 'src/login.html')
      },
      output: {
        // 自定义 chunk 命名
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    }
  },
  
  server: {
    port: 3000, // 开发服务器端口
    open: true, // 自动打开浏览器
    host: true, // 允许外部访问
    
    // 文件系统访问配置
    fs: {
      // 允许访问项目根目录及其子目录
      allow: [
        '..', // 允许访问父目录
        './src', // 明确允许 src 目录
        './src/template' // 明确允许 template 目录
      ]
    }
  },
  
  css: {
    preprocessorOptions: {
      scss: {
        // 全局 Sass 变量（如需要可在此添加）
      }
    }
  },
  
  // 优化依赖预构建
  optimizeDeps: {
    include: [], // 如有需要预构建的依赖可在此添加
  },
  
  // 处理旧版插件兼容性
  plugins: [],

  // Vitest 测试配置
  test: {
    globals: true, // 全局注册 describe, it, expect 等
    environment: 'jsdom', // 模拟浏览器环境
    setupFiles: './test/setup.js', // 测试初始化文件
    include: ['**/../test/**/*.test.{js,mjs,cjs}'], // 测试文件匹配模式
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.js']
    }
  }
});

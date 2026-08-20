// 龙族世界模拟器 - DeepSeek API CORS 代理服务器
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// 启用 CORS
app.use(cors());

// 解析 JSON 请求体
app.use(express.json());

// 代理到 DeepSeek API
app.use('/v1', createProxyMiddleware({
  target: 'https://api.deepseek.com',
  changeOrigin: true,
  secure: true,
  onProxyReq: (proxyReq, req, res) => {
    // 确保 Host 头正确
    proxyReq.setHeader('Host', 'api.deepseek.com');
    // 日志
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    // 添加 CORS 头
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
  },
  onError: (err, req, res) => {
    console.error('代理错误:', err);
    res.status(500).json({
      error: {
        message: '代理服务器错误: ' + err.message,
        type: 'proxy_error',
      }
    });
  },
}));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', proxy: 'deepseek-api', time: new Date().toISOString() });
});

// 处理 OPTIONS 预检请求
app.options('*', cors());

app.listen(PORT, () => {
  console.log('========================================');
  console.log('  龙族世界模拟器 - DeepSeek API 代理');
  console.log('========================================');
  console.log(`代理地址: http://localhost:${PORT}/v1`);
  console.log(`健康检查: http://localhost:${PORT}/health`);
  console.log('');
  console.log('在应用设置中，将「API代理地址」设为:');
  console.log(`http://localhost:${PORT}/v1`);
  console.log('');
  console.log('按 Ctrl+C 停止服务器');
  console.log('========================================');
});
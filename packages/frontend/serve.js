import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import http from 'http';

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.FRONTEND_PORT || 5173;
const API_URL = process.env.API_URL || 'http://localhost:3000';

// Parse API URL
const apiUrl = new URL(API_URL);

// Proxy API requests to backend (must come before static file serving)
app.use('/api', (req, res) => {
  const targetPath = req.originalUrl;
  const targetUrl = `${API_URL}${targetPath}`;
  
  console.log(`[Proxy] ${req.method} ${targetPath} -> ${targetUrl}`);
  
  // Prepare headers for proxy request
  const headers = {};
  Object.keys(req.headers).forEach((key) => {
    // Skip connection-specific headers
    if (!['connection', 'host', 'content-length'].includes(key.toLowerCase())) {
      headers[key] = req.headers[key];
    }
  });
  headers['host'] = apiUrl.host;
  
  // Create proxy request options
  const proxyOptions = {
    hostname: apiUrl.hostname,
    port: parseInt(apiUrl.port) || (apiUrl.protocol === 'https:' ? 443 : 80),
    path: targetPath,
    method: req.method,
    headers: headers,
  };
  
  // Forward the request
  const proxyReq = http.request(proxyOptions, (proxyRes) => {
    // Copy response headers
    Object.keys(proxyRes.headers).forEach((key) => {
      const value = proxyRes.headers[key];
      if (value) {
        res.setHeader(key, value);
      }
    });
    
    res.statusCode = proxyRes.statusCode;
    proxyRes.pipe(res);
  });
  
  proxyReq.on('error', (err) => {
    console.error('[Proxy Error]', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Proxy error', message: err.message });
    }
  });
  
  // Forward request body
  req.pipe(proxyReq);
});

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle SPA routing - all routes return index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Frontend server running on http://0.0.0.0:${PORT}`);
  console.log(`API proxy configured: /api -> ${API_URL}`);
});

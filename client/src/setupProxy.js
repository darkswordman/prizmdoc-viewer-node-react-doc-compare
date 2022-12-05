const { createProxyMiddleware } = require('http-proxy-middleware');

const options = {
    target: 'http://localhost:8888',
    changeOrigin: true,
    onProxyRes(proxyRes, req, res) {
      proxyRes.headers['Content-Security-Policy'] = "script-src 'self'";
    }
};

module.exports = function(app) {
  app.use(
    '/',
    createProxyMiddleware(options)
  );
};

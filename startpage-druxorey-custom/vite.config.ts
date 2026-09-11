import { defineConfig, Plugin } from 'vite';
import os from 'node:os';

function privateHostIps(): string[] {
  const result: string[] = [];
  for (const entries of Object.values(os.networkInterfaces())) {
    for (const item of entries || []) {
      if (item.family !== 'IPv4' || item.internal) continue;
      if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(item.address)) result.push(item.address);
    }
  }
  return [...new Set(result)];
}

function clientIpPlugin(): Plugin {
  return {
    name: 'client-ip-endpoint',
    configureServer(server) {
      server.middlewares.use('/api/client-ip', (req, res) => {
        const forwarded = req.headers['x-forwarded-for'];
        const forwardedIp = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0]?.trim();
        const remote = (req.socket.remoteAddress || '').replace(/^::ffff:/, '');
        const candidates = privateHostIps();
        const ip = forwardedIp || ((remote && remote !== '127.0.0.1' && remote !== '::1') ? remote : candidates[0] || remote);
        const source = forwardedIp ? 'forwarded' : ((remote && remote !== '127.0.0.1' && remote !== '::1') ? 'client' : candidates.length ? 'host-fallback' : 'loopback');
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ip, source, candidates }));
      });
    }
  };
}

export default defineConfig({
  base: './',
  plugins: [clientIpPlugin()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  }
});

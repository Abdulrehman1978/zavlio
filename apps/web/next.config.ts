import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  agentRules: false,
  allowedDevOrigins: ['127.0.0.1', 'localhost', '127.0.0.1:3100', 'localhost:3100'],
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: ['@zavlio/analytics', '@zavlio/config', '@zavlio/ui', '@zavlio/validation'],
  async headers() {
    const headers = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'X-Frame-Options', value: 'DENY' },
    ];
    if (process.env.NODE_ENV === 'production')
      headers.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains',
      });
    return [{ source: '/(.*)', headers }];
  },
};

export default nextConfig;

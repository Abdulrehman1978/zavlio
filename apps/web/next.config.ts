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
      {
        key: 'Content-Security-Policy-Report-Only',
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com data:",
          "img-src 'self' data: https: blob:",
          "connect-src 'self' https://*.supabase.co https://challenges.cloudflare.com http://127.0.0.1:* http://localhost:* ws://127.0.0.1:* ws://localhost:*",
          "frame-src https://challenges.cloudflare.com",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
        ].join('; '),
      },
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

#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';

const root = resolve(process.cwd());
const appServerDir = join(root, 'apps/web/.next/server/app');

const publicRoutes = [
  { path: '/', file: 'index.html', expectJsonLd: true },
  { path: '/services', file: 'services.html', expectJsonLd: false },
  { path: '/services/strategy', file: 'services/strategy.html', expectJsonLd: true },
  { path: '/services/design', file: 'services/design.html', expectJsonLd: true },
  { path: '/services/technology', file: 'services/technology.html', expectJsonLd: true },
  { path: '/services/growth', file: 'services/growth.html', expectJsonLd: true },
  { path: '/work', file: 'work.html', expectJsonLd: false },
  { path: '/work/kinetiq-systems', file: 'work/kinetiq-systems.html', expectJsonLd: true },
  { path: '/work/aurora-intelligence', file: 'work/aurora-intelligence.html', expectJsonLd: true },
  { path: '/work/strata-commerce', file: 'work/strata-commerce.html', expectJsonLd: true },
  { path: '/work/vanguard-identity', file: 'work/vanguard-identity.html', expectJsonLd: true },
  { path: '/about', file: 'about.html', expectJsonLd: false },
  { path: '/lab', file: 'lab.html', expectJsonLd: false },
  { path: '/lab/spatial-kinematics', file: 'lab/spatial-kinematics.html', expectJsonLd: false },
  {
    path: '/lab/agent-reasoning-graphs',
    file: 'lab/agent-reasoning-graphs.html',
    expectJsonLd: false,
  },
  {
    path: '/lab/container-micro-typography',
    file: 'lab/container-micro-typography.html',
    expectJsonLd: false,
  },
  { path: '/insights', file: 'insights.html', expectJsonLd: false },
  {
    path: '/insights/systems-over-frameworks',
    file: 'insights/systems-over-frameworks.html',
    expectJsonLd: false,
  },
  {
    path: '/insights/restrained-motion-architecture',
    file: 'insights/restrained-motion-architecture.html',
    expectJsonLd: false,
  },
  {
    path: '/insights/first-party-analytics-sovereignty',
    file: 'insights/first-party-analytics-sovereignty.html',
    expectJsonLd: false,
  },
  { path: '/contact', file: 'contact.html', expectJsonLd: false },
  { path: '/start-a-project', file: 'start-a-project.html', expectJsonLd: false },
  { path: '/privacy', file: 'privacy.html', expectJsonLd: false },
  { path: '/terms', file: 'terms.html', expectJsonLd: false },
  { path: '/cookies', file: 'cookies.html', expectJsonLd: false },
  { path: '/robots.txt', file: 'robots.txt.body', isSpecial: true },
  { path: '/sitemap.xml', file: 'sitemap.xml.body', isSpecial: true },
];

console.log(`Starting SEO Crawl & Static HTML Audit for ${publicRoutes.length} public routes...`);

const results = [];
let passedCount = 0;

for (const route of publicRoutes) {
  const filePath = join(appServerDir, route.file);
  const exists = existsSync(filePath);

  if (!exists) {
    results.push({
      route: route.path,
      status: 'FAIL',
      reason: `Static asset ${route.file} not found in build output`,
    });
    continue;
  }

  const content = readFileSync(filePath, 'utf8');

  if (route.isSpecial) {
    if (route.path === '/robots.txt') {
      const hasCrmDisallow = content.includes('Disallow: /crm/');
      const hasSitemap = content.includes('https://zavlio.online/sitemap.xml');
      if (hasCrmDisallow && hasSitemap) {
        passedCount += 1;
        results.push({ route: route.path, status: 'PASS', checks: { hasCrmDisallow, hasSitemap } });
      } else {
        results.push({ route: route.path, status: 'FAIL', reason: 'Missing disallow or sitemap' });
      }
    } else if (route.path === '/sitemap.xml') {
      const hasXmlNs = content.includes('http://www.sitemaps.org/schemas/sitemap/0.9');
      const countUrls = (content.match(/<loc>/g) || []).length;
      if (hasXmlNs && countUrls >= 25) {
        passedCount += 1;
        results.push({ route: route.path, status: 'PASS', urlCount: countUrls });
      } else {
        results.push({
          route: route.path,
          status: 'FAIL',
          reason: 'Invalid sitemap schema or insufficient URLs',
        });
      }
    }
    continue;
  }

  // HTML Checks
  const hasTitle = /<title[^>]*>([^<]+)<\/title>/i.test(content);
  const titleMatch = content.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1] : '';

  const hasDescription =
    /<meta[^>]+name="description"[^>]+content="([^"]+)"/i.test(content) ||
    /<meta[^>]+content="([^"]+)"[^>]+name="description"/i.test(content);

  const hasCanonical =
    /<link[^>]+rel="canonical"[^>]+href="https:\/\/zavlio\.online[^"]*"/i.test(content) ||
    /<link[^>]+href="https:\/\/zavlio\.online[^"]*"[^>]+rel="canonical"/i.test(content);

  const hasOgTitle = /<meta[^>]+property="og:title"/i.test(content);
  const hasOgDescription = /<meta[^>]+property="og:description"/i.test(content);

  const hasJsonLd = /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i.test(
    content,
  );

  const checks = {
    hasTitle,
    title,
    hasDescription,
    hasCanonical,
    hasOgTitle,
    hasOgDescription,
    hasJsonLd: route.expectJsonLd ? hasJsonLd : true,
    noLocalhostLinks:
      !content.includes('http://localhost:3000') && !content.includes('http://127.0.0.1:3000'),
    byteSize: content.length,
  };

  const isAllValid =
    checks.hasTitle &&
    checks.hasDescription &&
    checks.hasCanonical &&
    checks.noLocalhostLinks &&
    (!route.expectJsonLd || hasJsonLd);

  if (isAllValid) {
    passedCount += 1;
    results.push({ route: route.path, status: 'PASS', checks });
  } else {
    results.push({ route: route.path, status: 'FAIL', checks });
  }
}

const auditSummary = {
  timestamp: new Date().toISOString(),
  targetDomain: 'https://zavlio.online',
  totalAudited: publicRoutes.length,
  passed: passedCount,
  failed: publicRoutes.length - passedCount,
  routes: results,
};

const outputPath = resolve(root, 'docs/work/seo-crawl-report.json');
await writeFile(outputPath, JSON.stringify(auditSummary, null, 2), 'utf8');

console.log(`SEO Crawl Audit complete: ${passedCount}/${publicRoutes.length} PASSED.`);
if (passedCount === publicRoutes.length) {
  console.log('STATUS: PASS');
  process.exit(0);
} else {
  console.error('STATUS: FAIL');
  process.exit(1);
}

import type { MetadataRoute } from 'next';
import { PROJECTS, SERVICES, LAB_EXPERIMENTS, INSIGHTS } from '../lib/content';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://zavlio.online';

  const staticRoutes = [
    '',
    '/services',
    '/work',
    '/about',
    '/lab',
    '/insights',
    '/start-a-project',
    '/contact',
    '/privacy',
    '/terms',
    '/cookies',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  const serviceRoutes = SERVICES.map((service) => ({
    url: `${baseUrl}/services/${service.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const projectRoutes = PROJECTS.map((project) => ({
    url: `${baseUrl}/work/${project.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  const labRoutes = LAB_EXPERIMENTS.map((lab) => ({
    url: `${baseUrl}/lab/${lab.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  const insightRoutes = INSIGHTS.map((insight) => ({
    url: `${baseUrl}/insights/${insight.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...serviceRoutes, ...projectRoutes, ...labRoutes, ...insightRoutes];
}

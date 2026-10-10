import type { MetadataRoute } from 'next';
import {
  getResolvedProjects,
  getResolvedServices,
  getResolvedLabProjects,
  getResolvedInsights,
} from '../lib/content-resolver';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://zavlio.online';

  const [projects, services, labExperiments, insights] = await Promise.all([
    getResolvedProjects(),
    getResolvedServices(),
    getResolvedLabProjects(),
    getResolvedInsights(),
  ]);

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

  const serviceRoutes = services.map((service) => ({
    url: `${baseUrl}/services/${service.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const projectRoutes = projects.map((project) => ({
    url: `${baseUrl}/work/${project.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  const labRoutes = labExperiments.map((lab) => ({
    url: `${baseUrl}/lab/${lab.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  const insightRoutes = insights.map((insight) => ({
    url: `${baseUrl}/insights/${insight.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...serviceRoutes, ...projectRoutes, ...labRoutes, ...insightRoutes];
}

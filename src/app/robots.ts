import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/mission-control',
    },
    sitemap: 'https://aditimallick.dev/sitemap.xml', // Placeholder site URL, will adapt to domain
  };
}

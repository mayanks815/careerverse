import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://aditimallick.dev'; // Base URL placeholder
  const planets = ['core', 'education', 'skills', 'experience', 'achievements', 'contact'];

  const planetUrls = planets.map((planet) => ({
    url: `${baseUrl}/planet/${planet}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 1.0,
    },
    ...planetUrls,
  ];
}

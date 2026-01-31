// ============================================
// Source Registry for Research Topics
// Matches database seed data in schema_migration.sql
// ============================================

import type { DataSource } from '@/src/types/research';

/**
 * Source slugs as const for type safety
 */
export const SOURCE_SLUGS = [
  'twitter',
  'bbc',
  'reuters',
  'techcrunch',
  'bloomberg',
  'nyt',
  'guardian',
  'ap-news',
  'al-jazeera',
  'reddit',
] as const;

export type SourceSlug = (typeof SOURCE_SLUGS)[number];

/**
 * Static source registry - matches database seed data
 * Use this for UI rendering when database isn't needed
 */
export const SOURCES: Omit<DataSource, 'id' | 'createdAt'>[] = [
  {
    slug: 'twitter',
    name: 'Twitter',
    icon: 'twitter',
    color: '#1DA1F2',
    searchPattern: 'site:twitter.com OR site:x.com',
    active: true,
  },
  {
    slug: 'bbc',
    name: 'BBC',
    icon: 'globe',
    color: '#B80000',
    searchPattern: 'site:bbc.com/news',
    active: true,
  },
  {
    slug: 'reuters',
    name: 'Reuters',
    icon: 'newspaper',
    color: '#FF8000',
    searchPattern: 'site:reuters.com',
    active: true,
  },
  {
    slug: 'techcrunch',
    name: 'TechCrunch',
    icon: 'cpu',
    color: '#0A9B00',
    searchPattern: 'site:techcrunch.com',
    active: true,
  },
  {
    slug: 'bloomberg',
    name: 'Bloomberg',
    icon: 'trending-up',
    color: '#0A0A0A',
    searchPattern: 'site:bloomberg.com',
    active: true,
  },
  {
    slug: 'nyt',
    name: 'NYT',
    icon: 'newspaper',
    color: '#000000',
    searchPattern: 'site:nytimes.com',
    active: true,
  },
  {
    slug: 'guardian',
    name: 'Guardian',
    icon: 'shield',
    color: '#052962',
    searchPattern: 'site:theguardian.com',
    active: true,
  },
  {
    slug: 'ap-news',
    name: 'AP News',
    icon: 'zap',
    color: '#FF322E',
    searchPattern: 'site:apnews.com',
    active: true,
  },
  {
    slug: 'al-jazeera',
    name: 'Al Jazeera',
    icon: 'globe',
    color: '#FA9000',
    searchPattern: 'site:aljazeera.com',
    active: true,
  },
  {
    slug: 'reddit',
    name: 'Reddit',
    icon: 'message-circle',
    color: '#FF5700',
    searchPattern: 'site:reddit.com',
    active: true,
  },
];

/**
 * Get a source by its slug
 */
export function getSourceBySlug(slug: string): Omit<DataSource, 'id' | 'createdAt'> | undefined {
  return SOURCES.find((s) => s.slug === slug);
}

/**
 * Check if a slug is a valid source slug
 */
export function isValidSourceSlug(slug: string): slug is SourceSlug {
  return SOURCE_SLUGS.includes(slug as SourceSlug);
}

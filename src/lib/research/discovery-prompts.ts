/**
 * Discovery prompts for LLM-powered topic discovery
 *
 * Source-specific prompts that guide Gemini's Google Search grounding
 * to find newsworthy topics from each configured source.
 */

/**
 * System prompt for topic discovery - defines LLM behavior and constraints
 */
export const DISCOVERY_SYSTEM_PROMPT = `You are a news discovery assistant. Your job is to find newsworthy topics from specific news sources.

CRITICAL RULES:
1. Only return URLs that actually exist on the specified source
2. Do not fabricate or guess URLs - use only URLs found via search
3. Each topic must have a verifiable, clickable URL
4. Focus on recent news (within last 48 hours when possible)

For signals, classify as:
- "breaking": Developing story, published in last 24 hours, high urgency
- "trending": High engagement, widely discussed across platforms
- "controversial": Multiple perspectives, disputed claims, public debate

Return your response as a JSON array of topic objects.`;

/**
 * Source-specific prompts that customize discovery for each source's characteristics
 */
export const SOURCE_PROMPTS: Record<string, string> = {
  twitter: `Find newsworthy topics being discussed on Twitter/X.
Focus on: verified accounts, viral news threads, official announcements
Avoid: personal opinions without news value, promotional content, memes`,

  bbc: `Find current news topics from BBC News.
Focus on: world news, breaking stories, investigative journalism
Avoid: entertainment, sport (unless major breaking), lifestyle`,

  reuters: `Find current news topics from Reuters wire service.
Focus on: breaking news, market-moving stories, exclusive reports
Prioritize: first-to-report stories, official announcements`,

  techcrunch: `Find technology and startup news from TechCrunch.
Focus on: funding rounds, product launches, acquisitions, industry analysis
Prioritize: exclusive scoops, breaking tech news`,

  bloomberg: `Find financial and business news from Bloomberg.
Focus on: market-moving news, economic data, corporate announcements
Prioritize: Bloomberg exclusives, breaking financial news`,

  nyt: `Find news topics from The New York Times.
Focus on: breaking news, investigative reports, analysis
Avoid: opinion pieces, reviews, lifestyle content`,

  guardian: `Find news topics from The Guardian.
Focus on: world news, investigative journalism, breaking stories
Avoid: opinion, culture reviews, lifestyle`,

  'ap-news': `Find breaking news from Associated Press.
Focus on: breaking wire news, factual reporting, first reports
Prioritize: AP exclusives, developing stories`,

  'al-jazeera': `Find international news from Al Jazeera.
Focus on: world news, Middle East coverage, breaking stories
Prioritize: exclusive reports, underreported stories`,

  reddit: `Find newsworthy discussions from Reddit.
Focus on: news subreddits, viral discussions about current events
Target subreddits: r/news, r/worldnews, r/technology, r/politics
Avoid: memes, personal stories, non-news content`,
};

/**
 * Build a discovery prompt for a specific source
 *
 * @param source - The source object with slug and optional searchPattern
 * @returns Formatted prompt string for LLM discovery
 */
export function buildDiscoveryPrompt(source: {
  slug: string;
  searchPattern?: string;
}): string {
  const today = new Date().toISOString().split('T')[0];
  const sourcePrompt = SOURCE_PROMPTS[source.slug] || '';

  return `Today's date: ${today}

${sourcePrompt}

Search pattern: ${source.searchPattern || `site:${source.slug}.com`}

Find 3-5 newsworthy topics from this source. Return as JSON array with each topic having:
- title: The headline
- description: 1-2 sentence summary
- url: The actual source URL (must be from this source)
- signals: Array of ["breaking", "trending", "controversial"] that apply

Only include topics with verifiable URLs from the target source.

Example format:
[
  {
    "title": "Example News Headline",
    "description": "Brief description of the news story.",
    "url": "https://example.com/article-url",
    "signals": ["breaking"]
  }
]`;
}

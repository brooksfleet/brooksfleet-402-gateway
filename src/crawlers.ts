/**
 * What a crawler fetches pages for. This, not the operator, decides how it is
 * treated: the same company runs a training crawler you may want to charge and
 * a search agent whose citations bring you visitors.
 */
export type CrawlerPurpose =
  /** Collects pages to train models. The default target of the gateway. */
  | 'training'
  /** Indexes pages so an AI assistant can cite them in answers. */
  | 'ai-search'
  /** Fetches a page because a person asked an assistant to, right now. */
  | 'ai-user'
  /** A classic web search engine. */
  | 'search-engine';

export interface Crawler {
  /** The robots.txt token, also the canonical name. */
  readonly name: string;
  readonly operator: string;
  readonly purpose: CrawlerPurpose;
  /**
   * Case-insensitive substrings of the User-Agent header. Empty for tokens that
   * exist only in robots.txt (Google-Extended, Applebot-Extended): those
   * companies crawl with their search bots and honour the token as an opt-out.
   */
  readonly userAgents: readonly string[];
}

/**
 * Known crawlers, by purpose. Sources are each operator's published crawler
 * documentation. Matching is by User-Agent, which any client can fake — see the
 * README on what that means for enforcement.
 */
export const CRAWLERS: readonly Crawler[] = [
  // --- training ---
  { name: 'GPTBot', operator: 'OpenAI', purpose: 'training', userAgents: ['GPTBot'] },
  { name: 'ClaudeBot', operator: 'Anthropic', purpose: 'training', userAgents: ['ClaudeBot'] },
  {
    name: 'anthropic-ai',
    operator: 'Anthropic',
    purpose: 'training',
    userAgents: ['anthropic-ai'],
  },
  { name: 'CCBot', operator: 'Common Crawl', purpose: 'training', userAgents: ['CCBot'] },
  { name: 'Bytespider', operator: 'ByteDance', purpose: 'training', userAgents: ['Bytespider'] },
  {
    name: 'Meta-ExternalAgent',
    operator: 'Meta',
    purpose: 'training',
    userAgents: ['Meta-ExternalAgent'],
  },
  {
    name: 'cohere-training-data-crawler',
    operator: 'Cohere',
    purpose: 'training',
    userAgents: ['cohere-training-data-crawler'],
  },
  {
    name: 'AI2Bot',
    operator: 'Allen Institute for AI',
    purpose: 'training',
    userAgents: ['AI2Bot'],
  },
  { name: 'Diffbot', operator: 'Diffbot', purpose: 'training', userAgents: ['Diffbot'] },
  {
    name: 'ImagesiftBot',
    operator: 'ImageSift',
    purpose: 'training',
    userAgents: ['ImagesiftBot'],
  },
  { name: 'Timpibot', operator: 'Timpi', purpose: 'training', userAgents: ['Timpibot'] },
  { name: 'omgili', operator: 'Webz.io', purpose: 'training', userAgents: ['omgili'] },
  { name: 'Google-Extended', operator: 'Google', purpose: 'training', userAgents: [] },
  { name: 'Applebot-Extended', operator: 'Apple', purpose: 'training', userAgents: [] },

  // --- AI search ---
  {
    name: 'OAI-SearchBot',
    operator: 'OpenAI',
    purpose: 'ai-search',
    userAgents: ['OAI-SearchBot'],
  },
  {
    name: 'Claude-SearchBot',
    operator: 'Anthropic',
    purpose: 'ai-search',
    userAgents: ['Claude-SearchBot'],
  },
  {
    name: 'PerplexityBot',
    operator: 'Perplexity',
    purpose: 'ai-search',
    userAgents: ['PerplexityBot'],
  },

  // --- AI user-triggered ---
  { name: 'ChatGPT-User', operator: 'OpenAI', purpose: 'ai-user', userAgents: ['ChatGPT-User'] },
  { name: 'Claude-User', operator: 'Anthropic', purpose: 'ai-user', userAgents: ['Claude-User'] },
  {
    name: 'Perplexity-User',
    operator: 'Perplexity',
    purpose: 'ai-user',
    userAgents: ['Perplexity-User'],
  },

  // --- search engines ---
  { name: 'Googlebot', operator: 'Google', purpose: 'search-engine', userAgents: ['Googlebot'] },
  { name: 'Bingbot', operator: 'Microsoft', purpose: 'search-engine', userAgents: ['bingbot'] },
  {
    name: 'DuckDuckBot',
    operator: 'DuckDuckGo',
    purpose: 'search-engine',
    userAgents: ['DuckDuckBot'],
  },
  // After Applebot-Extended in the list on purpose: that one never appears in a
  // User-Agent, so this substring cannot shadow it.
  { name: 'Applebot', operator: 'Apple', purpose: 'search-engine', userAgents: ['Applebot'] },
  { name: 'YandexBot', operator: 'Yandex', purpose: 'search-engine', userAgents: ['YandexBot'] },
];

/** The purposes the gateway charges by default. */
export const DEFAULT_CHARGED_PURPOSES: readonly CrawlerPurpose[] = ['training'];

/** Crawlers of the given purposes. */
export function crawlersFor(purposes: readonly CrawlerPurpose[]): Crawler[] {
  return CRAWLERS.filter((crawler) => purposes.includes(crawler.purpose));
}

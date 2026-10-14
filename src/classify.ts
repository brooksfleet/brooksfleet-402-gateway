import {
  CRAWLERS,
  DEFAULT_CHARGED_PURPOSES,
  type Crawler,
  type CrawlerPurpose,
} from './crawlers.js';

/**
 * The crawler a User-Agent header names, or `undefined` for anything else —
 * browsers, unknown bots, a missing header. A claim, not a proof: any client
 * can send any User-Agent.
 */
export function classifyUserAgent(userAgent: string | null | undefined): Crawler | undefined {
  if (!userAgent) return undefined;
  const ua = userAgent.toLowerCase();
  return CRAWLERS.find((crawler) =>
    crawler.userAgents.some((token) => ua.includes(token.toLowerCase())),
  );
}

/** True when the User-Agent belongs to a crawler of one of the charged purposes. */
export function isChargedCrawler(
  userAgent: string | null | undefined,
  purposes: readonly CrawlerPurpose[] = DEFAULT_CHARGED_PURPOSES,
): boolean {
  const crawler = classifyUserAgent(userAgent);
  return crawler !== undefined && purposes.includes(crawler.purpose);
}

import { CRAWLERS, DEFAULT_CHARGED_PURPOSES, type CrawlerPurpose } from './crawlers.js';

/** One robots.txt group — the same shape Next.js `MetadataRoute.Robots['rules']` takes. */
export interface RobotsRule {
  userAgent: string | string[];
  allow?: string | string[];
  disallow?: string | string[];
}

export interface RobotsOptions {
  /**
   * `allow` (default) lets charged crawlers in so they reach the 402 and can
   * pay; `disallow` asks them to stay away, so only crawlers that ignore
   * robots.txt ever see the 402. Pick `allow` for x402, `disallow` for a block.
   */
  readonly charged?: 'allow' | 'disallow';
  readonly purposes?: readonly CrawlerPurpose[];
}

/**
 * robots.txt groups: everyone allowed, plus — with `charged: 'disallow'` — one
 * group disallowing the charged crawlers by name.
 */
export function robotsRules(options: RobotsOptions = {}): RobotsRule[] {
  const { charged = 'allow', purposes = DEFAULT_CHARGED_PURPOSES } = options;
  const rules: RobotsRule[] = [{ userAgent: '*', allow: '/' }];
  if (charged === 'disallow') {
    const names = CRAWLERS.filter((c) => purposes.includes(c.purpose)).map((c) => c.name);
    rules.push({ userAgent: names, disallow: '/' });
  }
  return rules;
}

function lines(field: string, value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return (Array.isArray(value) ? value : [value]).map((v) => `${field}: ${v}`);
}

/** robots.txt text, for stacks without a framework helper. */
export function renderRobotsTxt(rules: readonly RobotsRule[], sitemap?: string): string {
  const groups = rules.map((rule) =>
    [
      ...lines('User-agent', rule.userAgent),
      ...lines('Allow', rule.allow),
      ...lines('Disallow', rule.disallow),
    ].join('\n'),
  );
  if (sitemap) groups.push(`Sitemap: ${sitemap}`);
  return `${groups.join('\n\n')}\n`;
}

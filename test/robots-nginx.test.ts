import { describe, expect, it } from 'vitest';

import { crawlersFor, nginxMap, renderRobotsTxt, robotsRules } from '../src/index.js';
import { UA } from './agents.js';

describe('robotsRules', () => {
  it('allows everyone by default, so charged crawlers reach the 402', () => {
    expect(robotsRules()).toEqual([{ userAgent: '*', allow: '/' }]);
  });

  it('disallows training crawlers by name, robots-only tokens included', () => {
    const [, group] = robotsRules({ charged: 'disallow' });
    expect(group?.disallow).toBe('/');
    expect(group?.userAgent).toEqual(expect.arrayContaining(['GPTBot', 'Google-Extended']));
    expect(group?.userAgent).not.toContain('Googlebot');
  });
});

describe('renderRobotsTxt', () => {
  it('renders groups and a sitemap', () => {
    const txt = renderRobotsTxt(
      [
        { userAgent: '*', allow: '/' },
        { userAgent: ['GPTBot', 'CCBot'], disallow: '/' },
      ],
      'https://example.com/sitemap.xml',
    );
    expect(txt).toBe(
      'User-agent: *\nAllow: /\n\nUser-agent: GPTBot\nUser-agent: CCBot\nDisallow: /\n\n' +
        'Sitemap: https://example.com/sitemap.xml\n',
    );
  });
});

describe('nginxMap', () => {
  const map = nginxMap();
  const patterns = [...map.matchAll(/^\s+~\*(.+) 1;$/gm)].map((m) => new RegExp(m[1] ?? '', 'i'));

  it('has one line per training user-agent token', () => {
    expect(patterns).toHaveLength(crawlersFor(['training']).flatMap((c) => c.userAgents).length);
    expect(map).toContain('map $http_user_agent $ai_training_crawler {');
  });

  it('matches training crawlers and nothing that must pass', () => {
    const hits = (ua: string) => patterns.some((p) => p.test(ua));
    expect(hits(UA.gptbot) && hits(UA.claudebot) && hits(UA.ccbot)).toBe(true);
    for (const ua of [UA.googlebot, UA.oaiSearch, UA.claudeUser, UA.claudeSearch, UA.browser]) {
      expect(hits(ua)).toBe(false);
    }
  });

  it('rejects a variable name nginx would not accept', () => {
    expect(() => nginxMap({ variable: 'bad-name' })).toThrow(/invalid nginx variable/);
  });
});

import { describe, expect, it } from 'vitest';

import { CRAWLERS, classifyUserAgent, isChargedCrawler } from '../src/index.js';
import { UA } from './agents.js';

describe('classifyUserAgent', () => {
  it.each([
    [UA.gptbot, 'GPTBot', 'training'],
    [UA.claudebot, 'ClaudeBot', 'training'],
    [UA.ccbot, 'CCBot', 'training'],
    [UA.oaiSearch, 'OAI-SearchBot', 'ai-search'],
    [UA.claudeSearch, 'Claude-SearchBot', 'ai-search'],
    [UA.perplexity, 'PerplexityBot', 'ai-search'],
    [UA.chatgptUser, 'ChatGPT-User', 'ai-user'],
    [UA.claudeUser, 'Claude-User', 'ai-user'],
    [UA.googlebot, 'Googlebot', 'search-engine'],
    [UA.bingbot, 'Bingbot', 'search-engine'],
    [UA.applebot, 'Applebot', 'search-engine'],
  ])('%s → %s', (ua, name, purpose) => {
    expect(classifyUserAgent(ua)).toMatchObject({ name, purpose });
  });

  it('returns undefined for browsers and missing headers', () => {
    expect(classifyUserAgent(UA.browser)).toBeUndefined();
    expect(classifyUserAgent('')).toBeUndefined();
    expect(classifyUserAgent(null)).toBeUndefined();
  });

  it('matches case-insensitively', () => {
    expect(classifyUserAgent('gptbot/1.0')?.name).toBe('GPTBot');
  });
});

describe('isChargedCrawler', () => {
  it('charges training crawlers only by default', () => {
    expect(isChargedCrawler(UA.gptbot)).toBe(true);
    for (const ua of [UA.googlebot, UA.oaiSearch, UA.claudeUser, UA.browser]) {
      expect(isChargedCrawler(ua)).toBe(false);
    }
  });

  it('charges the purposes it is given', () => {
    expect(isChargedCrawler(UA.perplexity, ['training', 'ai-search'])).toBe(true);
  });
});

describe('CRAWLERS', () => {
  it('has unique names', () => {
    const names = CRAWLERS.map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('never lets one user-agent token shadow another crawler', () => {
    for (const crawler of CRAWLERS) {
      for (const token of crawler.userAgents) {
        expect(classifyUserAgent(`x ${token}/1.0 x`)?.name).toBe(crawler.name);
      }
    }
  });
});

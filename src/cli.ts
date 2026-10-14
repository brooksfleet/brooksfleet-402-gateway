#!/usr/bin/env node
import { parseArgs } from 'node:util';

import { CRAWLERS, type CrawlerPurpose } from './crawlers.js';
import { nginxMap } from './nginx.js';
import { renderRobotsTxt, robotsRules } from './robots.js';

const PURPOSES: readonly CrawlerPurpose[] = ['training', 'ai-search', 'ai-user', 'search-engine'];

const USAGE = `brooksfleet-402-gateway <command> [options]

Commands:
  nginx     Print the nginx user-agent map (http context, e.g. conf.d/)
  robots    Print robots.txt
  list      List known crawlers and their purpose

Options:
  --purposes <list>   Charged purposes, comma-separated (default: training)
  --variable <name>   nginx variable name (default: ai_training_crawler)
  --disallow          robots: disallow charged crawlers instead of allowing them
  --sitemap <url>     robots: add a Sitemap line
`;

function purposesFrom(value: string | undefined): CrawlerPurpose[] | undefined {
  if (value === undefined) return undefined;
  return value.split(',').map((raw) => {
    const purpose = PURPOSES.find((p) => p === raw.trim());
    if (!purpose) throw new Error(`unknown purpose "${raw}" — one of ${PURPOSES.join(', ')}`);
    return purpose;
  });
}

function main(argv: string[]): number {
  const { positionals, values } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      purposes: { type: 'string' },
      variable: { type: 'string' },
      disallow: { type: 'boolean', default: false },
      sitemap: { type: 'string' },
      help: { type: 'boolean', short: 'h', default: false },
    },
  });
  const purposes = purposesFrom(values.purposes);
  switch (values.help ? 'help' : positionals[0]) {
    case 'nginx':
      process.stdout.write(nginxMap({ variable: values.variable, purposes }));
      return 0;
    case 'robots':
      process.stdout.write(
        renderRobotsTxt(
          robotsRules({ charged: values.disallow ? 'disallow' : 'allow', purposes }),
          values.sitemap,
        ),
      );
      return 0;
    case 'list':
      for (const c of CRAWLERS) {
        process.stdout.write(`${c.purpose.padEnd(14)} ${c.name.padEnd(30)} ${c.operator}\n`);
      }
      return 0;
    default:
      process.stdout.write(USAGE);
      return values.help ? 0 : 1;
  }
}

try {
  process.exitCode = main(process.argv.slice(2));
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}

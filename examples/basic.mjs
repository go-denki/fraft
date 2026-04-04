// basic.mjs — Simple ESM usage
// Run: node examples/basic.mjs

import { FraftClient } from 'fraft';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const client = new FraftClient({
  config: join(__dirname, 'github-repos.yaml'),
});

const repos = await client.run('octocat-repos');
console.log('Octocat repos:\n', JSON.stringify(repos, null, 2));

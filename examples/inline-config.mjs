// inline-config.mjs — Passing a config object instead of a file path
// Useful when you want to generate config programmatically at runtime.
// Run: node examples/inline-config.mjs

import { FraftClient } from '@go-denki/fraft';

function buildConfig(userId) {
  return {
    version: 1,
    baseUrl: 'https://jsonplaceholder.typicode.com',
    requests: {
      userPosts: {
        path: '/posts',
        params: { userId },
        transform: [
          { pick: ['id', 'title'] },
          { rename: { title: 'headline' } },
        ],
      },
      userTodos: {
        path: '/todos',
        params: { userId, completed: false },
        transform: [
          { pick: ['id', 'title', 'completed'] },
        ],
      },
    },
  };
}

// Build config for user #3 at runtime
const client = new FraftClient({ config: buildConfig(3) });

// Run all requests at once
const results = await client.runAll();

console.log(`Posts for user 3 (${results.userPosts.length} total):`);
console.log(JSON.stringify(results.userPosts.slice(0, 3), null, 2));

console.log(`\nPending todos for user 3 (${results.userTodos.length} total):`);
console.log(JSON.stringify(results.userTodos.slice(0, 3), null, 2));

// transforms.mjs — Demonstrates all built-in transform steps
// Run: node examples/transforms.mjs

import { FraftClient } from '@go-denki/fraft';

// Inline config object — no file needed
const client = new FraftClient({
  config: {
    version: 1,
    baseUrl: "https://jsonplaceholder.typicode.com",
    requests: {
      // 1. filter + pick
      activeTodos: {
        path: "/todos",
        transform: [
          // Keep only completed todos
          { filter: { field: "completed", op: "eq", value: true } },
          // Keep only id and title fields
          { pick: ["id", "title"] },
        ],
      },

      // 2. rename
      renamedUsers: {
        path: "/users",
        transform: [
          { pick: ["id", "name", "email", "phone"] },
          // Rename fields to camelCase variants
          { rename: { name: "fullName", phone: "phoneNumber" } },
        ],
      },

      // 3. coerce
      posts: {
        path: "/posts",
        transform: [
          { pick: ["id", "userId", "title"] },
          {
            coerce: {
              // Shrink userId by multiplying (just to demo arithmetic)
              userId: { type: "number", expr: "*10" },
              // Ensure id is a string
              id: "string",
            },
          },
        ],
      },
    },
  },
});

console.log("--- filter + pick ---");
const todos = await client.run("activeTodos");
console.log(JSON.stringify(todos.slice(0, 3), null, 2));

console.log("\n--- rename ---");
const users = await client.run("renamedUsers");
console.log(JSON.stringify(users.slice(0, 2), null, 2));

console.log("\n--- coerce ---");
const posts = await client.run("posts");
console.log(JSON.stringify(posts.slice(0, 2), null, 2));

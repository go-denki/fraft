import { defineConfig } from "vitepress";

export default defineConfig({
  title: "fraft",
  description: "Declarative, config-driven HTTP client for Node.js",
  base: "/",

  head: [["link", { rel: "icon", href: "/favicon.ico" }]],

  themeConfig: {
    nav: [
      { text: "Guide", link: "/guide/getting-started" },
      { text: "Reference", link: "/reference/api" },
      { text: "Examples", link: "/examples" },
      { text: "Roadmap", link: "/roadmap" },
      {
        text: "0.1.0",
        items: [
          {
            text: "npm",
            link: "https://www.npmjs.com/package/@go-denki/fraft",
          },
          { text: "GitHub", link: "https://github.com/go-denki/fraft" },
        ],
      },
    ],

    sidebar: {
      "/guide/": [
        {
          text: "Guide",
          items: [
            { text: "Getting Started", link: "/guide/getting-started" },
            { text: "Config Format", link: "/guide/config-format" },
            {
              text: "Environment Variables",
              link: "/guide/environment-variables",
            },
            { text: "Transform Pipeline", link: "/guide/transforms" },
            { text: "Custom Middleware", link: "/guide/middleware" },
          ],
        },
      ],
      "/reference/": [
        {
          text: "Reference",
          items: [
            { text: "FraftClient API", link: "/reference/api" },
            { text: "TypeScript Types", link: "/reference/types" },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: "github", link: "https://github.com/go-denki/fraft" },
    ],

    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © go-denki",
    },

    search: { provider: "local" },
  },
});

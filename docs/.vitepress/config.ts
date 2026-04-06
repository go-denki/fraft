import { defineConfig } from "vitepress";

const clarityId = process.env.FRAFT_DOCS_PROJECT_ID;

const claritySnippet = clarityId
  ? `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${clarityId}");`
  : null;

export default defineConfig({
  title: "fraft",
  description: "Declarative, config-driven HTTP client for Node.js",
  base: "/",

  head: [
    ["link", { rel: "icon", href: "/favicon.ico" }],
    ...(claritySnippet ? [["script", {}, claritySnippet] as [string, Record<string, string>, string]] : []),
  ],

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

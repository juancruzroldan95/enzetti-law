// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";
import sentry from "@sentry/astro";

export default defineConfig({
  vite: {
    plugins: [tailwindcss()]
  },
  site: "https://estudioenzetti.com",
  integrations: [
    sitemap(),
    sentry({
      project: "enzetti-law",
      org: "jcroldan",
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
  output: 'server',
  adapter: vercel({
    webAnalytics: {
      enabled: false,
    },
    isr: {
      expiration: 60 * 60 * 24,
      exclude: ["/api/tiktok/login", "/api/tiktok/callback"],
    },
  })
});
# ModelWing API

A responsive directory containing seven selected providers: Codex-Relay, Yzmao, freemodel.in, EMTF AI, Moyuu, AgentRouter, and Aerolink AI. Built with native JavaScript modules, CSS, and a dependency-free Node.js server. Requires Node.js 22 or later.

## Run

```sh
npm run dev
```

Create a production build with `npm run build`; serve it with `npm run preview`. Deploy the `dist` folder to a static web host.

## Provider content

`src/data.js` contains the descriptions, offers, exact model IDs, authentication, client routes, dates, and other fields transcribed from each selected provider's expanded listing at https://new-free-api-providers-2026.vercel.app/ on November 3, 2026.

Status and offers reflect that directory; they are not live availability checks. Undocumented endpoints, model lists, and metrics remain unknown. Source attribution appears in the directory and details. The date on each card is the source's **Added** date.

EMTF AI's old domain displays a migration notice to https://emtf.aipm9527.site/. Its details include a separate link to the current website. Its Get API button uses the user-supplied short link.

## Sign-up links

Edit `src/config.js` → `REFERRAL_LINKS`. Both card and modal Get API buttons use this map. All seven providers use the user's exact `shr.pn` URLs.

The original six source listings provide no provider-specific documentation URL, so their Docs links open the source's setup guide. Aerolink AI's Docs button opens https://aerolink-ai.vercel.app/ as listed in the source.

## Icons

The header logo and browser icon use the user-supplied purple butterfly. Its empty outer border is cropped for legibility, and the image is embedded in `public/favicon.svg`.

Local logo files are stored in `public/providers/` and mapped in `src/provider-icons.js`. See `public/providers/SOURCES.md` for provenance. Cards and dialogs share a renderer with an SVG fallback for failed image loads. PNG logos preserve aspect ratio and transparency; Codex-Relay uses its original vector asset. Older unused assets are retained but not listed.

## Features and validation

Provider/model search, combined filters with facet counts, five collections, three sort modes, keyboard-operated tabs, persistent light/dark themes, mobile filters, accessible details dialogs, setup guides, and reduced-motion support.

`npm test` checks search, filters, collections, facet counts, ordering, selected providers, and sign-up coverage. `npm run build` creates the static output. Fonts use Google Fonts with local fallbacks.

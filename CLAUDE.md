# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

RYZ WAR ROOM — a mobile-first PWA redesign of the RyZ s129 alliance tracker for the
mobile game *Last War: Survival*. The original tabbed site (ryz129.tcilan.website) was
rebuilt as a single-scroll "military command center". There is **no build step, no
package.json, no dependencies** — plain HTML/CSS/JS served by a zero-dependency Node
server. Keep it that way; don't introduce a bundler or npm packages for changes that
vanilla JS can do.

## Commands

```bash
node server.mjs                                  # serve on :5129 with demo fixtures
PORT=5130 node server.mjs                        # alternate port
API_ORIGIN=http://host:3000 node server.mjs      # proxy /api/* to a real backend
docker compose up -d                             # same thing, containerized
```

There are no tests or linters. Verification is manual: run the server, open the app at
mobile viewport (375×812), log in with any callsign, and eyeball each module plus the
browser console.

## Architecture

`server.mjs` is both static file host (for `site/`) and API. It has two data modes,
switched by the `API_ORIGIN` env var: unset → serves hardcoded demo fixtures (the
`api()` function — a frozen snapshot of real alliance data); set → transparently
proxies `/api/*` (method, JSON body, Authorization header) to that origin. The
frontend only ever talks to relative `/api/*` paths, so it is oblivious to the mode.
The API contract (routes + response shapes the frontend actually reads) is tabled in
README.md — the fixture shapes in `server.mjs` are the executable spec.

`site/app.js` is the entire frontend: an ES module that boots by checking
`localStorage.token` against `/api/auth/me`, shows the login gate or renders all
modules from three parallel fetches (`/alliance`, `/alliance/growth`, `/squads`).
Everything is template-string DOM construction via the `el()` helper — **any
user-controlled string interpolated into HTML must go through `esc()`** (usernames are
player-chosen on the real backend). Inline SVG icons live in the `ICON` map; charts
are hand-rolled SVG strings, not a chart library.

The three.js holographic dome (`initHolo`) imports from the self-hosted
`site/vendor/three.module.min.js`. Two hard-won constraints: the container is
`display:none` during boot, so canvas sizing relies on a `ResizeObserver` (don't
replace it with a one-shot measurement), and canvas CSS must stay pinned to
100%/100% because `renderer.setSize(w, h, false)` doesn't set element style —
removing that CSS reintroduces a devicePixelRatio-scaled overflow.

PWA layer: `site/sw.js` is cache-first for the shell, network-first with cache
fallback for `/api`. **Every shell change ships with a `CACHE` name bump**
(`warroom-vN`) or returning clients keep the stale version. New static asset types
need a MIME entry in `server.mjs` (the fallback is `application/octet-stream`, which
breaks manifests/fonts).

`site/legacy.html` + `site/assets/` are the original production app (minified Vite
bundle), kept for reference — never edit them.

## Design system

The visual identity is Last War Season 6 "Lost Rainforest": CSS custom properties in
`site/app.css` (`--holo` teal, `--amber`, `--gold`, `--tank/--missile/--aircraft`
class colors), Black Ops One for display type, Rajdhani for body — both self-hosted
woff2 (latin subset only). Angular clip-path corners on modules/buttons are the
signature shape language. In-game terminology is deliberate: R1–R5 roles, operatives,
divisions, A-squad, supply draw. Fonts, three.js, and art are self-hosted on purpose —
the PWA must work offline and the page makes zero external requests at runtime.

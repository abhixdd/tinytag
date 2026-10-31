# Contributing to TinyTag

Thanks for helping. Bug reports, ideas and pull requests are all welcome.

## Set up

```bash
npm install
npm run dev
```

You need a recent Node.js (22 or newer).

## Before you open a pull request

- `npm run lint` reports no problems.
- `npm test` passes. New parsing, converting or sharing behavior needs a test in `test/`.
- `npm run build` succeeds.
- You tried your change in the browser, in the scenes it touches (chat, title, action bar, item, boss bar, sidebar).
- For UI changes, check a phone-width layout as well as desktop.

Keep pull requests small and focused, and describe what changed and why.

## Style

- React with plain functions and hooks. Derive values instead of setting state inside `useMemo` or synchronously inside effects.
- Tailwind for styling. Shared colors, panels and buttons live in `src/index.css` (`.panel`, `.inset`, `.btn`).
- No comments in code. Use clear names and small functions instead.
- The MiniMessage parser lives in `src/lib/minimessage.js`. If a tag behaves differently from Adventure's MiniMessage, link the relevant docs in the pull request.
- No new dependencies unless they are clearly worth it. The app is fully client-side.

## Bug reports

Please include: the MiniMessage text you typed, what you expected, what happened, which scene you were in, and your browser. A share link from the "Copy share link" button is the quickest way to show it.

## Licensing of contributions

TinyTag is under the [GNU Affero General Public License v3.0](LICENSE). By submitting a contribution you agree that it is licensed under the same terms.

Build a Simon-style memory sequence game in THIS folder: C:\xampp\htdocs\simon

A recruiter-ready browser sequence game. Playable, polished, no backend.

## Game
- Call it "Pulse Four". Original pads, no Hasbro Simon branding.
- Four pads (amber, cyan, magenta, lime). The game plays a growing sequence; the player repeats it. A wrong pad is game over. A correct full sequence adds one more pad.
- Click/tap a pad. Keyboard: Q/W/A/S or 1/2/3/4. R restarts.
- Round counter. Local best round in localStorage. Brief light + tone on each pad (Web Audio oscillator is fine; keep it optional if autoplay blocks it).

## UI
- Dark stage, four glowing pads, large round number. Not a default Vite page. No Vue logo.
- 390px phone and 1280px desktop.

## Tests
- Vitest (pure logic): a matching input advances the player index; a wrong pad ends the round; completing the sequence lengthens the sequence by one.
- `npm test` and `npm run build` must pass.

## GitHub
- Repo: https://github.com/oscarmmi/simon
- Pages: https://oscarmmi.github.io/simon/
- vite base `/simon/`
- Commit: feat: add simon
- First commit must `git add -A` so package.json, vite.config.ts, tsconfigs, src/main.ts, index.html, .gitignore, and .github/workflows/pages.yml ship with the game.
- gh repo edit --description "Pulse Four sequence memory game in Vue 3 + TypeScript, playable on GitHub Pages." --add-topic vue --add-topic typescript --add-topic game --add-topic simon --add-topic memory
- Stop. Print the repo URL and Pages URL.

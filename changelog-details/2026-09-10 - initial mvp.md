# 2026-09-10 — Initial MVP

TypeCascade ships as an unpacked Manifest V3 extension for Chromium (side panel) and Firefox (sidebar, via `manifest.firefox.json`).

## Added

- Element picker with hover/selection outlines
- Class list, computed `font-family`, and provider hints (Google / Bunny / Adobe / `@font-face`)
- Typography property stacks with **winner** vs **overruled** (strikethrough) layers, including inherited ancestors
- Editable winning values applied as a temporary `!important` override sheet on the selection
- Google Fonts and Bunny Fonts stylesheet injection + apply to selection
- Interactive demo facsimile under `demos/`
- Brand marks in `assets/icons/`

# TypeCascade

Browser extension: pick a DOM element, inspect typography cascade (strikethrough overruled layers), edit winners, inject Google Fonts or Bunny Fonts.

## Load

- Chromium: unpacked root `manifest.json`
- Firefox: use `manifest.firefox.json` (copy over or web-ext)

## Notes

- Cross-origin CSSOM sheets are opaque; the panel notes when rules are missing.
- Overrides use a temporary `style#typecascade-overrides` sheet with `!important`.
- Demo facsimile: `demos/` (GitHub Pages).

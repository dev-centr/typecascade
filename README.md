<div align="center">

<a href="https://github.com/dev-centr/typecascade/graphs/contributors"><img src="https://img.shields.io/github/contributors/dev-centr/typecascade?style=for-the-badge" alt="Contributors" /></a>
<a href="https://github.com/dev-centr/typecascade/network/members"><img src="https://img.shields.io/github/forks/dev-centr/typecascade?style=for-the-badge" alt="Forks" /></a>
<a href="https://github.com/dev-centr/typecascade/stargazers"><img src="https://img.shields.io/github/stars/dev-centr/typecascade?style=for-the-badge" alt="Stargazers" /></a>
<a href="https://github.com/dev-centr/typecascade/issues"><img src="https://img.shields.io/github/issues/dev-centr/typecascade?style=for-the-badge" alt="Issues" /></a>
<a href="https://github.com/dev-centr/typecascade/blob/main/LICENSE"><img src="https://img.shields.io/github/license/dev-centr/typecascade?style=for-the-badge" alt="MIT License" /></a>

<img src="assets/icons/typecascade-mark.svg" alt="TypeCascade" width="96" height="96" />

# TypeCascade

**See which typography rule wins on a live page — then change it.**

[Explore the docs »](https://docs.devcentr.org/) · [Demo](https://dev-centr.github.io/typecascade/demos/) · [Changelog](CHANGELOG.md)

</div>

## Who this is for

Designers and front-end engineers who want DevTools-style typography cascade (winner + struck-through overruled layers), without hand-injecting Google Fonts / Bunny Fonts link tags just to preview a face on one `div`.

## What it does

1. **Pick** an element on any http(s) page.
2. Read its **classes**, computed type, and detected font **providers**.
3. Show a **typography cascade stack** — winners first; overruled inheritance / lower-specificity rules with **strikethrough**.
4. **Edit** winning values and apply them as a temporary override.
5. **Inject** a Google Fonts or Bunny Fonts stylesheet and apply the family to the selection.

Cross-origin stylesheets the browser keeps opaque are called out in the panel (same limitation as most extensions without the debugger API).

## Install (unpacked)

### Chrome / Edge / Chromium

1. Clone this repo.
2. Open `chrome://extensions` → enable **Developer mode**.
3. **Load unpacked** → select this repository root (`manifest.json`).
4. Open the side panel from the toolbar icon, then **Pick element**.

### Firefox

1. Copy `manifest.firefox.json` over `manifest.json` (or load it via [web-ext](https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/)).
2. `about:debugging` → **This Firefox** → **Load Temporary Add-on** → choose `manifest.json`.
3. Open the sidebar from the TypeCascade action.

## Demo

An interactive facsimile of the panel lives in [`demos/`](demos/) (GitHub Pages).

## Built With

| Role | Stack |
| --- | --- |
| Runtime | WebExtensions Manifest V3 |
| UI | Vanilla HTML / CSS / JS side panel |
| Fonts CDN | Google Fonts CSS API, Bunny Fonts |

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

## License

[MIT](LICENSE)

## Contact

- Org: [dev-centr](https://github.com/dev-centr)
- Issues: [github.com/dev-centr/typecascade/issues](https://github.com/dev-centr/typecascade/issues)

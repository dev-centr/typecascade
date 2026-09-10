/**
 * Provider font injection (Google Fonts + Bunny Fonts) and local overrides.
 */
(function (root) {
  const STYLE_ID = "typecascade-overrides";
  const LINK_PREFIX = "typecascade-font-";

  function ensureOverrideSheet() {
    let el = document.getElementById(STYLE_ID);
    if (!el) {
      el = document.createElement("style");
      el.id = STYLE_ID;
      el.setAttribute("data-typecascade", "1");
      (document.head || document.documentElement).appendChild(el);
    }
    return el;
  }

  function slugFamily(name) {
    return String(name || "")
      .trim()
      .replace(/\s+/g, "+")
      .replace(/[^a-zA-Z0-9+_-]/g, "");
  }

  function googleCssUrl(family, weights) {
    const fam = slugFamily(family).replace(/\+/g, " ");
    const encoded = encodeURIComponent(fam).replace(/%20/g, "+");
    const w = (weights && weights.length ? weights : ["400", "700"]).join(";");
    // css2 API: family=Name:wght@400;700
    return `https://fonts.googleapis.com/css2?family=${encoded}:wght@${w}&display=swap`;
  }

  function bunnyCssUrl(family, weights) {
    const fam = slugFamily(family);
    const w = (weights && weights.length ? weights : ["400", "700"]).join(",");
    return `https://fonts.bunny.net/css?family=${fam}:${w}&display=swap`;
  }

  function injectStylesheet(url, key) {
    const id = LINK_PREFIX + key;
    let link = document.getElementById(id);
    if (link) {
      link.href = url;
      return link;
    }
    link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = url;
    link.setAttribute("data-typecascade", "1");
    (document.head || document.documentElement).appendChild(link);
    return link;
  }

  function injectProviderFont({ provider, family, weights }) {
    if (!family) return { ok: false, error: "Missing family" };
    const prov = (provider || "google").toLowerCase();
    const url =
      prov === "bunny" ? bunnyCssUrl(family, weights) : googleCssUrl(family, weights);
    injectStylesheet(url, `${prov}-${slugFamily(family)}`);
    return { ok: true, url, provider: prov, family };
  }

  /** Apply typography overrides to a selected element via attribute + stylesheet. */
  function applyOverrides(selectorHint, props) {
    const sheet = ensureOverrideSheet();
    const attr = "data-typecascade-target";
    // Prefer currently marked target
    let el = document.querySelector(`[${attr}="1"]`);
    if (!el && selectorHint) {
      try {
        el = document.querySelector(selectorHint);
      } catch {
        el = null;
      }
    }
    if (!el) return { ok: false, error: "No target element" };

    el.setAttribute(attr, "1");
    const decls = Object.entries(props || {})
      .filter(([, v]) => v != null && String(v).length)
      .map(([k, v]) => `${k}: ${v} !important;`)
      .join(" ");
    sheet.textContent = `[${attr}="1"] { ${decls} }`;
    return { ok: true };
  }

  function clearOverrides() {
    const sheet = document.getElementById(STYLE_ID);
    if (sheet) sheet.remove();
    document.querySelectorAll("[data-typecascade-target]").forEach((n) => {
      n.removeAttribute("data-typecascade-target");
    });
    return { ok: true };
  }

  root.TypeCascadeFonts = {
    injectProviderFont,
    applyOverrides,
    clearOverrides,
    googleCssUrl,
    bunnyCssUrl,
  };
})(typeof globalThis !== "undefined" ? globalThis : self);

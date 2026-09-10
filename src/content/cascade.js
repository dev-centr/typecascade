/**
 * Typography cascade collector.
 * Walks accessible stylesheets + inheritance, ranks declarations, marks winners.
 */
(function (root) {
  const FONT_PROPS = [
    "font-family",
    "font-size",
    "font-weight",
    "font-style",
    "font-variant",
    "font-stretch",
    "font-feature-settings",
    "font-variation-settings",
    "font-kerning",
    "line-height",
    "letter-spacing",
    "word-spacing",
    "text-transform",
    "text-decoration-line",
    "text-decoration-style",
    "text-decoration-thickness",
    "text-underline-offset",
    "color",
  ];

  const INHERITED = new Set([
    "font-family",
    "font-size",
    "font-weight",
    "font-style",
    "font-variant",
    "font-stretch",
    "font-feature-settings",
    "font-variation-settings",
    "font-kerning",
    "line-height",
    "letter-spacing",
    "word-spacing",
    "text-transform",
    "color",
  ]);

  function specificity(selectorText) {
    // Rough CSS specificity: (a,b,c) ignoring :not() nesting quirks.
    let a = 0;
    let b = 0;
    let c = 0;
    const parts = String(selectorText || "").split(",");
    let best = [0, 0, 0];
    for (const raw of parts) {
      const s = raw.trim();
      if (!s) continue;
      a = (s.match(/#[\w-]+/g) || []).length;
      b =
        (s.match(/\[[^\]]+\]/g) || []).length +
        (s.match(/\.(?![0-9])[\w-]+/g) || []).length +
        (s.match(/:(?!:)[\w-]+(\([^)]*\))?/g) || []).length;
      c = (s.match(/(^|[\s>+~])[a-zA-Z][\w-]*/g) || []).length;
      const score = [a, b, c];
      if (cmpTriple(score, best) > 0) best = score;
    }
    return best;
  }

  function cmpTriple(x, y) {
    for (let i = 0; i < 3; i++) {
      if (x[i] !== y[i]) return x[i] - y[i];
    }
    return 0;
  }

  function safeMatches(el, selectorText) {
    if (!selectorText) return false;
    try {
      return el.matches(selectorText);
    } catch {
      // Multi-selectors or unsupported :has — try each comma part.
      return String(selectorText)
        .split(",")
        .some((part) => {
          try {
            return el.matches(part.trim());
          } catch {
            return false;
          }
        });
    }
  }

  function describeSheet(sheet) {
    try {
      if (sheet.href) return sheet.href;
      if (sheet.ownerNode && sheet.ownerNode.id) {
        return `<style#${sheet.ownerNode.id}>`;
      }
      return "<inline style sheet>";
    } catch {
      return "<stylesheet>";
    }
  }

  function walkRules(rules, sheetMeta, out, orderBase) {
    if (!rules) return orderBase;
    let order = orderBase;
    for (const rule of rules) {
      order += 1;
      const type = rule.type;
      if (type === CSSRule.STYLE_RULE) {
        out.push({
          selectorText: rule.selectorText,
          style: rule.style,
          sheet: sheetMeta,
          order,
          media: sheetMeta.media || null,
        });
      } else if (type === CSSRule.MEDIA_RULE) {
        const mediaText = rule.media && rule.media.mediaText;
        const matchesMedia =
          !mediaText ||
          mediaText === "all" ||
          (typeof matchMedia === "function" && matchMedia(mediaText).matches);
        if (matchesMedia) {
          order = walkRules(
            rule.cssRules,
            { ...sheetMeta, media: mediaText || sheetMeta.media },
            out,
            order
          );
        }
      } else if (type === CSSRule.SUPPORTS_RULE) {
        try {
          if (CSS.supports && CSS.supports(`(${rule.conditionText})`)) {
            order = walkRules(rule.cssRules, sheetMeta, out, order);
          }
        } catch {
          /* ignore */
        }
      } else if (rule.cssRules) {
        order = walkRules(rule.cssRules, sheetMeta, out, order);
      }
    }
    return order;
  }

  function collectMatchedRules(el) {
    const matched = [];
    let order = 0;
    const sheets = Array.from(document.styleSheets || []);
    for (const sheet of sheets) {
      let rules;
      try {
        rules = sheet.cssRules;
      } catch {
        matched.push({
          blocked: true,
          sheet: describeSheet(sheet),
        });
        continue;
      }
      const bucket = [];
      order = walkRules(
        rules,
        { href: describeSheet(sheet), media: null },
        bucket,
        order
      );
      for (const item of bucket) {
        if (safeMatches(el, item.selectorText)) {
          matched.push(item);
        }
      }
    }
    return matched;
  }

  function readProp(style, prop) {
    if (!style) return "";
    const v = style.getPropertyValue(prop);
    return v ? v.trim() : "";
  }

  function importantFlag(style, prop) {
    try {
      return style.getPropertyPriority(prop) === "important";
    } catch {
      return false;
    }
  }

  function expandFontShorthand(style) {
    // If only `font` shorthand is set, longhands are usually expanded by the engine.
    return FONT_PROPS.map((p) => ({
      prop: p,
      value: readProp(style, p),
      important: importantFlag(style, p),
    })).filter((x) => x.value);
  }

  function selectorForElement(el) {
    if (!el || el.nodeType !== 1) return "";
    const parts = [];
    parts.push(el.tagName.toLowerCase());
    if (el.id) parts.push(`#${CSS.escape(el.id)}`);
    for (const cls of Array.from(el.classList || [])) {
      parts.push(`.${CSS.escape(cls)}`);
    }
    return parts.join("");
  }

  function classListOf(el) {
    return Array.from(el.classList || []);
  }

  function ancestry(el) {
    const chain = [];
    let node = el;
    while (node && node.nodeType === 1) {
      chain.push(node);
      node = node.parentElement;
    }
    return chain;
  }

  function declarationsForElement(el, matchedRules, ownOnly) {
    const decls = [];

    // Inline style — highest author specificity short of !important layers we skip.
    const inline = el.getAttribute && el.getAttribute("style");
    if (inline && el.style) {
      for (const entry of expandFontShorthand(el.style)) {
        decls.push({
          property: entry.prop,
          value: entry.value,
          important: entry.important,
          selector: "element.style",
          sheet: "inline",
          specificity: [1, 0, 0, 0],
          order: 1e9,
          origin: "inline",
          inheritedFrom: null,
        });
      }
    }

    for (const rule of matchedRules) {
      if (rule.blocked) continue;
      for (const entry of expandFontShorthand(rule.style)) {
        const spec = specificity(rule.selectorText);
        decls.push({
          property: entry.prop,
          value: entry.value,
          important: entry.important,
          selector: rule.selectorText,
          sheet: rule.sheet.href,
          media: rule.sheet.media || null,
          specificity: [0, ...spec],
          order: rule.order,
          origin: "author",
          inheritedFrom: null,
        });
      }
    }

    if (!ownOnly) {
      // Walk ancestors; each contributes only its own (non-inherited) decls.
      // Nearer ancestors rank higher via order; all lose to element-local rules.
      let depth = 0;
      let ancestor = el.parentElement;
      while (ancestor && depth < 12) {
        depth += 1;
        const ancestorMatched = collectMatchedRules(ancestor).filter(
          (r) => !r.blocked
        );
        const ancestorOwn = declarationsForElement(
          ancestor,
          ancestorMatched,
          true /* own only */
        );
        const label =
          selectorForElement(ancestor) || ancestor.tagName.toLowerCase();
        for (const d of ancestorOwn) {
          if (!INHERITED.has(d.property)) continue;
          decls.push({
            ...d,
            inheritedFrom: label,
            origin: d.origin === "inline" ? "inherited-inline" : "inherited",
            specificity: [-1, ...((d.specificity || [0, 0, 0, 0]).slice(1))],
            order: (d.order || 0) - depth * 1e6,
          });
        }
        ancestor = ancestor.parentElement;
      }
    }

    return decls;
  }

  function compareDecls(a, b) {
    // Important author beats normal; then specificity; then order.
    if (a.important !== b.important) return a.important ? 1 : -1;
    const sa = a.specificity || [0, 0, 0, 0];
    const sb = b.specificity || [0, 0, 0, 0];
    for (let i = 0; i < 4; i++) {
      if (sa[i] !== sb[i]) return sa[i] - sb[i];
    }
    return (a.order || 0) - (b.order || 0);
  }

  function resolveStacks(decls) {
    const byProp = new Map();
    for (const d of decls) {
      if (!byProp.has(d.property)) byProp.set(d.property, []);
      byProp.get(d.property).push(d);
    }

    const stacks = [];
    for (const prop of FONT_PROPS) {
      const list = byProp.get(prop);
      if (!list || !list.length) continue;
      const ranked = [...list].sort(compareDecls);
      // Highest rank last in compare → winner is last
      const winnerIdx = ranked.length - 1;
      const layers = ranked.map((d, i) => ({
        property: d.property,
        value: d.value,
        important: !!d.important,
        selector: d.selector,
        sheet: d.sheet,
        media: d.media || null,
        specificity: d.specificity,
        origin: d.origin,
        inheritedFrom: d.inheritedFrom,
        winner: i === winnerIdx,
        overruled: i !== winnerIdx,
      }));
      // Present top-down: winner first, then overruled (like DevTools inverted option).
      // User asked for list with strikethrough on overridden — show winner first then losers.
      const winner = layers[winnerIdx];
      const losers = layers.slice(0, winnerIdx).reverse();
      stacks.push({
        property: prop,
        winner,
        layers: [winner, ...losers],
      });
    }
    return stacks;
  }

  function detectFontSources(fontFamily) {
    const sources = [];
    const family = (fontFamily || "").replace(/["']/g, "");
    const sheets = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'));
    for (const node of sheets) {
      const href = node.href || "";
      const text = node.textContent || "";
      const blob = href + "\n" + text;
      if (/fonts\.googleapis\.com|fonts\.gstatic\.com/i.test(blob)) {
        sources.push({ provider: "Google Fonts", href: href || null });
      } else if (/fonts\.bunny\.net/i.test(blob)) {
        sources.push({ provider: "Bunny Fonts", href: href || null });
      } else if (/use\.typekit\.net|adobe/i.test(blob)) {
        sources.push({ provider: "Adobe Fonts", href: href || null });
      }
    }
    // @font-face family match (same-origin sheets only)
    try {
      for (const sheet of document.styleSheets) {
        let rules;
        try {
          rules = sheet.cssRules;
        } catch {
          continue;
        }
        for (const rule of rules || []) {
          if (rule.type !== CSSRule.FONT_FACE_RULE) continue;
          const ff = readProp(rule.style, "font-family").replace(/["']/g, "");
          const src = readProp(rule.style, "src");
          if (family && ff && family.split(",")[0].trim() === ff) {
            sources.push({
              provider: /fonts\.google/i.test(src)
                ? "Google Fonts"
                : /bunny/i.test(src)
                  ? "Bunny Fonts"
                  : "@font-face",
              href: src || describeSheet(sheet),
              face: ff,
            });
          }
        }
      }
    } catch {
      /* ignore */
    }
    // Dedupe
    const seen = new Set();
    return sources.filter((s) => {
      const k = `${s.provider}|${s.href}|${s.face || ""}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }

  function inspectElement(el) {
    if (!el || el.nodeType !== 1) {
      return { error: "Not an element" };
    }

    const matched = collectMatchedRules(el);
    const blockedSheets = matched
      .filter((r) => r.blocked)
      .map((r) => r.sheet);
    const usable = matched.filter((r) => !r.blocked);
    const decls = declarationsForElement(el, usable, false);
    const stacks = resolveStacks(decls);
    const computed = getComputedStyle(el);
    const computedType = {};
    for (const p of FONT_PROPS) {
      computedType[p] = computed.getPropertyValue(p);
    }

    const family = computedType["font-family"];
    return {
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      classes: classListOf(el),
      selector: selectorForElement(el),
      ancestry: ancestry(el)
        .slice(0, 8)
        .map((n) => selectorForElement(n) || n.tagName.toLowerCase()),
      stacks,
      computed: computedType,
      fontSources: detectFontSources(family),
      blockedSheets: [...new Set(blockedSheets)],
      note:
        blockedSheets.length > 0
          ? "Some cross-origin stylesheets are opaque to extensions; those rules are missing from the cascade list."
          : null,
    };
  }

  root.TypeCascadeCascade = {
    FONT_PROPS,
    inspectElement,
    selectorForElement,
  };
})(typeof globalThis !== "undefined" ? globalThis : self);

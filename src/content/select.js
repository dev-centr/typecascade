/**
 * Element picker + message bridge for TypeCascade content scripts.
 */
(function () {
  const MSG =
    (typeof TypeCascadeMessages !== "undefined" && TypeCascadeMessages) || {};

  let picking = false;
  let hoverEl = null;
  let selectedEl = null;
  let lastReport = null;

  const HOVER_CLASS = "tc-hover-outline";
  const SELECT_CLASS = "tc-selected-outline";

  function clearHover() {
    if (hoverEl) {
      hoverEl.classList.remove(HOVER_CLASS);
      hoverEl = null;
    }
  }

  function clearSelectVisual() {
    document.querySelectorAll("." + SELECT_CLASS).forEach((n) => {
      n.classList.remove(SELECT_CLASS);
    });
  }

  function stopPick() {
    if (!picking) return;
    picking = false;
    clearHover();
    document.removeEventListener("mousemove", onMove, true);
    document.removeEventListener("click", onClick, true);
    document.removeEventListener("keydown", onKey, true);
    document.documentElement.classList.remove("tc-picking");
  }

  function startPick() {
    stopPick();
    picking = true;
    document.documentElement.classList.add("tc-picking");
    document.addEventListener("mousemove", onMove, true);
    document.addEventListener("click", onClick, true);
    document.addEventListener("keydown", onKey, true);
  }

  function onMove(e) {
    if (!picking) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el || el === hoverEl) return;
    if (el.closest && el.closest("[data-typecascade-ui]")) return;
    clearHover();
    hoverEl = el;
    hoverEl.classList.add(HOVER_CLASS);
  }

  function onKey(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      stopPick();
    }
  }

  function reportElement(el) {
    selectedEl = el;
    clearSelectVisual();
    el.classList.add(SELECT_CLASS);
    el.setAttribute("data-typecascade-target", "1");
    document.querySelectorAll("[data-typecascade-target]").forEach((n) => {
      if (n !== el) n.removeAttribute("data-typecascade-target");
    });

    const report = TypeCascadeCascade.inspectElement(el);
    lastReport = report;
    return report;
  }

  function onClick(e) {
    if (!picking) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    const el = hoverEl || e.target;
    stopPick();
    if (!el || el.nodeType !== 1) return;
    const report = reportElement(el);
    chrome.runtime.sendMessage({ type: MSG.ELEMENT_PICKED, report });
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (!msg || !msg.type) return;

    if (msg.type === MSG.PING) {
      sendResponse({ ok: true });
      return;
    }

    if (msg.type === MSG.START_PICK) {
      startPick();
      sendResponse({ ok: true });
      return;
    }

    if (msg.type === MSG.CANCEL_PICK) {
      stopPick();
      sendResponse({ ok: true });
      return;
    }

    if (msg.type === MSG.GET_SELECTION) {
      sendResponse({ report: lastReport });
      return;
    }

    if (msg.type === MSG.APPLY_OVERRIDE) {
      const result = TypeCascadeFonts.applyOverrides(
        msg.selector,
        msg.props || {}
      );
      if (selectedEl) {
        lastReport = TypeCascadeCascade.inspectElement(selectedEl);
        result.report = lastReport;
      }
      sendResponse(result);
      return;
    }

    if (msg.type === MSG.CLEAR_OVERRIDES) {
      const result = TypeCascadeFonts.clearOverrides();
      clearSelectVisual();
      selectedEl = null;
      lastReport = null;
      sendResponse(result);
      return;
    }

    if (msg.type === MSG.INJECT_PROVIDER_FONT) {
      const inject = TypeCascadeFonts.injectProviderFont(msg);
      if (inject.ok && selectedEl && msg.apply !== false) {
        const family = `"${msg.family}", ${msg.fallback || "sans-serif"}`;
        TypeCascadeFonts.applyOverrides(null, {
          ...(msg.props || {}),
          "font-family": family,
        });
        lastReport = TypeCascadeCascade.inspectElement(selectedEl);
        inject.report = lastReport;
      }
      sendResponse(inject);
      return;
    }
  });
})();

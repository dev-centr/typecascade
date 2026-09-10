(() => {
  const MSG = globalThis.TypeCascadeMessages || {};
  const catalog = globalThis.TypeCascadeFontCatalog || [];

  const $ = (id) => document.getElementById(id);
  const status = (text) => {
    $("status").textContent = text || "";
  };

  const datalist = $("font-suggestions");
  for (const name of catalog) {
    const opt = document.createElement("option");
    opt.value = name;
    datalist.appendChild(opt);
  }

  let currentReport = null;
  let editProps = {};

  async function activeTabId() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs[0] && tabs[0].id;
  }

  async function sendToTab(payload) {
    const tabId = await activeTabId();
    if (tabId == null) throw new Error("No active tab");
    try {
      return await chrome.tabs.sendMessage(tabId, payload);
    } catch (err) {
      // Content script may not be injected yet (e.g. freshly opened tab).
      await chrome.scripting.executeScript({
        target: { tabId },
        files: [
          "src/shared/messages.js",
          "src/content/cascade.js",
          "src/content/fonts.js",
          "src/content/select.js",
        ],
      });
      await chrome.scripting.insertCSS({
        target: { tabId },
        files: ["src/content/select.css"],
      });
      return await chrome.tabs.sendMessage(tabId, payload);
    }
  }

  function renderTarget(report) {
    const box = $("target");
    if (!report) {
      box.innerHTML = `<p class="empty">Pick a text-bearing element on the page.</p>`;
      return;
    }
    const classes =
      (report.classes || []).map((c) => `<span class="chip">.${escapeHtml(c)}</span>`).join("") ||
      `<span class="chip">(no classes)</span>`;
    const sources = (report.fontSources || [])
      .map((s) => `${escapeHtml(s.provider)}${s.face ? ` · ${escapeHtml(s.face)}` : ""}`)
      .join(" · ");
    box.innerHTML = `
      <div><strong>${escapeHtml(report.selector || report.tag)}</strong></div>
      <div class="classes">${classes}</div>
      <div class="sources">Computed family: <code>${escapeHtml(
        (report.computed && report.computed["font-family"]) || ""
      )}</code></div>
      <div class="sources">Font sources: ${sources || "system / unknown"}</div>
    `;
  }

  function renderEditors(report) {
    const root = $("editors");
    root.innerHTML = "";
    editProps = {};
    if (!report || !report.stacks) return;

    for (const stack of report.stacks) {
      const win = stack.winner;
      if (!win) continue;
      editProps[stack.property] = win.value;
      const row = document.createElement("label");
      row.className = "editor-row";
      row.innerHTML = `<span>${escapeHtml(stack.property)}</span>`;
      const input = document.createElement("input");
      input.value = win.value;
      input.dataset.prop = stack.property;
      input.addEventListener("input", () => {
        editProps[stack.property] = input.value;
      });
      row.appendChild(input);
      root.appendChild(row);
    }
  }

  function renderCascade(report) {
    const root = $("cascade");
    const note = $("cascade-note");
    root.innerHTML = "";
    if (!report) return;

    if (report.note) {
      note.hidden = false;
      note.textContent = report.note;
    } else {
      note.hidden = true;
    }

    for (const stack of report.stacks || []) {
      const block = document.createElement("div");
      block.className = "prop-block";
      block.innerHTML = `<div class="prop-name">${escapeHtml(stack.property)}</div>`;
      for (const layer of stack.layers || []) {
        const div = document.createElement("div");
        div.className = "layer " + (layer.winner ? "winner" : "overruled");
        const badge = layer.winner
          ? `<span class="badge">winner</span>`
          : `<span class="badge lose">overruled</span>`;
        const inh = layer.inheritedFrom
          ? ` · inherited from ${escapeHtml(layer.inheritedFrom)}`
          : "";
        const imp = layer.important ? " !important" : "";
        div.innerHTML = `
          <div>${badge}<span class="value">${escapeHtml(layer.value)}${imp}</span></div>
          <div class="meta">${escapeHtml(layer.selector)} · ${escapeHtml(
          String(layer.sheet || "")
        )}${inh}</div>
        `;
        block.appendChild(div);
      }
      root.appendChild(block);
    }
  }

  function showReport(report) {
    currentReport = report;
    renderTarget(report);
    renderEditors(report);
    renderCascade(report);
  }

  function escapeHtml(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  $("btn-pick").addEventListener("click", async () => {
    try {
      status("Click an element on the page…");
      await sendToTab({ type: MSG.START_PICK });
    } catch (e) {
      status(e.message || String(e));
    }
  });

  $("btn-clear").addEventListener("click", async () => {
    try {
      await sendToTab({ type: MSG.CLEAR_OVERRIDES });
      currentReport = null;
      showReport(null);
      status("Overrides cleared");
    } catch (e) {
      status(e.message || String(e));
    }
  });

  $("btn-apply").addEventListener("click", async () => {
    try {
      const res = await sendToTab({
        type: MSG.APPLY_OVERRIDE,
        selector: currentReport && currentReport.selector,
        props: editProps,
      });
      if (res && res.report) showReport(res.report);
      status(res && res.ok ? "Applied" : (res && res.error) || "Failed");
    } catch (e) {
      status(e.message || String(e));
    }
  });

  $("btn-inject").addEventListener("click", async () => {
    const family = $("family").value.trim();
    if (!family) {
      status("Enter a font family");
      return;
    }
    const provider = $("provider").value;
    const raw = $("weight").value.trim() || "400;700";
    const weights = raw.split(/[;,]/).map((w) => w.trim()).filter(Boolean);
    try {
      status(`Loading ${family}…`);
      const res = await sendToTab({
        type: MSG.INJECT_PROVIDER_FONT,
        provider,
        family,
        weights,
        apply: true,
      });
      if (res && res.report) showReport(res.report);
      status(res && res.ok ? `Injected ${family} via ${provider}` : (res && res.error) || "Failed");
    } catch (e) {
      status(e.message || String(e));
    }
  });

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.type === MSG.ELEMENT_PICKED && msg.report) {
      showReport(msg.report);
      status("Element selected");
    }
  });

  // Restore last selection if panel reopened
  sendToTab({ type: MSG.GET_SELECTION })
    .then((res) => {
      if (res && res.report) showReport(res.report);
    })
    .catch(() => {});
})();

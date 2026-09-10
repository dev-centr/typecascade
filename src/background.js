/**
 * Background: open side panel / sidebar and relay picks.
 */
const isFirefox = typeof browser !== "undefined" && !!browser.runtime;

chrome.runtime.onInstalled.addListener(() => {
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
  }
});

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab || tab.id == null) return;
  if (chrome.sidePanel && chrome.sidePanel.open) {
    try {
      await chrome.sidePanel.open({ tabId: tab.id });
      return;
    } catch {
      /* fall through for Firefox sidebar */
    }
  }
  if (chrome.sidebarAction && chrome.sidebarAction.open) {
    try {
      await chrome.sidebarAction.open();
    } catch {
      /* ignore */
    }
  }
});

// Relay ELEMENT_PICKED from content script to any open extension pages.
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === "tc:element-picked") {
    chrome.runtime.sendMessage(msg).catch(() => {});
    sendResponse({ ok: true });
    return;
  }
  // Keep service worker aware of Firefox path
  if (msg && msg.type === "tc:ping") {
    sendResponse({ ok: true, isFirefox });
  }
});

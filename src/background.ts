import { Sessions } from "./types";
import { PLACEHOLDER } from "./constants";

const sessions : Sessions = {};

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // URL changed → flush previous session
  if (changeInfo.url && sessions[tabId]) {
    flushSession(tabId);
  }

  // Page finished loading → start new session
  if (changeInfo.status === "complete") {
    sessions[tabId] = {
      url: tab.url || PLACEHOLDER,
      title: tab.title || PLACEHOLDER,
      startedAt: Date.now(),
      endedAt: Date.now(),
      duration: 0,
      highlights: [],
      clicks: [],
      scrollDepth: 0
    };
  }
});

function flushSession(tabId : number) {
  const session = sessions[tabId];
  if (session) {
    session.endedAt = Date.now();
    session.duration = session.endedAt - session.startedAt;

    chrome.storage.local.get({ interactions: [] }, (data) => {
      const updated = [...data.interactions, session];
      chrome.storage.local.set({ interactions: updated });
    });

    delete sessions[tabId];
  }
}

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  if (sessions[tabId]) {
    const session = sessions[tabId];
    session.endedAt = Date.now();

    chrome.storage.local.get({ interactions: [] }, (data) => {
      const updated = [...data.interactions, session];
      chrome.storage.local.set({ interactions: updated });
      window.console.log("Saved final session:", session);
    });

    delete sessions[tabId];
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const tabId = sender.tab?.id;
  if (!tabId || !sessions[tabId]) return;

  if (message.action === "link_clicked") {
    sessions[tabId].clicks.push({
      url: message.url,
      timestamp: Date.now()
    });
  } else if (message.action === "text_selected") {
    sessions[tabId].highlights.push({
      text: message.text,
      timestamp: Date.now()
    });
  } else if (message.action === "scroll_depth") {
    sessions[tabId].scrollDepth = Math.max(
      sessions[tabId].scrollDepth,
      message.percent
    );
  }

  sendResponse({ status: "ok" });
});
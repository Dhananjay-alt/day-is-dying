// YOUR DAY IS DYING - Browser Extension Background Service Worker
const DESKTOP_ENDPOINT = "http://127.0.0.1:41832/api/activity";

let currentActiveTab = null;
let tabStartTime = Date.now();
let isIdle = false;
let isTrackingEnabled = true;

// Load user setting from storage
chrome.storage.local.get(["trackingEnabled"], (result) => {
  if (result.trackingEnabled !== undefined) {
    isTrackingEnabled = result.trackingEnabled;
  }
});

// Listen for settings change from popup
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.trackingEnabled) {
    isTrackingEnabled = changes.trackingEnabled.newValue;
  }
});

// Extract clean domain
function extractDomain(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "chrome:" || parsed.protocol === "about:" || parsed.protocol === "edge:") {
      return null;
    }
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

// Send activity chunk to local desktop Tauri app
async function sendActivityToDesktop(domain, title, durationSec, idleState) {
  if (!isTrackingEnabled || !domain) return;

  try {
    const res = await fetch(DESKTOP_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        domain: domain,
        title: title || domain,
        duration_seconds: durationSec,
        is_idle: idleState,
      }),
    });
    if (res.ok) {
      chrome.storage.local.set({ 
        lastSyncedDomain: domain,
        desktopConnected: true,
        lastSyncTimestamp: Date.now() 
      });
    }
  } catch (err) {
    // Desktop app may be closed or starting
    chrome.storage.local.set({ desktopConnected: false });
  }
}

// Flush current tab duration and switch active tab
async function flushActiveTab() {
  if (!currentActiveTab) return;

  const now = Date.now();
  const durationSec = Math.round((now - tabStartTime) / 1000);
  if (durationSec > 0) {
    await sendActivityToDesktop(
      currentActiveTab.domain,
      currentActiveTab.title,
      durationSec,
      isIdle
    );
  }
  tabStartTime = now;
}

// Handle tab activation
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  await flushActiveTab();
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab && tab.url) {
      const domain = extractDomain(tab.url);
      currentActiveTab = domain ? { domain, title: tab.title } : null;
    } else {
      currentActiveTab = null;
    }
  } catch (e) {
    currentActiveTab = null;
  }
});

// Handle URL navigation / title updates
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (tab.active && (changeInfo.url || changeInfo.title)) {
    await flushActiveTab();
    const domain = extractDomain(tab.url);
    currentActiveTab = domain ? { domain, title: tab.title } : null;
  }
});

// Handle window focus change
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  await flushActiveTab();
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    currentActiveTab = null;
  } else {
    try {
      const [tab] = await chrome.tabs.query({ active: true, windowId });
      if (tab && tab.url) {
        const domain = extractDomain(tab.url);
        currentActiveTab = domain ? { domain, title: tab.title } : null;
      }
    } catch {
      currentActiveTab = null;
    }
  }
});

// Idle detection (default 300 seconds)
chrome.idle.setDetectionInterval(300);
chrome.idle.onStateChanged.addListener((state) => {
  isIdle = state !== "active";
});

// Periodic heartbeat every 5 seconds for continuous tracking while active
setInterval(async () => {
  if (!currentActiveTab || !isTrackingEnabled) return;
  const now = Date.now();
  const durationSec = Math.round((now - tabStartTime) / 1000);
  if (durationSec >= 5) {
    await sendActivityToDesktop(
      currentActiveTab.domain,
      currentActiveTab.title,
      durationSec,
      isIdle
    );
    tabStartTime = now;
  }
}, 5000);

document.addEventListener("DOMContentLoaded", async () => {
  const connStatus = document.getElementById("connStatus");
  const activeDomain = document.getElementById("activeDomain");
  const toggleBtn = document.getElementById("toggleBtn");

  // Check tracking status
  let isEnabled = true;
  chrome.storage.local.get(["trackingEnabled", "lastSyncedDomain"], (res) => {
    if (res.trackingEnabled !== undefined) {
      isEnabled = res.trackingEnabled;
    }
    updateButton();
    if (res.lastSyncedDomain) {
      activeDomain.textContent = res.lastSyncedDomain;
    }
  });

  // Query current tab
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      try {
        const u = new URL(tab.url);
        if (u.protocol.startsWith("http")) {
          activeDomain.textContent = u.hostname.replace(/^www\./, "");
        } else {
          activeDomain.textContent = "System / Internal Page";
        }
      } catch {
        activeDomain.textContent = "None";
      }
    }
  } catch {}

  // Check desktop app connection
  try {
    const res = await fetch("http://127.0.0.1:41832/api/status");
    if (res.ok) {
      connStatus.textContent = "CONNECTED (LOCAL)";
      connStatus.className = "badge badge-online";
    } else {
      connStatus.textContent = "DISCONNECTED";
      connStatus.className = "badge badge-offline";
    }
  } catch {
    connStatus.textContent = "DISCONNECTED";
    connStatus.className = "badge badge-offline";
  }

  function updateButton() {
    if (isEnabled) {
      toggleBtn.textContent = "TRACKING: ACTIVE";
      toggleBtn.className = "toggle-btn";
    } else {
      toggleBtn.textContent = "TRACKING: PAUSED";
      toggleBtn.className = "toggle-btn disabled";
    }
  }

  toggleBtn.addEventListener("click", () => {
    isEnabled = !isEnabled;
    chrome.storage.local.set({ trackingEnabled: isEnabled });
    updateButton();
  });
});

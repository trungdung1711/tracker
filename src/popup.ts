import { Session } from "./types";

function formatDuration(ms: number): string {
  const sec = Math.floor(ms / 1000);
  const min = Math.floor(sec / 60);
  const s = sec % 60;
  return `${min}m ${s}s`;
}

document.addEventListener("DOMContentLoaded", async () => {
  // Get all finished sessions from storage
  const { interactions } = await chrome.storage.local.get({ interactions: [] });

  const container = document.getElementById("session-list")!;
  container.innerHTML = "";

  (interactions as Session[]).forEach((s, index) => {
    const el = document.createElement("div");
    el.className = "session";

    el.innerHTML = `
      <h3>Session ${index + 1}: ${s.title || "(No title)"}</h3>
      <div><em>${s.url}</em></div>
      <div>Started: ${new Date(s.startedAt).toLocaleString()}</div>
      <div>Ended: ${new Date(s.endedAt).toLocaleString()}</div>
      <div>Duration: ${formatDuration(s.duration)}</div>
      <div>Scroll Depth: ${s.scrollDepth}%</div>
      <div>Clicks: ${s.clicks.length}</div>
      <div>Highlights: ${s.highlights.length}</div>
    `;

    // Details
    const details = document.createElement("div");
    details.className = "session-details";

    if (s.clicks.length > 0) {
      const clicksEl = document.createElement("ul");
      clicksEl.innerHTML = "<strong>Click Events:</strong>";
      for (const c of s.clicks) {
        const li = document.createElement("li");
        li.textContent = `${new Date(c.timestamp).toLocaleTimeString()} → ${c.url}`;
        clicksEl.appendChild(li);
      }
      details.appendChild(clicksEl);
    }

    if (s.highlights.length > 0) {
      const highlightsEl = document.createElement("ul");
      highlightsEl.innerHTML = "<strong>Highlights:</strong>";
      for (const h of s.highlights) {
        const li = document.createElement("li");
        li.textContent = `"${h.text}" (${new Date(h.timestamp).toLocaleTimeString()})`;
        highlightsEl.appendChild(li);
      }
      details.appendChild(highlightsEl);
    }

    el.appendChild(details);
    container.appendChild(el);
  });
});

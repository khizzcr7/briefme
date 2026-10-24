"use strict";

const els = {
  badge: document.getElementById("modeBadge"),
  docType: document.getElementById("docType"),
  docTitle: document.getElementById("docTitle"),
  docText: document.getElementById("docText"),
  charCount: document.getElementById("charCount"),
  chips: document.getElementById("sampleChips"),
  generateBtn: document.getElementById("generateBtn"),
  errorBox: document.getElementById("errorBox"),
  emptyState: document.getElementById("emptyState"),
  result: document.getElementById("briefResult"),
  notice: document.getElementById("briefNotice"),
  tldr: document.getElementById("briefTldr"),
  meta: document.getElementById("briefMeta"),
  keyPoints: document.getElementById("briefKeyPoints"),
  decisions: document.getElementById("briefDecisions"),
  actions: document.getElementById("briefActions"),
  questions: document.getElementById("briefQuestions"),
  copyBtn: document.getElementById("copyBtn"),
  briefPanel: document.querySelector(".brief-panel"),
};

let currentBrief = null;

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function updateCount() {
  els.charCount.textContent = `${els.docText.value.length.toLocaleString()} characters`;
}
els.docText.addEventListener("input", updateCount);

async function initMode() {
  try {
    const res = await fetch("/api/health");
    const data = await res.json();
    if (data.mode === "gemini") {
      els.badge.textContent = `Powered by Gemini (${data.model})`;
      els.badge.classList.add("gemini");
    } else {
      els.badge.textContent = "Offline demo mode";
    }
  } catch {
    els.badge.textContent = "Server unreachable";
  }
}

async function initSamples() {
  try {
    const res = await fetch("/api/samples");
    const data = await res.json();
    for (const sample of data.samples) {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip";
      chip.textContent = sample.title;
      chip.addEventListener("click", () => {
        els.docText.value = sample.text;
        els.docTitle.value = sample.title;
        els.docType.value = sample.docType;
        updateCount();
        els.docText.focus();
      });
      els.chips.appendChild(chip);
    }
  } catch {
    // Samples are a convenience; the app works without them.
  }
}

function fillList(ul, items) {
  ul.innerHTML = "";
  if (!items || items.length === 0) {
    const li = document.createElement("li");
    li.className = "none-stated";
    li.textContent = "None stated in the document.";
    ul.appendChild(li);
    return;
  }
  for (const item of items) {
    const li = document.createElement("li");
    li.textContent = item;
    ul.appendChild(li);
  }
}

function renderActions(items) {
  els.actions.innerHTML = "";
  if (!items || items.length === 0) {
    const p = document.createElement("p");
    p.className = "none-stated";
    p.textContent = "None stated in the document.";
    els.actions.appendChild(p);
    return;
  }
  const table = document.createElement("table");
  table.className = "actions";
  table.innerHTML =
    "<thead><tr><th>Task</th><th>Owner</th><th>Due</th></tr></thead>";
  const tbody = document.createElement("tbody");
  for (const item of items) {
    const tr = document.createElement("tr");
    tr.innerHTML =
      `<td>${escapeHtml(item.task)}</td>` +
      `<td class="owner">${escapeHtml(item.owner ?? "—")}</td>` +
      `<td class="due">${escapeHtml(item.due ?? "—")}</td>`;
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  els.actions.appendChild(table);
}

function renderBrief(brief) {
  currentBrief = brief;
  els.emptyState.hidden = true;
  els.result.hidden = false;
  els.copyBtn.hidden = false;

  if (brief.notice) {
    els.notice.textContent = brief.notice;
    els.notice.hidden = false;
  } else {
    els.notice.hidden = true;
  }

  els.tldr.textContent = brief.tldr;
  els.meta.textContent =
    `“${brief.title}” · generated with ${brief.mode === "gemini" ? "Gemini" : "the offline demo extractor"}` +
    ` · saves roughly ${brief.readingTimeSavedMinutes} min of reading`;

  fillList(els.keyPoints, brief.keyPoints);
  fillList(els.decisions, brief.decisions);
  renderActions(brief.actionItems);
  fillList(els.questions, brief.openQuestions);
}

function showError(message) {
  els.errorBox.textContent = message;
  els.errorBox.hidden = false;
}
function clearError() {
  els.errorBox.hidden = true;
  els.errorBox.textContent = "";
}

async function generate() {
  clearError();
  const text = els.docText.value;
  if (text.trim().length < 200) {
    showError("That document is too short to brief. Paste at least 200 characters, or load one of the samples.");
    return;
  }
  els.generateBtn.disabled = true;
  els.generateBtn.textContent = "Reading your document…";
  els.briefPanel.classList.add("loading");
  try {
    const res = await fetch("/api/brief", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: els.docTitle.value.trim(),
        docType: els.docType.value,
        text,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      showError(data.error ?? "Something went wrong. Try again.");
      return;
    }
    renderBrief(data);
    els.result.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } catch {
    showError("Could not reach the server. Is BriefMe still running?");
  } finally {
    els.generateBtn.disabled = false;
    els.generateBtn.textContent = "Generate brief";
    els.briefPanel.classList.remove("loading");
  }
}
els.generateBtn.addEventListener("click", generate);

function briefToMarkdown(b) {
  const lines = [];
  lines.push(`# Brief: ${b.title}`, "");
  lines.push("## TL;DR", b.tldr, "");
  lines.push("## Key points");
  for (const p of b.keyPoints) lines.push(`- ${p}`);
  if (b.keyPoints.length === 0) lines.push("- None stated in the document.");
  lines.push("", "## Decisions");
  for (const d of b.decisions) lines.push(`- ${d}`);
  if (b.decisions.length === 0) lines.push("- None stated in the document.");
  lines.push("", "## Action items");
  for (const a of b.actionItems) {
    const bits = [a.task];
    if (a.owner) bits.push(`Owner: ${a.owner}`);
    if (a.due) bits.push(`Due: ${a.due}`);
    lines.push(`- [ ] ${bits.join(" · ")}`);
  }
  if (b.actionItems.length === 0) lines.push("- None stated in the document.");
  lines.push("", "## Open questions");
  for (const q of b.openQuestions) lines.push(`- ${q}`);
  if (b.openQuestions.length === 0) lines.push("- None stated in the document.");
  lines.push("", `---`, `_Generated by BriefMe (${b.mode === "gemini" ? "Gemini API" : "offline demo mode"})_`);
  return lines.join("\n");
}

els.copyBtn.addEventListener("click", async () => {
  if (!currentBrief) return;
  const md = briefToMarkdown(currentBrief);
  try {
    await navigator.clipboard.writeText(md);
    els.copyBtn.textContent = "Copied ✓";
  } catch {
    const ta = document.createElement("textarea");
    ta.value = md;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
    els.copyBtn.textContent = "Copied ✓";
  }
  setTimeout(() => (els.copyBtn.textContent = "Copy as Markdown"), 2000);
});

updateCount();
initMode();
initSamples();

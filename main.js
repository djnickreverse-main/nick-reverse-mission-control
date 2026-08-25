const stateUrl = new URL("./data/state.json", import.meta.url);

const statusTone = {
  urgent: "urgent",
  blocked: "blocked",
  done: "done",
  active: "",
  next: "",
  pending: "blocked"
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function pill(label) {
  const tone = statusTone[label] ?? "";
  return `<span class="pill ${tone}">${escapeHtml(label)}</span>`;
}

function setCount(id, items) {
  document.getElementById(id).textContent = String(items.length);
}

function renderTimeline(items) {
  setCount("today-count", items);
  document.getElementById("today-list").innerHTML = items
    .map(
      (item) => `
        <article class="timeline-item">
          <span class="time-label">${escapeHtml(item.time)}</span>
          <div>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.type)}</p>
          </div>
          ${pill(item.status)}
        </article>
      `
    )
    .join("");
}

function renderPriorities(items) {
  setCount("priority-count", items);
  document.getElementById("priority-list").innerHTML = items
    .map(
      (item) => `
        <article class="item-card">
          <div class="meta-row">
            ${pill(item.priority)}
            ${pill(item.status)}
          </div>
          <div>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.nextAction)}</p>
          </div>
          <p>Owner: ${escapeHtml(item.ownerLabel)}</p>
        </article>
      `
    )
    .join("");
}

function renderStack(targetId, countId, items, renderBody) {
  setCount(countId, items);
  document.getElementById(targetId).innerHTML = items
    .map((item) => `<article class="item-card">${renderBody(item)}</article>`)
    .join("");
}

function renderDashboard(state) {
  document.getElementById("focus-title").textContent = state.focus.title;
  document.getElementById("focus-next-action").textContent = state.focus.nextAction;
  document.getElementById("focus-priority").textContent = state.focus.priority;
  document.getElementById("generated-at").textContent = `Updated ${new Date(
    state.generatedAt
  ).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}`;

  renderTimeline(state.today);
  renderPriorities(state.priorities);

  renderStack("approval-list", "approval-count", state.approvals, (item) => `
    <div class="meta-row">${pill(item.status)}</div>
    <div>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.request)}</p>
    </div>
  `);

  renderStack("project-list", "project-count", state.projects, (item) => `
    <div class="meta-row">
      ${pill(item.priority)}
      ${pill(item.status)}
    </div>
    <div>
      <h3>${escapeHtml(item.name)}</h3>
      <p>${escapeHtml(item.objective)}</p>
    </div>
    <p>${escapeHtml(item.nextAction)}</p>
  `);

  renderStack("activity-list", "activity-count", state.laraActivity, (item) => `
    <div class="meta-row">${pill(item.status)}</div>
    <div>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.summary)}</p>
    </div>
  `);
}

async function init() {
  const response = await fetch(new URL(stateUrl.href + "?v=" + Date.now()));
  if (!response.ok) {
    throw new Error(`Mission Control state failed to load: ${response.status}`);
  }

  renderDashboard(await response.json());
}

init().catch((error) => {
  document.body.innerHTML = `<main class="error-state"><h1>Mission Control failed to load</h1><p>${escapeHtml(
    error.message
  )}</p></main>`;
});
setInterval(init, 60000);

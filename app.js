const API_BASE = "/api";

let applications = [];
let draggedId = null;

/* Elements */

const form = document.getElementById("app-form");
const inputId = document.getElementById("app-id");
const inputCompany = document.getElementById("company");
const inputRole = document.getElementById("role");
const inputLocation = document.getElementById("location");
const inputAppliedDate = document.getElementById("appliedDate");
const inputStatus = document.getElementById("status");
const inputSalaryMin = document.getElementById("salaryMin");
const inputSalaryMax = document.getElementById("salaryMax");
const inputJobLink = document.getElementById("jobLink");
const inputTags = document.getElementById("tags");
const inputNotes = document.getElementById("notes");
const resetBtn = document.getElementById("reset-btn");
const searchInput = document.getElementById("search");

const colApplied = document.getElementById("col-applied");
const colOa = document.getElementById("col-oa");
const colInterview = document.getElementById("col-interview");
const colOffer = document.getElementById("col-offer");
const colRejected = document.getElementById("col-rejected");

const sumTotal = document.getElementById("sum-total");
const sumApplied = document.getElementById("sum-applied");
const sumOa = document.getElementById("sum-oa");
const sumInterview = document.getElementById("sum-interview");
const sumOffer = document.getElementById("sum-offer");
const sumRejected = document.getElementById("sum-rejected");

/* API helpers */

async function fetchJSON(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  return res.json();
}

async function loadApplications() {
  const search = searchInput.value.trim();
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  const url = `${API_BASE}/applications?${params.toString()}`;
  applications = await fetchJSON(url);
  renderBoard();
}

async function loadSummary() {
  const summary = await fetchJSON(`${API_BASE}/summary`);
  sumTotal.textContent = summary.total;
  sumApplied.textContent = summary.applied;
  sumOa.textContent = summary.oa;
  sumInterview.textContent = summary.interview;
  sumOffer.textContent = summary.offer;
  sumRejected.textContent = summary.rejected;
}

async function createApplication(data) {
  return fetchJSON(`${API_BASE}/applications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
}

async function updateApplication(id, data) {
  return fetchJSON(`${API_BASE}/applications/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
}

async function deleteApplication(id) {
  await fetchJSON(`${API_BASE}/applications/${id}`, { method: "DELETE" });
}

/* Rendering */

function clearColumns() {
  [colApplied, colOa, colInterview, colOffer, colRejected].forEach((col) => {
    col.innerHTML = "";
  });
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function createCard(app) {
  const card = document.createElement("article");
  card.className = "card";
  card.draggable = true;
  card.dataset.id = app._id;

  const header = document.createElement("div");
  header.className = "card-header";

  const company = document.createElement("div");
  company.className = "card-company";
  company.textContent = app.company;

  const role = document.createElement("div");
  role.className = "card-role";
  role.textContent = app.role;

  header.appendChild(company);
  header.appendChild(role);

  const meta = document.createElement("div");
  meta.className = "card-meta";
  const bits = [];
  if (app.location) bits.push(app.location);
  if (app.appliedDate) bits.push(`Applied: ${formatDate(app.appliedDate)}`);
  if (app.salaryMin || app.salaryMax) {
    bits.push(`Salary: ${app.salaryMin || "?"} - ${app.salaryMax || "?"}`);
  }
  meta.textContent = bits.join(" • ");

  const tagsWrap = document.createElement("div");
  tagsWrap.className = "card-tags";
  (app.tags || []).forEach((t) => {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = t;
    tagsWrap.appendChild(tag);
  });

  const actions = document.createElement("div");
  actions.className = "card-actions";

  const editBtn = document.createElement("button");
  editBtn.textContent = "Edit";
  editBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    fillForm(app);
  });

  const delBtn = document.createElement("button");
  delBtn.textContent = "Delete";
  delBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    if (confirm("Delete this application?")) {
      await deleteApplication(app._id);
      await Promise.all([loadApplications(), loadSummary()]);
    }
  });

  actions.appendChild(editBtn);
  actions.appendChild(delBtn);

  if (app.jobLink) {
    const linkBtn = document.createElement("button");
    linkBtn.textContent = "JD";
    linkBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      window.open(app.jobLink, "_blank");
    });
    actions.appendChild(linkBtn);
  }

  card.appendChild(header);
  card.appendChild(meta);
  if (app.tags && app.tags.length) {
    card.appendChild(tagsWrap);
  }
  card.appendChild(actions);

  // Drag events
  card.addEventListener("dragstart", () => {
    draggedId = app._id;
  });

  card.addEventListener("dragend", () => {
    draggedId = null;
  });

  return card;
}

function renderBoard() {
  clearColumns();

  applications.forEach((app) => {
    const card = createCard(app);
    let targetCol = colApplied;
    if (app.status === "oa") targetCol = colOa;
    else if (app.status === "interview") targetCol = colInterview;
    else if (app.status === "offer") targetCol = colOffer;
    else if (app.status === "rejected") targetCol = colRejected;
    targetCol.appendChild(card);
  });
}

/* Form helpers */

function resetForm() {
  inputId.value = "";
  form.reset();
  inputStatus.value = "applied";
}

function fillForm(app) {
  inputId.value = app._id;
  inputCompany.value = app.company || "";
  inputRole.value = app.role || "";
  inputLocation.value = app.location || "";
  inputStatus.value = app.status || "applied";
  inputAppliedDate.value = app.appliedDate
    ? new Date(app.appliedDate).toISOString().slice(0, 10)
    : "";
  inputSalaryMin.value = app.salaryMin ?? "";
  inputSalaryMax.value = app.salaryMax ?? "";
  inputJobLink.value = app.jobLink || "";
  inputNotes.value = app.notes || "";
  inputTags.value = (app.tags || []).join(", ");
}

/* Events */

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    company: inputCompany.value.trim(),
    role: inputRole.value.trim(),
    location: inputLocation.value.trim(),
    status: inputStatus.value,
    appliedDate: inputAppliedDate.value || null,
    salaryMin: inputSalaryMin.value ? Number(inputSalaryMin.value) : undefined,
    salaryMax: inputSalaryMax.value ? Number(inputSalaryMax.value) : undefined,
    jobLink: inputJobLink.value.trim() || undefined,
    notes: inputNotes.value.trim() || undefined,
    tags: inputTags.value
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
  };

  if (!payload.company || !payload.role) {
    alert("Company and role are required.");
    return;
  }

  try {
    if (inputId.value) {
      await updateApplication(inputId.value, payload);
    } else {
      await createApplication(payload);
    }
    resetForm();
    await Promise.all([loadApplications(), loadSummary()]);
  } catch (err) {
    console.error(err);
    alert("Failed to save application.");
  }
});

resetBtn.addEventListener("click", () => {
  resetForm();
});

searchInput.addEventListener("input", () => {
  loadApplications();
});

/* Drag-and-drop columns */

document.querySelectorAll(".column-body").forEach((col) => {
  col.addEventListener("dragover", (e) => {
    e.preventDefault();
    col.classList.add("drag-over");
  });

  col.addEventListener("dragleave", () => {
    col.classList.remove("drag-over");
  });

  col.addEventListener("drop", async () => {
    col.classList.remove("drag-over");
    if (!draggedId) return;
    const newStatus = col.parentElement.dataset.status;
    try {
      await updateApplication(draggedId, { status: newStatus });
      await Promise.all([loadApplications(), loadSummary()]);
    } catch (err) {
      console.error(err);
      alert("Failed to move application.");
    }
  });
});

/* Init */

(async function init() {
  try {
    await Promise.all([loadApplications(), loadSummary()]);
  } catch (err) {
    console.error(err);
    alert("Failed to load data. Check if the server and MongoDB are running.");
  }
})();
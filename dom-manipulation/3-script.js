// script.js
// Dynamic Quote Generator with Category Filtering, Web Storage & Mock Server Sync

// ---------- Storage keys ----------
const LOCAL_KEY = "dynamic_quote_generator_quotes_v2";
const LOCAL_KEY_FILTER = "dynamic_quote_generator_selected_category_v2";
const SESSION_KEY_LAST = "dynamic_quote_generator_last_viewed_quote";

// ---------- Server simulation endpoint ----------
const SERVER_URL = "https://jsonplaceholder.typicode.com/posts"; // mock API

// ---------- Default quotes ----------
const defaultQuotes = [
  {
    text: "The best way to get started is to quit talking and begin doing.",
    category: "Motivation",
  },
  {
    text: "Success is not in what you have, but who you are.",
    category: "Success",
  },
  { text: "Happiness depends upon ourselves.", category: "Happiness" },
  {
    text: "In the middle of every difficulty lies opportunity.",
    category: "Inspiration",
  },
];

// ---------- DOM References ----------
const quoteDisplay = document.getElementById("quoteDisplay");
const categoryFilter = document.getElementById("categorySelect");
const newQuoteButton = document.getElementById("newQuote");
const formContainer = document.getElementById("addQuoteFormContainer");
const quotesListContainer = document.getElementById("quotesList");
const quotesCount = document.getElementById("quotesCount");
const exportBtn = document.getElementById("exportJson");
const importFileInput = document.getElementById("importFile");
const importMergeBtn = document.getElementById("importMerge");
const importReplaceBtn = document.getElementById("importReplace");

// Notification area
const notification = document.createElement("div");
notification.style.position = "fixed";
notification.style.bottom = "20px";
notification.style.right = "20px";
notification.style.background = "#2563eb";
notification.style.color = "white";
notification.style.padding = "10px 16px";
notification.style.borderRadius = "8px";
notification.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
notification.style.display = "none";
document.body.appendChild(notification);

// ---------- In-memory data ----------
let quotes = [];
let selectedCategory = "all";

// ---------- Initialization ----------
document.addEventListener("DOMContentLoaded", () => {
  loadQuotesFromLocalStorage();
  populateCategories();
  restoreSelectedCategory();
  createAddQuoteForm();
  renderQuotesList(selectedCategory);

  newQuoteButton.addEventListener("click", showRandomQuote);
  if (categoryFilter) categoryFilter.addEventListener("change", filterQuotes);
  if (exportBtn) exportBtn.addEventListener("click", exportQuotesToJson);
  if (importMergeBtn)
    importMergeBtn.addEventListener("click", () =>
      importFromJsonFile({ replace: false })
    );
  if (importReplaceBtn)
    importReplaceBtn.addEventListener("click", () =>
      importFromJsonFile({ replace: true })
    );

  // Begin periodic sync with the server
  startPeriodicSync();
});

// ---------- Local Storage ----------
function saveQuotesToLocalStorage() {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(quotes));
}

function loadQuotesFromLocalStorage() {
  const data = localStorage.getItem(LOCAL_KEY);
  if (!data) {
    quotes = [...defaultQuotes];
    saveQuotesToLocalStorage();
    return;
  }
  try {
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.every(isValidQuoteObject)) {
      quotes = parsed;
    } else throw new Error("Invalid structure");
  } catch {
    quotes = [...defaultQuotes];
    saveQuotesToLocalStorage();
  }
}

// ---------- Validation ----------
function isValidQuoteObject(obj) {
  return (
    obj &&
    typeof obj.text === "string" &&
    typeof obj.category === "string" &&
    obj.text.trim().length > 0 &&
    obj.category.trim().length > 0
  );
}

// ---------- Populate Categories ----------
function populateCategories() {
  if (!categoryFilter) return;
  const uniqueCats = [...new Set(quotes.map((q) => q.category))].sort();
  categoryFilter.innerHTML = `<option value="all">All Categories</option>`;
  uniqueCats.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    categoryFilter.appendChild(opt);
  });
}

// ---------- Filtering ----------
function filterQuotes() {
  selectedCategory = categoryFilter.value;
  localStorage.setItem(LOCAL_KEY_FILTER, selectedCategory);
  renderQuotesList(selectedCategory);
}

// ---------- Render Quotes ----------
function renderQuotesList(filter = selectedCategory) {
  if (!quotesListContainer) return;
  const list =
    filter === "all" ? quotes : quotes.filter((q) => q.category === filter);

  quotesListContainer.innerHTML = "";
  if (list.length === 0) {
    quotesListContainer.innerHTML = "<p><em>No quotes available.</em></p>";
    quotesCount.textContent = "0";
    return;
  }

  list.forEach((q) => {
    const p = document.createElement("p");
    p.textContent = `"${q.text}" — ${q.category}`;
    quotesListContainer.appendChild(p);
  });
  quotesCount.textContent = list.length;
}

// ---------- Restore Last Selected Category ----------
function restoreSelectedCategory() {
  const saved = localStorage.getItem(LOCAL_KEY_FILTER);
  if (saved && categoryFilter) {
    selectedCategory = saved;
    setTimeout(() => {
      if (
        Array.from(categoryFilter.options).some((opt) => opt.value === saved)
      ) {
        categoryFilter.value = saved;
      }
      renderQuotesList(saved);
    }, 50);
  } else {
    selectedCategory = "all";
  }
}

// ---------- Show Random Quote ----------
function showRandomQuote() {
  const filtered =
    selectedCategory === "all"
      ? quotes
      : quotes.filter((q) => q.category === selectedCategory);
  if (filtered.length === 0) {
    quoteDisplay.textContent = "No quotes available in this category.";
    return;
  }
  const chosen = filtered[Math.floor(Math.random() * filtered.length)];
  quoteDisplay.textContent = `"${chosen.text}" — ${chosen.category}`;
  sessionStorage.setItem(SESSION_KEY_LAST, JSON.stringify(chosen));
}

// ---------- Add Quote Form ----------
function createAddQuoteForm() {
  formContainer.innerHTML = "";
  const quoteInput = document.createElement("input");
  quoteInput.placeholder = "Enter a new quote";
  quoteInput.id = "newQuoteText";

  const categoryInput = document.createElement("input");
  categoryInput.placeholder = "Enter category";
  categoryInput.id = "newQuoteCategory";

  const addBtn = document.createElement("button");
  addBtn.textContent = "Add Quote";
  addBtn.addEventListener("click", () =>
    addQuote(quoteInput.value, categoryInput.value)
  );

  formContainer.append(quoteInput, categoryInput, addBtn);
}

// ---------- Add Quote ----------
function addQuote(text, category) {
  text = text.trim();
  category = category.trim();
  if (!text || !category) {
    alert("Please fill in both fields.");
    return;
  }

  const newQuote = { text, category };
  quotes.push(newQuote);
  saveQuotesToLocalStorage();
  populateCategories();
  selectedCategory = category;
  categoryFilter.value = category;
  filterQuotes();

  alert("Quote added successfully!");
  sendQuoteToServer(newQuote);
  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";
}

// ---------- Export ----------
function exportQuotesToJson() {
  const blob = new Blob([JSON.stringify(quotes, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes_export.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ---------- Import ----------
function importFromJsonFile({ replace = false } = {}) {
  const file = importFileInput.files[0];
  if (!file) {
    alert("Select a JSON file first!");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target.result);
      const valid = parsed.filter(isValidQuoteObject);
      if (replace) {
        quotes = valid;
      } else {
        const existing = new Set(quotes.map((q) => q.text + q.category));
        valid.forEach((q) => {
          if (!existing.has(q.text + q.category)) quotes.push(q);
        });
      }
      saveQuotesToLocalStorage();
      populateCategories();
      renderQuotesList(selectedCategory);
      showNotification("Quotes imported successfully!");
    } catch {
      alert("Invalid JSON file!");
    }
  };
  reader.readAsText(file);
}

// ============================================================
// 🛰️ Step 1–3: Simulated Server Sync and Conflict Resolution
// ============================================================

// Periodic sync every 30 seconds
function startPeriodicSync() {
  syncWithServer();
  setInterval(syncWithServer, 30000);
}

// Fetch from mock server
async function fetchQuotesFromServer() {
  const res = await fetch(SERVER_URL);
  const data = await res.json();
  // Simulate quote format using first 10 entries
  return data.slice(0, 10).map((item) => ({
    text: item.title,
    category: "ServerSync",
  }));
}

// Send local quote to mock server
async function sendQuoteToServer(quote) {
  try {
    await fetch(SERVER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(quote),
    });
    showNotification("Quote synced with server.");
  } catch {
    showNotification("⚠️ Failed to sync new quote. Will retry later.");
  }
}

// Merge server and local data (server wins)
async function syncWithServer() {
  try {
    const serverQuotes = await fetchQuotesFromServer();
    let updated = false;

    const localMap = new Map(quotes.map((q) => [q.text + q.category, q]));
    serverQuotes.forEach((sq) => {
      const key = sq.text + sq.category;
      if (!localMap.has(key)) {
        quotes.push(sq);
        updated = true;
      }
    });

    if (updated) {
      saveQuotesToLocalStorage();
      populateCategories();
      renderQuotesList(selectedCategory);
      showNotification("Server data synced. New quotes added.");
    }
  } catch {
    console.warn("Sync failed (offline or server error).");
  }
}

// ---------- Notification ----------
function showNotification(msg) {
  notification.textContent = msg;
  notification.style.display = "block";
  setTimeout(() => (notification.style.display = "none"), 4000);
}

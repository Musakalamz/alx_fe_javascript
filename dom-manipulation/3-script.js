// script.js
// Dynamic Quote Generator with Category Filtering, Web Storage, Import/Export, and Simulated Server Sync (GET + POST)

// ---------- Storage keys ----------
const LOCAL_KEY = "dynamic_quote_generator_quotes_v4";
const LOCAL_KEY_FILTER = "dynamic_quote_generator_selected_category_v4";
const SESSION_KEY_LAST = "dynamic_quote_generator_last_viewed_quote";

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
const categoryFilter =
  document.getElementById("categoryFilter") ||
  document.getElementById("categorySelect"); // compatibility
const newQuoteButton = document.getElementById("newQuote");
const formContainer = document.getElementById("addQuoteFormContainer");
const quotesListContainer = document.getElementById("quotesList");
const exportBtn = document.getElementById("exportJson");
const importFileInput = document.getElementById("importFile");
const importMergeBtn = document.getElementById("importMerge");
const importReplaceBtn = document.getElementById("importReplace");
const quotesCount = document.getElementById("quotesCount");

// ---------- In-memory data ----------
let quotes = [];
let selectedCategory = "all";

// ---------- Mock Server URL ----------
const SERVER_URL = "https://jsonplaceholder.typicode.com/posts";

// ---------- Initialization ----------
document.addEventListener("DOMContentLoaded", () => {
  loadQuotesFromLocalStorage();
  populateCategories();
  restoreSelectedCategory();
  createAddQuoteForm();
  renderQuotesList(selectedCategory);

  if (newQuoteButton) newQuoteButton.addEventListener("click", showRandomQuote);
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

  // 🔄 Initial sync on load
  fetchQuotesFromServer();

  // ⏱️ Periodic sync every 60 seconds
  setInterval(fetchQuotesFromServer, 60000);
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
    if (quotesCount) quotesCount.textContent = "0";
    return;
  }

  list.forEach((q) => {
    const p = document.createElement("p");
    p.textContent = `"${q.text}" — ${q.category}`;
    quotesListContainer.appendChild(p);
  });

  if (quotesCount) quotesCount.textContent = list.length.toString();
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

  // 🔼 Post new quote to mock server
  postQuoteToServer(newQuote);

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
      alert("Quotes imported successfully!");
    } catch {
      alert("Invalid JSON file!");
    }
  };
  reader.readAsText(file);
}

// ---------- Server Sync Functions ----------

// Fetch quotes from mock server (simulated GET)
async function fetchQuotesFromServer() {
  try {
    const response = await fetch(SERVER_URL);
    if (!response.ok) throw new Error("Failed to fetch server data");

    const data = await response.json();
    const serverQuotes = data.slice(0, 10).map((item) => ({
      text: item.title,
      category: "Server Import",
    }));

    handleServerSync(serverQuotes);
  } catch (err) {
    console.error("❌ Server fetch error:", err);
  }
}

// Post new quote to mock server (simulated POST)
async function postQuoteToServer(quote) {
  try {
    const response = await fetch(SERVER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(quote),
    });
    const result = await response.json();
    console.log("✅ Quote posted to server:", result);
  } catch (err) {
    console.error("❌ Failed to post quote:", err);
  }
}

// Merge server quotes with local data
function handleServerSync(serverQuotes) {
  const localMap = new Map(quotes.map((q) => q.text));
  let updated = false;

  serverQuotes.forEach((serverQuote) => {
    if (!localMap.has(serverQuote.text)) {
      quotes.push(serverQuote);
      updated = true;
    }
  });

  if (updated) {
    console.warn("⚠️ Local data updated with new server quotes");
    saveQuotesToLocalStorage();
    populateCategories();
    renderQuotesList(selectedCategory);
    showSyncNotification("🔄 New quotes synced from the server!");
  }
}

// Display sync notification
function showSyncNotification(message) {
  const note = document.createElement("div");
  note.textContent = message;
  note.style.position = "fixed";
  note.style.bottom = "20px";
  note.style.right = "20px";
  note.style.background = "#2563eb";
  note.style.color = "#fff";
  note.style.padding = "10px 14px";
  note.style.borderRadius = "8px";
  note.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
  note.style.zIndex = "9999";
  document.body.appendChild(note);
  setTimeout(() => note.remove(), 4000);
}

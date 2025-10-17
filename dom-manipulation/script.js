// script.js
// Dynamic Quote Generator with Category Filtering using Web Storage (LocalStorage + JSON import/export)

// ---------- Storage keys ----------
const LOCAL_KEY = "dynamic_quote_generator_quotes_v2";
const LOCAL_KEY_FILTER = "dynamic_quote_generator_selected_category_v2";
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
const categoryFilter = document.getElementById("categoryFilter");
const newQuoteButton = document.getElementById("newQuote");
const formContainer = document.getElementById("addQuoteFormContainer");
const quotesListContainer = document.getElementById("quotesList");
const exportBtn = document.getElementById("exportJson");
const importFileInput = document.getElementById("importFile");
const importMergeBtn = document.getElementById("importMerge");
const importReplaceBtn = document.getElementById("importReplace");

// ---------- In-memory quotes array ----------
let quotes = [];

// ---------- Initialization ----------
document.addEventListener("DOMContentLoaded", () => {
  loadQuotesFromLocalStorage();
  populateCategories();
  restoreSelectedCategory();
  createAddQuoteForm();
  renderQuotesList();

  // Event listeners
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
  const selected = categoryFilter.value;
  localStorage.setItem(LOCAL_KEY_FILTER, selected);
  renderQuotesList(selected);
}

// ---------- Render Quotes ----------
function renderQuotesList(
  filter = localStorage.getItem(LOCAL_KEY_FILTER) || "all"
) {
  if (!quotesListContainer) return;
  let filtered =
    filter === "all" ? quotes : quotes.filter((q) => q.category === filter);

  quotesListContainer.innerHTML = "";
  if (filtered.length === 0) {
    quotesListContainer.innerHTML =
      "<p><em>No quotes available in this category.</em></p>";
    return;
  }

  filtered.forEach((q) => {
    const p = document.createElement("p");
    p.textContent = `"${q.text}" — ${q.category}`;
    quotesListContainer.appendChild(p);
  });
}

// ---------- Restore Last Selected Filter ----------
function restoreSelectedCategory() {
  const saved = localStorage.getItem(LOCAL_KEY_FILTER);
  if (!saved || !categoryFilter) return;
  setTimeout(() => {
    if (Array.from(categoryFilter.options).some((opt) => opt.value === saved)) {
      categoryFilter.value = saved;
    }
    renderQuotesList(saved);
  }, 50);
}

// ---------- Random Quote ----------
function showRandomQuote() {
  const selected = categoryFilter.value;
  const filtered =
    selected === "all" ? quotes : quotes.filter((q) => q.category === selected);
  if (filtered.length === 0) {
    quoteDisplay.textContent = "No quotes found in this category.";
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

  quotes.push({ text, category });
  saveQuotesToLocalStorage();
  populateCategories();
  renderQuotesList();
  categoryFilter.value = category;
  filterQuotes();

  alert("Quote added successfully!");
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
      renderQuotesList();
      alert("Quotes imported successfully!");
    } catch {
      alert("Invalid JSON file!");
    }
  };
  reader.readAsText(file);
}

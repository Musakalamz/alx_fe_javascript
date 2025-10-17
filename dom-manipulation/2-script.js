// script.js
// Enhanced Dynamic Quote Generator with Filters, Storage, and JSON import/export

const LOCAL_KEY_QUOTES = "quotesData_v2";
const LOCAL_KEY_FILTER = "lastSelectedFilter";
const SESSION_KEY_LAST_QUOTE = "lastViewedQuote";

let quotes = [];

// DOM Elements
const quoteDisplay = document.getElementById("quoteDisplay");
const categoryFilter = document.getElementById("categoryFilter");
const newQuoteBtn = document.getElementById("newQuote");
const addQuoteFormContainer = document.getElementById("addQuoteFormContainer");
const quotesList = document.getElementById("quotesList");
const importFile = document.getElementById("importFile");

document.addEventListener("DOMContentLoaded", () => {
  loadQuotesFromStorage();
  populateCategories();
  createAddQuoteForm();
  restoreFilter();
  filterQuotes(); // display filtered quotes
  restoreLastViewedQuote();

  newQuoteBtn.addEventListener("click", showRandomQuote);
  document.getElementById("exportJson").addEventListener("click", exportToJSON);
  document
    .getElementById("importMerge")
    .addEventListener("click", () => importFromJsonFile(false));
  document
    .getElementById("importReplace")
    .addEventListener("click", () => importFromJsonFile(true));
});

// ---------- Default Quotes ----------
const defaultQuotes = [
  {
    text: "In the middle of every difficulty lies opportunity.",
    category: "Inspiration",
  },
  {
    text: "The best way to get started is to quit talking and begin doing.",
    category: "Motivation",
  },
  {
    text: "Success is not in what you have, but who you are.",
    category: "Success",
  },
  { text: "Happiness depends upon ourselves.", category: "Happiness" },
];

// ---------- Load & Save ----------
function loadQuotesFromStorage() {
  const stored = localStorage.getItem(LOCAL_KEY_QUOTES);
  if (stored) {
    try {
      quotes = JSON.parse(stored);
    } catch {
      quotes = [...defaultQuotes];
      saveQuotes();
    }
  } else {
    quotes = [...defaultQuotes];
    saveQuotes();
  }
}

function saveQuotes() {
  localStorage.setItem(LOCAL_KEY_QUOTES, JSON.stringify(quotes));
}

// ---------- Populate Categories ----------
function populateCategories() {
  const categories = [...new Set(quotes.map((q) => q.category))];
  categoryFilter.innerHTML = `<option value="all">All Categories</option>`;
  categories.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });
}

// ---------- Filtering System ----------
function filterQuotes() {
  const selected = categoryFilter.value;
  localStorage.setItem(LOCAL_KEY_FILTER, selected);

  const filteredQuotes =
    selected === "all" ? quotes : quotes.filter((q) => q.category === selected);

  renderQuotesList(filteredQuotes);
}

function renderQuotesList(list) {
  quotesList.innerHTML = "";
  if (list.length === 0) {
    quotesList.innerHTML =
      "<p><em>No quotes available in this category.</em></p>";
    return;
  }
  list.forEach((q) => {
    const p = document.createElement("p");
    p.innerHTML = `“${q.text}” <small>— ${q.category}</small>`;
    quotesList.appendChild(p);
  });
}

function restoreFilter() {
  const lastFilter = localStorage.getItem(LOCAL_KEY_FILTER);
  if (
    lastFilter &&
    Array.from(categoryFilter.options).some((opt) => opt.value === lastFilter)
  ) {
    categoryFilter.value = lastFilter;
  }
}

// ---------- Random Quote ----------
function showRandomQuote() {
  const selected = categoryFilter.value;
  const filtered =
    selected === "all" ? quotes : quotes.filter((q) => q.category === selected);

  if (filtered.length === 0) {
    quoteDisplay.textContent = "No quotes available in this category.";
    return;
  }

  const random = filtered[Math.floor(Math.random() * filtered.length)];
  quoteDisplay.textContent = `"${random.text}" — ${random.category}`;
  sessionStorage.setItem(SESSION_KEY_LAST_QUOTE, JSON.stringify(random));
}

function restoreLastViewedQuote() {
  const last = sessionStorage.getItem(SESSION_KEY_LAST_QUOTE);
  if (last) {
    const quote = JSON.parse(last);
    quoteDisplay.textContent = `"${quote.text}" — ${quote.category} (restored)`;
  }
}

// ---------- Add Quote ----------
function createAddQuoteForm() {
  const wrapper = document.createElement("div");

  const quoteInput = document.createElement("input");
  quoteInput.id = "newQuoteText";
  quoteInput.type = "text";
  quoteInput.placeholder = "Enter a new quote";

  const categoryInput = document.createElement("input");
  categoryInput.id = "newQuoteCategory";
  categoryInput.type = "text";
  categoryInput.placeholder = "Enter category";

  const addBtn = document.createElement("button");
  addBtn.textContent = "Add Quote";
  addBtn.addEventListener("click", () =>
    addQuote(quoteInput.value, categoryInput.value)
  );

  wrapper.appendChild(quoteInput);
  wrapper.appendChild(categoryInput);
  wrapper.appendChild(addBtn);
  addQuoteFormContainer.appendChild(wrapper);
}

function addQuote(text, category) {
  if (!text.trim() || !category.trim()) {
    alert("Please fill in both fields.");
    return;
  }

  quotes.push({ text: text.trim(), category: category.trim() });
  saveQuotes();
  populateCategories();
  filterQuotes();

  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";

  alert("Quote added successfully!");
}

// ---------- JSON Export ----------
function exportToJSON() {
  const dataStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes_export.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ---------- JSON Import ----------
function importFromJsonFile(replace = false) {
  const file = importFile.files[0];
  if (!file) {
    alert("Please select a JSON file first.");
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const importedQuotes = JSON.parse(event.target.result);
      if (!Array.isArray(importedQuotes))
        throw new Error("Invalid JSON format.");

      if (replace) {
        quotes = importedQuotes;
      } else {
        const existing = new Set(quotes.map((q) => q.text + "||" + q.category));
        for (const q of importedQuotes) {
          const key = q.text + "||" + q.category;
          if (!existing.has(key)) quotes.push(q);
        }
      }

      saveQuotes();
      populateCategories();
      filterQuotes();
      alert("Quotes imported successfully!");
      importFile.value = "";
    } catch (err) {
      alert("Error importing JSON: " + err.message);
    }
  };
  reader.readAsText(file);
}

// script.js
// Dynamic Quote Generator with Category Filtering using LocalStorage

// ---------- Storage Keys ----------
const LOCAL_KEY_QUOTES = "dynamic_quote_generator_quotes_v2";
const LOCAL_KEY_FILTER = "dynamic_quote_generator_selected_category";
const SESSION_KEY_LAST = "dynamic_quote_generator_last_viewed_quote";

// ---------- Default Quotes ----------
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
const newQuoteBtn = document.getElementById("newQuote");
const addFormContainer = document.getElementById("addQuoteFormContainer");

// ---------- Global State ----------
let quotes = [];

// ---------- Initialization ----------
document.addEventListener("DOMContentLoaded", () => {
  loadQuotes();
  populateCategories();
  restoreFilter();
  createAddQuoteForm();
  showFilteredQuotes();

  // Event Listeners
  newQuoteBtn.addEventListener("click", showRandomQuote);
  categoryFilter.addEventListener("change", filterQuotes);
});

// ---------- Local Storage Helpers ----------
function saveQuotes() {
  localStorage.setItem(LOCAL_KEY_QUOTES, JSON.stringify(quotes));
}

function loadQuotes() {
  const data = localStorage.getItem(LOCAL_KEY_QUOTES);
  if (data) {
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        quotes = parsed;
        return;
      }
    } catch (err) {
      console.warn("Invalid stored data. Resetting...");
    }
  }
  quotes = [...defaultQuotes];
  saveQuotes();
}

// ---------- Category Filtering Logic ----------
function populateCategories() {
  const uniqueCategories = [...new Set(quotes.map((q) => q.category))].sort();
  categoryFilter.innerHTML = `<option value="all">All Categories</option>`;
  uniqueCategories.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    categoryFilter.appendChild(opt);
  });
}

function filterQuotes() {
  const selected = categoryFilter.value;
  localStorage.setItem(LOCAL_KEY_FILTER, selected);
  showFilteredQuotes(selected);
}

function showFilteredQuotes(category = categoryFilter.value || "all") {
  quoteDisplay.innerHTML = "";

  let filtered = [];
  if (category === "all") {
    filtered = quotes;
  } else {
    filtered = quotes.filter((q) => q.category === category);
  }

  if (filtered.length === 0) {
    quoteDisplay.textContent = "No quotes available in this category.";
    return;
  }

  filtered.forEach((q) => {
    const p = document.createElement("p");
    p.textContent = `"${q.text}" — [${q.category}]`;
    quoteDisplay.appendChild(p);
  });
}

// ---------- Restore Last Selected Filter ----------
function restoreFilter() {
  const lastFilter = localStorage.getItem(LOCAL_KEY_FILTER);
  if (lastFilter) {
    const options = Array.from(categoryFilter.options).map((opt) => opt.value);
    if (options.includes(lastFilter)) {
      categoryFilter.value = lastFilter;
    }
  }
}

// ---------- Random Quote Display ----------
function showRandomQuote() {
  const selected = categoryFilter.value;
  const filtered =
    selected === "all" ? quotes : quotes.filter((q) => q.category === selected);

  if (filtered.length === 0) {
    quoteDisplay.textContent = "No quotes found in this category.";
    return;
  }

  const randomIndex = Math.floor(Math.random() * filtered.length);
  const chosen = filtered[randomIndex];
  quoteDisplay.textContent = `"${chosen.text}" — ${chosen.category}`;

  // Save last viewed quote in session storage
  sessionStorage.setItem(SESSION_KEY_LAST, JSON.stringify(chosen));
}

// ---------- Add Quote Form ----------
function createAddQuoteForm() {
  addFormContainer.innerHTML = "";

  const textInput = document.createElement("input");
  textInput.id = "newQuoteText";
  textInput.type = "text";
  textInput.placeholder = "Enter a new quote";
  textInput.style.width = "40%";

  const catInput = document.createElement("input");
  catInput.id = "newQuoteCategory";
  catInput.type = "text";
  catInput.placeholder = "Enter quote category";
  catInput.style.width = "25%";

  const addBtn = document.createElement("button");
  addBtn.textContent = "Add Quote";
  addBtn.addEventListener("click", () =>
    addQuote(textInput.value, catInput.value)
  );

  addFormContainer.appendChild(textInput);
  addFormContainer.appendChild(catInput);
  addFormContainer.appendChild(addBtn);
}

// ---------- Add Quote ----------
function addQuote(text, category) {
  text = text.trim();
  category = category.trim();
  if (!text || !category) {
    alert("Please enter both quote and category.");
    return;
  }

  quotes.push({ text, category });
  saveQuotes();
  populateCategories();
  showFilteredQuotes();

  // Persist category filter if new category added
  if (
    !Array.from(categoryFilter.options).some((opt) => opt.value === category)
  ) {
    populateCategories();
  }

  alert("Quote added successfully!");
  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";
}

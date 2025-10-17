// script.js
// Dynamic Quote Generator with LocalStorage, SessionStorage, JSON handling, and category filtering.

// ---------- Storage keys ----------
const LOCAL_KEY = "dynamic_quote_generator_quotes_v1";
const LOCAL_KEY_FILTER = "dynamic_quote_generator_selected_category_v1";
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

// ---------- DOM Refs ----------
const quoteDisplay = document.getElementById("quoteDisplay");
const categoryFilter = document.getElementById("categoryFilter");
const newQuoteButton = document.getElementById("newQuote");
const formContainer = document.getElementById("addQuoteFormContainer");

// ---------- In-memory quotes ----------
let quotes = [];

// ---------- Initialization ----------
document.addEventListener("DOMContentLoaded", () => {
  loadQuotesFromLocalStorage();
  populateCategories();
  restoreSelectedCategory();
  createAddQuoteForm();
  restoreLastViewedQuote();

  newQuoteButton.addEventListener("click", showRandomQuote);
  categoryFilter.addEventListener("change", () => {
    saveSelectedCategory();
    filterQuotes();
  });
});

// ---------- Local Storage ----------
function saveQuotesToLocalStorage() {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(quotes));
}

function loadQuotesFromLocalStorage() {
  const raw = localStorage.getItem(LOCAL_KEY);
  if (!raw) {
    quotes = [...defaultQuotes];
    saveQuotesToLocalStorage();
    return;
  }
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every(isValidQuoteObject)) {
      quotes = parsed;
    } else {
      quotes = [...defaultQuotes];
      saveQuotesToLocalStorage();
    }
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
    obj.text.trim() &&
    typeof obj.category === "string" &&
    obj.category.trim()
  );
}

// ---------- Populate Categories ----------
function populateCategories() {
  const categories = [...new Set(quotes.map((q) => q.category))].sort((a, b) =>
    a.localeCompare(b)
  );

  categoryFilter.innerHTML = `<option value="all">All Categories</option>`;
  categories.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });

  saveSelectedCategory();
}

// ---------- Save/Restore Selected Category ----------
function saveSelectedCategory() {
  localStorage.setItem(LOCAL_KEY_FILTER, categoryFilter.value);
}

function restoreSelectedCategory() {
  const saved = localStorage.getItem(LOCAL_KEY_FILTER);
  if (!saved) return;
  setTimeout(() => {
    const exists = Array.from(categoryFilter.options).some(
      (opt) => opt.value === saved
    );
    if (exists) categoryFilter.value = saved;
  }, 0);
}

// ---------- Filter and Display Quotes ----------
function filterQuotes() {
  const selected = categoryFilter.value;
  let filteredQuotes =
    selected === "all" ? quotes : quotes.filter((q) => q.category === selected);

  if (filteredQuotes.length === 0) {
    quoteDisplay.textContent = "No quotes available in this category yet.";
    return;
  }

  const randomQuote =
    filteredQuotes[Math.floor(Math.random() * filteredQuotes.length)];
  quoteDisplay.textContent = `"${randomQuote.text}" — ${randomQuote.category}`;
}

// ---------- Show Random Quote ----------
function showRandomQuote() {
  filterQuotes(); // reuse same logic

  // Save last viewed quote to sessionStorage
  const displayedText = quoteDisplay.textContent;
  const [textPart, categoryPart] = displayedText
    .split("—")
    .map((s) => s.trim().replace(/["']/g, ""));
  const quoteObj = { text: textPart, category: categoryPart };
  if (isValidQuoteObject(quoteObj)) {
    sessionStorage.setItem(SESSION_KEY_LAST, JSON.stringify(quoteObj));
  }
}

// ---------- Restore Last Viewed Quote ----------
function restoreLastViewedQuote() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY_LAST);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (isValidQuoteObject(parsed)) {
      quoteDisplay.textContent = `"${parsed.text}" — ${parsed.category} (restored from this session)`;
    }
  } catch {
    // ignore parse errors
  }
}

// ---------- Add Quote Form ----------
function createAddQuoteForm() {
  formContainer.innerHTML = "";

  const quoteInput = document.createElement("input");
  quoteInput.id = "newQuoteText";
  quoteInput.type = "text";
  quoteInput.placeholder = "Enter a new quote";

  const categoryInput = document.createElement("input");
  categoryInput.id = "newQuoteCategory";
  categoryInput.type = "text";
  categoryInput.placeholder = "Enter quote category";

  const addButton = document.createElement("button");
  addButton.textContent = "Add Quote";
  addButton.addEventListener("click", () => {
    addQuote(quoteInput.value, categoryInput.value);
    quoteInput.value = "";
    categoryInput.value = "";
  });

  formContainer.appendChild(quoteInput);
  formContainer.appendChild(categoryInput);
  formContainer.appendChild(addButton);
}

// ---------- Add New Quote ----------
function addQuote(text, category) {
  const trimmedText = text.trim();
  const trimmedCategory = category.trim();

  if (!trimmedText || !trimmedCategory) {
    alert("Please fill in both fields.");
    return;
  }

  const newQuote = { text: trimmedText, category: trimmedCategory };
  if (!isValidQuoteObject(newQuote)) {
    alert("Invalid quote format.");
    return;
  }

  quotes.push(newQuote);
  saveQuotesToLocalStorage();
  populateCategories();
  alert("Quote added successfully!");
}

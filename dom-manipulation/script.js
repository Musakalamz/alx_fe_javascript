// script.js
// Dynamic Quote Generator enhanced with LocalStorage, SessionStorage, JSON import/export, and validation.

// ---------- Storage keys ----------
const LOCAL_KEY = "dynamic_quote_generator_quotes_v1";
const LOCAL_KEY_FILTER = "dynamic_quote_generator_selected_category_v1";
const SESSION_KEY_LAST = "dynamic_quote_generator_last_viewed_quote";

// ---------- Initial quotes (fallback) ----------
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
const categorySelect = document.getElementById("categorySelect");
const newQuoteButton = document.getElementById("newQuote");
const formContainer = document.getElementById("addQuoteFormContainer");
const exportBtn = document.getElementById("exportJson");
const importFileInput = document.getElementById("importFile");
const importMergeBtn = document.getElementById("importMerge");
const importReplaceBtn = document.getElementById("importReplace");
const quotesListContainer = document.getElementById("quotesList"); // optional element if present in HTML

// ---------- In-memory quotes array (keeps current state) ----------
let quotes = [];

// ---------- Initialization ----------
document.addEventListener("DOMContentLoaded", () => {
  loadQuotesFromLocalStorage();
  populateCategories();
  restoreSelectedCategory();
  createAddQuoteForm();
  restoreLastViewedQuote();
  renderQuotesList(); // optional: renders the list if you have a container

  // Event listeners
  newQuoteButton.addEventListener("click", showRandomQuote);
  if (exportBtn) exportBtn.addEventListener("click", exportQuotesToJson);
  if (importMergeBtn)
    importMergeBtn.addEventListener("click", () =>
      importFromJsonFile({ replace: false })
    );
  if (importReplaceBtn)
    importReplaceBtn.addEventListener("click", () =>
      importFromJsonFile({ replace: true })
    );
  if (importFileInput)
    importFileInput.addEventListener("change", () => {
      // no-op here, but keeps file ready for import buttons
    });

  if (categorySelect) {
    categorySelect.addEventListener("change", () => {
      saveSelectedCategory();
      renderQuotesList();
    });
  }
});

// ---------- Local Storage helpers ----------
function saveQuotesToLocalStorage() {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(quotes));
  } catch (err) {
    console.error("Failed to save quotes to localStorage:", err);
    alert("Error saving quotes to localStorage.");
  }
}

function loadQuotesFromLocalStorage() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) {
      // nothing saved yet — use defaults
      quotes = [...defaultQuotes];
      saveQuotesToLocalStorage();
      return;
    }
    const parsed = JSON.parse(raw);
    // validate the stored structure
    if (Array.isArray(parsed) && parsed.every(isValidQuoteObject)) {
      quotes = parsed;
    } else {
      console.warn("localStorage data invalid; resetting to defaults.");
      quotes = [...defaultQuotes];
      saveQuotesToLocalStorage();
    }
  } catch (err) {
    console.error("Error reading quotes from localStorage:", err);
    quotes = [...defaultQuotes];
    saveQuotesToLocalStorage();
  }
}

// ---------- Validation ----------
function isValidQuoteObject(obj) {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.text === "string" &&
    obj.text.trim().length > 0 &&
    typeof obj.category === "string" &&
    obj.category.trim().length > 0
  );
}

// ---------- Populate categories dropdown ----------
function populateCategories() {
  if (!categorySelect) return;
  const cats = [...new Set(quotes.map((q) => q.category))].sort((a, b) =>
    a.localeCompare(b)
  );
  const prev = categorySelect.value;
  categorySelect.innerHTML = "";

  // Add an empty placeholder if you want - otherwise first category selected automatically
  cats.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);
  });

  // Restore previous selection if still valid
  if (prev && cats.includes(prev)) {
    categorySelect.value = prev;
  } else if (cats.length > 0) {
    categorySelect.selectedIndex = 0;
  }

  saveSelectedCategory(); // persist current selection (useful when categories change)
}

// ---------- Save/Restore selected category ----------
function saveSelectedCategory() {
  try {
    if (!categorySelect) return;
    localStorage.setItem(LOCAL_KEY_FILTER, categorySelect.value);
  } catch (err) {
    console.warn("Couldn't save selected category:", err);
  }
}

function restoreSelectedCategory() {
  try {
    if (!categorySelect) return;
    const saved = localStorage.getItem(LOCAL_KEY_FILTER);
    if (!saved) return;
    // If categories aren't populated yet we'll apply it in populateCategories call
    // But if category exists, set it
    setTimeout(() => {
      if (
        Array.from(categorySelect.options).some((opt) => opt.value === saved)
      ) {
        categorySelect.value = saved;
      }
    }, 0);
  } catch (err) {
    // ignore
  }
}

// ---------- Show a random quote in selected category ----------
function showRandomQuote() {
  const selectedCategory = categorySelect ? categorySelect.value : null;
  const filtered = selectedCategory
    ? quotes.filter((q) => q.category === selectedCategory)
    : quotes;

  if (!filtered || filtered.length === 0) {
    quoteDisplay.textContent = "No quotes available in this category yet.";
    return;
  }

  const idx = Math.floor(Math.random() * filtered.length);
  const chosen = filtered[idx];
  quoteDisplay.textContent = `"${chosen.text}" — ${chosen.category}`;

  // Save last viewed quote to sessionStorage (only for current tab/session)
  try {
    sessionStorage.setItem(SESSION_KEY_LAST, JSON.stringify(chosen));
  } catch (err) {
    console.warn("Could not save session data:", err);
  }
}

// ---------- Restore last viewed quote from sessionStorage ----------
function restoreLastViewedQuote() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY_LAST);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (isValidQuoteObject(parsed)) {
      // Ensure category exists in dropdown
      if (!quotes.some((q) => q.category === parsed.category)) {
        // Add category if missing (we only want the category to appear)
        quotes.push({
          text: `(${parsed.category} placeholder)`,
          category: parsed.category,
        });
        quotes = quotes.filter(
          (q) => !(q.text.startsWith("(") && q.category === parsed.category)
        ); // remove placeholder
      }
      populateCategories();
      if (categorySelect) categorySelect.value = parsed.category;
      quoteDisplay.textContent = `"${parsed.text}" — ${parsed.category} (restored from this session)`;
    }
  } catch (err) {
    // ignore parse errors
  }
}

// ---------- Create the add-quote form dynamically ----------
function createAddQuoteForm() {
  if (!formContainer) return;
  formContainer.innerHTML = ""; // clear

  const wrapper = document.createElement("div");

  const quoteInput = document.createElement("input");
  quoteInput.id = "newQuoteText";
  quoteInput.type = "text";
  quoteInput.placeholder = "Enter a new quote";
  quoteInput.style.width = "40%";

  const categoryInput = document.createElement("input");
  categoryInput.id = "newQuoteCategory";
  categoryInput.type = "text";
  categoryInput.placeholder = "Enter quote category";
  categoryInput.style.width = "20%";

  const addButton = document.createElement("button");
  addButton.textContent = "Add Quote";
  addButton.addEventListener("click", () =>
    addQuote(quoteInput.value, categoryInput.value, { clearOnSuccess: true })
  );

  wrapper.appendChild(quoteInput);
  wrapper.appendChild(categoryInput);
  wrapper.appendChild(addButton);

  formContainer.appendChild(wrapper);
}

// ---------- Add a new quote (with validation) ----------
function addQuote(text, category, opts = {}) {
  try {
    const t = (text || "").trim();
    const c = (category || "").trim();

    if (!t || !c) {
      alert("Please fill in both the quote text and category.");
      return false;
    }

    const newObj = { text: t, category: c };
    if (!isValidQuoteObject(newObj)) {
      alert("Invalid quote format.");
      return false;
    }

    quotes.push(newObj);
    saveQuotesToLocalStorage();
    populateCategories();
    renderQuotesList();

    if (opts.clearOnSuccess) {
      const qi = document.getElementById("newQuoteText");
      const ci = document.getElementById("newQuoteCategory");
      if (qi) qi.value = "";
      if (ci) ci.value = "";
    }

    alert("New quote added successfully!");
    return true;
  } catch (err) {
    console.error("Error adding quote:", err);
    alert("An error occurred while adding the quote.");
    return false;
  }
}

// ---------- Export quotes to JSON file ----------
function exportQuotesToJson() {
  try {
    const dataStr = JSON.stringify(quotes, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const a = document.createElement("a");
    a.href = url;
    a.download = `quotes_export_${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    a.remove();
  } catch (err) {
    console.error("Failed to export:", err);
    alert("Failed to export quotes.");
  }
}

// ---------- Import from JSON file (merge or replace behavior) ----------
function importFromJsonFile({ replace = false } = {}) {
  const file = importFileInput.files && importFileInput.files[0];
  if (!file) {
    alert("Please select a .json file using the file input first.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const parsed = JSON.parse(e.target.result);
      if (!Array.isArray(parsed)) {
        alert("Imported JSON must be an array of quote objects.");
        return;
      }

      // Validate objects
      const validItems = parsed.filter(isValidQuoteObject);
      if (validItems.length === 0) {
        alert("No valid quote objects found in the imported file.");
        return;
      }

      if (replace) {
        quotes = validItems;
      } else {
        // merge but avoid exact text+category duplicates
        const existingSet = new Set(
          quotes.map((q) => `${q.text}||${q.category}`)
        );
        for (const q of validItems) {
          const key = `${q.text}||${q.category}`;
          if (!existingSet.has(key)) {
            quotes.push(q);
            existingSet.add(key);
          }
        }
      }

      saveQuotesToLocalStorage();
      populateCategories();
      renderQuotesList();
      alert(
        `Imported ${validItems.length} valid quotes. ${
          replace ? "Replaced" : "Merged"
        } successfully.`
      );
      // Clear file input
      importFileInput.value = "";
    } catch (err) {
      console.error("Import failed:", err);
      alert("Failed to parse the JSON file. Ensure it contains valid JSON.");
    }
  };

  reader.onerror = function () {
    alert("Error reading file.");
  };

  reader.readAsText(file);
}

// ---------- Optional: render a list of quotes (all or filtered) ----------
function renderQuotesList() {
  if (!quotesListContainer) return; // optional
  const selected = categorySelect ? categorySelect.value : null;
  const list = selected
    ? quotes.filter((q) => q.category === selected)
    : quotes;

  quotesListContainer.innerHTML = "";
  if (!list || list.length === 0) {
    quotesListContainer.innerHTML = "<p><em>No quotes available.</em></p>";
    return;
  }

  list.forEach((q) => {
    const p = document.createElement("p");
    p.innerHTML = `“${escapeHtml(q.text)}” <small>— ${escapeHtml(
      q.category
    )}</small>`;
    quotesListContainer.appendChild(p);
  });
}

// Small helper to escape HTML in rendered content
function escapeHtml(unsafe) {
  return unsafe.replace(/[&<"'>]/g, function (m) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    }[m];
  });
}

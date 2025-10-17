let quotes = JSON.parse(localStorage.getItem("quotes")) || [];

// ---------------------
// DOM Elements
// ---------------------
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const categoryFilter = document.getElementById("categoryFilter");

// ---------------------
// Functions
// ---------------------

function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// Fetch quotes from the mock server
async function fetchFromServer() {
  try {
    const res = await fetch(
      "https://jsonplaceholder.typicode.com/posts?_limit=5"
    );
    const serverQuotes = await res.json();

    // Convert server data into quote format
    const formatted = serverQuotes.map((item) => ({
      text: item.title,
      category: "Server Data",
      id: item.id,
    }));

    resolveConflicts(formatted);
  } catch (err) {
    console.error("Error fetching from server:", err);
  }
}

// Post new quotes to the mock server
async function postToServer(quote) {
  try {
    const res = await fetch("https://jsonplaceholder.typicode.com/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(quote),
    });
    const data = await res.json();
    console.log("Synced to server:", data);
  } catch (err) {
    console.error("Error syncing to server:", err);
  }
}

// Conflict Resolution: server data takes precedence
function resolveConflicts(serverQuotes) {
  const localIds = new Set(quotes.map((q) => q.id));

  // Add server quotes not present locally
  serverQuotes.forEach((sq) => {
    if (!localIds.has(sq.id)) {
      quotes.push(sq);
    }
  });

  saveQuotes();
  displayQuotes();
  showNotification("Data synced with server (server data prioritized).");
}

// Display quotes (filtered)
function displayQuotes(category = "all") {
  quoteDisplay.innerHTML = "";
  const filteredQuotes =
    category === "all" ? quotes : quotes.filter((q) => q.category === category);

  if (filteredQuotes.length === 0) {
    quoteDisplay.textContent = "No quotes available.";
    return;
  }

  filteredQuotes.forEach((q) => {
    const p = document.createElement("p");
    p.textContent = `"${q.text}" — [${q.category}]`;
    quoteDisplay.appendChild(p);
  });
}

function showNotification(message) {
  const note = document.createElement("div");
  note.textContent = message;
  note.style.background = "#28a745";
  note.style.color = "white";
  note.style.padding = "10px";
  note.style.marginTop = "10px";
  note.style.borderRadius = "6px";
  document.body.appendChild(note);
  setTimeout(() => note.remove(), 4000);
}

// ---------------------
// Add & Filter Quotes
// ---------------------

function addQuote() {
  const text = document.getElementById("newQuoteText").value.trim();
  const category = document.getElementById("newQuoteCategory").value.trim();

  if (!text || !category) {
    alert("Please enter both quote and category!");
    return;
  }

  const newQuote = { text, category, id: Date.now() };
  quotes.push(newQuote);
  saveQuotes();
  displayQuotes();
  populateCategories();

  postToServer(newQuote);
  showNotification("Quote added and synced to server!");

  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";
}

function populateCategories() {
  const uniqueCategories = [...new Set(quotes.map((q) => q.category))];
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
  localStorage.setItem("lastCategory", selected);
  displayQuotes(selected);
}

// Restore last filter
window.onload = function () {
  const last = localStorage.getItem("lastCategory") || "all";
  populateCategories();
  categoryFilter.value = last;
  displayQuotes(last);
  fetchFromServer();
};

// Periodic sync every 60 seconds
setInterval(fetchFromServer, 60000);

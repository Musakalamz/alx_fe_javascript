// script.js

// Initial quotes array
let quotes = [
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

// DOM references
const quoteDisplay = document.getElementById("quoteDisplay");
const categorySelect = document.getElementById("categorySelect");
const newQuoteButton = document.getElementById("newQuote");
const formContainer = document.getElementById("addQuoteFormContainer");

// Initialize app
document.addEventListener("DOMContentLoaded", () => {
  populateCategories();
  createAddQuoteForm();
  newQuoteButton.addEventListener("click", showRandomQuote);
});

// Function to populate categories dynamically
function populateCategories() {
  // Clear dropdown
  categorySelect.innerHTML = "";
  // Get unique categories
  const categories = [...new Set(quotes.map((q) => q.category))];

  categories.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);
  });
}

// Function to display a random quote from selected category
function showRandomQuote() {
  const selectedCategory = categorySelect.value;
  const filteredQuotes = quotes.filter((q) => q.category === selectedCategory);

  if (filteredQuotes.length === 0) {
    quoteDisplay.textContent = "No quotes available in this category yet.";
    return;
  }

  const randomQuote =
    filteredQuotes[Math.floor(Math.random() * filteredQuotes.length)];
  quoteDisplay.textContent = `"${randomQuote.text}" — ${randomQuote.category}`;
}

// Function to create dynamic form to add new quotes
function createAddQuoteForm() {
  const form = document.createElement("div");

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
  addButton.addEventListener("click", addQuote);

  form.appendChild(quoteInput);
  form.appendChild(categoryInput);
  form.appendChild(addButton);

  formContainer.appendChild(form);
}

// Function to add new quote
function addQuote() {
  const quoteText = document.getElementById("newQuoteText").value.trim();
  const quoteCategory = document
    .getElementById("newQuoteCategory")
    .value.trim();

  if (!quoteText || !quoteCategory) {
    alert("Please fill in both fields!");
    return;
  }

  // Add new quote object to array
  quotes.push({ text: quoteText, category: quoteCategory });

  // Update category list dynamically if new category added
  populateCategories();

  // Clear input fields
  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";

  alert("New quote added successfully!");
}

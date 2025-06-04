// صبر می‌کنیم تا کل محتوای HTML بارگذاری شود
document.addEventListener("DOMContentLoaded", () => {
  // =================== SELECTORS ===================
  const categoryTabs = document.getElementById("categoryTabs");
  const searchInput = document.getElementById("searchInput");
  const cardContainer = document.getElementById("cardContainer");
  const themeToggleButton = document.getElementById("toggle-theme");
  const themeStyleLink = document.getElementById("theme-style");
  const themeOverlay = document.getElementById("themeOverlay");
  const themeMenu = document.getElementById("themeMenu");
  const addCardBtn = document.getElementById("addCardBtn");
  const addCardOverlay = document.getElementById("addCardOverlay");
  const addCardForm = document.getElementById("addCardForm");
  const cancelAddCard = document.getElementById("cancelAddCard");

  let allCardsData = []; // برای نگهداری داده‌های اصلی کارت‌ها
  const favorites = new Set(
    JSON.parse(localStorage.getItem("favoriteCardsALDMC") || "[]")
  );

  function debounce(fn, delay) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }


  function highlight(text, query) {
    if (!query) return text;
    return text.replace(
      new RegExp(query, "gi"),
      (match) => `<mark>${match}</mark>`
    );
  }

  function isValidUrl(str) {
    try {
      new URL(str.startsWith("http") ? str : `https://${str}`);
      return true;
    } catch {
      return false;
    }
  }

  function openAddCardModal() {
    if (addCardOverlay) addCardOverlay.classList.add("show");
  }

  function closeAddCardModal() {
    if (addCardOverlay) addCardOverlay.classList.remove("show");
  }

  // =================== THEME SWITCHER ===================
  const themes = [
    { name: "default", path: "Styles/Themes/theme-default.css" },
    { name: "dark", path: "Styles/Themes/theme-dark.css" },
    { name: "blue", path: "Styles/Themes/theme-blue.css" },
    { name: "green", path: "Styles/Themes/theme-green.css" },
    { name: "purple", path: "Styles/Themes/theme-purple.css" },
    { name: "teal", path: "Styles/Themes/theme-teal.css" },
    { name: "orange", path: "Styles/Themes/theme-orange.css" },
  ];
  let currentThemeIndex = 0;

  function applyTheme(themePath) {
    themeStyleLink.setAttribute("href", themePath);
    if (themeOverlay) {
      themeOverlay.style.opacity = "1";
      setTimeout(() => {
        themeOverlay.style.opacity = "0";
      }, 400);
    }
  }

  const savedThemeName = localStorage.getItem("selectedThemeALDMC");
  const initialTheme =
    themes.find((t) => t.name === savedThemeName) || themes[0];
  currentThemeIndex = themes.findIndex((t) => t.name === initialTheme.name);
  if (currentThemeIndex === -1) currentThemeIndex = 0;
  applyTheme(initialTheme.path);

  if (themeMenu) {
    themeMenu.innerHTML = themes
      .map((t) => `<button data-theme="${t.name}">${t.name}</button>`)
      .join("");
  }

  if (themeToggleButton && themeMenu) {
    themeToggleButton.addEventListener("click", () => {
      const rect = themeToggleButton.getBoundingClientRect();
      themeMenu.style.top = `${rect.bottom + 6}px`;
      themeMenu.style.left = `${rect.left}px`;
      themeMenu.classList.toggle("show");
    });

    themeMenu.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-theme]");
      if (!btn) return;
      const themeName = btn.dataset.theme;
      const theme = themes.find((t) => t.name === themeName);
      if (theme) {
        applyTheme(theme.path);
        localStorage.setItem("selectedThemeALDMC", theme.name);
      }
      themeMenu.classList.remove("show");
    });

    document.addEventListener("click", (e) => {
      if (
        themeMenu.classList.contains("show") &&
        !themeMenu.contains(e.target) &&
        e.target !== themeToggleButton
      ) {
        themeMenu.classList.remove("show");
      }
    });
  }

  // =================== CATEGORY BAR ===================
  function getUniqueCategories(cardData) {
    const categories = new Set(["All", "Favorites"]);
    cardData.forEach((card) => {
      if (card.category) {
        categories.add(card.category.trim());
      } else {
        categories.add("General");
      }
    });
    return Array.from(categories);
  }

  function renderCategoryTabs(categories) {
    if (!categoryTabs) return;
    categoryTabs.innerHTML = "";
    categories.forEach((category) => {
      const button = document.createElement("button");
      button.className = "category-tab";
      button.textContent = category;
      button.dataset.category = category;
      if (category === "All") {
        button.classList.add("active");
      }
      categoryTabs.appendChild(button);
    });
  }

  // =================== CARDS ===================
  function createCardElement(cardInfo, searchQuery = "") {
    const cardElement = document.createElement("div");
    cardElement.className = "card";

    // Basic structure with placeholders for image/icon
    cardElement.innerHTML = `
      <div class="card-image">
        <i class="${cardInfo.icon || 'fas fa-globe'}"></i>
      </div>
      <div class="card-content">
        <div>
          <h3>${highlight(cardInfo.title || "بدون عنوان", searchQuery)}</h3>
          <p class="description">${highlight(
            cardInfo.description || "",
            searchQuery
          )}</p>
        </div>
        <div class="card-actions">
          <button class="fav-btn ${favorites.has(cardInfo.url) ? 'active' : ''}">
            <i class="${favorites.has(cardInfo.url) ? 'fas' : 'far'} fa-star"></i> Favorite
          </button>
          <a href="${cardInfo.url || '#'}" class="btn" target="_blank" rel="noopener noreferrer">
            <i class="fas fa-external-link-alt"></i> Open
          </a>
          <button class="remove-btn">
            <i class="fas fa-times"></i> Remove
          </button>
        </div>
      </div>
    `;

    const favButton = cardElement.querySelector(".fav-btn");
    const removeButton = cardElement.querySelector(".remove-btn");

    favButton.addEventListener("click", () => {
      if (favorites.has(cardInfo.url)) {
        favorites.delete(cardInfo.url);
        favButton.classList.remove("active");
        favButton.querySelector("i").classList.replace("fas", "far");
      } else {
        favorites.add(cardInfo.url);
        favButton.classList.add("active");
        favButton.querySelector("i").classList.replace("far", "fas");
      }
      localStorage.setItem(
        "favoriteCardsALDMC",
        JSON.stringify(Array.from(favorites))
      );
    });

removeButton.addEventListener("click", () => {
  allCardsData = allCardsData.filter((c) => c.url !== cardInfo.url);
  localStorage.setItem("cardsDataALDMC", JSON.stringify(allCardsData));
  renderCards(currentCategory, searchInput ? searchInput.value : "");
  const categories = getUniqueCategories(allCardsData);
  renderCategoryTabs(categories);
});



    return cardElement;
  }

  function renderCards(filterCategory = "All", searchQuery = "") {
    if (!cardContainer || !allCardsData) return;

    cardContainer.classList.add("animating");

    setTimeout(() => {
      cardContainer.innerHTML = "";
      const fragment = document.createDocumentFragment();

      let filteredData = allCardsData.filter((card) => {
        const cardCat = card.category ? card.category.trim() : "General";
        const categoryMatch =
          filterCategory === "All" ||
          (filterCategory === "Favorites"
            ? favorites.has(card.url)
            : cardCat === filterCategory);

        const text = `${card.title || ""} ${card.subtitle || ""} ${
          card.description || ""
        }`.toLowerCase();
        const searchMatch = text.includes(searchQuery.toLowerCase());

        return categoryMatch && searchMatch;
      });

      if (filterCategory === "All") {
        filteredData = filteredData.sort((a, b) => {
          const aFav = favorites.has(a.url) ? -1 : 1;
          const bFav = favorites.has(b.url) ? -1 : 1;
          return aFav - bFav;
        });
      }

      if (filteredData.length === 0) {
        cardContainer.innerHTML =
          '<p class="no-results">موردی برای نمایش یافت نشد.</p>';
      } else {
        filteredData.forEach((cardInfo) => {
          fragment.appendChild(createCardElement(cardInfo, searchQuery));
        });
        cardContainer.appendChild(fragment);
      }
      cardContainer.classList.remove("animating");
    }, 250);
  }

  // =================== EVENT LISTENERS ===================
  let currentCategory = "All";

  if (categoryTabs) {
    categoryTabs.addEventListener("click", (event) => {
      const target = event.target;
      if (target.classList.contains("category-tab")) {
        const currentActiveTab = categoryTabs.querySelector(
          ".category-tab.active"
        );
        if (currentActiveTab) {
          currentActiveTab.classList.remove("active");
        }
        target.classList.add("active");
        currentCategory = target.dataset.category;
        renderCards(currentCategory, searchInput ? searchInput.value : "");
      }
    });
  }

  if (searchInput) {
    const handleSearch = debounce(() => {
      renderCards(currentCategory, searchInput.value);
    }, 300);
    searchInput.addEventListener("input", handleSearch);
  }

  if (addCardBtn && addCardOverlay && addCardForm) {
    addCardBtn.addEventListener("click", openAddCardModal);
    cancelAddCard.addEventListener("click", closeAddCardModal);
    addCardOverlay.addEventListener("click", (e) => {
      if (e.target === addCardOverlay) {
        closeAddCardModal();
      }
    });

    addCardForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const formData = new FormData(addCardForm);
      const title = formData.get("title").trim();
      const url = formData.get("url").trim();
      const description = formData.get("description").trim();
      if (!title || !isValidUrl(url)) {
        alert("Please enter a valid title and URL");
        return;
      }
      const newCard = { title, url, description };
      try {
        const stored = JSON.parse(localStorage.getItem("cardsDataALDMC")) || [];
        stored.push(newCard);
        localStorage.setItem("cardsDataALDMC", JSON.stringify(stored));
        addCardForm.reset();
        closeAddCardModal();
        initializeApp();
      } catch (err) {
        console.error("Error saving card data:", err);
        alert("Error saving data");
      }
    });
  }

  // =================== INITIAL DATA FETCH & RENDER ===================
  const defaultCards = [
    {
      title: "OpenAI",
      url: "https://openai.com",
      description: "Artificial intelligence research lab"
    },
    {
      title: "Mozilla",
      url: "https://www.mozilla.org",
      description: "Creators of the Firefox browser"
    },
    {
      title: "Wikipedia",
      url: "https://wikipedia.org",
      description: "Free online encyclopedia"
    }
  ];
  async function initializeApp() {
    try {
      const stored = localStorage.getItem("cardsDataALDMC");
      allCardsData = stored ? JSON.parse(stored) : defaultCards;
    } catch (error) {
      console.error("خطا در خواندن داده‌های ذخیره شده:", error);
      allCardsData = defaultCards;
    }

    const categories = getUniqueCategories(allCardsData);
    renderCategoryTabs(categories);
    renderCards(currentCategory, searchInput ? searchInput.value : "");
  }

  window.addEventListener("storage", (e) => {
    if (e.key === "cardsDataALDMC") {
      initializeApp();
    }
  });

  initializeApp();
});

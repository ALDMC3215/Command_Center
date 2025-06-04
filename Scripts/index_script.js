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

  let allCardsData = []; // برای نگهداری داده‌های اصلی کارت‌ها
  const favorites = new Set(
    JSON.parse(localStorage.getItem("favoriteCardsALDMC") || "[]"),
  );

  function debounce(fn, delay) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          observer.unobserve(img);
        }
      });
    },
    { rootMargin: "100px" },
  );

  function highlight(text, query) {
    if (!query) return text;
    return text.replace(new RegExp(query, "gi"), (match) => `<mark>${match}</mark>`);
  }

  // =================== THEME SWITCHER ===================
  const themes = [
    { name: "default", path: "Styles/Themes/theme-default.css" },
    { name: "dark", path: "Styles/Themes/theme-dark.css" },
    { name: "blue", path: "Styles/Themes/theme-blue.css" },
    { name: "green", path: "Styles/Themes/theme-green.css" },
    { name: "purple", path: "Styles/Themes/theme-purple.css" },
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
    const categories = new Set(["All"]);
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
    const allCats = [...categories];
    if (favorites.size > 0 && !allCats.includes("Favorites")) {
      allCats.unshift("Favorites");
    }
    allCats.forEach((category) => {
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
        <button class="fav-btn" title="افزودن به علاقه‌مندی‌ها">
          <i class="${favorites.has(cardInfo.url) ? "fas" : "far"} fa-star"></i>
        </button>
      </div>
      <div class="card-content">
        <div>
          <h3>${highlight(cardInfo.title || "بدون عنوان", searchQuery)}</h3>
          <p class="subtitle">${highlight(cardInfo.subtitle || "", searchQuery)}</p>
          <p class="description">${
            highlight(cardInfo.description || "توضیحی وجود ندارد.", searchQuery)
          }</p>
        </div>
        <div class="card-actions">
          <a href="${
            cardInfo.visitLink || cardInfo.url || "#"
          }" class="btn outline" target="_blank" rel="noopener noreferrer">
            <i class="fas fa-globe"></i> مشاهده
          </a>
          <a href="${
            cardInfo.detailsLink || cardInfo.url || "#"
          }" class="btn" target="_blank" rel="noopener noreferrer">
            <i class="fas fa-info-circle"></i> جزئیات
          </a>
        </div>
      </div>
    `;

const imageDiv = cardElement.querySelector(".card-image");
const favButton = cardElement.querySelector(".fav-btn");

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
    JSON.stringify(Array.from(favorites)),
  );
});

const siteUrl = cardInfo.visitLink || cardInfo.url;
if (
  siteUrl &&
  (siteUrl.startsWith("http://") || siteUrl.startsWith("https://"))
) {
  const img = document.createElement("img");
  img.dataset.src = `https://s.wordpress.com/mshots/v1/${encodeURIComponent(siteUrl)}`;
  img.alt = cardInfo.title || "thumbnail";
  img.style.width = "100%";
  img.style.height = "100%";
  img.style.objectFit = "cover";

  img.onerror = () => {
    // fallback to icon
    imageDiv.innerHTML = `<i class="${cardInfo.icon || "fas fa-link"} fa-3x"></i>`;
  };

  imageDiv.innerHTML = "";
  imageDiv.appendChild(img);
  observer.observe(img);
} else if (cardInfo.icon) {
  imageDiv.innerHTML = `<i class="${cardInfo.icon} fa-3x"></i>`;
} else {
  const img = document.createElement("img");
  img.dataset.src = "Images/Icon.png";
  img.alt = cardInfo.title || "thumbnail";
  imageDiv.innerHTML = "";
  imageDiv.appendChild(img);
  observer.observe(img);
}

return cardElement;


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

  const text = `${card.title || ""} ${card.subtitle || ""} ${card.description || ""}`.toLowerCase();
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

  // =================== INITIAL DATA FETCH & RENDER ===================
  async function initializeApp() {
    try {
      const response = await fetch("data/cards-data.json");
      if (!response.ok) {
        throw new Error(
          `خطا در بارگذاری داده‌ها: ${response.status} ${response.statusText}`
        );
      }
      allCardsData = await response.json();
    } catch (error) {
      console.error("خطا در خواندن فایل JSON:", error);
      if (window.cardsData) {
        allCardsData = window.cardsData;
      } else {
        if (cardContainer) {
          cardContainer.innerHTML =
            '<p class="error-message">متاسفانه مشکلی در بارگذاری اطلاعات پیش آمده است.</p>';
        }
        return;
      }
    }

    if (!Array.isArray(allCardsData)) {
      console.error("فرمت داده‌های دریافتی صحیح نیست. انتظار آرایه می‌رفت.");
      allCardsData = [];
      cardContainer.innerHTML =
        '<p class="error-message">خطا در بارگذاری اطلاعات کارت‌ها. لطفاً بعداً تلاش کنید.</p>';
      return;
    }

    const categories = getUniqueCategories(allCardsData);
    renderCategoryTabs(categories);
    renderCards(currentCategory, searchInput ? searchInput.value : "");
  }

  initializeApp();

});

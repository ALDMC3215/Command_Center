// صبر می‌کنیم تا کل محتوای HTML بارگذاری شود
document.addEventListener("DOMContentLoaded", () => {
  // =================== SELECTORS ===================
  const categoryTabs = document.getElementById("categoryTabs");
  const searchInput = document.getElementById("searchInput");
  const cardContainer = document.getElementById("cardContainer");
  const themeToggleButton = document.getElementById("toggle-theme");
  const themeStyleLink = document.getElementById("theme-style");
  const themeOverlay = document.getElementById("themeOverlay");

  let allCardsData = []; // برای نگهداری داده‌های اصلی کارت‌ها

  // =================== THEME SWITCHER ===================
  const themes = [
    { name: "default", path: "Styles/Themes/theme-default.css" },
    { name: "dark", path: "Styles/Themes/theme-dark.css" },
    { name: "blue", path: "Styles/Themes/theme-blue.css" },
    { name: "green", path: "Styles/Themes/theme-green.css" },
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

  if (themeToggleButton) {
    themeToggleButton.addEventListener("click", () => {
      currentThemeIndex = (currentThemeIndex + 1) % themes.length;
      const nextTheme = themes[currentThemeIndex];
      applyTheme(nextTheme.path);
      localStorage.setItem("selectedThemeALDMC", nextTheme.name);
    });
  }

  // =================== CATEGORY BAR ===================
  function getUniqueCategories(cardData) {
    const categories = new Set(["All"]);
    cardData.forEach((card) => categories.add(card.category || "General"));
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
  function createCardElement(cardInfo) {
    const cardElement = document.createElement("div");
    cardElement.className = "card";

    // Basic structure with placeholders for image/icon
    cardElement.innerHTML = `
      <div class="card-image">
        </div>
      <div class="card-content">
        <div>
          <h3>${cardInfo.title || "بدون عنوان"}</h3>
          <p class="subtitle">${cardInfo.subtitle || ""}</p>
          <p class="description">${
            cardInfo.description || "توضیحی وجود ندارد."
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

    // Attempt to load website screenshot if visitLink is a valid URL
    // Otherwise, use icon
    const siteUrl = cardInfo.visitLink || cardInfo.url;
    if (
      siteUrl &&
      (siteUrl.startsWith("http://") || siteUrl.startsWith("https://"))
    ) {
      const img = document.createElement("img");
      // Using WordPress mShots service for screenshots. Adjust dimensions as needed.
      img.src = `https://s.wordpress.com/mshots/v1/${encodeURIComponent(

      cardInfo.visitLink
      )}?w=300&h=180`;
      img.alt = `پیش‌نمایش ${cardInfo.title || "سایت"}`;
      // Styling for the image to fit the container
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "cover"; // Ensures the image covers the area, might crop

      img.onerror = () => {
        // Fallback to icon if image fails to load
        imageDiv.innerHTML = `<i class="${
          cardInfo.icon || "fas fa-link"
        } fa-3x"></i>`;
      };
      imageDiv.innerHTML = ""; // Clear any default content
      imageDiv.appendChild(img);
    } else if (cardInfo.icon) {
      // If no valid visitLink for screenshot, use the provided icon
      imageDiv.innerHTML = `<i class="${cardInfo.icon} fa-3x"></i>`;
    } else {
      // Default fallback icon if no visitLink and no specific icon
      imageDiv.innerHTML = `<i class="fas fa-image fa-3x"></i>`;
    }

    return cardElement;
  }

  function renderCards(filterCategory = "All", searchQuery = "") {
    if (!cardContainer || !allCardsData) return;

    cardContainer.classList.add("animating");

    setTimeout(() => {
      cardContainer.innerHTML = "";
      const fragment = document.createDocumentFragment();

      const filteredData = allCardsData.filter((card) => {
        const categoryMatch =
          filterCategory === "All" || card.category === filterCategory;
        const text = `${card.title || ""} ${card.subtitle || ""} ${
          card.description || ""
        }`.toLowerCase();
        const searchMatch = text.includes(searchQuery.toLowerCase());
        return categoryMatch && searchMatch;
      });

      if (filteredData.length === 0) {
        cardContainer.innerHTML =
          '<p class="no-results">موردی برای نمایش یافت نشد.</p>';
      } else {
        filteredData.forEach((cardInfo) => {
          fragment.appendChild(createCardElement(cardInfo));
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
    searchInput.addEventListener("input", () => {
      renderCards(currentCategory, searchInput.value);
    });
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
    } catch (error) {
      console.error("خطا در مقداردهی اولیه برنامه:", error);
      if (cardContainer) {
        cardContainer.innerHTML =
          '<p class="error-message">متاسفانه مشکلی در بارگذاری اطلاعات پیش آمده است.</p>';
      }
    }
  }

  initializeApp();

});

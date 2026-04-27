let ALL_PRODUCTS = [];
let FILTERED_PRODUCTS = [];
let IS_MOBILE = window.innerWidth <= 428;
let currentPage = 1;
const productsPerPage = 12;
let ACTIVE_FILTERS = {
  gender: "all",
  inStock: false,
  productType: [],
  available: false,
  outOfStock: false,
  sizes: [],
  color: null,
  minPrice: 0,
  maxPrice: 15000,
};
let TEMP_FILTERS = JSON.parse(JSON.stringify(ACTIVE_FILTERS));

document.querySelectorAll(".pg-filter-header").forEach((header) => {
  header.addEventListener("click", () => {
    const body = header.nextElementSibling;
    body.style.display = body.style.display === "none" ? "block" : "none";
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const query = params.get("q");

  if (!query) return;

  fetchProductsCollectionPage(query);
});

async function fetchProductsCollectionPage(query) {
  const res = await fetch(
    `https://services.mybcapps.com/bc-sf-filter/search?q=${query}&shop=avengers-playground.myshopify.com`,
  );

  const data = await res.json();
  console.log("search page data:", data);

  renderProductsCollectionPage(data.products);
  ALL_PRODUCTS = data.products;
  console.log("ALL_PRODUCTS:", ALL_PRODUCTS);
  updateFilterCounts();
  applyFilters();
}

function renderProductsCollectionPage(products) {
  const grid = document.querySelector(".pg-products");

  grid.innerHTML = "";

  products.forEach((product) => {
    const slide = document.createElement("div");
    slide.classList.add("pg-card");
    slide.innerHTML = `
      <product-card-avenger 
        data-product='${JSON.stringify({
          url:
            product.url ||
            product.onlineStoreUrl ||
            `/products/${product.handle}`,
          title: product.title,
          price: product.price_min,
          compare_at_price: product.compare_at_price_min,
          featured_image: product.images["1"],
          variants: [],
        })}'
      ></product-card-avenger>
    `;

    grid.appendChild(slide);
  });
}

function showSkeleton() {
  const grid = document.querySelector(".pg-products");
  grid.innerHTML = "";

  for (let i = 0; i < 8; i++) {
    const skeleton = document.createElement("div");
    skeleton.classList.add("pg-card", "skeleton-card");

    skeleton.innerHTML = `
      <div class="skeleton-img"></div>
      <div class="skeleton-text"></div>
      <div class="skeleton-text small"></div>
    `;

    grid.appendChild(skeleton);
  }
}

function applyFilters() {
  showSkeleton();

  setTimeout(() => {
    let filtered = [...ALL_PRODUCTS];

    console.log("Initial:", filtered.length);

    // 1. GENDER FILTER
    if (ACTIVE_FILTERS.gender && ACTIVE_FILTERS.gender !== "all") {
      const g = ACTIVE_FILTERS.gender.toLowerCase();
      const regex = new RegExp(`\\b${g}\\b`, "i");
      console.log("before gender, ", filtered);

      filtered = filtered.filter((p) => {
        const title = p.title || "";
        const category = p.product_category || "";
        const tags = p.tags || [];
        const collections = p.collections?.map((c) => c.title) || [];

        const inTitle = regex.test(title);
        const inCategory = regex.test(category);
        const inTags = tags.some((t) => regex.test(t));
        const inCollections = collections.some((cTitle) => regex.test(cTitle));

        return inTitle || inCategory || inTags || inCollections;
      });
      console.log("after gender, ", filtered);
    }

    // Product Type Filter
    if (ACTIVE_FILTERS.productType.length > 0) {
      filtered = filtered.filter((p) => {
        const category = (p.product_category || "").toLowerCase();
        const pType = (p.product_type || "").toLowerCase();
        const title = (p.title || "").toLowerCase();

        return ACTIVE_FILTERS.productType.some((filterVal) => {
          const f = filterVal.toLowerCase();

          return pType.includes(f) || category.includes(f) || title.includes(f);
        });
      });
    }

    if (ACTIVE_FILTERS.inStock && ACTIVE_FILTERS.outOfStock) {
    } else if (ACTIVE_FILTERS.inStock) {
      filtered = filtered.filter((p) => p.available === true);
      console.log("in stock me filtered: ", filtered);
      console.log("After stock:", filtered.length);
    } else if (ACTIVE_FILTERS.outOfStock) {
      filtered = filtered.filter((p) => p.available === false);
      console.log("in stock me filtered false vale : ", filtered);
      console.log("After stock:", filtered.length);
    }

    if (ACTIVE_FILTERS.sizes.length > 0) {
      filtered = filtered.filter((p) => {
        const sizeOption = p.options_with_values?.find(
          (opt) => opt.name.toLowerCase() === "size",
        );
        if (!sizeOption) return false;
        return sizeOption.values.some((v) =>
          ACTIVE_FILTERS.sizes.includes(v.title),
        );
      });
      console.log("products after size filter: ", filtered);
      console.log("After size filter:", filtered.length);
    }

    if (ACTIVE_FILTERS.color) {
      const targetColor = ACTIVE_FILTERS.color.toLowerCase();

      filtered = filtered.filter((p) => {
        const title = p.title?.toLowerCase() || "";
        const body = p.body_html?.toLowerCase() || "";
        const handle = p.handle?.toLowerCase() || "";
        const tags = p.tags?.map((t) => t.toLowerCase()) || [];

        const titleMatch = title.includes(targetColor);
        const handleMatch = handle.includes(targetColor);
        const tagMatch = tags.some((t) => t.includes(targetColor));

        const isMatched = titleMatch || handleMatch || tagMatch;

        if (isMatched) {
          console.log(`--- Match Found for "${targetColor}" ---`);
          console.log(`Product: ${p.title}`);
          if (titleMatch) console.log(`Found in Title: "${p.title}"`);
          if (handleMatch) console.log(`Found in Handle: "${p.handle}"`);
          if (tagMatch) console.log(`Found in Tags: [${p.tags.join(", ")}]`);
        }

        return isMatched;
      });

      console.log(`After Color Filter Result:`, filtered.length);
    }

    // Price Filter
    filtered = filtered.filter((p) => {
      const productPrice = parseFloat(p.price_min);

      return (
        productPrice >= ACTIVE_FILTERS.minPrice &&
        productPrice <= ACTIVE_FILTERS.maxPrice
      );
    });

    console.log("Final:", filtered.length);

    renderProductsCollectionPage(filtered);
    FILTERED_PRODUCTS = filtered;
    currentPage = 1;
    renderPaginatedProducts();
  }, 400);
  renderActiveFilters();
  updateSelectedFilterCounts();
}

function renderPaginatedProducts() {
  const startIndex = (currentPage - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const paginatedItems = FILTERED_PRODUCTS.slice(startIndex, endIndex);

  renderProductsCollectionPage(paginatedItems);
  renderPaginationControls();
}

function renderPaginationControls() {
  const totalPages = Math.ceil(FILTERED_PRODUCTS.length / productsPerPage);
  const container = document.querySelector(".pg-pagination-container");

  if (!container) return;
  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  let html = `
    <div class="pg-pagination-wrapper">
      <button class="pg-pag-btn prev" ${currentPage === 1 ? "disabled" : ""}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
  `;

  for (let i = 1; i <= totalPages; i++) {
    html += `
      <button class="pg-pag-number ${i === currentPage ? "active" : ""}" data-page="${i}">
        ${i}
      </button>
    `;
  }

  html += `
      <button class="pg-pag-btn next" ${currentPage === totalPages ? "disabled" : ""}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
      </button>
    </div>
  `;

  container.innerHTML = html;

  // Event Listeners for Pagination
  container.querySelectorAll(".pg-pag-number").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentPage = parseInt(btn.dataset.page);
      renderPaginatedProducts();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  container.querySelector(".prev").addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderPaginatedProducts();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });

  container.querySelector(".next").addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderPaginatedProducts();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });
}

document.querySelectorAll('input[name="gender"]').forEach((input) => {
  input.addEventListener("change", (e) => {
    const value = e.target.value.toLowerCase();

    ACTIVE_FILTERS.gender = value;
    console.log("Gender Filter Applied desktop:", ACTIVE_FILTERS.gender);
    applyFilters();
  });
});

document.querySelectorAll('input[name="instock"]').forEach((input) => {
  input.addEventListener("change", (e) => {
    if (IS_MOBILE) {
      TEMP_FILTERS.inStock = e.target.checked;
      console.log("In Stock Filter Applied mobile:", TEMP_FILTERS.inStock);
    } else {
      ACTIVE_FILTERS.inStock = e.target.checked;
      applyFilters();
    }
  });
});

document.querySelectorAll('input[name="outofstock"]').forEach((input) => {
  input.addEventListener("change", (e) => {
    if (IS_MOBILE) {
      TEMP_FILTERS.outOfStock = e.target.checked;
      console.log(
        "Out of Stock Filter Applied mobile:",
        TEMP_FILTERS.outOfStock,
      );
    } else {
      ACTIVE_FILTERS.outOfStock = e.target.checked;
      applyFilters();
    }
  });
});

document.querySelectorAll(".size-checkbox").forEach((checkbox) => {
  checkbox.addEventListener("change", (e) => {
    const val = e.target.value;

    if (IS_MOBILE) {
      if (e.target.checked) {
        TEMP_FILTERS.sizes.push(val);
      } else {
        TEMP_FILTERS.sizes = TEMP_FILTERS.sizes.filter((s) => s !== val);
      }

      console.log("TEMP Sizes:", TEMP_FILTERS.sizes);
    } else {
      if (e.target.checked) {
        ACTIVE_FILTERS.sizes.push(val);
      } else {
        ACTIVE_FILTERS.sizes = ACTIVE_FILTERS.sizes.filter((s) => s !== val);
      }

      console.log("ACTIVE Sizes:", ACTIVE_FILTERS.sizes);
      applyFilters();
    }
  });
});

const colorBars = document.querySelectorAll(".color-bar");

colorBars.forEach((bar) => {
  bar.addEventListener("click", () => {
    const isAlreadyActive = bar.classList.contains("active");
    const selectedColor = bar.getAttribute("data-color");

    colorBars.forEach((b) => b.classList.remove("active"));

    if (!isAlreadyActive) {
      bar.classList.add("active");

      if (IS_MOBILE) {
        TEMP_FILTERS.color = selectedColor;
      } else {
        ACTIVE_FILTERS.color = selectedColor;
        applyFilters();
      }
    } else {
      if (IS_MOBILE) {
        TEMP_FILTERS.color = null;
      } else {
        ACTIVE_FILTERS.color = null;
        applyFilters();
      }
    }
  });
});

const priceRange = document.querySelector(".pg-range");
const minPriceInput = document.querySelector(
  ".pg-price-inputs input:first-child",
);
const maxPriceInput = document.querySelector(
  ".pg-price-inputs input:last-child",
);

// on change of slider
priceRange?.addEventListener("input", (e) => {
  const val = parseFloat(e.target.value);
  maxPriceInput.value = val;

  if (IS_MOBILE) {
    TEMP_FILTERS.maxPrice = val;
  } else {
    ACTIVE_FILTERS.maxPrice = val;
    applyFilters();
  }
});

minPriceInput?.addEventListener("change", (e) => {
  const val = parseFloat(e.target.value) || 0;

  if (IS_MOBILE) {
    TEMP_FILTERS.minPrice = val;
  } else {
    ACTIVE_FILTERS.minPrice = val;
    applyFilters();
  }
});

maxPriceInput?.addEventListener("change", (e) => {
  const val = parseFloat(e.target.value) || 1500;
  priceRange.value = val;

  if (IS_MOBILE) {
    TEMP_FILTERS.maxPrice = val;
  } else {
    ACTIVE_FILTERS.maxPrice = val;
    applyFilters();
  }
});

document.querySelectorAll(".product-type-checkbox").forEach((checkbox) => {
  checkbox.addEventListener("change", (e) => {
    const val = e.target.value.toLowerCase();

    if (IS_MOBILE) {
      if (e.target.checked) {
        TEMP_FILTERS.productType.push(val);
      } else {
        TEMP_FILTERS.productType = TEMP_FILTERS.productType.filter(
          (t) => t !== val,
        );
      }

      console.log("TEMP Product Types:", TEMP_FILTERS.productType);
    } else {
      if (e.target.checked) {
        ACTIVE_FILTERS.productType.push(val);
      } else {
        ACTIVE_FILTERS.productType = ACTIVE_FILTERS.productType.filter(
          (t) => t !== val,
        );
      }

      console.log("ACTIVE Product Types:", ACTIVE_FILTERS.productType);
      applyFilters();
    }
  });
});

function updateFilterCounts() {
  const counts = {
    inStock: 0,
    outOfStock: 0,
    types: {},
  };

  ALL_PRODUCTS.forEach((p) => {
    if (p.available) counts.inStock++;
    else counts.outOfStock++;

    const type = p.product_type || p.product_category || "Other";
    counts.types[type] = (counts.types[type] || 0) + 1;
  });

  const stockLabels = document.querySelectorAll(".pg-option.stock");
  if (stockLabels[0])
    stockLabels[0].textContent = `In Stock (${counts.inStock})`;
  if (stockLabels[1])
    stockLabels[1].textContent = `Out of Stock (${counts.outOfStock})`;

  document.querySelectorAll(".product-type-checkbox").forEach((input) => {
    const val = input.value.toLowerCase();
    const countSpan = input.parentElement.querySelector(".pg-count");

    if (countSpan) {
      const count = ALL_PRODUCTS.filter((p) => {
        const pType = (p.product_type || "").toLowerCase();
        const pCat = (p.product_category || "").toLowerCase();
        return pType.includes(val) || pCat.includes(val);
      }).length;

      countSpan.textContent = count;
    }
  });
}

function renderActiveFilters() {
  const container = document.querySelector(".pg-active-filters");
  container.innerHTML = "";

  // Gender
  if (ACTIVE_FILTERS.gender) {
    addChip("Gender", ACTIVE_FILTERS.gender, () => {
      ACTIVE_FILTERS.gender = null;
      document.querySelector('input[value="all"]').checked = true;
      applyFilters();
    });
  }

  // Stock
  if (ACTIVE_FILTERS.inStock) {
    addChip("Stock", "In Stock", () => {
      ACTIVE_FILTERS.inStock = false;
      document.querySelector('input[name="instock"]').checked = false;
      applyFilters();
    });
  }

  if (ACTIVE_FILTERS.outOfStock) {
    addChip("Stock", "Out of Stock", () => {
      ACTIVE_FILTERS.outOfStock = false;
      document.querySelector('input[name="outofstock"]').checked = false;
      applyFilters();
    });
  }

  // Product Types
  ACTIVE_FILTERS.productType.forEach((type) => {
    addChip("Type", type, () => {
      ACTIVE_FILTERS.productType = ACTIVE_FILTERS.productType.filter(
        (t) => t !== type,
      );

      document.querySelectorAll(".product-type-checkbox").forEach((input) => {
        if (input.value.toLowerCase() === type.toLowerCase()) {
          input.checked = false;
        }
      });

      applyFilters();
    });
  });

  // Color
  if (ACTIVE_FILTERS.color) {
    addChip("Color", ACTIVE_FILTERS.color, () => {
      ACTIVE_FILTERS.color = null;
      document
        .querySelectorAll(".color-bar")
        .forEach((b) => b.classList.remove("active"));
      applyFilters();
    });
  }
  //sizes
  ACTIVE_FILTERS.sizes.forEach((size) => {
    addChip("Size", size, () => {
      ACTIVE_FILTERS.sizes = ACTIVE_FILTERS.sizes.filter((s) => s !== size);

      document.querySelectorAll(".size-checkbox").forEach((input) => {
        if (input.value === size) {
          input.checked = false;
        }
      });

      applyFilters();
    });
  });

  // Price
  if (ACTIVE_FILTERS.minPrice > 0 || ACTIVE_FILTERS.maxPrice < 1500) {
    addChip(
      "Price",
      `₹${ACTIVE_FILTERS.minPrice} - ₹${ACTIVE_FILTERS.maxPrice}`,
      () => {
        ACTIVE_FILTERS.minPrice = 0;
        ACTIVE_FILTERS.maxPrice = 1500;
        //ui reset
        document.querySelector("#min-price-box").value = "";
        document.querySelector("#max-price-box").value = "";

        // range slider reset
        document.querySelector(".pg-range").value = 1500;

        applyFilters();
      },
    );
  }

  function addChip(label, value, onRemove) {
    const chip = document.createElement("div");
    chip.className = "pg-chip";
    chip.innerHTML = `
     <span>${value}</span> <span class="chip-close"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M16.9497 7.05027L7.05025 16.9498M16.9497 16.9498L7.05025 7.05027" stroke="#1F2937" stroke-width="1.5" stroke-linejoin="round"/>
</svg></span>

    `;
    chip.querySelector(".chip-close").addEventListener("click", (e) => {
      e.stopPropagation();
      onRemove();
    });
    container.appendChild(chip);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const allRadio = document.querySelector('input[name="gender"][value="all"]');
  if (allRadio) allRadio.checked = true;
});

function updateSelectedFilterCounts() {
  document.querySelectorAll(".pg-filter").forEach((filter) => {
    const type = filter.dataset.filter;
    const badge = filter.querySelector(".pg-filter-count");

    let count = 0;

    switch (type) {
      case "gender":
        count = ACTIVE_FILTERS.gender ? 1 : 0;
        break;

      case "availability":
        count =
          (ACTIVE_FILTERS.inStock ? 1 : 0) +
          (ACTIVE_FILTERS.outOfStock ? 1 : 0);
        break;

      case "productType":
        count = ACTIVE_FILTERS.productType.length;
        break;

      case "size":
        count = ACTIVE_FILTERS.sizes.length;
        break;

      case "color":
        count = ACTIVE_FILTERS.color ? 1 : 0;
        break;
    }

    if (badge) {
      badge.textContent = count;
      badge.style.display = "inline-flex";
    }
  });
}

window.addEventListener("resize", () => {
  IS_MOBILE = window.innerWidth <= 428;
});

document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.querySelector(".pg-sidebar");
  const overlay = document.querySelector(".pg-overlay");
  const filterBtn = document.getElementById("mobileFilter");
  const genderFilterBtn = document.getElementById("genderFilter");
  const mobileBar = document.querySelector(".pg-mobile-bar");
  const gender = document.getElementById("genderBtn");
  const allFilters = document.querySelectorAll(".pg-filter");
  const bottomBtns = document.querySelector(".bottom-btns");
  const genderHead = document.getElementById("gender-head");
  const headingFilter = document.querySelector(".headingF");


  if (!sidebar || !filterBtn) return;

  // OPEN
  filterBtn.addEventListener("click", () => {
    allFilters.forEach((f) => f.classList.remove("hidden"));
    bottomBtns.style.display = "flex";
    headingFilter.textContent = "Filters";
    gender.classList.add("hidden");

    sidebar.classList.remove("closing");
    sidebar.classList.add("open");
    sidebar.classList.add("full");
    sidebar.classList.remove("half");

    overlay.classList.add("active");
    mobileBar.style.display = "none";
  });

  genderFilterBtn.addEventListener("click", () => {
    TEMP_FILTERS = JSON.parse(JSON.stringify(ACTIVE_FILTERS));

    allFilters.forEach((f) => f.classList.add("hidden"));
    gender.classList.remove("hidden");
    sidebar.classList.add("half");
    sidebar.classList.remove("full");
    sidebar.classList.remove("closing");
    sidebar.classList.add("open");
    gender.classList.add("no-border");
    genderHead.classList.add("hidee");
    headingFilter.textContent = "GENDER";
    overlay.classList.add("active");
    mobileBar.style.display = "none";
    bottomBtns.style.display = "none";
  });

  // CLOSE
  overlay.addEventListener("click", () => {
    sidebar.classList.remove("open");
    sidebar.classList.add("closing");

    overlay.classList.remove("active");
    mobileBar.style.display = "flex";

    setTimeout(() => {
      sidebar.classList.remove("closing");
    }, 400);
  });
});

document.querySelector(".pg-apply-btn").addEventListener("click", () => {
  ACTIVE_FILTERS = JSON.parse(JSON.stringify(TEMP_FILTERS));
  applyFilters();
  // close sidebar
  document.querySelector(".pg-sidebar").classList.remove("open");
  document.querySelector(".pg-overlay").classList.remove("active");
  document.querySelector(".pg-mobile-bar").style.display = "flex";
});

document.querySelector(".pg-clear-btn").addEventListener("click", () => {
  TEMP_FILTERS = {
    gender: "all",
    inStock: false,
    productType: [],
    available: false,
    outOfStock: false,
    sizes: [],
    color: null,
    minPrice: 0,
    maxPrice: 15000,
  };

  ACTIVE_FILTERS = JSON.parse(JSON.stringify(TEMP_FILTERS));

  // UI reset
  document
    .querySelectorAll("input[type='checkbox'], input[type='radio']")
    .forEach((input) => (input.checked = false));

  document.querySelector('input[value="all"]').checked = true;

  document
    .querySelectorAll(".color-bar")
    .forEach((b) => b.classList.remove("active"));

  document.querySelector("#min-price-box").value = "";
  document.querySelector("#max-price-box").value = "";
  document.querySelector(".pg-range").value = 1500;

  applyFilters();

  // close sidebar
  document.querySelector(".pg-sidebar").classList.remove("open");
  document.querySelector(".pg-overlay").classList.remove("active");
  document.querySelector(".pg-mobile-bar").style.display = "flex";
});

const crossSvg = document.querySelector(".filter-heading-mobile svg");
crossSvg.addEventListener("click", () => {
  const sidebar = document.querySelector(".pg-sidebar");
  const overlay = document.querySelector(".pg-overlay");
  const mobileBar = document.querySelector(".pg-mobile-bar");

  sidebar.classList.remove("open");
  sidebar.classList.add("closing");

  overlay.classList.remove("active");
  mobileBar.style.display = "flex";

  setTimeout(() => {
    sidebar.classList.remove("closing");
  }, 400);
});

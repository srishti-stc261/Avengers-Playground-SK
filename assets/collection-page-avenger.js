let ALL_PRODUCTS = [];
let FILTERED_PRODUCTS = [];
let TOTAL_PRODUCTS = 0;
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

  const hasAnyFilterParam =
    params.has("pf_opt_color[]") ||
    params.has("pf_opt_size[]") ||
    params.has("pf_pt_product_type[]") ||
    params.has("pf_t_tag[]") ||
    params.has("pf_st_available") ||
    params.has("pf_p_price");

  if (hasAnyFilterParam) {
    restoreFiltersFromURL(params);
  }

  if (!query) return;

  applyFilters();
});

function restoreFiltersFromURL(params) {
  // Sizes
  ACTIVE_FILTERS.sizes = params.getAll("pf_opt_size[]");

  // Color
  ACTIVE_FILTERS.color = params.get("pf_opt_color") || null;

  // Product types
  ACTIVE_FILTERS.productType = params.getAll("pf_pt_product_type[]");

  // Price
  const priceParam = params.get("pf_p_price");
  if (priceParam) {
    const [mn, mx] = priceParam.split(":").map(Number);
    if (!isNaN(mn)) ACTIVE_FILTERS.minPrice = mn;
    if (!isNaN(mx)) ACTIVE_FILTERS.maxPrice = mx;
  }

  // Availability
  const avail = params.get("pf_st_available");
  if (avail === "true") ACTIVE_FILTERS.inStock = true;
  if (avail === "false") ACTIVE_FILTERS.outOfStock = true;

  // Gender (stored as tag)
  const tags = params.getAll("pf_t_tag[]");
  const genderTags = ["men", "women", "unisex", "kids"];
  const foundGender = tags.find((t) => genderTags.includes(t.toLowerCase()));
  if (foundGender) ACTIVE_FILTERS.gender = foundGender;

  // Sync UI checkboxes/inputs to match restored state
  syncUIToFilters();
}

function syncUIToFilters() {
  // Gender radio
  const genderRadio = document.querySelector(
    `input[name="gender"][value="${ACTIVE_FILTERS.gender || "all"}"]`,
  );
  if (genderRadio) genderRadio.checked = true;

  // Size checkboxes
  document.querySelectorAll(".size-checkbox").forEach((cb) => {
    cb.checked = ACTIVE_FILTERS.sizes.includes(cb.value);
  });

  // Product type checkboxes
  document.querySelectorAll(".product-type-checkbox").forEach((cb) => {
    cb.checked = ACTIVE_FILTERS.productType.includes(cb.value.toLowerCase());
  });

  // Color
  document.querySelectorAll(".color-bar").forEach((bar) => {
    bar.classList.toggle("active", bar.dataset.color === ACTIVE_FILTERS.color);
  });

  // Price
  if (ACTIVE_FILTERS.minPrice > 0) {
    const minBox = document.querySelector("#min-price-box");
    if (minBox) minBox.value = ACTIVE_FILTERS.minPrice;
  }
  if (ACTIVE_FILTERS.maxPrice < 15000) {
    const maxBox = document.querySelector("#max-price-box");
    const range = document.querySelector(".pg-range");
    if (maxBox) maxBox.value = ACTIVE_FILTERS.maxPrice;
    if (range) range.value = ACTIVE_FILTERS.maxPrice;
  }

  // Availability
  const inStockCb = document.querySelector('input[name="instock"]');
  const outStockCb = document.querySelector('input[name="outofstock"]');
  if (inStockCb) inStockCb.checked = ACTIVE_FILTERS.inStock;
  if (outStockCb) outStockCb.checked = ACTIVE_FILTERS.outOfStock;
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

async function applyFilters(resetPage = true) {
  if (resetPage) currentPage = 1;
  showSkeleton();
  updateURL();

  const query = new URLSearchParams(window.location.search).get("q") || "";
  const params = buildBoostParams(query); 
  const url = `https://services.mybcapps.com/bc-sf-filter/search?${params}`;

  const res = await fetch(url);
  const data = await res.json();

  TOTAL_PRODUCTS =
    data.total_product || data.total || data.products?.length || 0;
  FILTERED_PRODUCTS = data.products || [];

  renderProductsCollectionPage(FILTERED_PRODUCTS);
  renderPaginationControls();
  renderActiveFilters();
  updateSelectedFilterCounts();

  if (FILTERED_PRODUCTS.length === 0) {
    document.querySelector(".pg-products").innerHTML =
      "<div style='text-align:center;padding:50px;'>No products found</div>";
  }
}

function renderPaginatedProducts() {
  const startIndex = (currentPage - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const paginatedItems = FILTERED_PRODUCTS.slice(startIndex, endIndex);

  renderProductsCollectionPage(paginatedItems);
  renderPaginationControls();
}

function buildBoostParams(query) {
  const params = new URLSearchParams();
  params.set(
    "q",
    query || new URLSearchParams(window.location.search).get("q") || "",
  );
  params.set("shop", "avengers-playground.myshopify.com");
  params.set("limit", String(productsPerPage));
  params.set("page", String(currentPage));

  ACTIVE_FILTERS.sizes.forEach((size) => params.append("pf_opt_size[]", size));

  if (ACTIVE_FILTERS.color)
    params.append("pf_opt_color[]", ACTIVE_FILTERS.color);

  ACTIVE_FILTERS.productType.forEach((type) =>
    params.append("pf_pt_product_type[]", type),
  );

  if (ACTIVE_FILTERS.minPrice > 0 || ACTIVE_FILTERS.maxPrice < 15000) {
    params.append(
      "pf_p_price[]",
      `${Math.round(ACTIVE_FILTERS.minPrice)}:${Math.round(ACTIVE_FILTERS.maxPrice)}`,
    );
  }

  if (ACTIVE_FILTERS.inStock && !ACTIVE_FILTERS.outOfStock) {
    params.append("pf_st_available[]", "true");
  } else if (ACTIVE_FILTERS.outOfStock && !ACTIVE_FILTERS.inStock) {
    params.append("pf_st_available[]", "false");
  }

  if (ACTIVE_FILTERS.gender && ACTIVE_FILTERS.gender !== "all") {
    params.append("pf_t_tag[]", ACTIVE_FILTERS.gender);
  }

  return params.toString();
}

function updateURL() {
  const currentParams = new URLSearchParams(window.location.search);
  const newParams = new URLSearchParams();

  // 1. Preserve search query
  const q = currentParams.get("q") || "";
  if (q) newParams.set("q", q);

  // 2. Add ALL active filters
  // Sizes
  ACTIVE_FILTERS.sizes.forEach((s) => newParams.append("pf_opt_size[]", s));

  // Color
  if (ACTIVE_FILTERS.color) {
    newParams.append("pf_opt_color[]", ACTIVE_FILTERS.color);
  }

  // Product type
  ACTIVE_FILTERS.productType.forEach((t) => {
    newParams.append("pf_pt_product_type[]", t);
  });

  // Price
  if (ACTIVE_FILTERS.minPrice > 0 || ACTIVE_FILTERS.maxPrice < 15000) {
    newParams.set(
      "pf_p_price",
      `${ACTIVE_FILTERS.minPrice}:${ACTIVE_FILTERS.maxPrice}`,
    );
  }

  // Availability
  if (ACTIVE_FILTERS.inStock && !ACTIVE_FILTERS.outOfStock) {
    newParams.set("pf_st_available", "true");
  } else if (ACTIVE_FILTERS.outOfStock && !ACTIVE_FILTERS.inStock) {
    newParams.set("pf_st_available", "false");
  }

  // Gender
  if (ACTIVE_FILTERS.gender && ACTIVE_FILTERS.gender !== "all") {
    newParams.append("pf_t_tag[]", ACTIVE_FILTERS.gender);
  }

  // 3. Update URL without reload
  const newUrl = `${window.location.pathname}?${newParams.toString()}`;
  window.history.replaceState({}, "", newUrl);

  console.log("Updated URL:", newUrl);
}

function renderPaginationControls() {
  const container = document.querySelector(".pg-pagination-container");
  const totalPages = Math.ceil(TOTAL_PRODUCTS / productsPerPage);

  if (!container) return;
  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  const delta = 2;
  const left = Math.max(1, currentPage - delta);
  const right = Math.min(totalPages, currentPage + delta);

  let html = `
    <div class="pg-pagination-wrapper">
      <button class="pg-pag-btn prev" ${currentPage === 1 ? "disabled" : ""}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
  `;

  // First page + dots
  if (left > 1) {
    html += `<button class="pg-pag-number" data-page="1">1</button>`;
    if (left > 2) html += `<span class="pg-pag-dots">...</span>`;
  }

  // Middle pages
  for (let i = left; i <= right; i++) {
    html += `
      <button class="pg-pag-number ${i === currentPage ? "active" : ""}" data-page="${i}">
        ${i}
      </button>
    `;
  }

  // Last page + dots
  if (right < totalPages) {
    if (right < totalPages - 1) html += `<span class="pg-pag-dots">...</span>`;
    html += `<button class="pg-pag-number" data-page="${totalPages}">${totalPages}</button>`;
  }

  html += `
      <button class="pg-pag-btn next" ${currentPage === totalPages ? "disabled" : ""}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
      </button>
    </div>
  `;

  container.innerHTML = html;

  // Event listeners
  container.querySelectorAll(".pg-pag-number").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentPage = parseInt(btn.dataset.page);
      applyFilters(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  container.querySelector(".prev").addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      applyFilters(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });

  container.querySelector(".next").addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      applyFilters(false);
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
  const val = parseFloat(e.target.value) || 15000;
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
  if (ACTIVE_FILTERS.minPrice > 0 || ACTIVE_FILTERS.maxPrice < 15000) {
    addChip(
      "Price",
      `₹${ACTIVE_FILTERS.minPrice} - ₹${ACTIVE_FILTERS.maxPrice}`,
      () => {
        ACTIVE_FILTERS.minPrice = 0;
        ACTIVE_FILTERS.maxPrice = 15000;
        //ui reset
        document.querySelector("#min-price-box").value = "";
        document.querySelector("#max-price-box").value = "";

        // range slider reset
        document.querySelector(".pg-range").value = 15000;

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
  document.querySelector(".pg-range").value = 15000;

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

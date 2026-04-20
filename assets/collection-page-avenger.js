let ALL_PRODUCTS = [];
let ACTIVE_FILTERS = {
  gender: null,
  inStock: false,
  productType: [],
  available: false,
  outOfStock: false,
  sizes: [],
  color: null,
  minPrice: 0,
  maxPrice: 15000,
};

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

    if (ACTIVE_FILTERS.available) {
    }

    if (ACTIVE_FILTERS.gender) {
      filtered = filtered.filter((p) => {
        const inTags = p.tags?.some((tag) =>
          tag.toLowerCase().includes(ACTIVE_FILTERS.gender),
        );

        const inCollections = p.collections?.some(
          (c) =>
            c.title && c.title.toLowerCase().includes(ACTIVE_FILTERS.gender),
        );

        return inTags || inCollections;
      });

      console.log("After gender:", filtered.length);
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

    if (ACTIVE_FILTERS.productType.length) {
      filtered = filtered.filter((p) => {
        const type = p.product_type || "";
        const category = p.product_category || "";

        return ACTIVE_FILTERS.productType.some(
          (filterType) =>
            type.toLowerCase().includes(filterType.toLowerCase()) ||
            category.toLowerCase().includes(filterType.toLowerCase()),
        );
      });

      console.log("After type:", filtered.length);
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

    // Price Filter Logic
    filtered = filtered.filter((p) => {
      const productPrice = parseFloat(p.price_min);

      return (
        productPrice >= ACTIVE_FILTERS.minPrice &&
        productPrice <= ACTIVE_FILTERS.maxPrice
      );
    });

    console.log("Final:", filtered.length);

    renderProductsCollectionPage(filtered);
  }, 400);
}
document.querySelectorAll('input[name="gender"]').forEach((input) => {
  input.addEventListener("change", (e) => {
    ACTIVE_FILTERS.gender = e.target.value.toLowerCase();
    applyFilters();
  });
});

document.querySelectorAll('input[name="instock"]').forEach((input) => {
  input.addEventListener("change", (e) => {
    ACTIVE_FILTERS.inStock = e.target.checked;
    applyFilters();
  });
});

document.querySelectorAll('input[name="outofstock"]').forEach((input) => {
  input.addEventListener("change", (e) => {
    ACTIVE_FILTERS.outOfStock = e.target.checked;
    applyFilters();
  });
});

document.querySelectorAll(".size-checkbox").forEach((checkbox) => {
  checkbox.addEventListener("change", (e) => {
    const val = e.target.value;

    if (e.target.checked) {
      ACTIVE_FILTERS.sizes.push(val);
    } else {
      ACTIVE_FILTERS.sizes = ACTIVE_FILTERS.sizes.filter((s) => s !== val);
    }

    console.log("Selected Sizes Array:", ACTIVE_FILTERS.sizes);
    applyFilters();
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
      ACTIVE_FILTERS.color = selectedColor;
    } else {
      ACTIVE_FILTERS.color = null;
    }

    applyFilters();
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
  ACTIVE_FILTERS.maxPrice = parseFloat(e.target.value);
  maxPriceInput.value = e.target.value;
  applyFilters();
});

minPriceInput?.addEventListener("change", (e) => {
  ACTIVE_FILTERS.minPrice = parseFloat(e.target.value) || 0;
  applyFilters();
});

maxPriceInput?.addEventListener("change", (e) => {
  const val = parseFloat(e.target.value) || 1500;
  ACTIVE_FILTERS.maxPrice = val;
  priceRange.value = val;
  applyFilters();
});

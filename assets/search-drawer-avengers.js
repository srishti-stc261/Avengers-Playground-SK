const wrapper = document.querySelector(".sh-dr-modal-wrapper");
const closeDrawer = document.querySelector(".sh-dr-close-trigger");
let currentIndex = -1;
let page = 1;
let loading = false;
let query = "";
let inputValue;

function debounce(func, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

function handleSearch(e) {
  query = e.target.value;
  page = 1;

  if (!query) {
    showDefault();
    return;
  }

  inputValue = query;
  console.log("currentIndex: ", currentIndex);
  showResults();
  fetchProducts(query, page, true);
}

const debouncedSearch = debounce(handleSearch, 300);

document.addEventListener("DOMContentLoaded", function () {
  new Swiper(".sh-dr-product-slider", {
    slidesPerView: "auto",
    spaceBetween: 16,
    freeMode: true,
  });
});

document.addEventListener("DOMContentLoaded", function () {
  const searchTriggers = document.querySelectorAll(".skSearchOpen");
  const stg = document.querySelector(".sk-search-trigger");

  searchTriggers.forEach((searchTrigger) => {
    const input = searchTrigger.querySelector(".sk-search-input");
    const placeholder = searchTrigger.querySelector(".sk-search-placeholder");
    const crossIcon = searchTrigger.querySelector(".svg-icon-sk");

    searchTrigger.addEventListener("click", function (e) {
      const isDrawer = searchTrigger.closest(".sh-dr-modal-wrapper") !== null;

      if (isDrawer) {
        console.log("Drawer wala search");
        e.stopPropagation();
        input.classList.add("active");
        placeholder.classList.add("hide");
        crossIcon?.classList.add("active");
        input.focus();
        input.addEventListener("input", debouncedSearch);
      }
    });

    crossIcon?.addEventListener("click", (e) => {
      e.stopPropagation();
      const items = document.querySelectorAll(".sh-dr-tag-list li");
      input.classList.remove("active");
      placeholder.classList.remove("hide");
      crossIcon.classList.remove("active");
      items.forEach((el) => el.classList.remove("active"));
      input.value = ""; // clear input

      // RESET STATE
      query = "";
      page = 1;
      loading = false;

      //  UI RESET
      showDefault();

      document.getElementById("results-grid-sk").innerHTML = "";

      console.log("cross icon clicked");
    });

    input.addEventListener("click", function (e) {
      e.stopPropagation();
    });
  });
});

async function fetchSearchResults(inputValue) {
  const res = await fetch(
    `https://services.mybcapps.com/bc-sf-filter/search?q=${inputValue}&shop=avengers-playground.myshopify.com`,
  );
  const data = await res.json();
  console.log("searched results: ", data);
}

document.addEventListener("DOMContentLoaded", async function () {
  const raw = await fetch(
    "https://services.mybcapps.com/bc-sf-filter/search/suggest?q=trousers&shop=avengers-playground.myshopify.com&product_limit=4",
  );
  const response = await raw.json();
  console.log(" response from fetch: ", response);
  let arr = response.products.map((p) => p.title);
  console.log(" response map: ", arr);

  const list = document.querySelector(".sh-dr-tag-list");
  list.innerHTML = "";

  response.products.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item.title;
    list.appendChild(li);
  });
});

document.addEventListener(
  "DOMContentLoaded",
  async function fetchSuggestions(query) {
    const res = await fetch(
      `https://services.mybcapps.com/bc-sf-filter/search/suggest?q="s"&shop=avengers-playground.myshopify.com`,
    );

    const data = await res.json();
    const wrapper = document.querySelector("#suggestions-wrapper");
    console.log("suggest ", data);

    wrapper.innerHTML = "";

    data.products.forEach((product) => {
      const slide = document.createElement("div");
      slide.classList.add("swiper-slide", "sh-dr-item-card");

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

      wrapper.appendChild(slide);
    });
  },
);

closeDrawer?.addEventListener("click", () => {
  document.querySelector(".sh-dr-modal-wrapper").classList.remove("open");
  overlay.classList.remove("active");
});
function showResults() {
  document.querySelector(".default-view").style.display = "none";
  document.querySelector(".search-results-sk").style.display = "block";
  document.querySelector(".sh-dr-submit-button").style.display = "flex";
}

function showDefault() {
  document.querySelector(".default-view").style.display = "block";
  document.querySelector(".search-results-sk").style.display = "none";
  document.querySelector(".sh-dr-submit-button").style.display = "none";
}

async function fetchProducts(query, page = 1, reset = false) {
  if (loading) return;
  loading = true;

  const grid = document.getElementById("results-grid-sk");

  // skeleton
  if (reset) {
    grid.innerHTML = "";
    for (let i = 0; i < 6; i++) {
      grid.innerHTML += `<div class="skeleton-sk"></div>`;
    }
  }

  const res = await fetch(
    `https://services.mybcapps.com/bc-sf-filter/search?q=${query}&page=${page}&shop=avengers-playground.myshopify.com`,
  );

  const data = await res.json();
  console.log("searched results: ", data);

  if (reset) grid.innerHTML = "";

  data.products.forEach((product) => {
    const slide = document.createElement("div");
    slide.classList.add("swiper-slide", "sh-dr-item-card");

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
  loading = false;
}

document
  .querySelector(".sh-dr-content-scroll")
  .addEventListener("scroll", () => {
    const container = document.querySelector(".sh-dr-content-scroll");

    if (
      container.scrollTop + container.clientHeight >=
      container.scrollHeight - 50
    ) {
      page++;
      fetchProducts(query, page);
    }
  });

const overlay = document.querySelector(".overlay-sk");

function openSearchDrawer() {
  document.querySelector(".sh-dr-modal-wrapper").classList.add("open");

  overlay.classList.add("active");
}

overlay.addEventListener("click", () => {
  document.querySelector(".sh-dr-modal-wrapper").classList.remove("open");

  overlay.classList.remove("active");
});

const searchResultNavigation = () => {
  const searchBtn = document.querySelector(".sh-dr-submit-button");
  const input = document.querySelector(".sk-search-input");

  searchBtn?.addEventListener("click", () => {
    if (!query || query.trim() === "") return;

    const finalQuery = encodeURIComponent(query.trim());
    console.log("finalquery", finalQuery);

    window.location.href = `/search?q=${finalQuery}`;
  });
};

searchResultNavigation();

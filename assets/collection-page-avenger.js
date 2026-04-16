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
}
function renderProductsCollectionPage(products) {
  const grid = document.querySelector(".pg-products");

  grid.innerHTML = "";

  products.forEach((product) => {
    const slide = document.createElement("div");
    slide.classList.add("pg-card");
    console.log("url in search page", product.url);
    console.log("title in search page", product.title);
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

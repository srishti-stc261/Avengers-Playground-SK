const wrapper = document.querySelector(".sh-dr-modal-wrapper");
const isDrawer = wrapper?.dataset.isDrawer === "true";

let inputValue;
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
    if (isDrawer) {
      const input = searchTrigger.querySelector(".sk-search-input");
      const placeholder = searchTrigger.querySelector(".sk-search-placeholder");
      const crossIcon = searchTrigger.querySelector(".svg-icon-sk");

      searchTrigger.addEventListener("click", function (e) {
        e.stopPropagation();
        input.classList.add("active");
        placeholder.classList.add("hide");
        crossIcon?.classList.add("active");
        input.focus();
        input?.addEventListener("input", (e) => {
          inputValue = e.target.value;
          fetchSearchResults(inputValue);
        });
      });

      crossIcon?.addEventListener("click", (e) => {
        e.stopPropagation();
        input.classList.remove("active");
        placeholder.classList.remove("hide");
        crossIcon.classList.remove("active");
        input.value = ""; // clear input
        console.log("cross icon clicked");
      });

      input.addEventListener("click", function (e) {
        e.stopPropagation();
      });
    }
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

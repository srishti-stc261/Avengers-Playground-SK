function isValidColor(color) {
  return CSS.supports("color", color);
}

class ProductCardAvenger extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    const template = document.getElementById("op-card-template");
    const clone = template.content.cloneNode(true);

    const product = JSON.parse(this.getAttribute("data-product"));

    const link = clone.querySelector(".op-card__url");
    const img = clone.querySelector(".op-card__img");
    const title = clone.querySelector(".op-card__link");
    const price = clone.querySelector(".op-card__price-current");
    const oldPrice = clone.querySelector(".op-card__price-old");
    const discount = clone.querySelector(".op-card__discount-text");
    const swatches = clone.querySelector(".op-card__swatches");

    link.href = product.url;

    img.src = product.featured_image;
    img.alt = product.title;

    title.href = product.url;
    title.textContent = product.title || "Origami woolen top";

    const priceValue = product.price;
    const comparePriceValue = product.compare_at_price;

    let priceInt;
    let compareInt;

    if (priceValue && comparePriceValue) {
      priceInt = Math.round(priceValue);
      compareInt = Math.round(comparePriceValue);
    }

    price.textContent = `₹${priceValue}`;
    if (comparePriceValue) {
      oldPrice.textContent = `₹${comparePriceValue}`;
    }

    if (comparePriceValue && comparePriceValue > priceValue) {
      const discountPercent = Math.round(
        ((compareInt - priceInt) / compareInt) * 100,
      );
      if (discountPercent) {
        discount.textContent = `(${discountPercent}% OFF)`;
      }
    } else {
      discount.textContent = "";
    }

    if (priceValue === comparePriceValue) {
      oldPrice.textContent = "";
    }
    const hasColor = isValidColor(product?.variants[0]?.color);
    //  swatches
    if (product.variants && product.variants.length) {
      product.variants.forEach((variant, index) => {
        if (hasColor) {
          const dot = document.createElement("span");

          dot.className = "op-card__dot";
          dot.style.backgroundColor = variant.color;
          dot.style.zIndex = product.variants.length - index;
          dot.style.cursor = "pointer";
          if (index === 0) {
            dot.classList.add("active");
          }

          dot.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            swatches
              .querySelectorAll(".op-card__dot")
              .forEach((d) => d.classList.remove("active"));
            dot.classList.add("active");

            window.location.href = `${product.url}?variant=${variant.id}`;
          });

          swatches.appendChild(dot);
        }
      });
    }

    this.appendChild(clone);
  }
}

customElements.define("product-card-avenger", ProductCardAvenger);

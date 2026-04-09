document.addEventListener("click", function (e) {
  var t = e.target.closest(".ps-heart");
  if (!t) return;
  e.preventDefault();
  var handle = t.getAttribute("data-product-handle");
  if (!handle) return;
  var saved = JSON.parse(localStorage.getItem("ps_wishlist") || "[]");
  var idx = saved.indexOf(handle);
  if (idx === -1) {
    saved.push(handle);
    t.classList.add("saved");
  } else {
    saved.splice(idx, 1);
    t.classList.remove("saved");
  }
  localStorage.setItem("ps_wishlist", JSON.stringify(saved));
});

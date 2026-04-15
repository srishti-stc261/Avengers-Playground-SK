document.querySelectorAll(".pg-filter-header").forEach((header) => {
  header.addEventListener("click", () => {
    const body = header.nextElementSibling;
    body.style.display = body.style.display === "none" ? "block" : "none";
  });
});

(function () {
  var root = document.documentElement;

  /* Theme toggle: dark / light, remembered per browser */
  var themeBtn = document.getElementById("theme");
  function paintToggle() {
    var light = root.dataset.theme === "light";
    themeBtn.setAttribute("aria-pressed", String(light));
    themeBtn.setAttribute("aria-label", light ? "Switch to dark mode" : "Switch to light mode");
    themeBtn.firstElementChild.innerHTML = light ? "&#9728;" : "&#9790;";
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = light ? "#f5faf7" : "#06100b";
  }
  themeBtn.addEventListener("click", function () {
    var next = root.dataset.theme === "light" ? "dark" : "light";
    root.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch (e) {}
    paintToggle();
  });
  paintToggle();

  /* Mobile menu */
  var menuBtn = document.getElementById("menu"), nav = document.getElementById("nav");
  function setMenu(open) {
    nav.classList.toggle("open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  menuBtn.addEventListener("click", function () { setMenu(!nav.classList.contains("open")); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
  nav.addEventListener("click", function (e) { if (e.target.tagName === "A") setMenu(false); });

  /* Footer year */
  var y = document.getElementById("year"); if (y) y.textContent = new Date().getFullYear();

  /* Test-run panel: lines "pass" one after another, once on load */
  var items = document.querySelectorAll("#run-list li"), sum = document.getElementById("run-sum");
  if (items.length && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    items.forEach(function (li, i) { setTimeout(function () { li.classList.add("on"); }, 500 + i * 450); });
    setTimeout(function () { sum.classList.add("on"); }, 500 + items.length * 450 + 150);
  } else {
    items.forEach(function (li) { li.classList.add("on"); });
    if (sum) sum.classList.add("on");
  }
})();

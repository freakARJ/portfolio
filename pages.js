(function () {
  var FALLBACK = window.SITE || { projects: [], articles: [], ideas: [] };
  var page = document.body.dataset.page;

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function inline(s) {
    return esc(s).replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  }
  /* Small, safe markdown renderer (HTML is escaped first). Phase 3's editor preview reuses it. */
  window.md = function (src) {
    var out = [], L = String(src).replace(/\r/g, "").split("\n"), i = 0, LI = /^(\d+\.|-)\s+/;
    while (i < L.length) {
      var l = L[i], m;
      if (/^```/.test(l)) { var c = []; i++; while (i < L.length && !/^```/.test(L[i])) c.push(L[i++]); i++; out.push("<pre><code>" + esc(c.join("\n")) + "</code></pre>"); continue; }
      if ((m = l.match(/^(#{1,3})\s+(.*)/))) { var n = m[1].length + 1; out.push("<h" + n + ">" + inline(m[2]) + "</h" + n + ">"); i++; continue; }
      if (/^>\s?/.test(l)) { var q = []; while (i < L.length && /^>\s?/.test(L[i])) q.push(L[i++].replace(/^>\s?/, "")); out.push("<blockquote>" + inline(q.join(" ")) + "</blockquote>"); continue; }
      if (LI.test(l)) { var ord = /^\d/.test(l), it = []; while (i < L.length && LI.test(L[i])) it.push("<li>" + inline(L[i++].replace(LI, "")) + "</li>"); out.push((ord ? "<ol>" : "<ul>") + it.join("") + (ord ? "</ol>" : "</ul>")); continue; }
      if (!l.trim()) { i++; continue; }
      var p = []; while (i < L.length && L[i].trim() && !/^(```|#{1,3}\s|>\s?|\d+\.\s|-\s)/.test(L[i])) p.push(L[i++]);
      out.push("<p>" + inline(p.join(" ")) + "</p>");
    }
    return out.join("");
  };
  function fmtDate(d) { return new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
  function mins(t) { return Math.max(1, Math.round(t.split(/\s+/).length / 200)); }
  function tags(a) { return '<ul class="chips">' + (a || []).map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>"; }
  function empty(msg) { return '<div class="empty"><p>' + msg + "</p></div>"; }

  function render(S) {
  /* Projects */
  if (page === "projects") {
    var grid = document.getElementById("p-grid"), bar = document.getElementById("p-filter"), kinds = ["All"];
    S.projects.forEach(function (p) { if (kinds.indexOf(p.kind) < 0) kinds.push(p.kind); });
    function drawP(kind) {
      var list = S.projects.filter(function (p) { return kind === "All" || p.kind === kind; });
      grid.innerHTML = list.length ? list.map(function (p) {
        return '<article class="card"><p class="kind">' + esc(p.kind) + "</p><h2>" + esc(p.title) + "</h2>" +
          (p.text ? "<p>" + esc(p.text) + "</p>" : "") + tags(p.tags) +
          (p.url ? '<p class="more"><a href="' + esc(p.url) + '" target="_blank" rel="noopener">View on GitHub</a></p>' : "") + "</article>";
      }).join("") : empty("No projects in this group yet.");
      bar.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.k === kind)); });
    }
    bar.innerHTML = kinds.map(function (k) { return '<button type="button" data-k="' + esc(k) + '">' + esc(k) + "</button>"; }).join("");
    bar.addEventListener("click", function (e) { if (e.target.dataset.k) drawP(e.target.dataset.k); });
    drawP("All");
  }

  /* QA Journey: list, or one article when the URL ends with #slug */
  if (page === "journey") {
    var box = document.getElementById("j-box"), head = document.getElementById("j-head");
    function drawJ() {
      var slug = decodeURIComponent(location.hash.slice(1)), a = S.articles.filter(function (x) { return x.slug === slug; })[0];
      if (a) {
        document.title = a.title + " | QA Journey";
        head.hidden = true;
        box.innerHTML = '<article class="prose"><p><a href="journey.html">&larr; All articles</a></p><h1>' + esc(a.title) + '</h1><p class="meta">' +
          fmtDate(a.date) + " &middot; " + mins(a.body) + " min read</p>" + tags(a.tags) + md(a.body) + "</article>";
        window.scrollTo(0, 0);
      } else {
        document.title = "QA Journey | Arifur Rahman Jawad"; head.hidden = false;
        box.innerHTML = S.articles.length ? '<div class="list">' + S.articles.map(function (x) {
          return '<article class="card"><p class="meta">' + fmtDate(x.date) + " &middot; " + mins(x.body) + ' min read</p><h2><a href="journey.html#' + encodeURIComponent(x.slug) + '">' + esc(x.title) + "</a></h2><p>" + esc(x.summary) + "</p>" + tags(x.tags) + "</article>";
        }).join("") + "</div>" : empty("No articles yet. The first one is on its way.");
      }
    }
    window.addEventListener("hashchange", drawJ); drawJ();
  }

  /* Free Ideas */
  if (page === "ideas") {
    document.getElementById("i-box").innerHTML = S.ideas.length ? '<div class="list">' + S.ideas.map(function (x) {
      return '<article class="card prose"><p class="meta">' + fmtDate(x.date) + "</p><h2>" + esc(x.title) + "</h2>" + md(x.body) + tags(x.tags) + "</article>";
    }).join("") + "</div>" : empty("No ideas posted yet. Check back soon.");
  }

  }

  /* Load content: database first, saved fallback if it is slow or down */
  function safeUrl(u) { return /^https?:\/\//.test(u || "") ? u : ""; }
  function mapRows(rows) {
    var o = { projects: [], articles: [], ideas: [] };
    rows.forEach(function (r) {
      var t = r.tags || [];
      if (r.type === "project") o.projects.push({ title: r.title, kind: r.kind || "Other", tags: t, text: r.summary || "", url: safeUrl(r.url) });
      else if (r.type === "article") o.articles.push({ slug: r.slug, date: r.entry_date, title: r.title, summary: r.summary || "", tags: t, body: r.body || "" });
      else if (r.type === "idea") o.ideas.push({ id: r.id, date: r.entry_date, title: r.title, tags: t, body: r.body || "" });
    });
    return o;
  }
  function load() {
    var c = window.CONFIG || {};
    if (!c.SUPABASE_URL || !c.SUPABASE_KEY) return Promise.resolve(FALLBACK);
    var ctl = new AbortController(), t = setTimeout(function () { ctl.abort(); }, 4000);
    return fetch(c.SUPABASE_URL + "/rest/v1/entries?select=*&published=eq.true&order=sort_order.asc,entry_date.desc", { headers: { apikey: c.SUPABASE_KEY }, signal: ctl.signal })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (rows) { clearTimeout(t); return mapRows(rows); })
      .catch(function () { clearTimeout(t); return FALLBACK; });
  }
  var boxes = { projects: "p-grid", journey: "j-box", ideas: "i-box" };
  if (boxes[page]) {
    var el = document.getElementById(boxes[page]);
    if (el) el.innerHTML = '<p class="hint" role="status">Loading...</p>';
    load().then(render);
  }

  /* Contact */
  if (page === "contact") {
    var show = document.getElementById("show-phone");
    show.addEventListener("click", function () {
      var n = ["+880", "1783031152"].join("");
      show.outerHTML = '<a class="btn" id="phone" href="tel:' + n + '">' + n + "</a>";
      document.getElementById("phone").focus();
    });
    var f = document.getElementById("cform"), err = document.getElementById("cerr");
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = f.name.value.trim(), mail = f.email.value.trim(), msg = f.message.value.trim(), bad = "";
      if (!msg) bad = "Write a message first.";
      else if (mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) bad = "That email address looks wrong. Check it and try again.";
      err.textContent = bad; f.message.setAttribute("aria-invalid", String(!msg));
      if (bad) { (!msg ? f.message : f.email).focus(); return; }
      var body = msg + (name || mail ? "\n\n" + [name, mail].filter(Boolean).join(" | ") : "");
      location.href = "mailto:arjawad.cse@gmail.com?subject=" + encodeURIComponent("Portfolio message" + (name ? " from " + name : "")) + "&body=" + encodeURIComponent(body);
    });
  }
})();

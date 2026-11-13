(function () {
  var cfg = window.CONFIG || {}, app = document.getElementById("app"), session = null, type = "project", editing = null, dirty = false;
  var TYPES = { project: "Projects", article: "Articles", idea: "Ideas", skill: "Skills" };
  function $(s, r) { return (r || document).querySelector(s); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function persist() { try { if (session) sessionStorage.setItem("arj_s", JSON.stringify(session)); else sessionStorage.removeItem("arj_s"); } catch (e) {} }
  function toast(msg, bad) { var t = $("#toast"); t.textContent = msg; t.className = "toast" + (bad ? " bad" : ""); clearTimeout(toast.t); toast.t = setTimeout(function () { t.textContent = ""; t.className = "toast"; }, 4500); }
  function chrome() { $("#who").textContent = session ? session.email : ""; $("#out").hidden = !session; }
  window.addEventListener("beforeunload", function (e) { if (dirty) { e.preventDefault(); e.returnValue = ""; } });

  /* ---- auth (Supabase Auth REST) ---- */
  function setSession(d) { session = { access_token: d.access_token, refresh_token: d.refresh_token, email: (d.user && d.user.email) || (session && session.email) || "" }; persist(); }
  function authCall(grant, body) {
    return fetch(cfg.SUPABASE_URL + "/auth/v1/token?grant_type=" + grant, { method: "POST", headers: { apikey: cfg.SUPABASE_KEY, "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { if (!r.ok) throw new Error(d.error_description || d.msg || "Sign-in failed"); return d; }); });
  }
  function refresh() { return authCall("refresh_token", { refresh_token: session.refresh_token }).then(function (d) { setSession(d); return true; }, function () { return false; }); }
  function logout(msg) {
    if (session) fetch(cfg.SUPABASE_URL + "/auth/v1/logout", { method: "POST", headers: { apikey: cfg.SUPABASE_KEY, Authorization: "Bearer " + session.access_token } }).catch(function () {});
    session = null; dirty = false; persist(); viewLogin(msg);
  }
  $("#out").addEventListener("click", function () { if (!dirty || confirm("You have unsaved changes. Log out anyway?")) logout(); });

  /* ---- data (PostgREST). Publishable key goes in apikey only; the signed-in user's token goes in Authorization ---- */
  function api(path, opts, retried) {
    opts = opts || {};
    var h = { apikey: cfg.SUPABASE_KEY, "Content-Type": "application/json" };
    if (session) h.Authorization = "Bearer " + session.access_token;
    if (opts.prefer) h.Prefer = opts.prefer;
    return fetch(cfg.SUPABASE_URL + path, { method: opts.method || "GET", headers: h, body: opts.body }).then(function (r) {
      if (r.status === 401 && session && !retried) return refresh().then(function (ok) { if (ok) return api(path, opts, true); return expired(); });
      if (r.status === 401) return expired();
      if (!r.ok) return r.json().catch(function () { return {}; }).then(function (d) { throw new Error(d.message || d.msg || "Request failed (" + r.status + ")"); });
      return r.status === 204 ? null : r.json().catch(function () { return null; });
    });
  }
  function expired() { logout("Your session expired. Please sign in again."); var e = new Error("expired"); e.expired = true; throw e; }

  /* ---- views ---- */
  function viewLogin(msg) {
    chrome(); document.title = "Sign in | Studio";
    app.innerHTML = '<form class="card login" id="lf" novalidate><h1>Sign in</h1><label>Email<input name="email" type="email" autocomplete="username"></label>' +
      '<label>Password<input name="password" type="password" autocomplete="current-password"></label><p class="err" id="le" role="alert">' + esc(msg || "") + '</p><button class="btn primary" type="submit">Sign in</button></form>';
    var f = $("#lf"); f.email.focus();
    f.addEventListener("submit", function (e) {
      e.preventDefault(); var b = $("button", f), em = f.email.value.trim(), pw = f.password.value;
      if (!em || !pw) { $("#le").textContent = "Enter your email and password."; return; }
      b.disabled = true; b.textContent = "Signing in...";
      authCall("password", { email: em, password: pw }).then(function (d) { setSession(d); viewList(); }, function (x) {
        $("#le").textContent = /invalid/i.test(x.message) ? "Wrong email or password." : (x.message === "Failed to fetch" ? "Cannot reach the server. Check your internet." : x.message);
        b.disabled = false; b.textContent = "Sign in"; f.password.value = "";
      });
    });
  }

  function viewList() {
    chrome(); editing = null; dirty = false; document.title = "Manage content | Studio";
    app.innerHTML = "<h1>Manage content</h1><div class=\"filter\" id=\"tabs\">" + Object.keys(TYPES).map(function (k) { return '<button type="button" data-t="' + k + '" aria-pressed="' + (k === type) + '">' + TYPES[k] + "</button>"; }).join("") +
      '</div><div class="bar2"><button class="btn primary sm" id="new" type="button">Add new</button></div><div id="rows"><p class="hint" role="status">Loading...</p></div>' +
      '<details class="tools"><summary>Tools</summary><p class="hint">Import starter content into an empty database, or import your starter skill cards.</p><div class="actions"><button class="btn sm" id="seed" type="button">Import starter content</button><button class="btn sm" id="seed-skills" type="button">Import starter skills</button></div></details>';
    $("#tabs").addEventListener("click", function (e) { if (e.target.dataset.t) { type = e.target.dataset.t; viewList(); } });
    $("#new").addEventListener("click", function () { viewEdit(null); });
    $("#seed").addEventListener("click", seed);
    $("#seed-skills").addEventListener("click", seedSkills);
    api("/rest/v1/entries?select=*&type=eq." + type + "&order=sort_order.asc,entry_date.desc,created_at.desc").then(function (rows) {
      var box = $("#rows");
      if (!rows.length) { box.innerHTML = '<div class="empty"><p>Nothing here yet. Click "Add new".</p></div>'; return; }
      box.innerHTML = rows.map(function (r) {
        return '<div class="row"><div><strong>' + esc(r.title) + '</strong><span class="badge' + (r.published ? "" : " off") + '">' + (r.published ? "Published" : "Hidden") + "</span><br><small>" + esc(r.entry_date) + (r.tags && r.tags.length ? " &middot; " + esc(r.tags.join(", ")) : "") +
          '</small></div><div class="acts"><button class="btn sm" data-e="' + esc(r.id) + '" type="button">Edit</button><button class="btn sm danger" data-d="' + esc(r.id) + '" type="button">Delete</button></div></div>';
      }).join("");
      box.addEventListener("click", function (e) {
        var id = e.target.dataset.e || e.target.dataset.d; if (!id) return;
        var row = rows.filter(function (r) { return r.id === id; })[0];
        if (e.target.dataset.e) viewEdit(row);
        else if (confirm('Delete "' + row.title + '"? This cannot be undone.')) api("/rest/v1/entries?id=eq." + encodeURIComponent(id), { method: "DELETE" }).then(function () { toast("Deleted."); viewList(); }, function (x) { if (!x.expired) toast(x.message, true); });
      });
    }, function (x) { if (!x.expired) $("#rows").innerHTML = '<p class="err" role="alert">Could not load content: ' + esc(x.message) + "</p>"; });
  }

  function slugify(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60); }
  function fld(label, inner, hint) { return "<label>" + label + inner + (hint ? '<span class="hint">' + hint + "</span>" : "") + "</label>"; }

  function viewEdit(row) {
    editing = row; dirty = false; var r = row || {}, today = new Date().toISOString().slice(0, 10);
    document.title = (row ? "Edit" : "Add") + " | Studio";
    var h = '<form class="edit" id="ef" novalidate><h1>' + (row ? "Edit" : "Add") + " " + TYPES[type].slice(0, -1).toLowerCase() + "</h1>" +
      fld(type === "skill" ? "Category title" : "Title", '<input name="title" maxlength="200" value="' + esc(r.title) + '">');
    if (type === "article") h += fld("Slug (the end of the article's web address)", '<input name="slug" value="' + esc(r.slug) + '">', "Lowercase letters, numbers and dashes only.");
    if (type === "project") h += fld("Kind", '<input name="kind" list="kinds" value="' + esc(r.kind || "Testing") + '"><datalist id="kinds"><option>Testing</option><option>Academic</option></datalist>') +
      fld("Description (optional)", '<textarea name="summary" rows="3">' + esc(r.summary) + "</textarea>") + fld("Link (optional)", '<input name="url" type="url" placeholder="https://" value="' + esc(r.url) + '">') +
      fld("Order (lower numbers show first)", '<input name="sort_order" type="number" step="1" value="' + esc(r.sort_order == null ? 0 : r.sort_order) + '">');
    if (type === "skill") h += fld("Order (lower numbers show first)", '<input name="sort_order" type="number" step="1" value="' + esc(r.sort_order == null ? 0 : r.sort_order) + '">');
    if (type === "article") h += fld("Summary (shown in the list)", '<textarea name="summary" rows="2">' + esc(r.summary) + "</textarea>");
    if (type === "article" || type === "idea") h += '<div class="split"><label>' + (type === "idea" ? "Idea" : "Article") + " (Markdown)<textarea name=\"body\">" + esc(r.body) + '</textarea><span class="hint">## heading, **bold**, - bullet, 1. number, ``` code</span></label><div><p class="meta">Live preview</p><div class="prose preview" id="prev"></div></div></div>';
    h += fld(type === "skill" ? "Skills (separate with commas)" : "Tags (separate with commas)", '<input name="tags" value="' + esc((r.tags || []).join(", ")) + '">', type === "skill" ? 'Add * at the end for a dashed "learning" badge (e.g. Playwright (learning)*).' : "");
    if (type === "article" || type === "idea") h += fld("Date", '<input name="entry_date" type="date" value="' + esc(r.entry_date || today) + '">');
    h += '<label class="check"><input type="checkbox" name="published"' + (row && !r.published ? "" : " checked") + '> Published (visible on the website)</label><p class="err" id="fe" role="alert"></p>' +
      '<div class="actions"><button class="btn primary" type="submit">Save</button><button class="btn" type="button" id="cancel">Cancel</button></div></form>';
    app.innerHTML = h;
    var f = $("#ef"), slugTouched = !!row, prev = $("#prev");
    function paint() { if (prev) prev.innerHTML = window.md(f.body.value); }
    paint(); f.title.focus();
    f.addEventListener("input", function (e) {
      dirty = true;
      if (e.target.name === "slug") slugTouched = true;
      if (e.target.name === "title" && type === "article" && !slugTouched) f.slug.value = slugify(f.title.value);
      if (e.target.name === "body") paint();
    });
    $("#cancel").addEventListener("click", function () { if (!dirty || confirm("Discard your unsaved changes?")) viewList(); });
    f.addEventListener("submit", function (e) { e.preventDefault(); submit(f); });
  }

  function submit(f) {
    var errs = [], v = { type: type, title: f.title.value.trim(), tags: f.tags.value.split(",").map(function (s) { return s.trim(); }).filter(Boolean), published: f.published.checked };
    f.querySelectorAll("[aria-invalid]").forEach(function (x) { x.removeAttribute("aria-invalid"); });
    function bad(el, msg) { errs.push({ el: el, msg: msg }); el.setAttribute("aria-invalid", "true"); }
    if (!v.title) bad(f.title, "Title is required.");
    if (type === "project") {
      v.kind = f.kind.value.trim() || "Other"; v.summary = f.summary.value.trim(); v.url = f.url.value.trim(); v.sort_order = Number(f.sort_order.value);
      if (v.url && !/^https?:\/\/\S+$/.test(v.url)) bad(f.url, "The link must start with http:// or https://");
      if (!Number.isInteger(v.sort_order)) bad(f.sort_order, "Order must be a whole number.");
      v.entry_date = (editing && editing.entry_date) || new Date().toISOString().slice(0, 10);
    } else if (type === "skill") {
      v.sort_order = Number(f.sort_order.value);
      if (!Number.isInteger(v.sort_order)) bad(f.sort_order, "Order must be a whole number.");
      if (!v.tags.length) bad(f.tags, "Add at least one skill.");
      v.entry_date = (editing && editing.entry_date) || new Date().toISOString().slice(0, 10);
    } else {
      v.body = f.body.value.trim(); v.entry_date = f.entry_date.value;
      if (!v.body) bad(f.body, "Write something in the body.");
      if (!v.entry_date) bad(f.entry_date, "Pick a date.");
    }
    if (type === "article") {
      v.slug = f.slug.value.trim(); v.summary = f.summary.value.trim();
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(v.slug)) bad(f.slug, "Slug: use lowercase letters, numbers and single dashes only.");
    }
    $("#fe").textContent = errs.map(function (x) { return x.msg; }).join(" ");
    if (errs.length) { errs[0].el.focus(); return; }
    var b = $("button[type=submit]", f); b.disabled = true; b.textContent = "Saving...";
    var req = editing ? api("/rest/v1/entries?id=eq." + encodeURIComponent(editing.id), { method: "PATCH", body: JSON.stringify(Object.assign(v, { updated_at: new Date().toISOString() })) })
      : api("/rest/v1/entries", { method: "POST", body: JSON.stringify(v), prefer: "return=minimal" });
    req.then(function () { dirty = false; toast("Saved."); viewList(); }, function (x) {
      if (x.expired) return;
      $("#fe").textContent = /duplicate/i.test(x.message) ? "That slug is already used by another article. Choose a different one." : "Could not save: " + x.message;
      b.disabled = false; b.textContent = "Save";
    });
  }

  function makeRow(o) {
    var today = new Date().toISOString().slice(0, 10);
    return { type: o.type, title: o.title, slug: o.slug || null, summary: o.summary || null, body: o.body || null, kind: o.kind || null, url: o.url || null, tags: o.tags || [], sort_order: o.sort_order || 0, published: true, entry_date: o.entry_date || today };
  }

  function seed() {
    api("/rest/v1/entries?select=id&limit=1").then(function (have) {
      if (have.length) { toast("Skipped: the database already has content.", true); return; }
      var S = window.SITE, rows = [];
      (S.skills || []).forEach(function (sk, i) { rows.push(makeRow({ type: "skill", title: sk.title, tags: sk.tags, sort_order: i })); });
      S.projects.forEach(function (p, i) { rows.push(makeRow({ type: "project", title: p.title, kind: p.kind, summary: p.text, url: p.url, tags: p.tags, sort_order: i })); });
      S.articles.forEach(function (a) { rows.push(makeRow({ type: "article", title: a.title, slug: a.slug, summary: a.summary, body: a.body, tags: a.tags, entry_date: a.date })); });
      S.ideas.forEach(function (d) { rows.push(makeRow({ type: "idea", title: d.title, body: d.body, tags: d.tags, entry_date: d.date })); });
      return api("/rest/v1/entries", { method: "POST", body: JSON.stringify(rows), prefer: "return=minimal" }).then(function () { toast("Imported " + rows.length + " items."); viewList(); });
    }).catch(function (x) { if (!x.expired) toast(x.message, true); });
  }

  function seedSkills() {
    api("/rest/v1/entries?select=id&type=eq.skill&limit=1").then(function (have) {
      if (have.length) { toast("Skipped: skills already exist in the database.", true); return; }
      var rows = (window.SITE.skills || []).map(function (sk, i) { return makeRow({ type: "skill", title: sk.title, tags: sk.tags, sort_order: i }); });
      return api("/rest/v1/entries", { method: "POST", body: JSON.stringify(rows), prefer: "return=minimal" }).then(function () { toast("Imported " + rows.length + " skill categories."); type = "skill"; viewList(); });
    }).catch(function (x) { if (!x.expired) toast(x.message, true); });
  }

  /* ---- start ---- */
  if (!cfg.SUPABASE_URL || !cfg.SUPABASE_KEY) {
    app.innerHTML = '<div class="empty"><p>Supabase is not connected yet. Open <strong>config.js</strong> and add your project URL and publishable key. Steps are in <strong>SETUP.md</strong>.</p></div>';
  } else {
    try { session = JSON.parse(sessionStorage.getItem("arj_s")); } catch (e) {}
    if (session && session.access_token) viewList(); else { session = null; viewLogin(); }
  }
})();

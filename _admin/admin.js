/* MX Flash — admin : ajout / modification / suppression de projets */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
  const dateFr = (d) => new Date(d + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  const pad = (n) => String(n).padStart(2, "0");
  const TYPES = { photo: "Photo", video: "Vidéo", motion: "Motion design", "3d": "3D" };
  // anciens projets : "type" unique (photo / video / mixte) → liste "types"
  const typesOf = (p) => (Array.isArray(p.types) && p.types.length ? p.types : p.type === "mixte" ? ["photo", "video"] : p.type ? [p.type] : []);
  const typesLabel = (p) => typesOf(p).map((k) => TYPES[k] || k).join(" · ");
  const DRAFT = "mx-admin-brouillon";

  /* ---------- icônes ---------- */
  const P = {
    plus: '<path d="M12 5v14M5 12h14"/>', cube: '<path d="m21 16-9 5-9-5V8l9-5 9 5z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
    motion: '<path d="M3 17c3-7 6-10 9-10s4 6 9 6"/><circle cx="3.5" cy="17" r="1.5"/><circle cx="20.5" cy="13" r="1.5"/>', camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3"/>',
    film: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 4v16M17 4v16M2 9h5M2 15h5M17 9h5M17 15h5"/>',
    layers: '<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/>',
    upload: '<path d="M12 16V4M6 9l6-6 6 6M5 20h14"/>', check: '<path d="M20 6 9 17l-5-5"/>',
    star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>',
    "eye-off": '<path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A10 10 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3.2 3.9M6.6 6.6C3.9 8.4 2 12 2 12s4 7 10 7c1.6 0 3-.4 4.3-1"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>',
    "arrow-right": '<path d="M5 12h14M13 6l6 6-6 6"/>', "arrow-up-right": '<path d="M7 17 17 7M7 7h10v10"/>', play: '<path d="M8 5v14l11-7z" fill="currentColor"/>'
  };
  const icon = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || ""}</svg>`;
  const paint = (root = document) => $$("[data-icon]", root).forEach((el) => { if (!el.dataset.p) { el.insertAdjacentHTML("afterbegin", icon(el.dataset.icon)); el.dataset.p = 1; } });

  /* ---------- données fixes ---------- */
  const LOGICIELS = [
    ["DaVinci Resolve Studio", "davinci-resolve.png", "Dr", "#1b1b1b", "#f2f2f0"], ["Premiere Pro", "premiere-pro.png", "Pr", "#00005b", "#9999ff"],
    ["After Effects", "after-effect.svg.webp", "Ae", "#00005b", "#d291ff"], ["Lightroom", "lightroom.png", "Lr", "#001e36", "#31a8ff"],
    ["Photoshop", "photoshop.svg.webp", "Ps", "#001e36", "#31a8ff"], ["Illustrator", "illustrator.svg", "Ai", "#330000", "#ff9a00"],
    ["Blender", "blender.svg", "Bl", "#1b1b1b", "#e87d0d"]
  ];
  const ROLES = ["Réalisation", "Cadre", "Prise de vue", "Montage", "Étalonnage", "Retouche", "Pilotage drone", "Motion design", "Direction artistique", "Sound design", "Modélisation 3D"];
  const CATS = ["Portrait", "Reportage", "Automobile", "Événement", "Clip", "Publicité", "Aftermovie", "Drone", "Animation", "Argentique", "Mode", "Sport"];

  /* ---------- état ---------- */
  let projets = [], editing = null, pendingSlug = null, items = [], coverId = null, coverAuto = true, softs = [], busy = false, uid = 0;
  let personnes = [], liens = [], dragId = null;
  const form = $("#form");
  const F = (n) => form.elements[n];
  const types = () => $$('input[name="types"]:checked', form).map((i) => i.value);
  // tous les projets acceptent photos et vidéos : le site les range selon les fichiers
  const accepts = () => true;

  /* ---------- API ---------- */
  async function api(url, opts = {}) {
    const r = await fetch(url, { method: opts.method || "GET", headers: opts.body ? { "Content-Type": "application/json" } : {}, body: opts.body ? JSON.stringify(opts.body) : undefined });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.erreur || "Le serveur n'a pas répondu correctement.");
    return data;
  }
  function upload(slug, nom, blob, onProgress) {
    return new Promise((resolve, reject) => {
      const x = new XMLHttpRequest();
      x.open("PUT", `/api/fichier?slug=${encodeURIComponent(slug)}&nom=${encodeURIComponent(nom)}`);
      x.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded, e.total);
      x.onload = () => { let d = {}; try { d = JSON.parse(x.responseText); } catch {} x.status < 300 ? resolve(d) : reject(new Error(d.erreur || "Envoi refusé.")); };
      x.onerror = () => reject(new Error("Connexion au serveur perdue. Vérifie que la fenêtre de l'admin est toujours ouverte."));
      x.send(blob);
    });
  }

  /* ---------- traitement des fichiers ---------- */
  async function optimize(file) {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return { blob: file, ext: extOf(file.name) };
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    const s = Math.min(1, 2400 / Math.max(bmp.width, bmp.height));
    if (s === 1 && file.type === "image/jpeg" && file.size < 1.5e6) return { blob: file, ext: ".jpg" };
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
    c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.86));
    return { blob: blob || file, ext: blob ? ".jpg" : extOf(file.name) };
  }
  const extOf = (n) => { const m = /\.[a-z0-9]+$/i.exec(n || ""); return m ? m[0].toLowerCase().replace(".jpeg", ".jpg") : ""; };
  // format affiché sous la vignette : 16:9, 1:1, 9:16, 4:5…
  function ratioLabel(w, h) {
    if (!w || !h) return "";
    const r = w / h, known = [[16, 9], [9, 16], [1, 1], [4, 5], [5, 4], [4, 3], [3, 4], [21, 9], [2, 1]];
    const k = known.find(([a, b]) => Math.abs(r - a / b) < 0.03);
    return k ? k.join(":") : `${w}×${h}`;
  }
  const fmtDur = (s) => (isFinite(s) && s > 0 ? `${Math.floor(s / 60)}:${pad(Math.round(s % 60))}` : "");
  function videoInfo(file) {
    return new Promise((resolve) => {
      const v = document.createElement("video");
      let done = false;
      const finish = (blob) => { if (done) return; done = true; resolve({ poster: blob, duree: fmtDur(v.duration), w: v.videoWidth || 0, h: v.videoHeight || 0 }); URL.revokeObjectURL(v.src); };
      v.muted = true; v.preload = "auto"; v.playsInline = true;
      v.onloadeddata = () => { v.currentTime = Math.min(1, (v.duration || 2) / 3); };
      v.onseeked = () => {
        try {
          const s = Math.min(1, 1600 / v.videoWidth), c = document.createElement("canvas");
          c.width = Math.round(v.videoWidth * s); c.height = Math.round(v.videoHeight * s);
          c.getContext("2d").drawImage(v, 0, 0, c.width, c.height);
          c.toBlob((b) => finish(b), "image/jpeg", 0.85);
        } catch { finish(null); }
      };
      v.onerror = () => finish(null);
      setTimeout(() => finish(null), 10000);
      v.src = URL.createObjectURL(file);
    });
  }

  /* ---------- médias ---------- */
  function addFiles(list) {
    const refused = [];
    for (const file of list) {
      const genre = file.type.startsWith("video/") ? "video" : file.type.startsWith("image/") ? "photo" : null;
      if (!genre) { refused.push(file.name); continue; }
      const it = { id: ++uid, genre, file, uploaded: false, preview: genre === "photo" ? URL.createObjectURL(file) : "" };
      items.push(it);
      if (genre === "video") videoInfo(file).then(({ poster, duree, w, h }) => {
        it.posterBlob = poster; it.duree = duree; it.w = w; it.h = h;
        if (poster) it.preview = URL.createObjectURL(poster);
        renderTiles();
      });
    }
    $("#medias-error").textContent = refused.length ? `Format non pris en charge : ${refused.join(", ")}. Utilise JPG, PNG, WebP, MP4 ou MOV.` : "";
    renderTiles();
    saveDraft();
  }
  // couverture : la 1re photo tant que tu n'as pas cliqué sur une étoile
  function syncCover() {
    const ok = items.filter((i) => accepts(i.genre));
    if (coverAuto || !ok.some((i) => i.id === coverId)) { const c = ok.find((i) => i.genre === "photo" && !i.cache) || ok.find((i) => i.genre === "photo") || ok[0]; coverId = c ? c.id : null; }
  }
  function renderTiles() {
    syncCover();
    const ul = $("#tiles");
    const num = { photo: 0, video: 0 };
    ul.innerHTML = items.map((it, i) => {
      const warn = !accepts(it.genre);
      const n = warn ? "–" : it.cache ? "Vignette" : (it.genre === "video" ? "V" : "") + ++num[it.genre];
      return `<li class="tile${warn ? " is-warn" : ""}${it.cache ? " is-cover-only" : ""}" data-id="${it.id}" draggable="${!busy}">
        <span class="tile__badge tag ${it.cache ? "tag--accent" : "tag--dark"}" title="${it.cache ? "Image de présentation uniquement : masquée sur la page du projet" : "Position sur la page"}">${n}</span>
        <div class="media${coverId === it.id ? " is-cover" : ""}">${it.preview ? `<img src="${esc(it.preview)}" alt="" draggable="false">` : ""}
          ${it.genre === "video" ? `<span class="play play--sm" style="position:relative;z-index:1">${icon("play")}</span>` : ""}
          <div class="tile__prog" hidden><span></span></div></div>
        <div class="tile__btns">
          <button type="button" data-act="cover" aria-pressed="${coverId === it.id}" aria-label="Choisir comme couverture" title="Couverture">${icon("star")}</button>
          ${it.genre === "photo" ? `<button type="button" data-act="hide" aria-pressed="${!!it.cache}" aria-label="${it.cache ? "Afficher aussi cette image sur la page du projet" : "Image de présentation uniquement (masquée sur la page du projet)"}" title="${it.cache ? "Afficher sur la page" : "Présentation uniquement"}">${icon("eye-off")}</button>` : ""}
          <button type="button" data-act="remove" aria-label="Retirer ce fichier" title="Retirer">${icon("x")}</button>
        </div>
        <div class="tile__bar"><span class="tile__name">${esc(it.file ? it.file.name : it.nom)}</span><span class="mono muted">${it.genre === "video" ? esc([ratioLabel(it.w, it.h), it.duree].filter(Boolean).join(" · ") || "vidéo") : ""}</span></div>
        <div class="tile__move"><button type="button" data-act="left" aria-label="Déplacer vers l'avant" title="Avant" ${i === 0 ? "disabled" : ""}>←</button><button type="button" data-act="right" aria-label="Déplacer vers l'arrière" title="Après" ${i === items.length - 1 ? "disabled" : ""}>→</button></div>
      </li>`;
    }).join("");
    $("#cover-hint").hidden = !items.length;
  }
  $("#tiles").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-act]"); if (!b || busy) return;
    const id = Number(b.closest(".tile").dataset.id);
    const k = items.findIndex((i) => i.id === id);
    if (b.dataset.act === "cover") { coverId = id; coverAuto = false; }
    else if (b.dataset.act === "hide") {
      const it = items[k]; it.cache = !it.cache;
      // une image "présentation uniquement" sert forcément de couverture
      if (it.cache) { items.filter((x) => x !== it).forEach((x) => { x.cache = false; }); coverId = id; coverAuto = false; }
      $("#medias-error").textContent = "";
    }
    else if (b.dataset.act === "left" || b.dataset.act === "right") {
      const j = k + (b.dataset.act === "left" ? -1 : 1);
      if (j < 0 || j >= items.length) return;
      [items[k], items[j]] = [items[j], items[k]];
      renderTiles();
      const again = $(`.tile[data-id="${id}"] [data-act="${b.dataset.act}"]`); if (again && !again.disabled) again.focus();
      return;
    } else items = items.filter((i) => i.id !== id);
    renderTiles();
  });

  /* ---------- ordre : glisser-déposer des vignettes ---------- */
  const tilesEl = $("#tiles");
  const clearMarks = () => $$(".tile", tilesEl).forEach((t) => t.classList.remove("drop-before", "drop-after"));
  tilesEl.addEventListener("dragstart", (e) => {
    const li = e.target.closest(".tile"); if (!li || busy) return;
    dragId = Number(li.dataset.id); li.classList.add("is-drag");
    e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", String(dragId));
  });
  tilesEl.addEventListener("dragover", (e) => {
    if (dragId == null) return;
    e.preventDefault(); clearMarks();
    const li = e.target.closest(".tile"); if (!li || Number(li.dataset.id) === dragId) return;
    const r = li.getBoundingClientRect();
    li.classList.add(e.clientX < r.left + r.width / 2 ? "drop-before" : "drop-after");
  });
  tilesEl.addEventListener("drop", (e) => {
    if (dragId == null) return;
    e.preventDefault();
    const li = e.target.closest(".tile");
    if (li && Number(li.dataset.id) !== dragId) {
      const before = li.classList.contains("drop-before");
      const moving = items.find((i) => i.id === dragId);
      items = items.filter((i) => i.id !== dragId);
      let idx = items.findIndex((i) => i.id === Number(li.dataset.id));
      if (!before) idx++;
      items.splice(idx, 0, moving);
    }
    dragId = null; renderTiles();
  });
  tilesEl.addEventListener("dragend", () => { if (dragId != null) { dragId = null; renderTiles(); } });
  const input = $("#f-files"), drop = $("#drop");
  input.addEventListener("change", () => { addFiles(Array.from(input.files)); input.value = ""; });
  ["dragenter", "dragover"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("is-over"); }));
  ["dragleave", "drop"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("is-over"); }));
  drop.addEventListener("drop", (e) => addFiles(Array.from(e.dataTransfer.files)));

  function onType() {
    const n = types().length;
    $("#types-count").textContent = n ? `${n} sélectionné${n > 1 ? "s" : ""}` : "";
    if (n) setErr("types", "");
    renderTiles();
  }
  $$('input[name="types"]').forEach((r) => r.addEventListener("change", () => { onType(); saveDraft(); }));

  /* ---------- rôle ---------- */
  const roleParts = () => F("role").value.split(/\s*[·,/]\s*/).map((s) => s.trim()).filter(Boolean);
  function renderRoles() {
    const cur = roleParts().map((s) => s.toLowerCase());
    $("#role-suggest").innerHTML = ROLES.map((r) => `<button type="button" aria-pressed="${cur.includes(r.toLowerCase())}">${cur.includes(r.toLowerCase()) ? "✓ " : "+ "}${esc(r)}</button>`).join("");
  }
  $("#role-suggest").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    const r = b.textContent.slice(2), parts = roleParts();
    const i = parts.findIndex((p) => p.toLowerCase() === r.toLowerCase());
    if (i >= 0) parts.splice(i, 1); else parts.push(r);
    F("role").value = parts.join(" · ");
    clearErr("role"); renderRoles(); saveDraft();
  });
  F("role").addEventListener("input", renderRoles);

  /* ---------- logiciels ---------- */
  function renderSofts() {
    const known = LOGICIELS.map((l) => l[0]);
    const all = known.concat(softs.filter((s) => !known.includes(s)));
    $("#softs").innerHTML = all.map((n) => {
      const l = LOGICIELS.find((x) => x[0] === n);
      const mini = l ? `<span class="mini" style="background:${l[3]};color:${l[4]}"><img src="../assets/images/logiciels/${l[1]}" alt="" onerror="this.remove()"><b>${l[2]}</b></span>`
        : `<span class="mini" style="background:#1c1c1c;color:#f2f2f0"><b>${esc(n.slice(0, 2))}</b></span>`;
      return `<label class="chip soft-chip"><input type="checkbox" value="${esc(n)}" ${softs.includes(n) ? "checked" : ""}><span>${mini}${esc(n)}</span></label>`;
    }).join("");
  }
  $("#softs").addEventListener("change", (e) => {
    const v = e.target.value;
    softs = e.target.checked ? softs.concat(v) : softs.filter((s) => s !== v);
    saveDraft();
  });
  function addSoft() {
    const v = $("#f-soft").value.trim(); if (!v) return;
    if (!softs.includes(v)) softs.push(v);
    $("#f-soft").value = ""; renderSofts(); saveDraft();
  }
  $("#btn-soft").addEventListener("click", addSoft);
  $("#f-soft").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); addSoft(); } });

  /* ---------- crédits & liens (facultatif) ---------- */
  const normIg = (v) => { v = String(v || "").trim(); const m = v.match(/instagram\.com\/([A-Za-z0-9._]{1,30})/i); const h = (m ? m[1] : v.replace(/^@/, "")).trim(); return /^[A-Za-z0-9._]{1,30}$/.test(h) ? h : null; };
  const normUrl = (v) => { v = String(v || "").trim(); if (!v) return null; if (!/^https?:\/\//i.test(v)) v = "https://" + v; try { const u = new URL(v); return u.hostname.includes(".") ? u.href : null; } catch { return null; } };
  function renderPeople() {
    $("#people").innerHTML = personnes.map((p, i) => `<div class="crow" data-i="${i}">
      <div class="field"><label for="pn${i}">Nom</label><input id="pn${i}" data-k="nom" maxlength="60" value="${esc(p.nom)}" placeholder="Camille Martin"></div>
      <div class="field"><label for="pr${i}">Rôle <span class="opt">facultatif</span></label><input id="pr${i}" data-k="role" maxlength="60" value="${esc(p.role)}" placeholder="Modèle, client…"></div>
      <div class="field"><label for="pi${i}">Instagram</label><input id="pi${i}" data-k="instagram" maxlength="120" value="${esc(p.instagram)}" placeholder="@camille.photo" autocomplete="off"><p class="error"></p></div>
      <button class="icon-btn icon-btn--sm" type="button" data-del aria-label="Retirer cette personne">${icon("x")}</button>
    </div>`).join("");
  }
  function renderLinks() {
    $("#links").innerHTML = liens.map((l, i) => `<div class="crow crow--2" data-i="${i}">
      <div class="field"><label for="lt${i}">Texte du lien <span class="opt">facultatif</span></label><input id="lt${i}" data-k="texte" maxlength="60" value="${esc(l.texte)}" placeholder="Voir le clip sur YouTube"></div>
      <div class="field"><label for="lu${i}">Adresse</label><input id="lu${i}" data-k="url" inputmode="url" maxlength="500" value="${esc(l.url)}" placeholder="https://…"><p class="error"></p></div>
      <button class="icon-btn icon-btn--sm" type="button" data-del aria-label="Retirer ce lien">${icon("x")}</button>
    </div>`).join("");
  }
  const rowErr = (row, m) => { const f = $(".error", row).closest(".field"); $(".error", f).textContent = m; if (m) f.setAttribute("data-invalid", ""); else f.removeAttribute("data-invalid"); };
  const checkPerson = (p) => (p.instagram.trim() && normIg(p.instagram) === null ? "Ce pseudo Instagram n'est pas valide (lettres, chiffres, points et _ uniquement)." : "");
  const checkLink = (l) => (!l.url.trim() ? (l.texte.trim() ? "Ajoute l'adresse du lien, ou retire la ligne." : "") : normUrl(l.url) === null ? "Cette adresse ne ressemble pas à un lien (ex. https://youtube.com/…)." : "");
  function bindRows(box, list, check, render) {
    box.addEventListener("input", (e) => {
      const row = e.target.closest(".crow"); if (!row) return;
      list()[row.dataset.i][e.target.dataset.k] = e.target.value;
      if ($("[data-invalid]", row)) rowErr(row, check(list()[row.dataset.i]));
      saveDraft();
    });
    box.addEventListener("focusout", (e) => { const row = e.target.closest(".crow"); if (row && e.target.value) rowErr(row, check(list()[row.dataset.i])); });
    box.addEventListener("click", (e) => { const b = e.target.closest("[data-del]"); if (!b) return; list().splice(Number(b.closest(".crow").dataset.i), 1); render(); saveDraft(); });
  }
  bindRows($("#people"), () => personnes, checkPerson, renderPeople);
  bindRows($("#links"), () => liens, checkLink, renderLinks);
  $("#btn-person").addEventListener("click", () => { personnes.push({ nom: "", role: "", instagram: "" }); renderPeople(); $(`#pn${personnes.length - 1}`).focus(); });
  $("#btn-link").addEventListener("click", () => { liens.push({ texte: "", url: "" }); renderLinks(); $(`#lt${liens.length - 1}`).focus(); });

  /* ---------- description ---------- */
  const desc = F("description");
  const countDesc = () => { const n = desc.value.trim().length; $("#desc-count").textContent = `${n} caractères${n && n < 150 ? " · un peu court" : n > 900 ? " · un peu long" : ""}`; };
  desc.addEventListener("input", countDesc);

  /* ---------- validation (au blur, effacée à la saisie) ---------- */
  const RULES = {
    titre: () => F("titre").value.trim() ? "" : "Donne un titre au projet.",
    date: () => /^\d{4}-\d{2}-\d{2}$/.test(F("date").value) ? "" : "Indique la date du projet — elle sert à classer les activités récentes.",
    role: () => F("role").value.trim() ? "" : "Indique ton rôle, ou clique sur une suggestion.",
    description: () => desc.value.trim().length >= 20 ? "" : "Écris au moins une phrase (20 caractères) pour présenter le projet."
  };
  function setErr(name, msg) {
    const f = form.querySelector(`[data-f="${name}"]`);
    if (!f) return;
    const p = $(".error", f); if (p) p.textContent = msg;
    if (msg) f.setAttribute("data-invalid", ""); else f.removeAttribute("data-invalid");
    const inp = $("input, textarea", f); if (inp) inp.setAttribute("aria-invalid", String(!!msg));
  }
  const clearErr = (name) => setErr(name, "");
  Object.keys(RULES).forEach((n) => {
    const el = F(n);
    el.addEventListener("blur", () => { if (el.value) setErr(n, RULES[n]()); });
    el.addEventListener("input", () => { if (form.querySelector(`[data-f="${n}"][data-invalid]`)) setErr(n, RULES[n]()); saveDraft(); });
  });
  F("categorie").addEventListener("input", saveDraft);
  F("embed").addEventListener("input", saveDraft);
  function mediaErr() {
    if (items.some((i) => !i.cache) || F("embed").value.trim()) return "";
    return items.length ? "L'image de présentation est masquée sur la page : ajoute au moins une autre photo ou vidéo à afficher." : "Ajoute au moins une photo ou une vidéo (ou un lien YouTube / Vimeo).";
  }
  function validate() {
    let first = null;
    if (!types().length) { setErr("types", "Choisis au moins un type : Photo, Vidéo, Motion design ou 3D."); first = $('input[name="types"]', form); }
    for (const n of Object.keys(RULES)) { const m = RULES[n](); setErr(n, m); if (m && !first) first = F(n); }
    const m = mediaErr(); $("#medias-error").textContent = m; if (m && !first) first = $("#f-files");
    $$("#people .crow").forEach((row) => { const e = checkPerson(personnes[row.dataset.i]); rowErr(row, e); if (e && !first) first = $("[data-k=instagram]", row); });
    $$("#links .crow").forEach((row) => { const e = checkLink(liens[row.dataset.i]); rowErr(row, e); if (e && !first) first = $("[data-k=url]", row); });
    return first;
  }

  /* ---------- brouillon (nouveau projet uniquement) ---------- */
  function saveDraft() {
    if (editing) return;
    try { localStorage.setItem(DRAFT, JSON.stringify({ types: types(), titre: F("titre").value, date: F("date").value, categorie: F("categorie").value, role: F("role").value, description: desc.value, embed: F("embed").value, softs, personnes, liens })); } catch {}
  }
  function loadDraft() {
    try { const d = JSON.parse(localStorage.getItem(DRAFT) || "null"); if (d && (d.titre || d.description)) return d; } catch {}
    return null;
  }
  const clearDraft = () => { try { localStorage.removeItem(DRAFT); } catch {} };

  /* ---------- formulaire : nouveau / modifier ---------- */
  function setValues(p) {
    const ts = typesOf(p);
    $$('input[name="types"]', form).forEach((i) => { i.checked = ts.includes(i.value); });
    setErr("types", "");
    F("titre").value = p.titre || ""; F("date").value = p.date || today(); F("categorie").value = p.categorie || "";
    F("role").value = p.role || ""; desc.value = p.description || ""; F("embed").value = p.embed || "";
    softs = (p.logiciels || p.softs || []).slice();
    personnes = (p.personnes || []).map((x) => ({ nom: x.nom || "", role: x.role || "", instagram: x.instagram ? "@" + String(x.instagram).replace(/^@/, "") : "" }));
    liens = (p.liens || []).map((x) => ({ texte: x.texte || "", url: x.url || "" }));
    renderPeople(); renderLinks();
    Object.keys(RULES).forEach(clearErr); $("#medias-error").textContent = "";
    renderSofts(); renderRoles(); countDesc(); onType();
  }
  function newProject(useDraft = true) {
    editing = null; pendingSlug = null; items = []; coverId = null; coverAuto = true;
    const d = useDraft ? loadDraft() : null;
    setValues(d || {});
    $("#draft-note").hidden = !d;
    $("#form-kicker").textContent = "Nouveau projet"; $("#form-title").textContent = "Ajouter un projet";
    $("#btn-submit").firstChild.textContent = "Publier le projet ";
    $("#btn-delete").hidden = true;
    showForm(); renderList();
  }
  function editProject(slug) {
    const p = projets.find((x) => x.slug === slug); if (!p) return;
    editing = slug; pendingSlug = null;
    const base = `/assets/projets/${slug}/`;
    items = p.medias.map((m) => ({ id: ++uid, genre: m.genre, nom: m.nom, poster: m.poster, duree: m.duree, w: m.w, h: m.h, cache: !!m.cache, uploaded: true, preview: m.genre === "photo" ? base + m.nom : m.poster ? base + m.poster : "" }));
    const c = items.find((i) => i.nom === p.couverture || i.poster === p.couverture); coverId = c ? c.id : null;
    const first = items.find((i) => i.genre === "photo") || items[0];
    coverAuto = !c || c === first;
    setValues(p);
    $("#draft-note").hidden = true;
    $("#form-kicker").textContent = "Modifier · " + typesLabel(p); $("#form-title").textContent = p.titre;
    $("#btn-submit").firstChild.textContent = "Enregistrer les modifications ";
    $("#btn-delete").hidden = false;
    showForm(); renderList();
    window.scrollTo({ top: 0 });
  }
  function showForm() { form.hidden = false; $("#done").hidden = true; msg(""); }
  $("#btn-new").addEventListener("click", () => newProject(false));
  $("#done-new").addEventListener("click", () => newProject(false));
  $("#btn-cancel").addEventListener("click", () => { if (!editing) clearDraft(); newProject(false); });

  /* ---------- liste ---------- */
  function renderList() {
    $("#count").textContent = projets.length;
    const ul = $("#plist");
    if (!projets.length) { ul.innerHTML = `<li class="empty">Aucun projet pour l’instant.<br>Remplis le formulaire pour publier le premier.</li>`; return; }
    ul.innerHTML = projets.map((p, i) => `<li><button type="button" data-slug="${esc(p.slug)}" aria-current="${editing === p.slug}">
      <span class="media">${p.couverture ? `<img src="/assets/projets/${esc(p.slug)}/${esc(p.couverture)}" alt="">` : ""}</span>
      <span style="min-width:0"><strong>${esc(p.titre)}</strong><small>${i < 3 ? '<span class="tag tag--accent">Récent</span>' : ""}${esc(typesLabel(p))} · ${esc(dateFr(p.date))}</small></span>
    </button></li>`).join("");
  }
  $("#plist").addEventListener("click", (e) => { const b = e.target.closest("button[data-slug]"); if (b && !busy) editProject(b.dataset.slug); });
  function fillCats() {
    const all = [...new Set(CATS.concat(projets.map((p) => p.categorie).filter(Boolean)))];
    $("#cats").innerHTML = all.map((c) => `<option value="${esc(c)}">`).join("");
  }
  async function refresh() {
    projets = await api("/api/projets");
    renderList(); fillCats();
  }

  /* ---------- publication ---------- */
  const msg = (t, err) => { const m = $("#bar-msg"); m.textContent = t; m.classList.toggle("is-error", !!err); };
  const bar = (r) => { const p = $("#progress"); p.hidden = r == null; if (r != null) $("span", p).style.width = Math.round(r * 100) + "%"; };
  function lock(on) {
    busy = on;
    $$("button, input, textarea", form).forEach((el) => { el.disabled = on; });
  }
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (busy) return;
    const bad = validate();
    if (bad) { msg("Il manque quelques infos — elles sont indiquées en rouge.", true); bad.focus(); return; }
    const keep = items.slice();
    lock(true); msg("Préparation…"); bar(0);
    try {
      // en cas de nouvel essai après une erreur, on réutilise le même dossier
      const slug = editing || pendingSlug || (pendingSlug = (await api("/api/projets/nouveau", { method: "POST", body: { titre: F("titre").value, date: F("date").value } })).slug);
      const todo = keep.filter((i) => !i.uploaded);
      const total = todo.reduce((a, i) => a + i.file.size, 0) || 1;
      let sent = 0;
      let nPhoto = keep.filter((i) => i.genre === "photo" && i.uploaded).length;
      let nVideo = keep.filter((i) => i.genre === "video" && i.uploaded).length;
      for (const [k, it] of todo.entries()) {
        const tile = $(`.tile[data-id="${it.id}"]`), prog = tile && $(".tile__prog", tile);
        if (prog) prog.hidden = false;
        const onP = (l, tot) => { if (prog) $("span", prog).style.width = Math.round((l / tot) * 100) + "%"; bar((sent + (l / tot) * it.file.size) / total); };
        msg(`Envoi ${k + 1} / ${todo.length} — ${it.file.name}`);
        if (it.genre === "photo") {
          const o = $("#f-optim").checked ? await optimize(it.file) : { blob: it.file, ext: extOf(it.file.name) };
          it.nom = (await upload(slug, `photo-${pad(++nPhoto)}${o.ext || ".jpg"}`, o.blob, onP)).nom;
        } else {
          const n = pad(++nVideo);
          it.nom = (await upload(slug, `video-${n}${extOf(it.file.name) || ".mp4"}`, it.file, onP)).nom;
          if (it.posterBlob) it.poster = (await upload(slug, `poster-${n}.jpg`, it.posterBlob, () => {})).nom;
        }
        it.uploaded = true; sent += it.file.size; bar(sent / total);
      }
      const cover = keep.find((i) => i.id === coverId);
      msg("Création de la page…");
      const r = await api("/api/projets", { method: "POST", body: {
        slug, types: types(), titre: F("titre").value, date: F("date").value, categorie: F("categorie").value,
        role: F("role").value, description: desc.value, embed: F("embed").value, logiciels: softs,
        personnes: personnes.map((x) => ({ nom: x.nom.trim(), role: x.role.trim(), instagram: normIg(x.instagram) || "" })).filter((x) => x.nom || x.instagram),
        liens: liens.filter((l) => l.url.trim()).map((l) => ({ texte: l.texte.trim(), url: normUrl(l.url) })),
        couverture: cover ? (cover.genre === "photo" ? cover.nom : cover.poster) : "",
        medias: keep.map((i) => ({ nom: i.nom, genre: i.genre, poster: i.poster, duree: i.duree, w: i.w, h: i.h, cache: !!i.cache }))
      } });
      const wasEditing = !!editing;
      clearDraft();
      await refresh();
      const rank = projets.findIndex((p) => p.slug === slug);
      form.hidden = true; $("#done").hidden = false;
      $("#done-title").textContent = wasEditing ? "Modifications enregistrées" : "Projet publié";
      $("#done-text").textContent = `« ${r.projet.titre} » (${typesLabel(r.projet)}) a sa page, et apparaît dans ${where(r.projet)}` +
        (rank > -1 && rank < 3 ? " et dans les Activités récentes de l’accueil." : ". Il est plus ancien que les 3 derniers projets : il n’est pas dans les Activités récentes.");
      $("#done-page").href = r.page;
      editing = null; pendingSlug = null; items = []; personnes = []; liens = []; renderList();
      window.scrollTo({ top: 0 });
    } catch (err) {
      msg(err.message + " Les fichiers déjà envoyés sont conservés : tu peux réessayer.", true);
    } finally {
      lock(false); bar(null);
    }
  });

  // placement sur le site : selon les fichiers
  function where(p) {
    const ph = p.medias.some((m) => m.genre === "photo" && !m.cache), vi = p.medias.some((m) => m.genre === "video") || !!p.embed;
    return ph && vi ? "Réalisations Photos et Vidéos" : ph ? "Réalisations Photos" : "Réalisations Vidéos";
  }

  /* ---------- suppression (confirmation nommée) ---------- */
  const dlg = $("#confirm");
  $("#btn-delete").addEventListener("click", () => {
    const p = projets.find((x) => x.slug === editing); if (!p) return;
    $("#confirm-title").textContent = `Supprimer « ${p.titre} » ?`;
    $("#confirm-text").textContent = `La page du projet et ses ${p.medias.length} fichier${p.medias.length > 1 ? "s" : ""} seront effacés du site. Cette action est définitive.`;
    $("#confirm-yes").textContent = `Supprimer « ${p.titre.length > 24 ? p.titre.slice(0, 24) + "…" : p.titre} »`;
    dlg.showModal(); $("#confirm-no").focus();
  });
  $("#confirm-no").addEventListener("click", () => dlg.close());
  $("#confirm-yes").addEventListener("click", async () => {
    const slug = editing; dlg.close();
    try { await api(`/api/projets?slug=${encodeURIComponent(slug)}`, { method: "DELETE" }); await refresh(); newProject(false); msg("Projet supprimé."); }
    catch (err) { msg(err.message, true); }
  });

  window.addEventListener("beforeunload", (e) => { if (busy) { e.preventDefault(); e.returnValue = ""; } });

  /* ---------- démarrage ---------- */
  paint();
  newProject(true);
  refresh().then(() => {
    $("#status").textContent = "● Serveur local connecté";
  }).catch(() => {
    $("#status").textContent = "Serveur non lancé";
    msg("L’admin doit être ouverte via le serveur local : double-clique sur LANCER-ADMIN.bat, puis va sur http://localhost:4321/_admin/", true);
    $("#btn-submit").disabled = true;
  });
})();

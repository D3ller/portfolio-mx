/* MX Flash — comportements communs à toutes les pages */
(function () {
  "use strict";
  const MX = window.MX || {};
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- Icônes (data-icon="nom") ---------- */
  const P = {
    instagram: '<rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.6" fill="currentColor"/>',
    tiktok: '<path d="M15 3v2.5A4.5 4.5 0 0 0 19.5 10v3A7.4 7.4 0 0 1 15 11.5V16a5.5 5.5 0 1 1-5.5-5.5v3A2.5 2.5 0 1 0 12 16V3z"/>',
    pappers: '<path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-5h6v5M9 10h.01M15 10h.01"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
    "arrow-up-right": '<path d="M7 17 17 7M7 7h10v10"/>',
    "arrow-right": '<path d="M5 12h14M13 6l6 6-6 6"/>',
    "arrow-left": '<path d="M19 12H5M12 19l-7-7 7-7"/>',
    download: '<path d="M12 4v12M6 11l6 6 6-6M5 20h14"/>',
    play: '<path d="M8 5v14l11-7z" fill="currentColor"/>',
    pause: '<path d="M6 4h4v16H6zM14 4h4v16h-4z" fill="currentColor"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    sound: '<path d="M11 5 6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
    mute: '<path d="M11 5 6 9H2v6h4l5 4zM22 9l-6 6M16 9l6 6"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3"/>',
    sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
    pin: '<circle cx="12" cy="10" r="3"/><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"/>'
  };
  const icon = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || ""}</svg>`;
  const paintIcons = (root = document) => $$("[data-icon]", root).forEach((el) => { if (!el.dataset.painted) { el.insertAdjacentHTML("afterbegin", icon(el.dataset.icon)); el.dataset.painted = "1"; } });

  /* ---------- Liens de contact (data-link="instagram" …) ---------- */
  function paintLinks() {
    const c = MX.contact || {};
    const map = {
      instagram: c.instagram, tiktok: c.tiktok, pappers: c.pappers,
      mail: c.email && "mailto:" + c.email, phone: c.telephone && "tel:" + c.telephone,
      cv: MX.cv
    };
    $$("[data-link]").forEach((a) => { const h = map[a.dataset.link]; if (h) a.href = h; });
    $$("[data-text]").forEach((el) => { const v = { email: c.email, phone: c.telephoneAffiche, instagram: c.instagramAffiche }[el.dataset.text]; if (v) el.textContent = v; });
  }

  /* ---------- Médias manquants : on garde le dégradé de secours ---------- */
  // data-fallback="autre.jpg" : image de secours essayée avant d'afficher le cadre gris
  const useFallback = (img) => {
    const fb = img.dataset.fallback;
    if (!fb || img.dataset.fbTried) return false;
    img.dataset.fbTried = "1"; img.src = fb;
    return true;
  };
  document.addEventListener("error", (e) => {
    const t = e.target;
    if (t.tagName === "IMG" || t.tagName === "VIDEO") { if (t.closest(".media, .soft__logo, .hero__bg") && !useFallback(t)) t.remove(); }
  }, true);
  // les images déjà en échec avant le chargement de ce script
  const sweepMissing = () => {
    $$(".media img, .soft__logo img, .hero__bg img").forEach((i) => { if (i.complete && i.naturalWidth === 0 && !useFallback(i)) i.remove(); });
    $$(".media video").forEach((v) => { if (v.error || v.networkState === 3) v.remove(); });
  };

  /* ---------- Aperçu vidéo au survol ---------- */
  function bindPreviews(root = document) {
    $$("[data-preview]", root).forEach((box) => {
      const v = $("video", box);
      if (!v || reduceMotion) return;
      box.addEventListener("mouseenter", () => { v.play().catch(() => {}); });
      box.addEventListener("mouseleave", () => { v.pause(); v.currentTime = 0; });
    });
  }

  /* ---------- Carrousels horizontaux ---------- */
  $$("[data-scroll]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const track = document.getElementById(btn.dataset.target);
      if (track) track.scrollBy({ left: Number(btn.dataset.scroll) * track.clientWidth * 0.8, behavior: reduceMotion ? "auto" : "smooth" });
    });
  });

  /* ---------- Lightbox (photos, vidéos, embeds) ---------- */
  let lb, state = { items: [], i: 0 };
  function ensureLightbox() {
    if (lb) return lb;
    document.body.insertAdjacentHTML("beforeend", `
      <dialog class="lightbox" aria-labelledby="lb-title">
        <div class="lightbox__bar">
          <div><span class="mono accent" id="lb-kicker"></span><h2 class="heading-m" id="lb-title"></h2></div>
          <button class="icon-btn" type="button" data-lb-close aria-label="Fermer" data-icon="close"></button>
        </div>
        <div class="lightbox__stage" id="lb-stage"></div>
        <div class="lightbox__foot">
          <p class="muted" id="lb-info"></p>
          <div class="lightbox__nav">
            <button class="icon-btn icon-btn--sm" type="button" data-lb-prev aria-label="Précédent" data-icon="arrow-left"></button>
            <span class="mono muted" id="lb-count" style="align-self:center"></span>
            <button class="icon-btn icon-btn--sm" type="button" data-lb-next aria-label="Suivant" data-icon="arrow-right"></button>
            <a class="btn btn--accent" id="lb-link" hidden>Voir le process <span data-icon="arrow-right"></span></a>
          </div>
        </div>
      </dialog>`);
    lb = $(".lightbox");
    paintIcons(lb);
    $("[data-lb-close]", lb).addEventListener("click", () => lb.close());
    $("[data-lb-prev]", lb).addEventListener("click", () => show(state.i - 1));
    $("[data-lb-next]", lb).addEventListener("click", () => show(state.i + 1));
    lb.addEventListener("click", (e) => { if (e.target === lb) lb.close(); });
    lb.addEventListener("close", () => { $("#lb-stage").innerHTML = ""; });
    lb.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") show(state.i + 1);
      if (e.key === "ArrowLeft") show(state.i - 1);
    });
    return lb;
  }
  function show(i) {
    const n = state.items.length; if (!n) return;
    state.i = (i + n) % n;
    const it = state.items[state.i], stage = $("#lb-stage");
    if (it.type === "embed") stage.innerHTML = `<iframe${/instagram\.com/.test(it.src) ? ' class="is-vertical"' : ""} src="${esc(it.src)}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="${esc(it.alt || "Vidéo")}"></iframe>`;
    else if (it.type === "video") stage.innerHTML = `<video src="${esc(it.src)}" ${it.poster ? `poster="${esc(it.poster)}"` : ""} controls autoplay playsinline></video>`;
    else stage.innerHTML = `<img src="${esc(it.src)}" alt="${esc(it.alt || "")}">`;
    const m = $("img, video", stage);
    if (m) m.addEventListener("error", () => { stage.innerHTML = `<p class="muted" style="padding:120px 24px;text-align:center">Fichier à venir : ${esc(it.src)}</p>`; });
    $("#lb-count").textContent = n > 1 ? `${String(state.i + 1).padStart(2, "0")} / ${String(n).padStart(2, "0")}` : "";
    $$("[data-lb-prev],[data-lb-next]", lb).forEach((b) => (b.hidden = n < 2));
  }
  function openLightbox({ items, index = 0, title = "", kicker = "", info = "", link = "" }) {
    ensureLightbox();
    state = { items, i: index };
    $("#lb-title").textContent = title;
    $("#lb-kicker").textContent = kicker;
    $("#lb-info").textContent = info;
    const a = $("#lb-link"); a.hidden = !link; if (link) a.href = link;
    show(index);
    lb.showModal();
  }
  window.openLightbox = openLightbox;

  // Galeries statiques : <div data-gallery="Titre"> … <div class="media" data-src="…"> <img> </div>
  function bindGallery(g) {
    const tiles = $$(".media", g);
    const items = tiles.map((t) => ({ type: "image", src: $("img", t) ? $("img", t).getAttribute("src") : "", alt: t.getAttribute("aria-label") || "" }));
    tiles.forEach((t, i) => {
      t.tabIndex = 0; t.setAttribute("role", "button");
      const open = () => { if (!$("img", t)) return; openLightbox({ items: items.filter((x, k) => $("img", tiles[k])), index: tiles.slice(0, i).filter((x) => $("img", x)).length, title: g.dataset.gallery, kicker: "PHOTOS" }); };
      t.addEventListener("click", open);
      t.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
    });
  }
  $$("[data-gallery]").forEach(bindGallery);

  /* ---------- Reels / vidéos verticales : fichier local OU lien Instagram ---------- */
  // lien de reel ou de post Instagram → adresse d'intégration officielle
  function igEmbed(url) {
    const m = String(url || "").match(/instagram\.com\/(?:[\w.]+\/)?(reel|reels|p|tv)\/([\w-]+)/i);
    return m ? `https://www.instagram.com/${m[1].toLowerCase() === "p" ? "p" : "reel"}/${m[2]}/embed/` : "";
  }
  window.igEmbed = igEmbed;
  // r = { fichier, titre, duree, instagram?, vignette? } — base = dossier des fichiers
  function reelCard(r, base, attr) {
    const thumb = r.vignette || (r.fichier ? `${base}${r.fichier}.jpg` : "");
    const preview = r.instagram ? "" : r.src ? r.src : r.fichier ? `${base}${r.fichier}${r.apercu ? "-apercu" : ""}.mp4` : "";
    return `
        <button type="button" class="pcard" ${attr}>
          <div class="media media--9x16" data-preview>
            ${thumb ? `<img src="${esc(thumb)}" alt="" loading="lazy">` : ""}
            ${preview ? `<video src="${esc(preview)}" muted loop playsinline preload="none"></video>` : ""}
            <div class="overlay"><div style="display:flex;gap:6px;flex-wrap:wrap">${r.instagram ? `<span class="tag tag--dark reel-ig">${icon("instagram")}Reel</span>` : ""}${r.duree ? `<span class="tag tag--dark">${esc(r.duree)}</span>` : ""}</div>
              <div style="display:flex;align-items:center;gap:10px"><span class="play play--sm" style="width:36px;height:36px">${icon("play")}</span><strong style="font-size:14px;font-weight:500">${esc(r.titre || "")}</strong></div></div>
          </div>
        </button>`;
  }
  function openReel(r, base, kicker) {
    const ig = r.instagram && igEmbed(r.instagram);
    openLightbox({
      items: [ig ? { type: "embed", src: ig } : { type: "video", src: r.src || `${base}${r.fichier}.mp4`, poster: r.vignette || (r.fichier ? `${base}${r.fichier}.jpg` : "") }],
      title: r.titre || "", kicker, link: "", info: r.instagram ? "Vidéo publiée sur Instagram" : ""
    });
  }

  /* ---------- Filtres ---------- */
  function bindFilters(bar, cards, onChange) {
    if (!bar) return;
    bar.addEventListener("click", (e) => {
      const b = e.target.closest(".filter"); if (!b) return;
      $$(".filter", bar).forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      const f = b.dataset.filter;
      $$(".pcard", cards).forEach((c) => { c.hidden = !(f === "tous" || (f === "recent" ? c.dataset.recent === "1" : (c.dataset.cat || "").split(" ").includes(f))); });
      if (onChange) onChange(f);
    });
  }
  const slug = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-");
  function filterButtons(bar, cats, withRecent) {
    const list = [["tous", "Tous"]].concat(withRecent ? [["recent", "Activités récentes"]] : [], cats.map((c) => [slug(c), c]));
    bar.innerHTML = list.map(([k, l], i) => `<button type="button" class="filter" data-filter="${k}" aria-pressed="${i === 0}">${esc(l)}</button>`).join("");
  }

  /* ---------- Projets ajoutés avec l'admin (assets/js/projets.js) ---------- */
  const PROJ = (window.MX_PROJETS || []).slice().sort((a, b) => b.date.localeCompare(a.date));
  const RECENTS = new Set(PROJ.slice(0, 3).map((p) => p.slug));
  const TYPE_LABEL = { photo: "Photo", video: "Vidéo", motion: "Motion design", "3d": "3D" };
  // anciens projets : "type" unique → liste "types"
  const typesOf = (p) => (Array.isArray(p.types) && p.types.length ? p.types : p.type === "mixte" ? ["photo", "video"] : [p.type || "photo"]);
  const tLabel = (p) => typesOf(p).map((k) => TYPE_LABEL[k] || k).join(" · ");
  // placement selon les fichiers : images → Photos, vidéos (ou lien YouTube/Vimeo) → Vidéos
  // une image "présentation uniquement" ne fait pas apparaître le projet dans Réalisations Photos
  const hasPhoto = (p) => p.medias.some((m) => m.genre === "photo" && !m.cache);
  const hasVideo = (p) => p.medias.some((m) => m.genre === "video") || !!p.embed;
  // filtres : chaque type + la catégorie
  const pCats = (p) => typesOf(p).map((k) => TYPE_LABEL[k] || k).concat(p.categorie ? [p.categorie] : []);
  const pCatSlugs = (p) => [...new Set(pCats(p).map((c) => slug(c)))].join(" ");
  const pSrc = (p, nom) => `assets/projets/${p.slug}/${nom}`;
  const pHref = (p) => `projets/${p.slug}.html`;
  const pDate = (d) => new Date(d + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const pCount = (p, g) => p.medias.filter((m) => m.genre === g && !m.cache).length;
  const pDuree = (p) => (p.medias.find((m) => m.genre === "video" && m.duree) || {}).duree || "";
  const pCover = (p) => (p.couverture ? `<img src="${esc(pSrc(p, p.couverture))}" alt="" loading="lazy">` : "");

  // Accueil : les 3 projets les plus récents remplacent les cartes d'exemple
  $$("[data-recent-slot]").forEach((slot, i) => {
    const p = PROJ[i]; if (!p) return;
    slot.outerHTML = `
      <a class="card activity" href="${pHref(p)}">
        <div class="media">${pCover(p)}${hasVideo(p) && !hasPhoto(p) ? `<span class="play">${icon("play")}</span>` : ""}</div>
        <div class="activity__txt"><span class="tag">${esc(tLabel(p))}</span><h3 class="heading-s">${esc(p.titre)}</h3><p class="muted">${esc(pDate(p.date))} · ${esc(p.role)}</p></div>
      </a>`;
  });

  /* ---------- Page Réalisations Photos ---------- */
  const photoGrid = $("#photo-cards");
  if (photoGrid && MX.photos) {
    const base = "assets/images/photos/";
    const mine = PROJ.filter(hasPhoto);
    // dès qu'un projet a été ajouté avec l'admin, "récent" = les 3 plus récents par date
    const isRecentStatic = (p) => !PROJ.length && p.recent;
    const cats = [...new Set(mine.flatMap(pCats).concat(MX.photos.map((p) => p.categorie)))];
    filterButtons($("#photo-filters"), cats, true);
    const nImages = mine.reduce((a, p) => a + pCount(p, "photo"), 0) + MX.photos.reduce((a, p) => a + (p.nbPhotos || 0), 0);
    $("#photo-count").textContent = `${mine.length + MX.photos.length} PROJETS · ${nImages} IMAGES`;
    photoGrid.innerHTML = mine.map((p) => `
      <a class="pcard" href="${pHref(p)}" data-cat="${pCatSlugs(p)}" data-recent="${RECENTS.has(p.slug) ? 1 : 0}">
        <div class="media media--4x3">${pCover(p)}
          <div class="overlay"><div style="display:flex;gap:6px">${RECENTS.has(p.slug) ? '<span class="tag tag--accent">Récent</span>' : ""}<span class="tag tag--dark">${pCount(p, "photo")} photos</span></div></div>
        </div>
        <div class="pcard__meta"><div class="grow"><h3 class="heading-s">${esc(p.titre)}</h3><p class="muted">${esc(p.categorie || tLabel(p))} · ${esc(pDate(p.date))}</p></div>${icon("arrow-up-right")}</div>
      </a>`).join("") + MX.photos.map((p, i) => `
      <button type="button" class="pcard" data-i="${i}" data-cat="${slug(p.categorie)}" data-recent="${isRecentStatic(p) ? 1 : 0}">
        <div class="media media--4x3">
          <img src="${base}${esc(p.dossier)}/cover.jpg" alt="" loading="lazy">
          <div class="overlay"><div style="display:flex;gap:6px">${isRecentStatic(p) ? '<span class="tag tag--accent">Récent</span>' : ""}<span class="tag tag--dark">${p.nbPhotos} photos</span></div></div>
        </div>
        <div class="pcard__meta"><div class="grow"><h3 class="heading-s">${esc(p.titre)}</h3><p class="muted">${esc(p.categorie)}</p></div>${icon("arrow-up-right")}</div>
      </button>`).join("");
    bindFilters($("#photo-filters"), photoGrid);
    photoGrid.addEventListener("click", (e) => {
      const c = e.target.closest("button.pcard"); if (!c) return;
      const p = MX.photos[c.dataset.i];
      const items = Array.from({ length: p.nbPhotos || 1 }, (_, k) => ({ type: "image", src: `${base}${p.dossier}/${String(k + 1).padStart(2, "0")}.jpg`, alt: `${p.titre} — photo ${k + 1}` }));
      openLightbox({ items, title: p.titre, kicker: p.categorie.toUpperCase() });
    });
    // lien direct : photos.html#activite-2
    const h = decodeURIComponent(location.hash.slice(1));
    if (h === "recent") { const b = $('.filter[data-filter="recent"]'); if (b) b.click(); }
    const idx = MX.photos.findIndex((p) => p.dossier === h);
    if (idx >= 0) $(`.pcard[data-i="${idx}"]`, photoGrid).click();
  }

  /* ---------- Page Réalisations Vidéos ---------- */
  const videoGrid = $("#video-cards");
  if (videoGrid && MX.videos) {
    const base = "assets/videos/projets/";
    const mine = PROJ.filter(hasVideo);
    const open = (v) => openLightbox({
      items: [v.embed ? { type: "embed", src: v.embed } : { type: "video", src: `${base}${v.dossier}/video.mp4`, poster: `${base}${v.dossier}/poster.jpg` }],
      title: v.titre, kicker: `${v.categorie} · ${v.duree}`.toUpperCase(), info: v.role, link: v.page || ""
    });
    const thumb = (v, cls, inner) => `
      <div class="media ${cls}" data-preview>
        <img src="${base}${esc(v.dossier)}/poster.jpg" alt="" loading="lazy">
        <video src="${base}${esc(v.dossier)}/apercu.mp4" muted loop playsinline preload="none"></video>
        <div class="overlay">${inner}</div>
      </div>`;
    const mThumb = (p, cls, inner, style = "") => `<div class="media ${cls}"${style}>${pCover(p)}<div class="overlay">${inner}</div></div>`;
    const cats = [...new Set(mine.flatMap(pCats).concat(MX.videos.map((v) => v.categorie)))];
    filterButtons($("#video-filters"), cats, false);
    $("#video-count").textContent = `${mine.length + MX.videos.length} PROJETS`;
    videoGrid.innerHTML = mine.map((p) => `
      <a class="pcard" href="${pHref(p)}" data-cat="${pCatSlugs(p)}">
        ${mThumb(p, "media--16x9", `<div style="display:flex;gap:6px">${RECENTS.has(p.slug) ? '<span class="tag tag--accent">Récent</span>' : ""}<span class="tag tag--dark">${esc(p.categorie || tLabel(p))}</span></div><div style="display:flex;justify-content:space-between;align-items:center"><span class="play play--sm">${icon("play")}</span>${pDuree(p) ? `<span class="tag tag--dark">${esc(pDuree(p))}</span>` : ""}</div>`)}
        <div class="pcard__meta"><div class="grow"><h3 class="heading-s">${esc(p.titre)}</h3><p class="muted">${esc(p.role)}</p></div>${icon("arrow-up-right")}</div>
      </a>`).join("") + MX.videos.map((v, i) => `
      <button type="button" class="pcard" data-i="${i}" data-cat="${slug(v.categorie)}">
        ${thumb(v, "media--16x9", `<div><span class="tag tag--dark">${esc(v.categorie)}</span></div><div style="display:flex;justify-content:space-between;align-items:center"><span class="play play--sm">${icon("play")}</span><span class="tag tag--dark">${esc(v.duree)}</span></div>`)}
        <div class="pcard__meta"><div class="grow"><h3 class="heading-s">${esc(v.titre)}</h3><p class="muted">${esc(v.role)}</p></div>${icon("arrow-up-right")}</div>
      </button>`).join("");
    bindFilters($("#video-filters"), videoGrid, (f) => { const s = $("#featured"); if (s) s.hidden = f !== "tous"; });
    videoGrid.addEventListener("click", (e) => { const c = e.target.closest("button.pcard"); if (c) open(MX.videos[c.dataset.i]); });

    // À la une : les vidéos ajoutées avec l'admin (les plus récentes) passent en premier
    const feat = $("#featured-grid");
    const bigInner = (tag, duree, titre, role) => `
          <div style="display:flex;gap:6px"><span class="tag tag--accent">${esc(tag)}</span>${duree ? `<span class="tag tag--dark">${esc(duree)}</span>` : ""}</div>
          <div style="display:flex;align-items:flex-end;gap:20px;padding:8px"><div class="grow"><h3 class="display-l">${esc(titre)}</h3><p class="muted">${esc(role)}</p></div><span class="play play--lg" style="width:72px;height:72px">${icon("play")}</span></div>`;
    const sideInner = (tag, duree, titre, link) => `
            <div style="display:flex;gap:6px"><span class="tag tag--accent">${esc(tag)}</span>${duree ? `<span class="tag tag--dark">${esc(duree)}</span>` : ""}</div>
            <div style="display:flex;justify-content:space-between;align-items:center"><h3 class="heading-s">${esc(titre)}</h3>${link ? '<span class="muted" style="font-size:14px;font-weight:500">Voir le projet ↗</span>' : ""}</div>`;
    const staticPhare = MX.videos.find((v) => v.phare) || MX.videos[0];
    const staticSide = MX.videos.filter((v) => v.alaune && v !== staticPhare);
    const feats = mine.slice(0, 3).map((p) => ({ p })).concat([staticPhare].concat(staticSide).filter(Boolean).map((v) => ({ v }))).slice(0, 3);
    const fullH = ' style="height:100%;min-height:200px"';
    const render = (f, big) => f.p
      ? `<a class="pcard${big ? " big" : ""}" href="${pHref(f.p)}"${big ? "" : ' style="height:100%"'}>${mThumb(f.p, big ? "big" : "", big ? bigInner(f.p.categorie || tLabel(f.p), pDuree(f.p), f.p.titre, f.p.role) : sideInner(RECENTS.has(f.p.slug) ? "Récent" : f.p.categorie || tLabel(f.p), pDuree(f.p), f.p.titre, true), big ? "" : fullH)}</a>`
      : `<button type="button" class="pcard${big ? " big" : ""}" data-v="${MX.videos.indexOf(f.v)}"${big ? "" : ' style="height:100%"'}>${thumb(f.v, big ? "big" : "", big ? bigInner(f.v.categorie, f.v.duree, f.v.titre, f.v.role) : sideInner(f.v.recent && !PROJ.length ? "Récent" : f.v.categorie, f.v.duree, f.v.titre, !!f.v.page)).replace('class="media "', 'class="media"' + fullH)}</button>`;
    if (feat && feats.length) {
      feat.innerHTML = render(feats[0], true) + `<div class="stack">${feats.slice(1).map((f) => render(f, false)).join("")}</div>`;
      feat.addEventListener("click", (e) => { const c = e.target.closest("[data-v]"); if (c) open(MX.videos[c.dataset.v]); });
    }

    // Reels 9:16
    const reels = $("#reels");
    if (reels && MX.reels) {
      reels.innerHTML = MX.reels.map((r, i) => reelCard({ ...r, apercu: false }, "assets/videos/reels/", `data-r="${i}"`)).join("");
      reels.addEventListener("click", (e) => {
        const c = e.target.closest("[data-r]"); if (!c) return; const r = MX.reels[c.dataset.r];
        openReel(r, "assets/videos/reels/", `FORMAT VERTICAL${r.duree ? " · " + r.duree : ""}`);
      });
    }
  }

  /* ---------- Page Simplicicar ---------- */
  const SC = MX.simplicicar || {};
  const scTrack = $("#simpl-track");
  // vidéos ajoutées dans l'admin (onglet Simplicicar) en priorité, sinon la liste de data.js
  const scVideos = (window.MX_SC_VIDEOS && window.MX_SC_VIDEOS.length) ? window.MX_SC_VIDEOS : SC.videos;
  if (scTrack && scVideos) {
    const base = "assets/videos/simplicicar/";
    scTrack.innerHTML = scVideos.map((v, i) => reelCard({ ...v, apercu: !v.src }, base, `data-sv="${i}"`)).join("");
    scTrack.addEventListener("click", (e) => { const c = e.target.closest("[data-sv]"); if (c) openReel(scVideos[c.dataset.sv], base, "SIMPLICICAR TROYES"); });
  }
  const carsBox = $("#cars");
  if (carsBox && SC.voitures && SC.voitures.length) {
    const cars = SC.voitures;
    let cur = 0;
    const two = (n) => String(n).padStart(2, "0");
    const src = (c, k) => `assets/images/simplicicar/voitures/${c.dossier}/${two(k)}.jpg`;
    const tile = (c, k, cls = "", style = "") => `<div class="media ${cls}"${style} aria-label="${esc(c.nom)} — photo ${k}"><img src="${src(c, k)}" alt="${esc(c.nom)} — photo ${k}" loading="${k < 4 ? "eager" : "lazy"}"></div>`;
    const prev = $("[data-car=prev]", carsBox), next = $("[data-car=next]", carsBox);
    function renderCar() {
      const c = cars[cur], n = Math.max(1, c.photos || 1);
      $("#car-count").textContent = `VÉHICULE ${two(cur + 1)} / ${two(cars.length)}`;
      $("#car-bar").innerHTML = `
        <div class="car__id"><span class="mono accent">${esc(c.marque || "Simplicicar Troyes")}</span><h3 class="display-l">${esc(c.nom)}</h3>${c.detail ? `<p class="muted">${esc(c.detail)}</p>` : ""}</div>
        <div class="car__price"><span class="mono muted">${c.prix ? "Prix" : "Tarif"}</span><strong>${esc(c.prix || "Prix sur demande")}</strong></div>`;
      const rest = [];
      for (let k = 4; k <= n; k++) rest.push(tile(c, k, "media--4x3"));
      const g = $("#car-gallery");
      g.innerHTML = `<div data-gallery="${esc(c.nom)}" class="car-in">
          <div class="cars">${tile(c, 1, "car__main")}${n > 1 ? `<div class="stack">${tile(c, 2)}${n > 2 ? tile(c, 3) : ""}</div>` : ""}</div>
          ${rest.length ? `<div class="cars-row">${rest.join("")}</div>` : ""}
        </div>`;
      bindGallery($("[data-gallery]", g));
      sweepMissing();
      const single = cars.length < 2;
      [prev, next].forEach((b) => { b.disabled = single; b.title = single ? "Ajoute d'autres véhicules dans assets/js/data.js" : ""; });
    }
    const go = (d) => { if (cars.length < 2) return; cur = (cur + d + cars.length) % cars.length; renderCar(); resetTimer(); };
    prev.addEventListener("click", () => go(-1));
    next.addEventListener("click", () => go(1));
    carsBox.addEventListener("keydown", (e) => { if (e.target.closest(".lightbox")) return; if (e.key === "ArrowLeft") go(-1); if (e.key === "ArrowRight") go(1); });

    /* Défilement automatique toutes les 4,5 s.
       La barre se FIGE (et reprend là où elle en était) quand :
       la souris est sur une photo ou une flèche, une photo est ouverte en grand,
       le focus clavier est dans la section, l'onglet est masqué, la section est hors écran,
       le bouton pause est actif, ou « animations réduites » est activé dans le système.
       Sur les espaces vides de la section, elle continue d'avancer. */
    const DELAY = 4500;
    const PHOTO_ZONE = "#car-gallery .media, .car__nav";
    const toggle = $("[data-car=auto]", carsBox);
    let timer = null, remaining = DELAY, startedAt = 0, running = false;
    let userPaused = reduceMotion, overPhoto = false, kbFocus = false, visible = true;
    const blocked = () => userPaused || overPhoto || kbFocus || !visible || document.hidden || !!document.querySelector("dialog.lightbox[open]");
    function freeze() {
      if (running) { remaining = Math.max(0, remaining - (performance.now() - startedAt)); running = false; }
      clearTimeout(timer);
      carsBox.classList.add("is-paused");
    }
    function update() {
      if (cars.length < 2) return;
      if (blocked()) { freeze(); return; }
      if (running) return;
      carsBox.classList.remove("is-paused");
      carsBox.classList.add("is-running");
      running = true; startedAt = performance.now();
      timer = setTimeout(() => go(1), remaining);
    }
    function resetTimer() {
      clearTimeout(timer); running = false; remaining = DELAY;
      carsBox.classList.remove("is-running");
      void carsBox.offsetWidth; // relance la barre à zéro
      carsBox.classList.add("is-running");
      update();
    }
    function paintToggle() {
      if (!toggle) return;
      toggle.hidden = cars.length < 2;
      toggle.innerHTML = icon(userPaused ? "play" : "pause");
      toggle.setAttribute("aria-label", userPaused ? "Reprendre le défilement automatique" : "Mettre en pause le défilement automatique");
      toggle.title = userPaused ? "Reprendre le défilement" : "Pause";
    }
    if (toggle) toggle.addEventListener("click", () => { userPaused = !userPaused; paintToggle(); update(); });
    carsBox.style.setProperty("--car-delay", DELAY + "ms");
    // survol : seulement les photos (et les flèches posées dessus), pas les espaces vides
    carsBox.addEventListener("pointerover", (e) => { const o = !!e.target.closest(PHOTO_ZONE); if (o !== overPhoto) { overPhoto = o; update(); } });
    carsBox.addEventListener("pointerleave", () => { if (overPhoto) { overPhoto = false; update(); } });
    // focus au clavier (Tab) : pause ; un simple clic de souris ne met pas en pause
    carsBox.addEventListener("focusin", (e) => { kbFocus = e.target.matches(":focus-visible"); update(); });
    carsBox.addEventListener("focusout", (e) => { if (!carsBox.contains(e.relatedTarget)) { kbFocus = false; update(); } });
    document.addEventListener("visibilitychange", update);
    document.addEventListener("close", update, true); // fermeture de la photo en grand
    document.addEventListener("click", () => setTimeout(update, 0)); // ouverture de la photo en grand
    // "visible" = la section touche la bande centrale de l'écran (fonctionne même si elle est plus haute que l'écran)
    if ("IntersectionObserver" in window) new IntersectionObserver(([e]) => { visible = e.isIntersecting; update(); }, { rootMargin: "-25% 0px -25% 0px" }).observe(carsBox);

    renderCar();
    paintToggle();
    resetTimer();
  }

  /* ---------- Lecteurs : une vidéo qui n'est pas en 16:9 garde son format ---------- */
  $$(".player video").forEach((v) => {
    const fit = () => {
      const w = v.videoWidth, h = v.videoHeight, box = v.parentElement;
      if (!w || !h || Math.abs(w / h - 16 / 9) < 0.03 || box.classList.contains("player--native")) return;
      box.classList.remove("media--16x9");
      box.classList.add("player--native");
      box.style.aspectRatio = `${w} / ${h}`;
      box.style.setProperty("--r", (w / h).toFixed(4));
    };
    if (v.readyState >= 1) fit(); else v.addEventListener("loadedmetadata", fit, { once: true });
  });

  /* ---------- Vidéos à ouvrir en lightbox (data-play) ---------- */
  $$("[data-play]").forEach((el) => {
    el.addEventListener("click", () => openLightbox({ items: [el.dataset.embed ? { type: "embed", src: el.dataset.embed } : { type: "video", src: el.dataset.play, poster: el.dataset.poster }], title: el.dataset.title || "", kicker: el.dataset.kicker || "" }));
  });

  /* ---------- Showreel (lecture auto sans son) ---------- */
  const reel = $("#showreel-video");
  if (reel) {
    if (!reduceMotion) reel.play().catch(() => {});
    const snd = $("#showreel-sound");
    if (snd) snd.addEventListener("click", () => {
      reel.muted = !reel.muted;
      if (!reel.muted) reel.play().catch(() => {});
      snd.querySelector("span").textContent = reel.muted ? "Activer le son" : "Couper le son";
    });
  }

  /* ---------- Formulaire « Parlons de votre projet » ---------- */
  const form = $("#contact-form");
  if (form) {
    const boxes = $$('input[name="prestations"]', form);
    const count = $("#presta-count"), summary = $("#presta-summary");
    const update = () => {
      const sel = boxes.filter((b) => b.checked).map((b) => b.value);
      count.textContent = `${sel.length} SÉLECTIONNÉE${sel.length > 1 ? "S" : ""}`;
      summary.textContent = sel.length ? "Votre sélection : " + sel.join(" + ") : "Sélectionnez une ou plusieurs prestations.";
    };
    boxes.forEach((b) => b.addEventListener("change", update)); update();

    const email = $("#f-email"), tel = $("#f-tel"), err = $("#contact-error"), prestaErr = $("#presta-error");
    const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    const telOk = (v) => v.replace(/[^\d+]/g, "").length >= 10;
    const checkContact = () => {
      const e = email.value.trim(), t = tel.value.trim();
      let msg = "";
      if (!e && !t) msg = "Indiquez un e-mail ou un numéro de téléphone pour que je puisse vous répondre.";
      else if (e && !emailOk(e)) msg = "L'adresse e-mail semble incomplète — vérifiez le @ et le domaine.";
      else if (t && !telOk(t)) msg = "Le numéro semble incomplet — 10 chiffres attendus.";
      err.textContent = msg;
      email.closest(".field").setAttribute("aria-invalid", String(!!msg && (!!e || !t)));
      tel.closest(".field").setAttribute("aria-invalid", String(!!msg && (!!t || !e)));
      return !msg;
    };
    [email, tel].forEach((i) => {
      i.addEventListener("blur", () => { if (email.value || tel.value) checkContact(); });
      i.addEventListener("input", () => { if (err.textContent) checkContact(); });
    });
    boxes.forEach((b) => b.addEventListener("change", () => (prestaErr.textContent = "")));

    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const sel = boxes.filter((b) => b.checked).map((b) => b.value);
      prestaErr.textContent = sel.length ? "" : "Choisissez au moins une prestation.";
      const okContact = checkContact();
      if (!sel.length) { boxes[0].focus(); return; }
      if (!okContact) { (email.value ? email : tel).focus(); return; }
      const d = new FormData(form);
      const body = [
        `Prestations : ${sel.join(", ")}`,
        `Nom : ${d.get("nom") || "-"}`,
        `E-mail : ${d.get("email") || "-"}`,
        `Téléphone : ${d.get("telephone") || "-"}`,
        `Date souhaitée : ${d.get("date") || "-"}`,
        `Lieu : ${d.get("lieu") || "-"}`,
        "", d.get("message") || ""
      ].join("\n");
      const to = (MX.contact && MX.contact.email) || "";
      window.location.href = `mailto:${to}?subject=${encodeURIComponent("Demande de devis — " + sel.join(" + "))}&body=${encodeURIComponent(body)}`;
      $("#contact-ok").hidden = false;
    });
  }

  paintIcons();
  paintLinks();
  bindPreviews();
  sweepMissing();
  window.addEventListener("load", sweepMissing);
})();

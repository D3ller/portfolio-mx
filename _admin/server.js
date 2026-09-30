/* =========================================================
   MX Flash — serveur local de l'admin
   Lance :  node _admin/server.js   (ou double-clic sur LANCER-ADMIN.bat)
   - sert le site sur http://localhost:4321
   - l'admin est sur http://localhost:4321/_admin/
   - enregistre les médias dans assets/projets/<slug>/
   - génère une page par projet dans projets/<slug>.html
   - régénère assets/js/projets.js (lu par l'accueil, Photos et Vidéos)
   N'écoute que sur ta machine (127.0.0.1).
   ========================================================= */
"use strict";
const http = require("http");
const fs = require("fs");
const fsp = fs.promises;
const path = require("path");
const { exec } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const PORT = Number(process.env.PORT) || 4321;
const DATA_JSON = path.join(ROOT, "assets", "data", "projets.json");
const DATA_JS = path.join(ROOT, "assets", "js", "projets.js");
const MEDIA_DIR = path.join(ROOT, "assets", "projets");
// Vidéos de la page Simplicicar (gérées dans l'onglet « Simplicicar » de l'admin)
const SC_JSON = path.join(ROOT, "assets", "data", "simplicicar.json");
const SC_JS = path.join(ROOT, "assets", "js", "simplicicar.js");
const SC_DIR = path.join(ROOT, "assets", "videos", "simplicicar");
const PAGES_DIR = path.join(ROOT, "projets");

const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".md": "text/plain; charset=utf-8", ".txt": "text/plain; charset=utf-8",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif", ".svg": "image/svg+xml", ".ico": "image/x-icon",
  ".mp4": "video/mp4", ".m4v": "video/mp4", ".webm": "video/webm", ".mov": "video/quicktime", ".pdf": "application/pdf"
};
const UPLOAD_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".mp4", ".m4v", ".webm", ".mov"]);
const TYPES = { photo: "Photo", video: "Vidéo", motion: "Motion design", "3d": "3D" };
// anciens projets : "type" unique (photo / video / mixte) → liste "types"
const typesOf = (p) => (Array.isArray(p.types) && p.types.length ? p.types.filter((k) => TYPES[k]) : p.type === "mixte" ? ["photo", "video"] : TYPES[p.type] ? [p.type] : ["photo"]);
const typesLabel = (p) => typesOf(p).map((k) => TYPES[k]).join(" · ");

/* Logos : mêmes fichiers que presentation.html */
const LOGICIELS = {
  "DaVinci Resolve Studio": { img: "davinci-resolve.png", ab: "Dr", bg: "#1b1b1b", fg: "#f2f2f0", d: "Étalonnage · Montage" },
  "Premiere Pro": { img: "premiere-pro.png", ab: "Pr", bg: "#00005b", fg: "#9999ff", d: "Montage" },
  "After Effects": { img: "after-effect.svg.webp", ab: "Ae", bg: "#00005b", fg: "#d291ff", d: "Motion design" },
  "Lightroom": { img: "lightroom.png", ab: "Lr", bg: "#001e36", fg: "#31a8ff", d: "Développement photo" },
  "Photoshop": { img: "photoshop.svg.webp", ab: "Ps", bg: "#001e36", fg: "#31a8ff", d: "Retouche" },
  "Illustrator": { img: "illustrator.svg", ab: "Ai", bg: "#330000", fg: "#ff9a00", d: "Vectoriel" },
  "Blender": { img: "blender.svg", ab: "Bl", bg: "#1b1b1b", fg: "#e87d0d", d: "3D" }
};

/* ---------- utilitaires ---------- */
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const slugify = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
  .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "projet";
const isSlug = (s) => typeof s === "string" && /^[a-z0-9][a-z0-9-]{0,80}$/.test(s);
const isName = (s) => typeof s === "string" && /^[a-z0-9][a-z0-9._-]{0,120}$/.test(s) && !s.includes("..");
const str = (v, max) => String(v == null ? "" : v).trim().slice(0, max);
const dateFr = (d) => new Date(d + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
const within = (base, p) => { const r = path.relative(base, p); return r && !r.startsWith("..") && !path.isAbsolute(r); };

function normIg(v) {
  v = str(v, 120);
  const m = v.match(/instagram\.com\/([A-Za-z0-9._]{1,30})/i);
  const h = (m ? m[1] : v.replace(/^@/, "")).trim();
  return /^[A-Za-z0-9._]{1,30}$/.test(h) ? h : "";
}
function normUrl(v) {
  v = str(v, 500);
  if (!v) return "";
  if (!/^https?:\/\//i.test(v)) v = "https://" + v;
  try { const u = new URL(v); return /^https?:$/.test(u.protocol) && u.hostname.includes(".") ? u.href : ""; } catch { return ""; }
}

function toEmbed(url) {
  url = str(url, 300);
  if (!url) return "";
  let m;
  if ((m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/))) return "https://www.youtube.com/embed/" + m[1];
  if ((m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/))) return "https://player.vimeo.com/video/" + m[1];
  if ((m = url.match(/instagram\.com\/(?:[\w.]+\/)?(reel|reels|p|tv)\/([\w-]+)/i))) return `https://www.instagram.com/${m[1].toLowerCase() === "p" ? "p" : "reel"}/${m[2]}/embed/`;
  return /^https:\/\//.test(url) ? url : "";
}

function send(res, code, body) {
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(body));
}
function readJson(req, limit = 2e6) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on("data", (c) => { size += c.length; if (size > limit) { reject(new Error("Requête trop volumineuse")); req.destroy(); } else chunks.push(c); });
    req.on("end", () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}")); } catch { reject(new Error("JSON invalide")); } });
    req.on("error", reject);
  });
}

/* ---------- données ---------- */
async function load() {
  try { return JSON.parse(await fsp.readFile(DATA_JSON, "utf8")); } catch { return []; }
}
const byDate = (a, b) => b.date.localeCompare(a.date) || a.titre.localeCompare(b.titre, "fr");
async function save(list) {
  // migration : "type" → "types"
  for (const p of list) { p.types = typesOf(p); delete p.type; }
  list.sort(byDate);
  await fsp.mkdir(path.dirname(DATA_JSON), { recursive: true });
  await fsp.writeFile(DATA_JSON, JSON.stringify(list, null, 2));
  await fsp.writeFile(DATA_JS,
    "/* Généré automatiquement par l'admin (_admin/server.js) — ne pas modifier à la main. */\n" +
    "window.MX_PROJETS = " + JSON.stringify(list, null, 2) + ";\n");
  await regenerate(list);
}

/* ---------- génération des pages ---------- */
function logoHtml(nom) {
  const l = LOGICIELS[nom];
  const ab = l ? l.ab : nom.split(/\s+/).map((w) => w[0]).join("").slice(0, 2);
  const bg = l ? l.bg : "#1c1c1c", fg = l ? l.fg : "#f2f2f0";
  return `<div class="soft__logo" style="background:${bg};border:1.5px solid ${fg}">${l ? `<img src="../assets/images/logiciels/${esc(l.img)}" alt="">` : ""}<span style="color:${fg}">${esc(ab)}</span></div>`;
}

/* Vidéo en 16:9 → pleine largeur ; sinon (1:1, 9:16, 4:5…) → format d origine, sans recadrage */
function playerAttrs(v) {
  const r = v.w && v.h ? v.w / v.h : 16 / 9;
  if (Math.abs(r - 16 / 9) < 0.03) return `class="media media--16x9 player"`;
  return `class="media player player--native" style="aspect-ratio:${v.w} / ${v.h};--r:${r.toFixed(4)}"`;
}

function creditsHtml(p) {
  const people = p.personnes || [], links = p.liens || [];
  if (!people.length && !links.length) return "";
  const person = (x) => {
    const initial = esc((x.nom || x.instagram || "?").replace(/^[^A-Za-zÀ-ÿ0-9]+/, "").charAt(0).toUpperCase());
    const inner = `<span class="person__avatar">${initial}</span><span class="person__txt"><strong>${esc(x.nom || "@" + x.instagram)}</strong>${!x.nom ? `<span class="person__ig"><span data-icon="instagram"></span>Instagram</span>` : ""}${x.role ? `<span class="muted">${esc(x.role)}</span>` : ""}${x.instagram && x.nom ? `<span class="person__ig"><span data-icon="instagram"></span>@${esc(x.instagram)}</span>` : ""}</span>`;
    return x.instagram
      ? `<a class="card person" href="https://www.instagram.com/${esc(x.instagram)}/" target="_blank" rel="noopener">${inner}</a>`
      : `<div class="card person">${inner}</div>`;
  };
  return `
  <section class="section">
    <div class="section__head"><div><span class="mono accent kicker">Crédits &amp; liens</span><h2 class="heading-m">Autour du projet</h2></div></div>${people.length ? `
    <div class="grid grid-people">
      ${people.map(person).join("\n      ")}
    </div>` : ""}${links.length ? `
    <div class="links">
      ${links.map((l) => `<a class="btn" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(l.texte)} <span data-icon="arrow-up-right"></span></a>`).join("\n      ")}
    </div>` : ""}
  </section>`;
}

function renderPage(p, newer, older) {
  const m = (nom) => `../assets/projets/${p.slug}/${nom}`;
  const photos = p.medias.filter((x) => x.genre === "photo" && !x.cache);
  const videos = p.medias.filter((x) => x.genre === "video");
  const counts = [photos.length && `${photos.length} photo${photos.length > 1 ? "s" : ""}`, (videos.length || p.embed) && `${videos.length + (p.embed ? 1 : 0)} vidéo${videos.length + (p.embed ? 1 : 0) > 1 ? "s" : ""}`].filter(Boolean).join(" · ");
  const paras = p.description.split(/\n\s*\n/).map((t) => `<p class="body-l muted">${esc(t).replace(/\n/g, "<br>")}</p>`).join("\n      ");
  const metaDesc = esc(p.description.replace(/\s+/g, " ").slice(0, 155));
  const og = p.couverture ? `<meta property="og:image" content="${esc(m(p.couverture))}">` : "";

  const videoBlocks = [
    // un reel Instagram s'affiche en vertical, YouTube / Vimeo en 16:9
    p.embed && `<div ${/instagram\.com/.test(p.embed) ? 'class="media player player--native" style="aspect-ratio:9 / 16;--r:0.5625"' : 'class="media media--16x9 player"'}><iframe src="${esc(p.embed)}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="${esc(p.titre)}"></iframe></div>`,
    ...videos.map((v) => `<div ${playerAttrs(v)}><video src="${esc(m(v.nom))}"${v.poster ? ` poster="${esc(m(v.poster))}"` : ""} controls preload="metadata" playsinline></video></div>`)
  ].filter(Boolean);

  const nav = (q, label) => q ? `<a class="pnav" href="${esc(q.slug)}.html"><span class="mono muted">${label}</span><strong class="heading-s">${esc(q.titre)}</strong><span class="muted">${esc(typesLabel(q))} · ${esc(dateFr(q.date))}</span></a>` : "<span></span>";

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(p.titre)} — MX Flash</title>
  <meta name="description" content="${metaDesc}">
  <meta property="og:title" content="${esc(p.titre)} — MX Flash">
  <meta property="og:description" content="${metaDesc}">
  ${og}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Archivo:wght@800;900&family=Geist:wght@400;500&family=Geist+Mono&family=Instrument+Serif:ital@1&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>
<!-- Page générée par l'admin — tes modifications manuelles seront écrasées à la prochaine publication. -->
<header class="nav">
  <a class="btn" href="../index.html"><span data-icon="arrow-left"></span>Retour à l’accueil</a>
  <span class="mono nav__label">MX Flash — ${esc(typesLabel(p))}</span>
  <a class="btn btn--accent" href="../contact.html">Parlons de votre projet</a>
</header>

<main>
  <div class="project-head">
    <span class="mono accent">${esc(typesLabel(p))} · ${esc(dateFr(p.date))}</span>
    <h1 class="display-xl">${esc(p.titre)}</h1>
    <dl class="meta">
      <div><dt class="mono">Date</dt><dd>${esc(dateFr(p.date))}</dd></div>
      <div><dt class="mono">Rôle</dt><dd>${esc(p.role)}</dd></div>
      <div><dt class="mono">Catégorie</dt><dd>${esc(p.categorie || typesLabel(p))}</dd></div>
      <div><dt class="mono">Médias</dt><dd>${esc(counts || "—")}</dd></div>
      <div><dt class="mono">Logiciels</dt><dd>${esc(p.logiciels.join(", ") || "—")}</dd></div>
    </dl>
  </div>
${videoBlocks.length ? `
  <div class="stack-v" style="padding:0 var(--gutter) 24px">
    ${videoBlocks.join("\n    ")}
  </div>` : ""}${photos.length ? `
  <div class="masonry" style="padding:0 var(--gutter) 24px" data-gallery="${esc(p.titre)}">
    ${photos.map((ph, i) => `<div class="media" aria-label="Photo ${i + 1}"><img src="${esc(m(ph.nom))}" alt="${esc(p.titre)} — photo ${i + 1}" loading="${i < 3 ? "eager" : "lazy"}"></div>`).join("\n    ")}
  </div>` : ""}

  <section class="section split">
    <div><span class="mono accent kicker" style="display:block;margin-bottom:12px">Le projet</span><h2 class="display-l">En quelques mots</h2></div>
    <div style="display:flex;flex-direction:column;gap:20px">
      ${paras}
    </div>
  </section>
${creditsHtml(p)}
${p.logiciels.length ? `
  <section class="section">
    <div class="section__head"><div><span class="mono accent kicker">Outils</span><h2 class="heading-m">Logiciels utilisés</h2></div></div>
    <div class="grid grid-auto">
      ${p.logiciels.map((l) => `<div class="card soft">${logoHtml(l)}<div class="soft__txt"><strong>${esc(l)}</strong>${LOGICIELS[l] ? `<p class="muted">${esc(LOGICIELS[l].d)}</p>` : ""}</div></div>`).join("\n      ")}
    </div>
  </section>` : ""}

  <section class="section">
    <div class="pnav-row">${nav(newer, "← Projet plus récent")}${nav(older, "Projet précédent →")}</div>
  </section>
</main>

<div class="band">
  <div class="grow"><span class="mono">Devis gratuit · Réponse sous 48 h</span><h2 class="display-l">Un projet similaire ? Parlons-en.</h2></div>
  <a class="btn btn--lg" href="../contact.html">Demander un devis <span data-icon="arrow-right"></span></a>
</div>
<script src="../assets/js/data.js"></script>
<script src="../assets/js/projets.js"></script>
<script src="../assets/js/main.js"></script>
</body>
</html>
`;
}

async function regenerate(list) {
  await fsp.mkdir(PAGES_DIR, { recursive: true });
  const keep = new Set();
  for (let i = 0; i < list.length; i++) {
    const f = list[i].slug + ".html";
    keep.add(f);
    await fsp.writeFile(path.join(PAGES_DIR, f), renderPage(list[i], list[i - 1], list[i + 1]));
  }
  for (const f of await fsp.readdir(PAGES_DIR)) if (f.endsWith(".html") && !keep.has(f)) await fsp.unlink(path.join(PAGES_DIR, f));
}

/* ---------- API ---------- */
async function api(req, res, u) {
  const route = req.method + " " + u.pathname;

  if (route === "GET /api/projets") return send(res, 200, await load());

  /* ----- Vidéos Simplicicar ----- */
  if (route === "GET /api/simplicicar") {
    try { return send(res, 200, JSON.parse(await fsp.readFile(SC_JSON, "utf8"))); } catch { return send(res, 200, { videos: [] }); }
  }
  if (route === "POST /api/simplicicar") {
    const b = await readJson(req);
    await fsp.mkdir(SC_DIR, { recursive: true });
    const files = new Set(await fsp.readdir(SC_DIR));
    const own = (n) => (isName(n) && files.has(n) ? n : "");
    const videos = (Array.isArray(b.videos) ? b.videos : []).slice(0, 60).map((v) => {
      const ig = toEmbed(v && v.instagram).match(/instagram\.com\/(reel|p)\/([\w-]+)/);
      return {
        titre: str(v && v.titre, 80),
        duree: str(v && v.duree, 8),
        instagram: ig ? `https://www.instagram.com/${ig[1]}/${ig[2]}/` : "",
        fichier: own(v && v.fichier),
        vignette: own(v && v.vignette)
      };
    }).filter((v) => v.instagram || v.fichier);
    const data = { videos };
    await fsp.mkdir(path.dirname(SC_JSON), { recursive: true });
    await fsp.writeFile(SC_JSON, JSON.stringify(data, null, 2));
    // version lue par le site : chemins complets
    const site = videos.map((v) => ({
      titre: v.titre, duree: v.duree, instagram: v.instagram,
      src: v.fichier ? "assets/videos/simplicicar/" + v.fichier : "",
      vignette: v.vignette ? "assets/videos/simplicicar/" + v.vignette : ""
    }));
    await fsp.writeFile(SC_JS, "/* Généré par l'admin (onglet Simplicicar) — ne pas modifier à la main. */\nwindow.MX_SC_VIDEOS = " + JSON.stringify(site, null, 2) + ";\n");
    console.log(`✓ Simplicicar : ${videos.length} vidéo(s) enregistrée(s)`);
    return send(res, 200, { ok: true, videos });
  }

  if (route === "POST /api/projets/nouveau") {
    const b = await readJson(req);
    const date = /^\d{4}-\d{2}-\d{2}$/.test(b.date) ? b.date : new Date().toISOString().slice(0, 10);
    const base = `${date.slice(0, 7)}-${slugify(b.titre)}`;
    const used = new Set((await load()).map((p) => p.slug));
    let slug = base, n = 2;
    while (used.has(slug) || fs.existsSync(path.join(MEDIA_DIR, slug))) slug = `${base}-${n++}`;
    await fsp.mkdir(path.join(MEDIA_DIR, slug), { recursive: true });
    return send(res, 200, { slug });
  }

  if (route === "PUT /api/fichier") {
    const slug = u.searchParams.get("slug");
    const zone = u.searchParams.get("zone");
    let dir;
    if (zone === "simplicicar") { dir = SC_DIR; await fsp.mkdir(dir, { recursive: true }); }
    else {
      dir = path.join(MEDIA_DIR, slug || "");
      if (!isSlug(slug) || !fs.existsSync(dir)) return send(res, 400, { erreur: "Projet inconnu." });
    }
    const raw = u.searchParams.get("nom") || "fichier";
    const ext = path.extname(raw).toLowerCase();
    if (!UPLOAD_EXT.has(ext)) return send(res, 400, { erreur: `Format ${ext || "inconnu"} non accepté (JPG, PNG, WebP, MP4, MOV, WebM).` });
    const base = slugify(path.basename(raw, path.extname(raw)));
    let nom = base + ext, n = 2;
    while (fs.existsSync(path.join(dir, nom))) nom = `${base}-${n++}${ext}`;
    const tmp = path.join(dir, "." + nom + ".part");
    await new Promise((resolve, reject) => {
      const out = fs.createWriteStream(tmp);
      req.pipe(out);
      out.on("finish", resolve);
      out.on("error", reject);
      req.on("error", reject);
    });
    await fsp.rename(tmp, path.join(dir, nom));
    return send(res, 200, { nom });
  }

  if (route === "POST /api/projets") {
    const b = await readJson(req);
    const slug = b.slug;
    const dir = path.join(MEDIA_DIR, slug || "");
    if (!isSlug(slug) || !fs.existsSync(dir)) return send(res, 400, { erreur: "Projet inconnu." });
    const files = new Set(await fsp.readdir(dir));
    const medias = (Array.isArray(b.medias) ? b.medias : [])
      .filter((x) => x && isName(x.nom) && files.has(x.nom) && (x.genre === "photo" || x.genre === "video"))
      .map((x) => ({ nom: x.nom, genre: x.genre, ...(x.genre === "video" && isName(x.poster) && files.has(x.poster) ? { poster: x.poster } : {}), ...(x.duree ? { duree: str(x.duree, 8) } : {}),
        ...(x.genre === "video" && x.w > 0 && x.h > 0 ? { w: Math.round(Number(x.w)) || 0, h: Math.round(Number(x.h)) || 0 } : {}),
        ...(x.genre === "photo" && x.cache === true ? { cache: true } : {}) }));
    const p = {
      slug,
      titre: str(b.titre, 120),
      types: [...new Set((Array.isArray(b.types) ? b.types : []).filter((k) => TYPES[k]))],
      date: /^\d{4}-\d{2}-\d{2}$/.test(b.date) ? b.date : "",
      role: str(b.role, 160),
      categorie: str(b.categorie, 40),
      description: str(b.description, 3000),
      logiciels: (Array.isArray(b.logiciels) ? b.logiciels : []).map((l) => str(l, 40)).filter(Boolean).slice(0, 20),
      embed: toEmbed(b.embed),
      personnes: (Array.isArray(b.personnes) ? b.personnes : [])
        .map((x) => ({ nom: str(x && x.nom, 60), role: str(x && x.role, 60), instagram: normIg(x && x.instagram) }))
        .filter((x) => x.nom || x.instagram).slice(0, 20),
      liens: (Array.isArray(b.liens) ? b.liens : [])
        .map((x) => ({ texte: str(x && x.texte, 60), url: normUrl(x && x.url) }))
        .filter((x) => x.url)
        .map((x) => ({ texte: x.texte || new URL(x.url).hostname.replace(/^www\./, ""), url: x.url })).slice(0, 10),
      medias
    };
    const errs = [];
    if (!p.types.length) errs.push("type (Photo, Vidéo, Motion design ou 3D)");
    if (!p.titre) errs.push("titre");
    if (!p.date) errs.push("date");
    if (!p.role) errs.push("rôle");
    if (!p.description) errs.push("description");
    if (!medias.some((x) => !x.cache) && !p.embed) errs.push("au moins un média affiché sur la page");
    if (errs.length) return send(res, 400, { erreur: "Il manque : " + errs.join(", ") + "." });
    const refs = new Set(medias.flatMap((x) => [x.nom, x.poster].filter(Boolean)));
    const coverOnly = medias.find((x) => x.cache);
    p.couverture = coverOnly ? coverOnly.nom : isName(b.couverture) && refs.has(b.couverture) ? b.couverture
      : (medias.find((x) => x.genre === "photo") || {}).nom || (medias.find((x) => x.poster) || {}).poster || "";
    // fichiers envoyés puis retirés : on nettoie
    for (const f of files) if (!refs.has(f)) await fsp.rm(path.join(dir, f), { force: true });
    const list = (await load()).filter((x) => x.slug !== slug);
    list.push(p);
    await save(list);
    console.log(`✓ Publié : ${p.titre} → projets/${slug}.html`);
    return send(res, 200, { ok: true, projet: p, page: `/projets/${slug}.html` });
  }

  if (route === "DELETE /api/projets") {
    const slug = u.searchParams.get("slug");
    if (!isSlug(slug)) return send(res, 400, { erreur: "Projet inconnu." });
    const list = await load();
    const p = list.find((x) => x.slug === slug);
    await fsp.rm(path.join(MEDIA_DIR, slug), { recursive: true, force: true });
    await save(list.filter((x) => x.slug !== slug));
    if (p) console.log(`✗ Supprimé : ${p.titre}`);
    return send(res, 200, { ok: true });
  }

  return send(res, 404, { erreur: "Route inconnue." });
}

/* ---------- fichiers statiques (avec Range pour les vidéos) ---------- */
async function serveStatic(req, res, u) {
  let rel = decodeURIComponent(u.pathname);
  if (rel.endsWith("/")) rel += "index.html";
  const f = path.join(ROOT, path.normalize(rel));
  if (!within(ROOT, f)) { res.writeHead(403); return res.end(); }
  let st = await fsp.stat(f).catch(() => null);
  if (st && st.isDirectory()) { res.writeHead(301, { Location: u.pathname + "/" }); return res.end(); }
  if (!st) { res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); return res.end("Introuvable"); }
  const type = MIME[path.extname(f).toLowerCase()] || "application/octet-stream";
  const head = { "Content-Type": type, "Accept-Ranges": "bytes", "Cache-Control": "no-store" };
  const range = /bytes=(\d*)-(\d*)/.exec(req.headers.range || "");
  if (range) {
    let start = range[1] ? Number(range[1]) : st.size - Number(range[2]);
    let end = range[1] && range[2] ? Number(range[2]) : st.size - 1;
    end = Math.min(end, st.size - 1);
    if (start < 0 || start > end) { res.writeHead(416, { "Content-Range": `bytes */${st.size}` }); return res.end(); }
    res.writeHead(206, { ...head, "Content-Length": end - start + 1, "Content-Range": `bytes ${start}-${end}/${st.size}` });
    if (req.method === "HEAD") return res.end();
    return fs.createReadStream(f, { start, end }).pipe(res);
  }
  res.writeHead(200, { ...head, "Content-Length": st.size });
  if (req.method === "HEAD") return res.end();
  fs.createReadStream(f).pipe(res);
}

/* ---------- démarrage ---------- */
http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://localhost");
  try {
    if (u.pathname.startsWith("/api/")) return await api(req, res, u);
    if (u.pathname === "/admin" || u.pathname === "/admin/") { res.writeHead(302, { Location: "/_admin/" }); return res.end(); }
    return await serveStatic(req, res, u);
  } catch (e) {
    console.error(e);
    if (!res.headersSent) send(res, 500, { erreur: "Erreur du serveur : " + e.message });
  }
}).listen(PORT, "127.0.0.1", async () => {
  // première exécution : crée projets.js vide pour que le site fonctionne
  if (!fs.existsSync(DATA_JS)) await save(await load());
  const url = `http://localhost:${PORT}/_admin/`;
  console.log("\n  MX Flash — admin prêt");
  console.log("  Admin : " + url);
  console.log("  Site  : http://localhost:" + PORT + "/");
  console.log("  (garde cette fenêtre ouverte ; Ctrl+C pour arrêter)\n");
  if (!process.env.NO_OPEN) {
    const cmd = process.platform === "win32" ? `start "" "${url}"` : process.platform === "darwin" ? `open "${url}"` : `xdg-open "${url}"`;
    exec(cmd, () => {});
  }
});

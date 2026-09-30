/* MX Flash — admin : onglet « Simplicicar » (vidéos réseaux sociaux de la page Simplicicar) */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const IG = /instagram\.com\/(?:[\w.]+\/)?(reel|reels|p|tv)\/([\w-]+)/i;
  const igId = (u) => { const m = String(u || "").match(IG); return m ? m[2] : ""; };
  const igUrl = (u) => { const m = String(u || "").match(IG); return m ? `https://www.instagram.com/${m[1].toLowerCase() === "p" ? "p" : "reel"}/${m[2]}/` : ""; };
  const BASE = "/assets/videos/simplicicar/";

  const panel = $("#sc-panel"), form = $("#form"), done = $("#done");
  const tabs = $$("[data-tab]");
  let rows = [], uid = 0, loaded = false, busy = false, dirty = false, dragRow = null;

  /* ---------- onglets ---------- */
  function showTab(name) {
    tabs.forEach((t) => t.setAttribute("aria-selected", String(t.dataset.tab === name)));
    const sc = name === "simplicicar";
    panel.hidden = !sc;
    $(".side__projects").hidden = sc;
    if (sc) { form.hidden = true; done.hidden = true; if (!loaded) load(); }
    else if (done.hidden) form.hidden = false;
  }
  tabs.forEach((t) => t.addEventListener("click", () => showTab(t.dataset.tab)));
  // les actions « projet » ramènent sur l'onglet Projets
  ["#btn-new", "#done-new"].forEach((s) => { const b = $(s); if (b) b.addEventListener("click", () => showTab("projets"), true); });

  /* ---------- données ---------- */
  async function load() {
    try {
      const r = await fetch("/api/simplicicar");
      const d = await r.json();
      rows = (d.videos || []).map((v) => ({ id: ++uid, titre: v.titre || "", duree: v.duree || "", instagram: v.instagram || "", fichier: v.fichier || "", vignette: v.vignette || "" }));
      loaded = true; render(); msg(rows.length ? "" : "Aucune vidéo pour l’instant : colle tes liens ci-dessus.");
    } catch { msg("Impossible de lire la liste : le serveur de l’admin est-il lancé ?", true); }
  }

  /* ---------- rendu ---------- */
  const thumbOf = (r) => r.vignettePreview || (r.vignette ? BASE + r.vignette : "");
  function render() {
    $("#sc-count").textContent = rows.length ? `${rows.length} vidéo${rows.length > 1 ? "s" : ""}` : "";
    $("#sc-list").innerHTML = rows.map((r, i) => {
      const ok = !r.instagram || igId(r.instagram);
      const t = thumbOf(r);
      return `<li class="sc-row card" data-id="${r.id}" draggable="${!busy}">
        <div class="sc-thumb media media--9x16">${t ? `<img src="${esc(t)}" alt="" draggable="false">` : ""}
          <span class="sc-num tag tag--dark">${i + 1}</span>
          ${r.instagram && igId(r.instagram) ? `<span class="sc-ig" title="Reel Instagram">IG</span>` : ""}</div>
        <div class="sc-fields">
          <div class="field"><label for="sc-l${r.id}">Lien Instagram</label><input id="sc-l${r.id}" data-k="instagram" value="${esc(r.instagram)}" placeholder="https://www.instagram.com/reel/…" autocomplete="off" inputmode="url"><p class="error">${ok ? "" : "Ce lien n’est pas un reel ou une publication Instagram."}</p></div>
          <div class="row">
            <div class="field"><label for="sc-t${r.id}">Titre <span class="opt">facultatif</span></label><input id="sc-t${r.id}" data-k="titre" maxlength="80" value="${esc(r.titre)}" placeholder="Présentation Jaguar F-Type R"></div>
            <div class="field" style="max-width:120px"><label for="sc-d${r.id}">Durée <span class="opt">facult.</span></label><input id="sc-d${r.id}" data-k="duree" maxlength="8" value="${esc(r.duree)}" placeholder="0:32"></div>
          </div>
          <div class="sc-actions">
            <label class="btn btn--add">${r.vignette || r.vignetteFile ? "Changer la vignette" : "Ajouter une vignette"}<input type="file" accept="image/*" data-file="vignette" hidden></label>
            <label class="btn btn--add">${r.fichier || r.videoFile ? "Changer le fichier vidéo" : "Fichier vidéo (facultatif)"}<input type="file" accept="video/*" data-file="video" hidden></label>
            ${igId(r.instagram) ? `<a class="btn" href="${esc(igUrl(r.instagram))}" target="_blank" rel="noopener">Voir sur Instagram ↗</a>` : ""}
            <span class="sc-state mono muted">${r.videoFile ? "vidéo à envoyer" : r.fichier ? "vidéo : " + esc(r.fichier) : ""}</span>
          </div>
        </div>
        <div class="sc-side">
          <button class="icon-btn icon-btn--sm" type="button" data-act="up" aria-label="Monter" ${i === 0 ? "disabled" : ""}>↑</button>
          <button class="icon-btn icon-btn--sm" type="button" data-act="down" aria-label="Descendre" ${i === rows.length - 1 ? "disabled" : ""}>↓</button>
          <button class="icon-btn icon-btn--sm" type="button" data-act="del" aria-label="Retirer cette vidéo">✕</button>
        </div>
      </li>`;
    }).join("");
  }
  const msg = (t, err) => { const m = $("#sc-msg"); m.textContent = t; m.classList.toggle("is-error", !!err); };

  /* ---------- ajout en masse ---------- */
  $("#sc-add").addEventListener("click", () => {
    const lines = $("#sc-paste").value.split(/[\r\n,]+/).map((s) => s.trim()).filter(Boolean);
    let added = 0; const bad = [];
    for (const l of lines) {
      const id = igId(l);
      if (!id) { bad.push(l); continue; }
      if (rows.some((r) => igId(r.instagram) === id)) continue;
      rows.push({ id: ++uid, titre: "", duree: "", instagram: igUrl(l), fichier: "", vignette: "" }); added++;
    }
    if (!lines.length) { rows.push({ id: ++uid, titre: "", duree: "", instagram: "", fichier: "", vignette: "" }); added = 1; }
    $("#sc-paste").value = "";
    dirty = dirty || added > 0;
    render();
    msg((added ? `${added} vidéo${added > 1 ? "s" : ""} ajoutée${added > 1 ? "s" : ""}. ` : "Ces liens sont déjà dans la liste. ") + (bad.length ? `Ignoré (pas un lien Instagram) : ${bad.slice(0, 3).join(", ")}${bad.length > 3 ? "…" : ""}` : "N’oublie pas d’enregistrer."), bad.length > 0);
  });

  /* ---------- édition ---------- */
  const list = $("#sc-list");
  list.addEventListener("input", (e) => {
    const li = e.target.closest(".sc-row"); if (!li || !e.target.dataset.k) return;
    const r = rows.find((x) => x.id === Number(li.dataset.id)); r[e.target.dataset.k] = e.target.value; dirty = true;
    if (e.target.dataset.k === "instagram") {
      const p = e.target.parentElement.querySelector(".error");
      p.textContent = !r.instagram || igId(r.instagram) ? "" : "Ce lien n’est pas un reel ou une publication Instagram.";
    }
  });
  list.addEventListener("focusout", (e) => { if (e.target.dataset.k === "instagram") { const li = e.target.closest(".sc-row"); const r = rows.find((x) => x.id === Number(li.dataset.id)); if (igId(r.instagram)) { r.instagram = igUrl(r.instagram); render(); } } });
  list.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-act]"); if (!b || busy) return;
    const i = rows.findIndex((x) => x.id === Number(b.closest(".sc-row").dataset.id));
    if (b.dataset.act === "del") rows.splice(i, 1);
    else { const j = i + (b.dataset.act === "up" ? -1 : 1); if (j < 0 || j >= rows.length) return; [rows[i], rows[j]] = [rows[j], rows[i]]; }
    dirty = true; render();
  });
  list.addEventListener("change", async (e) => {
    const inp = e.target.closest("input[data-file]"); if (!inp || !inp.files[0]) return;
    const r = rows.find((x) => x.id === Number(inp.closest(".sc-row").dataset.id)); const file = inp.files[0];
    if (inp.dataset.file === "vignette") { r.vignetteFile = file; r.vignettePreview = URL.createObjectURL(file); }
    else {
      r.videoFile = file;
      const info = await videoInfo(file);
      if (info.poster && !r.vignetteFile && !r.vignette) { r.vignetteFile = info.poster; r.vignettePreview = URL.createObjectURL(info.poster); }
      if (info.duree && !r.duree) r.duree = info.duree;
    }
    dirty = true; render();
  });
  // glisser-déposer pour l'ordre
  list.addEventListener("dragstart", (e) => { const li = e.target.closest(".sc-row"); if (!li || busy || e.target.matches("input")) return; dragRow = Number(li.dataset.id); li.classList.add("is-drag"); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", "sc"); });
  list.addEventListener("dragover", (e) => { if (dragRow == null) return; e.preventDefault(); });
  list.addEventListener("drop", (e) => {
    if (dragRow == null) return; e.preventDefault();
    const li = e.target.closest(".sc-row");
    if (li && Number(li.dataset.id) !== dragRow) {
      const r = li.getBoundingClientRect(), after = e.clientY > r.top + r.height / 2;
      const moving = rows.find((x) => x.id === dragRow);
      rows = rows.filter((x) => x.id !== dragRow);
      let k = rows.findIndex((x) => x.id === Number(li.dataset.id)); if (after) k++;
      rows.splice(k, 0, moving); dirty = true;
    }
    dragRow = null; render();
  });
  list.addEventListener("dragend", () => { dragRow = null; render(); });

  /* ---------- fichiers ---------- */
  const pad = (n) => String(n).padStart(2, "0");
  const fmtDur = (s) => (isFinite(s) && s > 0 ? `${Math.floor(s / 60)}:${pad(Math.round(s % 60))}` : "");
  function videoInfo(file) {
    return new Promise((resolve) => {
      const v = document.createElement("video"); let fin = false;
      const end = (b) => { if (fin) return; fin = true; resolve({ poster: b, duree: fmtDur(v.duration) }); };
      v.muted = true; v.preload = "auto"; v.playsInline = true;
      v.onloadeddata = () => { v.currentTime = Math.min(1, (v.duration || 2) / 3); };
      v.onseeked = () => { try { const s = Math.min(1, 1080 / Math.max(v.videoWidth, v.videoHeight)), c = document.createElement("canvas"); c.width = Math.round(v.videoWidth * s); c.height = Math.round(v.videoHeight * s); c.getContext("2d").drawImage(v, 0, 0, c.width, c.height); c.toBlob((b) => end(b), "image/jpeg", 0.85); } catch { end(null); } };
      v.onerror = () => end(null); setTimeout(() => end(null), 10000);
      v.src = URL.createObjectURL(file);
    });
  }
  async function shrink(blob) {
    try {
      const bmp = await createImageBitmap(blob, { imageOrientation: "from-image" });
      const s = Math.min(1, 1080 / Math.max(bmp.width, bmp.height));
      const c = document.createElement("canvas"); c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
      c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
      return await new Promise((r) => c.toBlob((b) => r(b || blob), "image/jpeg", 0.85));
    } catch { return blob; }
  }
  function upload(nom, blob) {
    return new Promise((resolve, reject) => {
      const x = new XMLHttpRequest();
      x.open("PUT", `/api/fichier?zone=simplicicar&nom=${encodeURIComponent(nom)}`);
      x.upload.onprogress = (e) => e.lengthComputable && msg(`Envoi de ${nom} — ${Math.round((e.loaded / e.total) * 100)} %`);
      x.onload = () => { let d = {}; try { d = JSON.parse(x.responseText); } catch {} x.status < 300 ? resolve(d.nom) : reject(new Error(d.erreur || "Envoi refusé.")); };
      x.onerror = () => reject(new Error("Connexion au serveur perdue."));
      x.send(blob);
    });
  }

  /* ---------- enregistrement ---------- */
  $("#sc-save").addEventListener("click", async () => {
    if (busy) return;
    const bad = rows.find((r) => r.instagram && !igId(r.instagram));
    if (bad) { msg("Un lien n’est pas valide (indiqué en rouge) : corrige-le ou retire la ligne.", true); $(`#sc-l${bad.id}`).focus(); return; }
    const empty = rows.find((r) => !igId(r.instagram) && !r.fichier && !r.videoFile);
    if (empty) { msg("Chaque vidéo a besoin d’un lien Instagram ou d’un fichier vidéo.", true); $(`#sc-l${empty.id}`).focus(); return; }
    busy = true; $("#sc-save").disabled = true;
    try {
      for (const r of rows) {
        const slug = (r.titre || igId(r.instagram) || "video").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "video";
        if (r.videoFile) { const ext = (/\.[a-z0-9]+$/i.exec(r.videoFile.name) || [".mp4"])[0].toLowerCase(); r.fichier = await upload(`${slug}${ext}`, r.videoFile); r.videoFile = null; }
        if (r.vignetteFile) { r.vignette = await upload(`${slug}-vignette.jpg`, await shrink(r.vignetteFile)); r.vignetteFile = null; }
      }
      const res = await fetch("/api/simplicicar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ videos: rows.map((r) => ({ titre: r.titre.trim(), duree: r.duree.trim(), instagram: r.instagram, fichier: r.fichier, vignette: r.vignette })) }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.erreur || "Enregistrement refusé.");
      dirty = false;
      msg(`Enregistré : ${d.videos.length} vidéo${d.videos.length > 1 ? "s" : ""} sur la page Simplicicar.`);
      render();
    } catch (err) { msg(err.message + " Tu peux réessayer.", true); }
    finally { busy = false; $("#sc-save").disabled = false; }
  });
  window.addEventListener("beforeunload", (e) => { if (dirty || busy) { e.preventDefault(); e.returnValue = ""; } });
})();

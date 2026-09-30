/* =========================================================
   FICHIER À MODIFIER — tes infos et la liste de tes projets.
   Tu n'as pas besoin de toucher au HTML pour ajouter un projet :
   1. crée le dossier du projet (voir LISEZMOI.md)
   2. ajoute une entrée dans la liste ci-dessous
   ========================================================= */
window.MX = {
  /* ---------- Coordonnées (icônes de l'accueil + page contact) ---------- */
  contact: {
    email: "contact@mxflash.fr",              // ← ton adresse
    telephone: "+33600000000",                // ← format international, sans espace
    telephoneAffiche: "06 00 00 00 00",       // ← comme tu veux l'afficher
    instagram: "https://www.instagram.com/TON_COMPTE",
    tiktok: "https://www.tiktok.com/@TON_COMPTE",
    pappers: "https://www.pappers.fr/entreprise/TON_ENTREPRISE",
    instagramAffiche: "@mxflash"
  },

  /* ---------- CV (bouton « Télécharger mon CV ») ---------- */
  cv: "assets/cv/CV-Maxence-Ballot-Wrobel.pdf",

  /* ---------- Réalisations Photos ----------
     Dossier : assets/images/photos/<dossier>/
     - cover.jpg          → image de couverture de la carte
     - 01.jpg, 02.jpg …   → les photos (le nombre = "nbPhotos")
     recent: true         → apparaît aussi dans « Activités récentes »          */
  photos: [
    { dossier: "activite-2",      titre: "Activité récente 2",      categorie: "Série",          nbPhotos: 5, recent: true },
    { dossier: "activite-3",      titre: "Activité récente 3",      categorie: "Reportage",      nbPhotos: 5, recent: true },
    { dossier: "simplicicar",     titre: "Simplicicar — Véhicules", categorie: "Automobile",     nbPhotos: 7 },
    { dossier: "portrait",        titre: "Projet portrait",         categorie: "Portrait",       nbPhotos: 6 },
    { dossier: "evenement",       titre: "Projet événement",        categorie: "Événement",      nbPhotos: 6 },
    { dossier: "argentique",      titre: "Série argentique",        categorie: "Argentique",     nbPhotos: 6 },
    { dossier: "drone-troyes",    titre: "Troyes vue du ciel",      categorie: "Drone",          nbPhotos: 6 }
  ],

  /* ---------- Réalisations Vidéos ----------
     Dossier : assets/videos/projets/<dossier>/
     - poster.jpg   → vignette 16:9
     - apercu.mp4   → extrait de 3-5 s joué au survol (sans son, léger)
     - video.mp4    → la vidéo complète (OU renseigne "embed" pour YouTube/Vimeo)
     embed: lien d'intégration, ex. "https://player.vimeo.com/video/123456789"
            ou "https://www.youtube.com/embed/XXXXXXXXXXX"
     page: lien vers une page « process » (facultatif)                       */
  videos: [
    { dossier: "activite-1",   titre: "Activité récente 1",     categorie: "Clip",          role: "Réalisation · Montage",     duree: "2:30", recent: true, alaune: true, page: "activite-1.html" },
    { dossier: "simplicicar",  titre: "Simplicicar Troyes",     categorie: "Automobile",    role: "Tournage · Montage",        duree: "0:45", alaune: true, page: "simplicicar.html" },
    { dossier: "clip",         titre: "Projet clip",            categorie: "Clip",          role: "Réalisation · Montage",     duree: "3:12", phare: true },
    { dossier: "aftermovie",   titre: "Projet aftermovie",      categorie: "Aftermovie",    role: "Cadre · Montage",           duree: "1:58" },
    { dossier: "publicite",    titre: "Projet publicité",       categorie: "Publicité",     role: "Réalisation · Étalonnage",  duree: "0:30" },
    { dossier: "drone-troyes", titre: "Troyes vue du ciel",     categorie: "Drone",         role: "Pilotage · Montage",        duree: "1:20" },
    { dossier: "motion",       titre: "Projet motion",          categorie: "Motion design", role: "After Effects",             duree: "0:40" }
  ],

  /* ---------- Formats verticaux 9:16 (reels) ----------
     Dossier : assets/videos/reels/
     - 01.mp4, 02.mp4 …  + 01.jpg, 02.jpg … (vignettes)                      */
  reels: [
    { fichier: "01", titre: "Reel Simplicicar", duree: "0:32" },
    { fichier: "02", titre: "Reel clip",        duree: "0:24" },
    { fichier: "03", titre: "Aftermovie court", duree: "0:45" },
    { fichier: "04", titre: "Reel drone",       duree: "0:18" },
    { fichier: "05", titre: "Reel coulisses",   duree: "0:28" },
    { fichier: "06", titre: "Reel pub",         duree: "0:15" }
  ],
  /* Un reel peut aussi venir d'Instagram (pas besoin du fichier) :
     { instagram: "https://www.instagram.com/reel/XXXXXXXXX/", titre: "Mon reel", vignette: "assets/videos/reels/07.jpg" } */

  /* ---------- Page Simplicicar ---------- */
  simplicicar: {
    /* Vidéos au format réseaux sociaux (9:16)
       - fichier : assets/videos/simplicicar/01.mp4 + 01.jpg (vignette) + 01-apercu.mp4 (survol, facultatif)
       - OU instagram : lien du reel (la vignette est alors facultative : "vignette: 'chemin.jpg'")   */
    videos: [
      { fichier: "01", titre: "Vidéo 1 — titre", duree: "0:27" },
      { fichier: "02", titre: "Vidéo 2 — titre", duree: "0:34" },
      { fichier: "03", titre: "Vidéo 3 — titre", duree: "0:41" },
      { fichier: "04", titre: "Vidéo 4 — titre", duree: "0:48" }
      // { instagram: "https://www.instagram.com/reel/XXXXXXXXX/", titre: "Reel Instagram" }
    ],

    /* Véhicules : une section = une voiture, flèches pour passer à la suivante
       Photos : assets/images/simplicicar/voitures/<dossier>/01.jpg, 02.jpg …
       01 = grande photo, 02-03 = à droite, 04 et + = rangée du bas
       prix : "24 990 €" — laisse vide pour afficher « Prix sur demande »           */
    voitures: [
      { nom: "Ford Mustang", detail: "Coupé · intérieur cuir rouge", prix: "35 980 €", dossier: "mustang-interieur-rouge", photos: 7 },
      { nom: "BMW Z4 40i",   detail: "Roadster",                      prix: "69 980 €", dossier: "bmw-z4-40i",              photos: 7 },
      { nom: "Jaguar F-Type R", detail: "Cabriolet",                  prix: "54 480 €", dossier: "jaguar-f-type-r",         photos: 7 },
      { nom: "Renault Mégane R.S. Trophy-R", detail: "Compacte sportive", prix: "50 980 €", dossier: "megane-rs-trophy-r", photos: 7 },
      { nom: "Mercedes Classe A", detail: "Full option",              prix: "27 980 €", dossier: "mercedes-classe-a",       photos: 7 }
      // , { nom: "…", detail: "…", prix: "…", dossier: "…", photos: 7 }
    ]
  }
};

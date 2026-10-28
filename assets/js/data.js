/* =========================================================
   FICHIER À MODIFIER — tes infos et la liste de tes projets.
   Tu n'as pas besoin de toucher au HTML pour ajouter un projet :
   1. crée le dossier du projet (voir LISEZMOI.md)
   2. ajoute une entrée dans la liste ci-dessous
   ========================================================= */
window.MX = {
  /* ---------- Coordonnées (icônes de l'accueil + page contact) ---------- */
  contact: {
    email: "maxence.ballotwrobel@free.fr",    // ← ton adresse
    telephone: "+33766916414",                // ← format international, sans espace
    telephoneAffiche: "07 66 91 64 14",       // ← comme tu veux l'afficher
    instagram: "https://www.instagram.com/mx_.flash/",
    instagramAffiche: "@mx_.flash"
  },

  /* ---------- CV (bouton « Télécharger mon CV ») ---------- */
  cv: "assets/cv/CV-Maxence-Ballot-Wrobel.pdf",

  /* ---------- Réalisations Photos ----------
     Dossier : assets/images/photos/<dossier>/
     - cover.jpg          → image de couverture de la carte
     - 01.jpg, 02.jpg …   → les photos (le nombre = "nbPhotos")
     recent: true         → apparaît aussi dans « Activités récentes »          */
  photos: [
    // Le plus simple : ajoute tes projets avec l'admin. Format manuel :
    // { dossier: "mon-projet", titre: "Mon projet", categorie: "Portrait", nbPhotos: 12 },
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
    // Le plus simple : ajoute tes projets avec l'admin. Format manuel :
    // { dossier: "mon-film", titre: "Mon film", categorie: "Clip", role: "Réalisation", duree: "2:30" },
  ],

  /* ---------- Formats verticaux 9:16 (reels) ----------
     Dossier : assets/videos/reels/
     - 01.mp4, 02.mp4 …  + 01.jpg, 02.jpg … (vignettes)                      */
  reels: [
    // { fichier: "01", titre: "Mon reel", duree: "0:30" }  ou  { instagram: "https://www.instagram.com/reel/…", titre: "…" }
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

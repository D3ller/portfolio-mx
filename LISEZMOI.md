# Portfolio MX Flash — où mettre tes fichiers

## ★ Ajouter un projet avec l'admin (le plus simple)

1. **Double-clique sur `LANCER-ADMIN.bat`** (il faut Node.js, déjà installé sur ton PC).
   Une fenêtre noire s'ouvre, puis l'admin dans ton navigateur : http://localhost:4321/_admin/
   → garde la fenêtre noire ouverte tant que tu travailles.
2. Remplis le formulaire : **Photo / Vidéo / les deux**, titre, **date**, **ton rôle**, tes fichiers (glisser-déposer),
   **description**, **logiciels**. Clique sur **Publier le projet**.
3. C'est fait :
   - une page est créée dans `projets/<date>-<titre>.html` ;
   - les fichiers sont rangés dans `assets/projets/<date>-<titre>/` (photos redimensionnées à 2400 px, image de couverture extraite des vidéos) ;
   - le projet apparaît dans **Réalisations Photos** et/ou **Réalisations Vidéos** ;
   - les **3 projets les plus récents (d'après leur date)** remplacent automatiquement les « Activités récentes » de l'accueil.
4. Clique sur un projet dans la colonne de gauche pour le **modifier** (textes, ajouter/retirer des fichiers, changer la couverture ★) ou le **supprimer**.

Ne modifie pas à la main `projets/*.html` ni `assets/js/projets.js` : l'admin les régénère à chaque publication.
Pour mettre le site en ligne, envoie tout **sauf** `_admin/`, `LANCER-ADMIN.bat` et `assets/data/` (ils ne servent qu'à toi).

---

Le site est prêt : tant qu'un fichier manque, un **cadre gris avec une icône** s'affiche à sa place.
Dès que tu déposes le fichier au bon endroit **avec le bon nom**, il apparaît tout seul.
Chaque dossier contient un fichier `_A_METTRE_ICI.txt` qui rappelle les noms attendus.

## Les pages

| Carte de l'accueil | Page |
|---|---|
| 1 · Nom + citation | `presentation.html` |
| 2 · Parlons de votre projet | `contact.html` |
| 3 · Activité récente 1 (vidéo) | `activite-1.html` |
| 4 · Activité récente 2 (photo) | `activite-2.html` |
| 5 · Activité récente 3 (photo) | `activite-3.html` |
| 6 · Simplicicar Troyes | `simplicicar.html` |
| 7 · CV | télécharge `assets/cv/CV-Maxence-Ballot-Wrobel.pdf` |
| 8 · Réalisations Photos | `photos.html` |
| 9 · Réalisations Vidéos | `videos.html` |

## L'arborescence

```
portfolio-mxflash/
├── index.html … videos.html          ← les pages
├── assets/
│   ├── css/style.css                 ← le style (couleurs du Figma)
│   ├── js/data.js                    ← ★ TES INFOS + LA LISTE DES PROJETS
│   ├── js/main.js                    ← le fonctionnement (ne pas toucher)
│   ├── cv/                           ← CV-Maxence-Ballot-Wrobel.pdf
│   ├── images/
│   │   ├── moi/                      ← portrait.jpg
│   │   ├── accueil/                  ← photos-1/2/3.jpg, videos.jpg
│   │   ├── materiel/                 ← canon-r6, rf-24-105, trepied, argentique, dji-mini-3 (.jpg)
│   │   ├── logiciels/                ← logos .png
│   │   ├── activites/activite-1/     ← miniature.jpg + etapes/01…05.jpg
│   │   ├── activites/activite-2/     ← etapes/01…05.jpg
│   │   ├── activites/activite-3/     ← etapes/01…05.jpg
│   │   ├── simplicicar/              ← miniature.jpg + mobilier/01…03.jpg
│   │   └── photos/                   ← ★ TOUS LES PROJETS PHOTO, 1 dossier par projet
│   │       ├── activite-2/           ← cover.jpg + 01.jpg, 02.jpg…
│   │       ├── activite-3/
│   │       ├── simplicicar/          ← photos des voitures
│   │       ├── portrait/  evenement/  argentique/  drone-troyes/
│   └── videos/
│       ├── showreel.mp4 (+ .jpg)     ← le showreel en haut de la page Vidéos
│       ├── activite-1/               ← video.mp4 + poster.jpg
│       ├── simplicicar/              ← 01…04.mp4 + 01…04.jpg (bandeau 16:9)
│       ├── reels/                    ← 01…06.mp4 + 01…06.jpg (formats 9:16)
│       └── projets/                  ← ★ 1 dossier par projet vidéo
│           └── clip/ aftermovie/ …   ← poster.jpg + apercu.mp4 + video.mp4
```

Les photos des **activités récentes 2 et 3** sont rangées dans `images/photos/`, avec tous les autres projets photo : elles apparaissent donc à la fois sur leur page et dans « Réalisations Photos » (tag « Récent »).

## Ajouter un projet photo

1. Crée `assets/images/photos/mon-projet/` avec `cover.jpg`, `01.jpg`, `02.jpg`, …
2. Dans `assets/js/data.js`, liste `photos`, ajoute :
   `{ dossier: "mon-projet", titre: "Mon projet", categorie: "Portrait", nbPhotos: 12 },`
   Une nouvelle catégorie crée automatiquement un nouveau filtre.

## Ajouter un projet vidéo

1. Crée `assets/videos/projets/mon-film/` avec `poster.jpg` (16:9), `apercu.mp4` (3-5 s, sans son) et `video.mp4`.
2. Dans `data.js`, liste `videos`, ajoute une ligne.
   Si la vidéo est sur **Vimeo ou YouTube**, pas besoin de `video.mp4` : ajoute `embed: "https://player.vimeo.com/video/123456789"` (ou `https://www.youtube.com/embed/ID`).
3. `phare: true` = le grand projet « À la une » ; `alaune: true` = les 2 petits à côté.

## Tailles conseillées

| Type | Format | Taille |
|---|---|---|
| Photos de galerie | JPG qualité 80, 2000 px max côté long | < 500 Ko |
| Couvertures / vignettes | JPG, 1200 px de large | < 250 Ko |
| Aperçus de survol `apercu.mp4` | MP4 H.264, 720p, sans son, 3-5 s | < 1,5 Mo |
| Vidéos complètes | Vimeo / YouTube de préférence (plus rapide) | — |
| Showreel | MP4 H.264, 1080p, sans son pour la lecture auto | < 15 Mo |

Garde des noms **en minuscules, sans espace ni accent** (`drone-troyes`, pas `Drone Troyes`).

## Tes coordonnées

Tout est dans `assets/js/data.js` → `contact` (e-mail, téléphone, Instagram, TikTok, Pappers).
Le formulaire ouvre la messagerie du visiteur avec la demande pré-remplie vers ton e-mail.
Pour recevoir les demandes sans passer par sa messagerie, crée un formulaire gratuit sur Formspree et je pourrai le brancher.

## Voir le site

Double-clique sur `index.html`. Pour que les vidéos et la lightbox marchent comme en ligne, lance un petit serveur dans ce dossier :

```
npx serve .
```

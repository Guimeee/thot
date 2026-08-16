# 𓁟 Thot — Éditeur Markdown & Export PDF A4

Application web moderne construite avec **Vite** (Vanilla JS) et **Marked**, permettant de rédiger du Markdown en temps réel avec un aperçu fidèle au format feuille A4 (210mm x 297mm), personnalisable avec différentes polices (Google Fonts et système), et exportable en PDF de manière native via le navigateur (`window.print()`).

---

## 🚀 Démarrage rapide

### 1. Installation des dépendances
```bash
npm install
```

### 2. Lancement en mode développement
```bash
npm run dev
```
L'application sera accessible sur `http://localhost:5173`.

### 3. Compilation pour la production
```bash
npm run build
```
Les fichiers compilés prêts à être déployés seront générés dans le dossier `dist/`.

### 4. Prévisualiser le build de production localement
```bash
npm run preview
```

---

## 📁 Structure du projet

```
thot/
├── .github/
│   └── workflows/
│       └── deploy.yml       # Workflow CI/CD GitHub Actions pour le déploiement FTP OVH
├── .gitignore               # Fichiers et répertoires ignorés par Git
├── index.html               # Structure HTML de l'interface & Toolbar
├── main.js                  # Logique de parsing Markdown, Google Fonts et export PDF
├── package.json             # Dépendances (marked, vite) et scripts
├── style.css                # Styles de l'interface, simulation page A4 et @media print
├── vite.config.js           # Configuration Vite (base relative pour sous-dossier /thot/)
└── README.md
```

---

## ⚙️ Configuration du déploiement GitHub Actions (OVH FTP)

Le workflow `.github/workflows/deploy.yml` déploie automatiquement l'application sur votre hébergement OVH à chaque `push` sur la branche `main`.

### Secrets GitHub à configurer :
Dans les paramètres de votre dépôt GitHub (**Settings** > **Secrets and variables** > **Actions** > **New repository secret**), ajoutez :

1. `FTP_SERVER` : Adresse de l'hôte FTP OVH (ex: `ftp.votre-domaine.com` ou `ftp.cluster0XX.hosting.ovh.net`).
2. `FTP_USERNAME` : Nom d'utilisateur du compte FTP.
3. `FTP_PASSWORD` : Mot de passe du compte FTP.

Le dossier cible configuré sur le serveur OVH est `./www/thot/`.

import { marked } from 'marked';

// Configuration de Marked
marked.setOptions({
  gfm: true,
  breaks: true,
});

// Éléments du DOM
const markdownInput = document.getElementById('markdown-input');
const preview = document.getElementById('preview');
const fontSelect = document.getElementById('font-select');
const exportPdfBtn = document.getElementById('export-pdf-btn');
const wordCountEl = document.getElementById('word-count');
const charCountEl = document.getElementById('char-count');

// Configuration des Google Fonts
const GOOGLE_FONTS = {
  'Roboto': {
    family: "'Roboto', sans-serif",
    query: 'Roboto:ital,wght@0,300;0,400;0,500;0,700;1,400&display=swap'
  },
  'Open Sans': {
    family: "'Open Sans', sans-serif",
    query: 'Open+Sans:ital,wght@0,300;0,400;0,600;0,700;1,400&display=swap'
  },
  'Montserrat': {
    family: "'Montserrat', sans-serif",
    query: 'Montserrat:ital,wght@0,300;0,400;0,600;0,700;1,400&display=swap'
  },
  'Inter': {
    family: "'Inter', sans-serif",
    query: 'Inter:wght@300;400;500;600;700&display=swap'
  },
  'Lora': {
    family: "'Lora', serif",
    query: 'Lora:ital,wght@0,400;0,600;0,700;1,400&display=swap'
  },
  'Merriweather': {
    family: "'Merriweather', serif",
    query: 'Merriweather:ital,wght@0,300;0,400;0,700;1,300&display=swap'
  },
  'Playfair Display': {
    family: "'Playfair Display', serif",
    query: 'Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap'
  },
  'Fira Code': {
    family: "'Fira Code', monospace",
    query: 'Fira+Code:wght@400;500;600&display=swap'
  }
};

// Cache des polices chargées dynamiquement
const loadedFonts = new Set();

/**
 * Charge une Google Font dynamiquement dans le <head> si nécessaire
 * @param {string} fontName
 */
function loadGoogleFont(fontName) {
  const fontConfig = GOOGLE_FONTS[fontName];
  if (!fontConfig) return;

  if (!loadedFonts.has(fontName)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${fontConfig.query}`;
    document.head.appendChild(link);
    loadedFonts.add(fontName);
  }
}

/**
 * Applique la police sélectionnée à la zone de prévisualisation
 * @param {string} fontValue
 */
function applyFont(fontValue) {
  if (GOOGLE_FONTS[fontValue]) {
    loadGoogleFont(fontValue);
    preview.style.fontFamily = GOOGLE_FONTS[fontValue].family;
  } else {
    preview.style.fontFamily = fontValue;
  }
}

/**
 * Met à jour le compteur de mots et caractères
 * @param {string} text
 */
function updateStats(text) {
  const trimmed = text.trim();
  const words = trimmed.length > 0 ? trimmed.split(/\s+/).length : 0;
  const chars = text.length;

  wordCountEl.textContent = `${words} mot${words > 1 ? 's' : ''}`;
  charCountEl.textContent = `${chars} caractère${chars > 1 ? 's' : ''}`;
}

/**
 * Convertit le Markdown en HTML et met à jour l'aperçu
 */
function renderMarkdown() {
  const text = markdownInput.value;
  preview.innerHTML = marked.parse(text);
  updateStats(text);
}

// Écouteurs d'événements
markdownInput.addEventListener('input', renderMarkdown);

fontSelect.addEventListener('change', (e) => {
  applyFont(e.target.value);
});

exportPdfBtn.addEventListener('click', () => {
  window.print();
});

// Document initial de démonstration
const initialMarkdown = `# 𓁟 Thot — Éditeur Markdown & Export PDF

Bienvenue dans **Thot**, l'éditeur Markdown conçu pour créer des documents élégants et les exporter nativement au format **PDF A4**.

---

## Fonctionnalités principales

- **Rendu temps réel** : Saisie Markdown fluide avec conversion instantanée.
- **Simulation A4 fidèle** : Aperçu aux dimensions réelles (210mm × 297mm).
- **Typographie personnalisable** : Polices système & Google Fonts injectées à la volée.
- **Export PDF natif** : Utilisation optimisée de \`window.print()\` et de règles CSS \`@media print\`.

---

## Exemple de tableau comparatif

| Fonctionnalité | Supporté | Description |
| :--- | :---: | :--- |
| GitHub Flavored Markdown | ✅ | Tables, listes de tâches, code blocks |
| Google Fonts dynamiques | ✅ | Roboto, Inter, Lora, Fira Code... |
| Exportation Vectorielle | ✅ | PDF haute résolution généré par le navigateur |

---

## Citation & Bloc de code

> *"L'écriture est le reflet de la pensée organisée."*
> — Sagesse de Thot

Exemple de fonction JavaScript utilisée pour l'impression :

\`\`\`javascript
function exportToPdf() {
  // Déclenche l'impression native du navigateur configurée en A4
  window.print();
}
\`\`\`

---

## Liste de tâches

- [x] Initialiser le projet Vite
- [x] Configurer le parseur Marked
- [x] Styliser la simulation A4
- [x] Déployer avec GitHub Actions vers OVH
`;

// Initialisation au chargement de la page
markdownInput.value = initialMarkdown;
applyFont(fontSelect.value);
renderMarkdown();

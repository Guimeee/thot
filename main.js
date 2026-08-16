import { marked } from 'marked';

// Configuration de Marked
marked.setOptions({
  gfm: true,
  breaks: true,
});

// Éléments du DOM
const markdownInput = document.getElementById('markdown-input');
const previewCanvas = document.getElementById('preview-canvas');
const fontSelect = document.getElementById('font-select');
const toggleFooter = document.getElementById('toggle-footer');
const exportPdfBtn = document.getElementById('export-pdf-btn');
const wordCountEl = document.getElementById('word-count');
const charCountEl = document.getElementById('char-count');
const pageCountBadge = document.getElementById('page-count-badge');
const previewPageIndicator = document.getElementById('preview-page-indicator');

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

const loadedFonts = new Set();
let currentFontFamily = "'Roboto', sans-serif";

/**
 * Charge une Google Font dynamiquement dans le <head> si nécessaire
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
 * Applique la police sélectionnée
 */
function setFont(fontValue) {
  if (GOOGLE_FONTS[fontValue]) {
    loadGoogleFont(fontValue);
    currentFontFamily = GOOGLE_FONTS[fontValue].family;
  } else {
    currentFontFamily = fontValue;
  }
  document.documentElement.style.setProperty('--doc-font', currentFontFamily);
  applyFontToAllPages();
  paginate();
}

function applyFontToAllPages() {
  const pageContents = previewCanvas.querySelectorAll('.page-content');
  pageContents.forEach((el) => {
    el.style.fontFamily = currentFontFamily;
  });
}

/**
 * Crée un élément DOM de page A4
 */
function createPageElement(pageIndex, showFooter) {
  const page = document.createElement('article');
  page.className = 'a4-page';
  page.dataset.pageNumber = pageIndex;

  const content = document.createElement('div');
  content.className = 'page-content';
  content.style.fontFamily = currentFontFamily;
  page.appendChild(content);

  if (showFooter) {
    const footer = document.createElement('div');
    footer.className = 'page-footer';
    footer.innerHTML = `<span class="page-number">Page ${pageIndex}</span>`;
    page.appendChild(footer);
  }

  return page;
}

/**
 * Découpe et distribue un élément s'il dépasse la hauteur autorisée
 */
function appendOrSplit(el, createNextPage, getCurrentContent, maxHeight) {
  let content = getCurrentContent();
  content.appendChild(el);

  if (content.scrollHeight <= maxHeight) {
    return;
  }

  const tag = el.tagName.toLowerCase();

  // 1. Découpage des listes UL / OL
  if (tag === 'ul' || tag === 'ol') {
    const items = Array.from(el.children);
    content.removeChild(el);

    let currentList = document.createElement(tag);
    if (tag === 'ol' && el.hasAttribute('start')) {
      currentList.start = el.start;
    }
    content.appendChild(currentList);

    let olCounter = tag === 'ol' ? (parseInt(el.getAttribute('start')) || 1) : 1;

    for (let j = 0; j < items.length; j++) {
      const item = items[j];
      currentList.appendChild(item);

      if (content.scrollHeight > maxHeight) {
        currentList.removeChild(item);

        if (currentList.children.length === 0) {
          content.removeChild(currentList);
        }

        content = createNextPage();
        currentList = document.createElement(tag);
        if (tag === 'ol') {
          currentList.start = olCounter;
        }
        content.appendChild(currentList);
        currentList.appendChild(item);
      }
      olCounter++;
    }
    return;
  }

  // 2. Découpage des tableaux TABLE
  if (tag === 'table') {
    const thead = el.querySelector('thead');
    const tbody = el.querySelector('tbody');
    const rows = tbody ? Array.from(tbody.querySelectorAll('tr')) : Array.from(el.querySelectorAll('tr'));

    content.removeChild(el);

    let currentTable = document.createElement('table');
    if (thead) currentTable.appendChild(thead.cloneNode(true));
    let currentTbody = document.createElement('tbody');
    currentTable.appendChild(currentTbody);
    content.appendChild(currentTable);

    for (let j = 0; j < rows.length; j++) {
      const row = rows[j];
      currentTbody.appendChild(row);

      if (content.scrollHeight > maxHeight) {
        currentTbody.removeChild(row);

        if (currentTbody.children.length === 0) {
          content.removeChild(currentTable);
        }

        content = createNextPage();
        currentTable = document.createElement('table');
        if (thead) currentTable.appendChild(thead.cloneNode(true));
        currentTbody = document.createElement('tbody');
        currentTable.appendChild(currentTbody);
        content.appendChild(currentTable);
        currentTbody.appendChild(row);
      }
    }
    return;
  }

  // 3. Gestion des paragraphes longs P
  if (tag === 'p') {
    content.removeChild(el);

    if (content.children.length > 0) {
      content = createNextPage();
      content.appendChild(el);

      if (content.scrollHeight <= maxHeight) {
        return;
      }
    }

    splitParagraphWords(el, createNextPage, () => content, maxHeight);
    return;
  }

  // 4. Blocs de code PRE
  if (tag === 'pre') {
    content.removeChild(el);

    if (content.children.length > 0) {
      content = createNextPage();
      content.appendChild(el);

      if (content.scrollHeight <= maxHeight) {
        return;
      }
    }

    splitPreLines(el, createNextPage, () => content, maxHeight);
    return;
  }

  // Pour les titres (H1-H6), citations, images, séparateurs
  content.removeChild(el);
  content = createNextPage();
  content.appendChild(el);
}

function splitParagraphWords(pEl, createNextPage, getCurrentContent, maxHeight) {
  let content = getCurrentContent();
  const text = pEl.innerHTML;
  const words = text.split(' ');
  pEl.innerHTML = '';
  content.appendChild(pEl);

  let currentP = pEl;
  let wordBuf = [];

  for (let w = 0; w < words.length; w++) {
    wordBuf.push(words[w]);
    currentP.innerHTML = wordBuf.join(' ');

    if (content.scrollHeight > maxHeight) {
      wordBuf.pop();
      currentP.innerHTML = wordBuf.join(' ');

      content = createNextPage();
      currentP = document.createElement('p');
      content.appendChild(currentP);
      wordBuf = [words[w]];
      currentP.innerHTML = wordBuf.join(' ');
    }
  }
}

function splitPreLines(preEl, createNextPage, getCurrentContent, maxHeight) {
  let content = getCurrentContent();
  const codeEl = preEl.querySelector('code');
  const rawCode = codeEl ? codeEl.textContent : preEl.textContent;
  const lines = rawCode.split('\n');

  content.removeChild(preEl);

  let currentPre = document.createElement('pre');
  let currentCode = document.createElement('code');
  if (codeEl && codeEl.className) currentCode.className = codeEl.className;
  currentPre.appendChild(currentCode);
  content.appendChild(currentPre);

  let lineBuf = [];
  for (let l = 0; l < lines.length; l++) {
    lineBuf.push(lines[l]);
    currentCode.textContent = lineBuf.join('\n');

    if (content.scrollHeight > maxHeight) {
      lineBuf.pop();
      currentCode.textContent = lineBuf.join('\n');

      content = createNextPage();
      currentPre = document.createElement('pre');
      currentCode = document.createElement('code');
      if (codeEl && codeEl.className) currentCode.className = codeEl.className;
      currentPre.appendChild(currentCode);
      content.appendChild(currentPre);
      lineBuf = [lines[l]];
      currentCode.textContent = lineBuf.join('\n');
    }
  }
}

/**
 * Évite les titres orphelins en fin de page
 */
function cleanOrphanHeadings() {
  const pages = Array.from(previewCanvas.querySelectorAll('.a4-page'));
  for (let i = 0; i < pages.length - 1; i++) {
    const currentContent = pages[i].querySelector('.page-content');
    const nextContent = pages[i + 1].querySelector('.page-content');

    if (currentContent && nextContent && currentContent.lastElementChild) {
      const last = currentContent.lastElementChild;
      const tag = last.tagName.toUpperCase();
      if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(tag)) {
        currentContent.removeChild(last);
        nextContent.insertBefore(last, nextContent.firstElementChild);
      }
    }
  }
}

/**
 * Met à jour les compteurs de mots, caractères et pages
 */
function updateStats(text, totalPages) {
  const trimmed = text.trim();
  const words = trimmed.length > 0 ? trimmed.split(/\s+/).length : 0;
  const chars = text.length;

  wordCountEl.textContent = `${words} mot${words > 1 ? 's' : ''}`;
  charCountEl.textContent = `${chars} caractère${chars > 1 ? 's' : ''}`;
  pageCountBadge.textContent = `${totalPages} page${totalPages > 1 ? 's' : ''} A4`;
  previewPageIndicator.textContent = `${totalPages} feuille${totalPages > 1 ? 's' : ''} A4 (210mm × 297mm)`;
}

/**
 * Moteur de pagination automatique A4
 */
function paginate() {
  const markdownText = markdownInput.value;
  const rawHtml = marked.parse(markdownText);
  const showFooter = toggleFooter ? toggleFooter.checked : false;

  previewCanvas.innerHTML = '';

  const tempContainer = document.createElement('div');
  tempContainer.innerHTML = rawHtml;
  const elements = Array.from(tempContainer.children);

  if (elements.length === 0) {
    const emptyPage = createPageElement(1, showFooter);
    previewCanvas.appendChild(emptyPage);
    updateStats(markdownText, 1);
    return;
  }

  let pageIndex = 1;
  let currentPage = createPageElement(pageIndex, showFooter);
  previewCanvas.appendChild(currentPage);
  let currentContent = currentPage.querySelector('.page-content');

  // Mesure de la hauteur disponible dans la feuille A4
  const maxHeight = currentContent.clientHeight;

  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    appendOrSplit(
      el,
      () => {
        pageIndex++;
        currentPage = createPageElement(pageIndex, showFooter);
        previewCanvas.appendChild(currentPage);
        currentContent = currentPage.querySelector('.page-content');
        return currentContent;
      },
      () => currentContent,
      maxHeight
    );
  }

  cleanOrphanHeadings();

  // Mise à jour de la numérotation des pages (si activée)
  const allPages = previewCanvas.querySelectorAll('.a4-page');
  const totalPages = allPages.length;
  if (showFooter) {
    allPages.forEach((page, idx) => {
      const numEl = page.querySelector('.page-number');
      if (numEl) {
        numEl.textContent = `Page ${idx + 1} / ${totalPages}`;
      }
    });
  }

  updateStats(markdownText, totalPages);
}

// Debounce pour fluidité de frappe
let debounceTimer;
markdownInput.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(paginate, 30);
});

fontSelect.addEventListener('change', (e) => {
  setFont(e.target.value);
});

toggleFooter.addEventListener('change', () => {
  paginate();
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
- **Pagination A4 dynamique** : Répartition automatique sur plusieurs feuilles A4 réelles (210mm × 297mm).
- **Typographie personnalisable** : Polices système & Google Fonts injectées à la volée.
- **Export PDF natif & Couleurs exactes** : Utilisation de \`window.print()\` avec \`print-color-adjust: exact\` pour préserver tous les arrière-plans et bordures.

---

## Exemple de tableau comparatif

| Fonctionnalité | Supporté | Description |
| :--- | :---: | :--- |
| GitHub Flavored Markdown | ✅ | Tables, listes de tâches, code blocks |
| Google Fonts dynamiques | ✅ | Roboto, Inter, Lora, Fira Code... |
| Pagination Automatique A4 | ✅ | Découpage propre multi-pages sans débordement |
| Couleurs d'arrière-plan exactes | ✅ | Blocs sombres et citations préservés à l'impression |

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
- [x] Styliser la simulation multi-pages A4
- [x] Déployer avec GitHub Actions vers OVH
`;

// Initialisation au chargement
markdownInput.value = initialMarkdown;
setFont(fontSelect.value);

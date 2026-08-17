import { marked } from 'marked';

// Configuration de Marked avec cases à cocher interactives
marked.use({
  gfm: true,
  breaks: true,
  renderer: {
    checkbox({ checked }) {
      return `<input type="checkbox"${checked ? ' checked=""' : ''} class="task-checkbox" /> `;
    }
  }
});

// DOM Elements
const markdownInput = document.getElementById('markdown-input');
const previewCanvas = document.getElementById('preview-canvas');
const fontSelect = document.getElementById('font-select');
const toggleFooter = document.getElementById('toggle-footer');
const exportPdfBtn = document.getElementById('export-pdf-btn');
const wordCountEl = document.getElementById('word-count');
const charCountEl = document.getElementById('char-count');
const pageCountBadge = document.getElementById('page-count-badge');
const previewPageIndicator = document.getElementById('preview-page-indicator');

// Configuration Google Fonts
const GOOGLE_FONTS = {
  'Inter': {
    family: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    query: 'Inter:wght@300;400;500;600;700&display=swap'
  },
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
let currentFontFamily = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

/**
 * Loads a Google Font dynamically if needed
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
 * Applies the selected font
 */
function setFont(fontValue) {
  if (GOOGLE_FONTS[fontValue]) {
    loadGoogleFont(fontValue);
    currentFontFamily = GOOGLE_FONTS[fontValue].family;
  } else {
    currentFontFamily = fontValue;
  }
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
 * Creates an A4 page element
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
 * Splits overflowing elements across pages
 */
function appendOrSplit(el, createNextPage, getCurrentContent, maxHeight) {
  let content = getCurrentContent();
  content.appendChild(el);

  if (content.scrollHeight <= maxHeight) {
    return;
  }

  const tag = el.tagName.toLowerCase();

  // 1. Lists (UL / OL)
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

  // 2. Tables
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

  // 3. Paragraphs
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

  // 4. Code Blocks (PRE)
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

  // Headings, blockquotes, images, hr
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
 * Prevents orphan headings and dividers at page breaks
 */
function cleanOrphanHeadings() {
  const pages = Array.from(previewCanvas.querySelectorAll('.a4-page'));
  for (let i = 0; i < pages.length - 1; i++) {
    const currentContent = pages[i].querySelector('.page-content');
    const nextContent = pages[i + 1].querySelector('.page-content');

    if (currentContent && nextContent) {
      while (currentContent.lastElementChild) {
        const last = currentContent.lastElementChild;
        const tag = last.tagName.toUpperCase();
        if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'HR'].includes(tag)) {
          currentContent.removeChild(last);
          nextContent.insertBefore(last, nextContent.firstElementChild);
        } else {
          break;
        }
      }
    }
  }

  // Remove any empty pages created during adjustments
  const allRendered = Array.from(previewCanvas.querySelectorAll('.a4-page'));
  allRendered.forEach((page) => {
    const content = page.querySelector('.page-content');
    if (content && content.children.length === 0 && previewCanvas.children.length > 1) {
      page.remove();
    }
  });
}

/**
 * Updates stats badge
 */
function updateStats(text, totalPages) {
  const trimmed = text.trim();
  const words = trimmed.length > 0 ? trimmed.split(/\s+/).length : 0;
  const chars = text.length;

  wordCountEl.textContent = `${words} word${words !== 1 ? 's' : ''}`;
  charCountEl.textContent = `${chars} character${chars !== 1 ? 's' : ''}`;
  pageCountBadge.textContent = `${totalPages} page${totalPages > 1 ? 's' : ''} A4`;
  previewPageIndicator.textContent = `${totalPages} sheet${totalPages > 1 ? 's' : ''} A4 (210mm × 297mm)`;
}

/**
 * Automatic A4 pagination engine
 */
function paginate() {
  const markdownText = markdownInput.value;
  const rawHtml = marked.parse(markdownText);
  const showFooter = toggleFooter ? toggleFooter.checked : false;

  previewCanvas.innerHTML = '';

  const tempContainer = document.createElement('div');
  tempContainer.innerHTML = rawHtml;
  tempContainer.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
    cb.removeAttribute('disabled');
  });
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

  // Update page numbers
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

// Typing debounce
let debounceTimer;
markdownInput.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(paginate, 30);
});

// Synchronized scrolling between editor and preview (StackEdit feature)
let isEditorScrolling = false;
let isPreviewScrolling = false;

markdownInput.addEventListener('scroll', () => {
  if (isPreviewScrolling) return;
  isEditorScrolling = true;
  const maxEditorScroll = markdownInput.scrollHeight - markdownInput.clientHeight;
  const maxPreviewScroll = previewCanvas.scrollHeight - previewCanvas.clientHeight;
  if (maxEditorScroll > 0 && maxPreviewScroll > 0) {
    const percentage = markdownInput.scrollTop / maxEditorScroll;
    previewCanvas.scrollTop = percentage * maxPreviewScroll;
  }
  setTimeout(() => { isEditorScrolling = false; }, 60);
});

previewCanvas.addEventListener('scroll', () => {
  if (isEditorScrolling) return;
  isPreviewScrolling = true;
  const maxEditorScroll = markdownInput.scrollHeight - markdownInput.clientHeight;
  const maxPreviewScroll = previewCanvas.scrollHeight - previewCanvas.clientHeight;
  if (maxEditorScroll > 0 && maxPreviewScroll > 0) {
    const percentage = previewCanvas.scrollTop / maxPreviewScroll;
    markdownInput.scrollTop = percentage * maxEditorScroll;
  }
  setTimeout(() => { isPreviewScrolling = false; }, 60);
});

fontSelect.addEventListener('change', (e) => {
  setFont(e.target.value);
});

toggleFooter.addEventListener('change', () => {
  paginate();
});

// Interactive Task Checkboxes in Preview Canvas
previewCanvas.addEventListener('click', (e) => {
  const target = e.target.closest('input[type="checkbox"]');
  if (!target) return;

  e.preventDefault();
  e.stopPropagation();

  const allCheckboxes = Array.from(previewCanvas.querySelectorAll('.page-content input[type="checkbox"]'));
  const checkboxIndex = allCheckboxes.indexOf(target);
  if (checkboxIndex === -1) return;

  const text = markdownInput.value;
  // Match any markdown task list line: - [ ], - [x], * [ ], + [ ], 1. [ ], etc.
  const taskRegex = /^([ \t]*[-*+]|[ \t]*\d+\.)[ \t]+\[([ xX])\]/gm;
  let match;
  let count = 0;
  let targetMatch = null;

  while ((match = taskRegex.exec(text)) !== null) {
    if (count === checkboxIndex) {
      targetMatch = {
        index: match.index,
        prefix: match[1],
        currentStatus: match[2],
        fullMatchLength: match[0].length
      };
      break;
    }
    count++;
  }

  if (targetMatch) {
    const newStatus = (targetMatch.currentStatus === ' ') ? 'x' : ' ';
    const newMatchStr = `${targetMatch.prefix} [${newStatus}]`;
    const updatedText = text.substring(0, targetMatch.index) + newMatchStr + text.substring(targetMatch.index + targetMatch.fullMatchLength);

    const selectionStart = markdownInput.selectionStart;
    const selectionEnd = markdownInput.selectionEnd;

    markdownInput.value = updatedText;
    markdownInput.setSelectionRange(selectionStart, selectionEnd);

    paginate();
  }
});

exportPdfBtn.addEventListener('click', () => {
  window.print();
});

// Markdown Syntax Guide / Wiki Modal
const wikiBtn = document.getElementById('wiki-btn');
const wikiModal = document.getElementById('wiki-modal');
const wikiCloseBtn = document.getElementById('wiki-close-btn');

function openWiki() {
  if (wikiModal) {
    wikiModal.classList.add('is-open');
    wikiModal.setAttribute('aria-hidden', 'false');
  }
}

function closeWiki() {
  if (wikiModal) {
    wikiModal.classList.remove('is-open');
    wikiModal.setAttribute('aria-hidden', 'true');
  }
}

if (wikiBtn && wikiModal && wikiCloseBtn) {
  wikiBtn.addEventListener('click', openWiki);
  wikiCloseBtn.addEventListener('click', closeWiki);
  wikiModal.addEventListener('click', (e) => {
    if (e.target === wikiModal) {
      closeWiki();
    }
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && wikiModal.classList.contains('is-open')) {
      closeWiki();
    }
  });
}

// Short & minimalist default sample document
const initialMarkdown = `# Thot — Markdown Editor

A minimalist Markdown editor designed for distraction-free writing and clean **A4 PDF export**.

---

> Written with [Thot](https://guillaumehonore.com/thot)
`;

// Initialisation
markdownInput.value = initialMarkdown;
setFont(fontSelect.value);

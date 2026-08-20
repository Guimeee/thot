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
 * Creates an authentic A4 page element with responsive wrapper
 */
function createPageElement(pageIndex, showFooter) {
  const wrapper = document.createElement('div');
  wrapper.className = 'a4-page-wrapper';

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

  wrapper.appendChild(page);
  return wrapper;
}

/**
 * Splits overflowing elements across pages
 */
function appendOrSplit(el, createNextPage, getCurrentContent, maxHeight) {
  let content = getCurrentContent();
  content.appendChild(el);

  // If it fits completely on the current page, we're done
  if (content.scrollHeight <= maxHeight) {
    return;
  }

  const tag = el.tagName.toLowerCase();

  // 1. Paragraphs (split token by token: words, spaces, <br> line breaks)
  if (tag === 'p') {
    content.removeChild(el);
    splitParagraphTokens(el, createNextPage, getCurrentContent, maxHeight);
    return;
  }

  // 2. Lists (UL / OL)
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

        if (currentList.children.length === 0 && currentList.parentNode === content) {
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

  // 3. Tables
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

        if (currentTbody.children.length === 0 && currentTable.parentNode === content) {
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

  // 4. Code Blocks (PRE)
  if (tag === 'pre') {
    content.removeChild(el);
    splitPreLines(el, createNextPage, getCurrentContent, maxHeight);
    return;
  }

  // 5. Headings (H1-H6) - prevent orphan headings at the bottom of pages
  if (/^h[1-6]$/.test(tag)) {
    content.removeChild(el);
    if (content.children.length > 0 && content.scrollHeight + 100 > maxHeight) {
      content = createNextPage();
    }
    content.appendChild(el);
    return;
  }

  // 6. Blockquotes, HR, Images, and other blocks
  content.removeChild(el);
  if (content.children.length > 0) {
    content = createNextPage();
  }
  content.appendChild(el);
}

/**
 * Splits paragraphs token by token (<br> tags, spaces, words) across pages cleanly
 */
function splitParagraphTokens(pEl, createNextPage, getCurrentContent, maxHeight) {
  let content = getCurrentContent();
  const text = pEl.innerHTML;
  const tokens = text.split(/(<br\s*\/?>|\s+)/gi);
  pEl.innerHTML = '';
  content.appendChild(pEl);

  let currentP = pEl;
  let tokenBuf = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (!token) continue;

    tokenBuf.push(token);
    currentP.innerHTML = tokenBuf.join('');

    if (content.scrollHeight > maxHeight) {
      tokenBuf.pop();
      currentP.innerHTML = tokenBuf.join('');

      if (tokenBuf.length === 0 && currentP.parentNode === content) {
        content.removeChild(currentP);
      }

      content = createNextPage();
      currentP = document.createElement('p');
      currentP.style.fontFamily = currentFontFamily;
      content.appendChild(currentP);

      if (token.toLowerCase().startsWith('<br') || token.trim() === '') {
        tokenBuf = [];
      } else {
        tokenBuf = [token];
        currentP.innerHTML = token;
      }
    }
  }
}

function splitPreLines(preEl, createNextPage, getCurrentContent, maxHeight) {
  let content = getCurrentContent();
  const codeEl = preEl.querySelector('code');
  const rawCode = codeEl ? codeEl.textContent : preEl.textContent;
  const lines = rawCode.split('\n');

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

      if (lineBuf.length === 0 && currentPre.parentNode === content) {
        content.removeChild(currentPre);
      }

      content = createNextPage();
      currentPre = document.createElement('pre');
      currentCode = document.createElement('code');
      if (codeEl && codeEl.className) currentCode.className = codeEl.className;
      currentPre.appendChild(currentCode);
      content.appendChild(currentPre);

      lineBuf = [lines[l]];
      currentCode.textContent = lines[l];
    }
  }
}

/**
 * Removes any empty page wrappers created during adjustments
 */
function cleanOrphanHeadings() {
  const allWrappers = Array.from(previewCanvas.querySelectorAll('.a4-page-wrapper'));
  allWrappers.forEach((wrapper) => {
    const content = wrapper.querySelector('.page-content');
    if (content && content.children.length === 0 && previewCanvas.children.length > 1) {
      wrapper.remove();
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
 * Calculates and updates scale factor for mobile preview so authentic A4 sheets fit screen width
 */
function updateMobileScale() {
  const canvasWidth = previewCanvas.clientWidth;
  if (canvasWidth && canvasWidth < 820) {
    // 210mm is 793.7px at standard 96 DPI
    const a4PxWidth = 794;
    const availableWidth = Math.max(canvasWidth - 20, 260);
    const scale = Math.min(availableWidth / a4PxWidth, 1);
    document.documentElement.style.setProperty('--page-scale', scale.toFixed(4));
  } else {
    document.documentElement.style.setProperty('--page-scale', '1');
  }
}

window.addEventListener('resize', updateMobileScale);

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
    const emptyWrapper = createPageElement(1, showFooter);
    previewCanvas.appendChild(emptyWrapper);
    updateMobileScale();
    updateStats(markdownText, 1);
    return;
  }

  let pageIndex = 1;
  let currentWrapper = createPageElement(pageIndex, showFooter);
  previewCanvas.appendChild(currentWrapper);
  let currentPage = currentWrapper.querySelector('.a4-page');
  let currentContent = currentPage.querySelector('.page-content');

  // True A4 printable height (297mm - 40mm margins = ~971px)
  const maxHeight = currentContent.clientHeight || 971;

  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    appendOrSplit(
      el,
      () => {
        pageIndex++;
        currentWrapper = createPageElement(pageIndex, showFooter);
        previewCanvas.appendChild(currentWrapper);
        currentPage = currentWrapper.querySelector('.a4-page');
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

  updateMobileScale();
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

const exportBtns = document.querySelectorAll('.export-trigger-btn, #export-pdf-btn');
exportBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    window.print();
  });
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

// Mobile View Toggle (Write ↔ Preview)
const appEl = document.getElementById('app');
const viewEditBtn = document.getElementById('view-edit-btn');
const viewPreviewBtn = document.getElementById('view-preview-btn');

function setMobileView(view) {
  if (!appEl) return;
  appEl.setAttribute('data-mobile-view', view);

  if (viewEditBtn && viewPreviewBtn) {
    if (view === 'edit') {
      viewEditBtn.classList.add('active');
      viewPreviewBtn.classList.remove('active');
    } else {
      viewPreviewBtn.classList.add('active');
      viewEditBtn.classList.remove('active');
      paginate();
    }
  }
}

if (viewEditBtn && viewPreviewBtn) {
  viewEditBtn.addEventListener('click', () => setMobileView('edit'));
  viewPreviewBtn.addEventListener('click', () => setMobileView('preview'));
  setMobileView('edit');
}

// Short & minimalist default sample document
const initialMarkdown = `# Thot — Markdown Editor

A minimalist Markdown editor designed for distraction-free writing and clean **A4 PDF export**.

---

> Written with [Thot](https://guillaumehonore.com/thot)
`;

// Ensure mobile window/body is strictly pinned at (0, 0) and header is never lost
window.addEventListener('scroll', () => {
  if (window.scrollY !== 0 || window.scrollX !== 0) {
    window.scrollTo(0, 0);
  }
});

function handleViewportChange() {
  if (window.visualViewport) {
    const vh = window.visualViewport.height;
    document.documentElement.style.setProperty('--app-height', `${vh}px`);
    updateMobileScale();
    if (window.scrollY !== 0 || window.scrollX !== 0) {
      window.scrollTo(0, 0);
    }
  }
}

if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', handleViewportChange);
  window.visualViewport.addEventListener('scroll', handleViewportChange);
  document.documentElement.style.setProperty('--app-height', `${window.visualViewport.height}px`);
}

// Initialisation
markdownInput.value = initialMarkdown;
setFont(fontSelect.value);

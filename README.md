# 𓁟 Thot — Markdown Editor & Native A4 PDF Exporter

[![License: MIT](https://img.shields.io/badge/License-MIT-red.svg)](https://opensource.org/licenses/MIT)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Marked](https://img.shields.io/badge/Parser-Marked-orange.svg)](https://marked.js.org/)

**Thot** (named after the ancient Egyptian god of wisdom and writing) is a minimalist, 100% client-side web application designed to write Markdown in real time with an authentic **multi-page A4 paper preview** and export pixel-perfect **vector PDFs** natively through the browser.

> 🌐 **Live Demo**: Available online at [guillaumehonore.com/thot](https://guillaumehonore.com/thot)

---

## ✨ Features

- ⚡ **Real-Time Markdown Parsing**: Instant live rendering powered by [Marked](https://marked.js.org/).
- 📄 **Dynamic Multi-Page A4 Engine**: Automatic content pagination across real A4 sheets (`210mm × 297mm`) with intelligent splitting for lists, tables, code blocks, and orphan heading prevention.
- 🎨 **Typography Switcher**: Easily switch between standard system fonts and dynamically loaded Google Fonts (*Inter, Roboto, Open Sans, Montserrat, Lora, Merriweather, Playfair Display, Fira Code*).
- 🖨️ **Native Vector PDF Export**: High-resolution printing via `window.print()` and CSS `@media print` with forced background color preservation (`print-color-adjust: exact`).
- 🔢 **Optional Page Numbering**: Toggle footer page numbering (`Page X / N`) on or off with a single click.
- 🌐 **100% Client-Side & Static**: Zero backend required. Can be hosted anywhere (GitHub Pages, Netlify, Vercel, Cloudflare Pages, OVH, or embedded via `<iframe>`).
- 🚀 **Automated CI/CD**: Ready-to-use GitHub Actions workflow for automated FTP deployments.

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Start the local development server
```bash
npm run dev
```
The application will be running at `http://localhost:5173`.

### 3. Build for production
```bash
npm run build
```
Compiled static assets will be generated in the `dist/` directory with relative asset paths (`base: './'`).

### 4. Preview production build locally
```bash
npm run preview
```

---

## 📁 Project Structure

```
thot/
├── .github/
│   └── workflows/
│       └── deploy.yml       # CI/CD GitHub Actions workflow for automated FTP deploy
├── .gitignore               # Ignored files and folders
├── index.html               # Semantic HTML structure & toolbar
├── main.js                  # Markdown parser, dynamic fonts & pagination engine
├── package.json             # Scripts and dependencies (marked, vite)
├── style.css                # Minimalist design system, A4 simulation & @media print
├── vite.config.js           # Vite configuration with relative base paths
├── LICENSE                  # MIT License
└── README.md                # Project documentation
```

---

## 🌐 Embedding in Your Website

Because Thot is completely static and built with relative asset links, you can easily integrate it into an existing site or portfolio:

### Direct Subfolder Hosting
Copy the contents of the `dist/` folder into your site's subfolder (e.g. `https://your-domain.com/thot/`).

### Iframe Embedding
```html
<iframe
  src="/thot/"
  style="width: 100%; height: 90vh; border: none; border-radius: 8px;"
  title="Thot Markdown Editor">
</iframe>
```

---

## ⚙️ Automated Deployment (GitHub Actions)

The included workflow `.github/workflows/deploy.yml` automatically compiles and deploys the application to your web server via FTP upon pushing to the `main` branch.

### Required GitHub Secrets:
In your GitHub repository settings (**Settings** > **Secrets and variables** > **Actions** > **New repository secret**), configure:

- `FTP_SERVER`: Your FTP host (e.g. `ftp.your-domain.com`)
- `FTP_USERNAME`: Your FTP username
- `FTP_PASSWORD`: Your FTP password

Target directory configured on the server: `./www/thot/`.

---

## 🤝 Contributing & Community Ideas

Thot is a free, open-source, and distraction-free Markdown editor designed for everyone.

Feedback, feature ideas, and contributions are warmly welcome! If you'd like to help improve the tool:
- **Share your ideas & suggestions**: Open an issue on GitHub to suggest new features, improvements, or report bugs.
- **Contribute code**: Feel free to submit Pull Requests to enhance the editor, add new fonts, optimize pagination, or improve styling.

Let's build a simple, reliable, and accessible Markdown writing tool together!

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) — see the [LICENSE](LICENSE) file for details.

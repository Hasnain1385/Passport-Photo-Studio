# 📸 Passport Photo Studio

A lightweight Electron + Vite app for arranging and exporting passport photos.


⭐ Developer: Mirza Hasnain Baig

Built with Google Gemini. If you like this project, please subscribe:
https://www.youtube.com/channel/UCFLQuLM-EcOm7r8ZtvITfKA?sub_confirmation=1

---
## 🖥️ Screenshoot

<img src="/screenshoots/Main.png" alt="Editor preview" width="700" />

## 🚀 Features

- Simple passport photo layout and cropping UI
- Desktop app via Electron with a web preview (Vite)
- Uses Google Gemini for AI features (requires API key)

---

## 🧰 Prerequisites

- Node.js (v18+ recommended)
- npm (or yarn)
- (Optional) Windows: install required build tools for `electron-builder` if packaging

---

## ⚡ Quick Start (Run Locally)

Open a terminal in the project root and run:

```powershell
npm install
# Set your Gemini API key in an env file (see Env section)
npm run dev
```

This starts the Vite dev server (web). To run the Electron desktop app during development:

```powershell
npm run electron:dev
```

Notes:
- `electron:dev` uses `concurrently` and `wait-on` to start Vite and then Electron.
- The web preview runs on `http://localhost:5173` by default.

---

## 🏗️ Build for Production

Web build (Vite):

```powershell
npm run build
```

Build and package the Electron app for Windows (uses `electron-builder`):

```powershell
npm run electron:build
```

Packaged output will be placed in the `release` directory (per `package.json` build config).

---

## 🔒 Environment Variables

Create an env file (do NOT commit this file):

```powershell
# Create a .env.local or .env
echo "GEMINI_API_KEY=your_api_key_here" > .env.local
```

Replace `your_api_key_here` with your Gemini API key.

---

## 📁 Project Structure (high level)

- `App.tsx`, `index.tsx`, `index.html` — app entry (React + Vite)
- `electron/` — Electron `main.js` and `preload.js`
- `components/` — React components (LandingPage, PhotoEditor, etc.)
- `services/apiService.ts` — wrapper for API calls
- `package.json` — scripts and build config

---

## 🤝 Contributing

Contributions are welcome — raise issues or PRs. Please avoid committing secrets like API keys.

---

## 📝 License

This project is licensed under the MIT License — see `LICENSE` file.

---

## 🙋 Contact / Credits

- **Developer:** Mirza Hasnain Baig
- **Built with:** Google Gemini
- **YouTube:** https://www.youtube.com/channel/UCFLQuLM-EcOm7r8ZtvITfKA?sub_confirmation=1

Enjoy! 🎉



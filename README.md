<div align="center">

# Idea Land

A mobile-first PWA for capturing ideas with AI-powered voice transcription and smart note polishing. Save directly to Obsidian.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/import/project)

</div>

## Features

- **Voice Transcription** — Tap to record, powered by Gemini AI with auto language detection (Chinese, English, or mixed)
- **Smart Fallback** — If Gemini fails (quota/network), browser speech recognition takes over automatically
- **Magic Polish** — AI rewrites rough notes into clean Markdown with tags
- **Obsidian Integration** — One-tap export to your Obsidian vault via URI scheme
- **PWA Support** — Install to home screen for a native app experience
- **Offline Draft** — Unsaved content persists in localStorage

## Getting Started

**Prerequisites:** Node.js 18+

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env.local` file with your Gemini API key:
   ```
   API_KEY=your_gemini_api_key
   ```

3. Run the dev server:
   ```bash
   npm run dev
   ```

## Deploy to Vercel

1. Push this repo to GitHub
2. Import it in [Vercel](https://vercel.com)
3. Add the `API_KEY` environment variable in Vercel project settings
4. Deploy — the included `vercel.json` handles SPA routing

## Configuration

Open **Settings** (gear icon) in the app to configure:

| Setting | Description |
|---------|-------------|
| **Vault Name** | Your Obsidian vault name (case-sensitive, required) |
| **Inbox Folder** | Folder path in vault (leave empty for root) |
| **File Name Template** | Supports `{{date}}`, `{{time}}`, `{{year}}`, `{{month}}`, `{{day}}`, `{{hour}}`, `{{minute}}`, `{{second}}` |
| **Note Template** | Use `{{content}}` for note body, plus any date/time tokens |
| **Browser Fallback** | Enable/disable browser speech recognition fallback (default: on) |
| **Browser Language** | Language for fallback transcription (default: Chinese Simplified) |

## Tech Stack

- React 19 + TypeScript
- Vite
- Google Gemini API (`@google/genai`)
- Web Speech API (fallback)
- Lucide React (icons)

## Project Structure

```
├── index.tsx                  # Main app component
├── components/
│   ├── Editor.tsx             # Text editor
│   ├── Header.tsx             # App header with copy/settings
│   ├── SettingsModal.tsx      # Settings panel
│   ├── Toast.tsx              # Toast notifications
│   └── Toolbar.tsx            # Record/polish/clear/send toolbar
├── utils/
│   ├── helpers.ts             # Audio, MIME type, template utilities
│   └── styles.ts              # Shared styles and colors
├── manifest.json              # PWA manifest
├── service-worker.js          # Service worker for offline support
├── vercel.json                # SPA rewrite rules
└── vite.config.ts             # Vite configuration
```

## License

MIT

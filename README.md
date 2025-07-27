# BearMind

BearMind is an intelligent browser extension that transforms your web browsing into an interactive, AI-powered experience. It enables you to chat with content from single or multiple browser tabs, search and extract information from web pages, and even interact with YouTube videos conversationally.

---

## Features

| Status      | Feature                                 | Complexity |
| ----------- | --------------------------------------- | ---------- |
| Completed   | Chat with single or multiple tabs       | Easy       |
| In Progress | Find anything in a tab                  | Hard       |
| In Progress | Chat with YouTube video                 | Medium     |
| Completed   | API key management (Gemini/OpenAI)      | Easy       |
| Completed   | Theme, font size, and language settings | Easy       |
| Completed   | Markdown and code block rendering       | Medium     |
| Completed   | Tab selection and highlight management  | Medium     |
| Completed   | Local storage for settings              | Easy       |

---

## Technology Stack

- **React** (UI)
- **TypeScript** (type safety)
- **Tailwind CSS** & **Shadcn UI** (styling)
- **WXT** (browser extension framework)
- **Google Gemini API** & **OpenAI** (AI models)
- **i18next** (localization)
- **Radix UI** (UI primitives)
- **Tiptap** (rich text editor)
- **Fuse.js** (search)

---

## Folder Structure

```
assets/           # Icons, CSS, images
components/       # React components (UI, settings, chat, context, etc.)
demo/             # Demo media
entrypoints/      # Extension entrypoints (background, sidebar, content, popup, sidepanel)
hooks/            # Custom React hooks
locales/          # Localization files (en, vi)
public/           # Static assets and _locales for extension
utils/            # Utility functions (browser tabs, LLM, prompts, etc.)
```

---

## Installation

```bash
# Clone the repository
git clone https://github.com/LETHEVIET/bearmind.git
cd bearmind

# Install dependencies (use npm or pnpm)
pnpm install

# Build the extension
pnpm run build

# For development (hot reload)
pnpm run dev
```

---

## Configuration & Usage

### 1. API Key Setup
- Open the extension's settings (gear icon or via the side panel).
- Enter your Gemini API key (or OpenAI key if supported) in the API Key field and save.

### 2. Settings
- **Theme:** Switch between light/dark mode.
- **Font Size:** Adjust chat font size.
- **Language:** Choose interface language (English, Vietnamese).
- **Tab Management:** Select, highlight, and manage browser tabs for chat context.

### 3. Chat & Search
- Start a conversation with the content of one or more tabs.
- Use the search toggle to enable/disable AI-powered search within tabs.
- For YouTube tabs, ask questions about the video; answers may include timestamps.

---

## Development Scripts

- `pnpm run dev` — Start development server (Chrome)
- `pnpm run dev:firefox` — Start development server (Firefox)
- `pnpm run build` — Build for production
- `pnpm run build:firefox` — Build for Firefox
- `pnpm run zip` — Package extension for distribution
- `pnpm run compile` — Type-check only

---

## Localization
- Add new languages in `locales/` and `public/_locales/`.
- Uses `i18next` for runtime translation.

---

## Contributing

1. Fork the repository and create a new branch.
2. Make your changes and add tests if applicable.
3. Run `pnpm run build` to ensure the extension builds successfully.
4. Submit a pull request with a clear description of your changes.

---

## License
MIT

---

## Demo

![BearMind Demo](demo/demo.gif)

---

## Support
For issues or feature requests, open an issue on [GitHub](https://github.com/LETHEVIET/bearmind/issues).

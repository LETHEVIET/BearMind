import './style.css';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import {i18nConfig} from "@/components/i18nConfig.ts";
import initTranslations from "@/components/i18n.ts";
import {ThemeProvider} from "@/components/theme-provider.tsx";
import { browser } from "wxt/browser";

// Listen for messages from the extension
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getPageContent") {
    // Get the page HTML content
    const content = document.documentElement.outerHTML;
    sendResponse(content);
    return true; // Important for async response
  }
});


export default defineContentScript({
    matches: ['*://*/*'],
    cssInjectionMode: 'ui',
    async main(ctx) {
        initTranslations(i18nConfig.defaultLocale, ["common", "content"])
        const ui = await createShadowRootUi(ctx, {
            name: 'language-learning-content-box',
            position: 'inline',
            onMount: (container) => {
                console.log(container);
                const root = ReactDOM.createRoot(container);
                root.render(
                    <ThemeProvider>
                        <App/>
                    </ThemeProvider>
                );
                return root;
            },
            onRemove: (root) => {
                root?.unmount();
            },
        });

        ui.mount();
    },
});

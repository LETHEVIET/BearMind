import {defineConfig} from 'wxt';
import react from '@vitejs/plugin-react';

// See https://wxt.dev/api/config.html
export default defineConfig({
    modules: ['@wxt-dev/auto-icons'],
    autoIcons: {
        enabled: true,
        baseIconPath: 'assets/icon.png',
        grayscaleOnDevelopment: true,
        sizes: [128, 48, 32, 16],
    },
    manifest: {
        permissions: ["activeTab", "scripting", "sidePanel", "storage", "tabs"],
        action: {},
        name: 'BearMind',
        description: '__MSG_extDescription__',
        default_locale: "en"
    },
    vite: () => ({
        plugins: [react()],
    }),
});

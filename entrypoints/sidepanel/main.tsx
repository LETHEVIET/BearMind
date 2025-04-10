import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './style.css';
import { Toaster } from "@/components/ui/toaster.tsx";
// Supports weights 100-900
// import '@fontsource-variable/geist-mono';
// Supports weights 100-900
import '@fontsource-variable/inter';

import { AppContextProvider } from '@/components/AppContext';
import { i18nConfig } from "@/components/i18nConfig.ts";
import initTranslations from "@/components/i18n.ts";

// Initialize translations
initTranslations(i18nConfig.defaultLocale, ["common", "sidepanel"])

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <AppContextProvider>
            <App/>
            <Toaster />
        </AppContextProvider>
    </React.StrictMode>,
);

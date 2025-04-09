import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './style.css';
import {ThemeProvider} from "@/components/theme-provider.tsx";
import {i18nConfig} from "@/components/i18nConfig.ts";
import initTranslations from "@/components/i18n.ts";
import { Toaster } from "@/components/ui/toaster.tsx";
// Supports weights 100-900
import '@fontsource-variable/geist-mono';

initTranslations(i18nConfig.defaultLocale,["common","sidepanel"])

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ThemeProvider>
            <App/>
            <Toaster />
        </ThemeProvider>
    </React.StrictMode>,
);

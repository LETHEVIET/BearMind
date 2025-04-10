import React from "react";
import {I18nSettings} from "@/components/settings/i18n-settings.tsx";
import {ThemeSettings} from "@/components/settings/theme-settings.tsx";
import {FontSizeSettings} from "@/components/settings/font-size-settings.tsx";

export function SettingsPage() {
    return (
        <div className="grid gap-4">
            <I18nSettings/>
            <ThemeSettings/>
            <FontSizeSettings/>
        </div>
    )
}


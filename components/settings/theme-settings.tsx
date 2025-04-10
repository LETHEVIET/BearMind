import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '@/components/AppContext';
import { SettingsDropdown } from '@/components/ui/settings-dropdown';

export function ThemeSettings() {
  const { ui, setTheme } = useAppContext();
  const themes = ["light", "dark", "system"];
  const { t } = useTranslation();
  
  const handleThemeChange = (value: string) => {
    setTheme(value as 'light' | 'dark' | 'system');
  };
  
  return (
    <SettingsDropdown
      title={t("themeSettings")}
      currentValue={ui.theme || 'system'}
      items={themes}
      onSelect={handleThemeChange}
    />
  );
}

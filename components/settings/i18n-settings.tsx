import React from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '@/components/AppContext';
import { SettingsDropdown } from '@/components/ui/settings-dropdown';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

// Available languages
const languages = [
  { value: 'en', label: 'English' },
  { value: 'vi', label: 'Tiếng Việt' },
];

// Font sizes definition
const fontSizes = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
];

export function I18nSettings() {
  const { ui, setLanguage, setFontSize } = useAppContext();
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      <SettingsDropdown
        title={t("i18nSettings")}
        currentValue={ui.language}
        items={languages}
        onSelect={(value) => setLanguage(value)}
      />
    </div>
  );
}

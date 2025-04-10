import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '@/components/AppContext';
import { SettingsDropdown } from '@/components/ui/settings-dropdown';

export function FontSizeSettings() {
  const { ui, setFontSize } = useAppContext();
  const fontSizes = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' },
  ];
  const { t } = useTranslation();
  
  return (
    <SettingsDropdown
      title={t('fontSizeSettings', 'Font Size')}
      currentValue={ui.fontSize}
      items={fontSizes}
      onSelect={(value) => setFontSize(value as 'small' | 'medium' | 'large')}
    />
  );
}
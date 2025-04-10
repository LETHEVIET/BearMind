import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '@/components/AppContext';
import { toast } from '../../hooks/use-toast';

export function ApiKeySettings() {
  const { session, setApiKey } = useAppContext();
  const [tempApiKey, setTempApiKey] = useState(session.apiKey);
  const { t } = useTranslation();
  
  const handleSave = () => {
    setApiKey(tempApiKey);
    toast({
      title: "Success",
      description: "API key has been saved successfully.",
      duration: 1000,
    });
  };
  
  return (
    <div className='flex flex-col gap-2 align-start'>
      <div className="">
        <h3 className="font-semibold text-left text-base text-foreground">Gemini API Key</h3>
      </div>
      <div className="flex gap-2">
        <Input 
          value={tempApiKey} 
          onChange={(e) => setTempApiKey(e.target.value)} 
          placeholder="Enter API key..." 
          type="password"
          className='text-sm text-foreground'
        />
        <Button className='text-sm' onClick={handleSave}>Save</Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Enter your Gemini API key to enable AI features
      </p>
    </div>
  );
}
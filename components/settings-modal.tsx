import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Book, Plus, Settings } from "lucide-react";
import { ApiKeySettings } from "@/components/settings/api-key-settings";
import { ConvertedTabsDrawer } from "@/components/converted-tabs-drawer";
import { Drawer } from "@/components/ui/drawer";

export function SettingsModal({ resetChat, convertedTabIds = [] }: { readonly resetChat?: () => void, readonly convertedTabIds?: number[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isTabsDrawerOpen, setIsTabsDrawerOpen] = useState(false);

  const handleResetChat = () => {
    if (resetChat) {
      resetChat();
    }
  };

  return (
    <div className="flex items-center justify-end gap-2">
      <Button 
        variant="ghost" 
        size="no" 
        onClick={() => setIsTabsDrawerOpen(true)}
        className="p-2 rounded-md"
        title="Open Read Tabs"
        disabled={convertedTabIds.length === 0}
      >
        <Book className="h-4 w-4" />
      </Button>

      <Button 
        variant="ghost" 
        size="no" 
        onClick={handleResetChat}
        className="p-2 rounded-md"
        title="Reset Chat"
      >
        <Plus className="h-4 w-4" />
      </Button>

      <Button 
        variant="ghost" 
        size="no" 
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-md"
        title="Settings"
      >
        <Settings className="h-4 w-4" />
      </Button>

      {/* Settings Drawer */}
      <Drawer open={isOpen} onOpenChange={setIsOpen} side="right">
        <div className="flex flex-col h-full">
          <h2 className="text-lg font-semibold mb-4">Settings</h2>
          <div className="grid gap-4 py-2">
            <ApiKeySettings />
          </div>
        </div>
      </Drawer>

      {/* Converted Tabs Drawer */}
      <ConvertedTabsDrawer 
        open={isTabsDrawerOpen} 
        onOpenChange={setIsTabsDrawerOpen} 
        convertedTabIds={convertedTabIds} 
      />
    </div>
  );
}
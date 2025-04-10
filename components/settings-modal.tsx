import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Book, Plus, Settings, X } from "lucide-react";
import { ApiKeySettings } from "@/components/settings/api-key-settings";
import { ThemeSettings } from "@/components/settings/theme-settings";
import { I18nSettings } from "@/components/settings/i18n-settings";
import { FontSizeSettings } from "@/components/settings/font-size-settings";
import { ConvertedTabsDrawer } from "@/components/converted-tabs-drawer";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { useAppContext } from "./AppContext";
import { Card } from "./ui/card";
import { Separator } from "./ui/separator";

export function SettingsModal({
  resetChat,
}: {
  readonly resetChat?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isTabsDrawerOpen, setIsTabsDrawerOpen] = useState(false);
  const { session } = useAppContext();

  const handleResetChat = () => {
    if (resetChat) {
      resetChat();
    }
  };

  return (
    <div className="flex  items-center justify-end gap-2">
      <Button
        variant="ghost"
        size="no"
        onClick={() => setIsTabsDrawerOpen(true)}
        className="p-2 rounded-md text-foreground"
        title="Open Read Tabs"
        disabled={session.convertedTabIds.length === 0}
      >
        <Book className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="no"
        onClick={handleResetChat}
        className="p-2 rounded-md text-foreground"
        title="Reset Chat"
      >
        <Plus className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="no"
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-md text-foreground"
        title="Settings"
      >
        <Settings className="h-4 w-4" />
      </Button>

      {/* Settings Drawer */}
      <Drawer open={isOpen} onOpenChange={setIsOpen} side="right">
        <DrawerContent className="flex flex-col h-full">
          <DrawerHeader>
            <DrawerTitle className="text-foreground">Settings</DrawerTitle>
            <DrawerClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </DrawerClose>
          </DrawerHeader>
          <div className="flex-col gap-2 overflow-y-auto flex-1">
            {/* <Card className="p-4 text-center text-muted-foreground"> */}
            <div className="flex flex-col gap-2 align-start p-4">
              <p className="font-semibold text-lg text-foreground">Assistant</p>
              <Separator />
              <ApiKeySettings />
            </div>
            <div className="flex flex-col gap-2 align-start p-4">
              <p className="font-semibold text-lg text-foreground">Appearance</p>
              <Separator />
              <ThemeSettings />
              <FontSizeSettings />
              <I18nSettings />
            </div>
            {/* </Card> */}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Converted Tabs Drawer */}
      <ConvertedTabsDrawer
        open={isTabsDrawerOpen}
        onOpenChange={setIsTabsDrawerOpen}
      />
    </div>
  );
}

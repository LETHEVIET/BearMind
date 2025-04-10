import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

interface SettingsDropdownItem {
  value: string;
  label: string;
}

interface SettingsDropdownProps {
  title: string;
  currentValue: string;
  items: SettingsDropdownItem[] | string[];
  onSelect: (value: string) => void;
  align?: "start" | "end" | "center";
}

export function SettingsDropdown({ 
  title, 
  currentValue, 
  items, 
  onSelect,
  align = "end" 
}: SettingsDropdownProps) {
  const normalizedItems = items.map(item => 
    typeof item === 'string' ? { value: item, label: item } : item
  );
  
  return (
    <div className='flex justify-between items-center gap-2'>
      <div className="flex flex-col gap-2 align-start">
        <h3 className="text-left text-sm text-foreground">{title}</h3>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size={"default"}
            className="w-fit justify-between"
          >
            <span className="capitalize text-foreground text-sm">
              {normalizedItems.find(item => item.value === currentValue)?.label || currentValue}
            </span>
            <ChevronDown className="h-4 w-4 opacity-50 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-fit" align={align}>
          {normalizedItems.map((item) => (
            <DropdownMenuItem
              key={item.value}
              className="capitalize text-foreground text-sm"
              onClick={() => onSelect(item.value)}
            >
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

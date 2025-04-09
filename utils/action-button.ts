import { LucideIcon } from "lucide-react";
import {
    Text,
    CheckCheck,
    ArrowDownWideNarrow,
    CornerRightDown,
} from "lucide-react";

const DEFAULT_ACTIONS: ActionItem[] = [
  {
      text: "Summary",
      icon: Text,
      colors: {
          icon: "text-[color:var(--tw-color-orange-600)]",
          border: "border-[color:var(--tw-color-orange-500)]",
          bg: "bg-[color:var(--tw-color-orange-100)]",
      },
  },
  {
      text: "Fix Spelling and Grammar",
      icon: CheckCheck,
      colors: {
          icon: "text-[color:var(--tw-color-emerald-600)]",
          border: "border-[color:var(--tw-color-emerald-500)]",
          bg: "bg-[color:var(--tw-color-emerald-100)]",
      },
  },
  {
      text: "Make shorter",
      icon: ArrowDownWideNarrow,
      colors: {
          icon: "text-[color:var(--tw-color-purple-600)]",
          border: "border-[color:var(--tw-color-purple-500)]",
          bg: "bg-[color:var(--tw-color-purple-100)]",
      },
  },
];

interface ActionItem {
  text: string;
  icon: LucideIcon;
  colors: {
      icon: string;
      border: string;
      bg: string;
  };
}


export { DEFAULT_ACTIONS };
export type { ActionItem };
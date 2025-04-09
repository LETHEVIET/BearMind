"use client";

import { Globe } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SearchToggleButtonProps {
  /**
   * Current state of the search toggle
   */
  readonly enabled: boolean;
  
  /**
   * Called when the toggle is clicked
   */
  readonly onToggle: () => void;
  
  /**
   * Optional label text that appears when enabled
   * @default "Search"
   */
  readonly label?: string;
  
  /**
   * Optional className for additional styling
   */
  readonly className?: string;
}

export function SearchToggleButton({
  enabled,
  onToggle,
  label = "Search",
  className,
}: SearchToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "rounded-full transition-all flex items-center gap-2 px-1.5 py-1 border",
        enabled
          ? "bg-sky-500/15 border-sky-400 text-sky-500"
          : "bg-black/5 dark:bg-white/5 border-transparent text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white",
        className
      )}
    >
      <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
        <motion.div
          animate={{
            rotate: enabled ? 180 : 0,
            scale: enabled ? 1.1 : 1,
          }}
          whileHover={{
            rotate: enabled ? 180 : 15,
            scale: 1.1,
            transition: {
              type: "spring",
              stiffness: 300,
              damping: 10,
            },
          }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 25,
          }}
        >
          <Globe
            className={cn(
              "w-4 h-4",
              enabled ? "text-sky-500" : "text-inherit"
            )}
          />
        </motion.div>
      </div>
      <AnimatePresence>
        {enabled && (
          <motion.span
            initial={{ width: 0, opacity: 0 }}
            animate={{
              width: "auto",
              opacity: 1,
            }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="text-xs overflow-hidden whitespace-nowrap text-sky-500 flex-shrink-0"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
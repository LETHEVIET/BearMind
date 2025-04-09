import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const drawerVariants = cva(
  "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom: "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right: "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
)

interface DrawerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof drawerVariants> {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const Drawer = React.forwardRef<HTMLDivElement, DrawerProps>(
  ({ className, children, side = "right", open, onOpenChange, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(open || false)
    const [isAnimating, setIsAnimating] = React.useState(false)

    React.useEffect(() => {
      if (open !== undefined) {
        if (open) {
          setIsOpen(true)
          setIsAnimating(true)
        } else {
          setIsAnimating(true)
          // We'll keep isOpen true during animation and set it to false after animation completes
        }
      }
    }, [open])

    const handleClose = () => {
      setIsAnimating(true)
      if (onOpenChange) {
        onOpenChange(false)
      }
      // Let the closing animation play before removing from DOM
      setTimeout(() => {
        setIsOpen(false)
      }, 300) // Match the data-[state=closed]:duration-300 from drawerVariants
    }

    const handleAnimationEnd = () => {
      setIsAnimating(false)
      if (!open) {
        setIsOpen(false)
      }
    }

    return (
      <>
        {isOpen && (
          <div className="fixed inset-0 z-50">
            <div
              className="fixed inset-0 bg-black/40 transition-opacity duration-300"
              style={{ opacity: open ? 1 : 0 }}
              onClick={handleClose}
              data-state={open ? "open" : "closed"}
            />
            <div
              ref={ref}
              data-state={open ? "open" : "closed"}
              className={cn(drawerVariants({ side }), className)}
              onAnimationEnd={handleAnimationEnd}
              {...props}
            >
              <button
                onClick={handleClose}
                className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </button>
              {children}
            </div>
          </div>
        )}
      </>
    )
  }
)
Drawer.displayName = "Drawer"

export { Drawer }
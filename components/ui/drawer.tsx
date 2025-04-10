import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/components/lib/utils"

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

interface DrawerProps {
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  side?: "top" | "bottom" | "left" | "right"
}

const DrawerContext = React.createContext<{
  open: boolean
  onOpenChange: (open: boolean) => void
  onClose: () => void
  side?: "top" | "bottom" | "left" | "right"
}>({
  open: false,
  onOpenChange: () => {},
  onClose: () => {},
})

function useDrawerContext() {
  const context = React.useContext(DrawerContext)
  if (!context) {
    throw new Error("useDrawerContext must be used within a DrawerProvider")
  }
  return context
}

const Drawer = ({ children, ...props }: DrawerProps) => {
  const [open, setOpen] = React.useState(props.open || false)
  
  const onOpenChange = React.useCallback((open: boolean) => {
    setOpen(open)
    props.onOpenChange?.(open)
  }, [props])

  const onClose = React.useCallback(() => {
    onOpenChange(false)
  }, [onOpenChange])
  
  React.useEffect(() => {
    if (props.open !== undefined) {
      setOpen(props.open)
    }
  }, [props.open])

  return (
    <DrawerContext.Provider 
      value={{ 
        open, 
        onOpenChange, 
        onClose,
        side: props.side 
      }}
    >
      {children}
    </DrawerContext.Provider>
  )
}

Drawer.displayName = "Drawer"

interface DrawerTriggerProps {
  children: React.ReactNode
  asChild?: boolean
}

const DrawerTrigger = React.forwardRef<
  HTMLButtonElement,
  DrawerTriggerProps & React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ children, asChild = false, ...props }, ref) => {
  const { onOpenChange } = useDrawerContext()
  
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    onOpenChange(true)
    props.onClick?.(event)
  }

  if (asChild) {
    return React.cloneElement(children as React.ReactElement, {
      ref,
      ...props,
      onClick: handleClick,
    })
  }

  return (
    <button
      ref={ref}
      type="button"
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  )
})

DrawerTrigger.displayName = "DrawerTrigger"

interface DrawerContentProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof drawerVariants> {}

const DrawerContent = React.forwardRef<HTMLDivElement, DrawerContentProps>(
  ({ className, children, side, ...props }, ref) => {
    const { open, onClose, side: contextSide } = useDrawerContext()
    const [isOpen, setIsOpen] = React.useState(open)
    const [isAnimating, setIsAnimating] = React.useState(false)
    
    const activeSide = side || contextSide || "right"

    React.useEffect(() => {
      if (open) {
        setIsOpen(true)
        setIsAnimating(true)
      } else {
        setIsAnimating(true)
        // We'll keep isOpen true during animation and set it to false after animation completes
      }
    }, [open])

    const handleAnimationEnd = () => {
      setIsAnimating(false)
      if (!open) {
        setIsOpen(false)
      }
    }

    return (
      <>
        {(isOpen || isAnimating) && (
          <div className="fixed inset-0 z-50">
            <div
              className="fixed inset-0 bg-black/40 transition-opacity duration-300"
              style={{ opacity: open ? 1 : 0 }}
              onClick={onClose}
              data-state={open ? "open" : "closed"}
            />
            <div
              ref={ref}
              data-state={open ? "open" : "closed"}
              className={cn(drawerVariants({ side: activeSide }), className)}
              onAnimationEnd={handleAnimationEnd}
              {...props}
            >
              {children}
            </div>
          </div>
        )}
      </>
    )
  }
)

DrawerContent.displayName = "DrawerContent"

const DrawerClose = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ children, asChild = false, ...props }, ref) => {
  const { onClose } = useDrawerContext()
  
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    onClose()
    props.onClick?.(event)
  }

  if (asChild) {
    return React.cloneElement(children as React.ReactElement, {
      ref,
      ...props,
      onClick: handleClick,
    })
  }

  return (
    <button
      ref={ref}
      className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
      onClick={handleClick}
      {...props}
    >
      <X className="h-4 w-4" />
      <span className="sr-only">Close</span>
    </button>
  )
})

DrawerClose.displayName = "DrawerClose"

const DrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("grid gap-1.5 p-4 text-center sm:text-left", className)}
    {...props}
  />
)

DrawerHeader.displayName = "DrawerHeader"

const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("mt-auto flex flex-col gap-2 p-4", className)}
    {...props}
  />
)

DrawerFooter.displayName = "DrawerFooter"

const DrawerTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))

DrawerTitle.displayName = "DrawerTitle"

const DrawerDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))

DrawerDescription.displayName = "DrawerDescription"

export {
  Drawer,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription
}
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-green focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-forest-green text-cream-50 hover:bg-forest-green-hover shadow-sm hover:shadow-md",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 shadow-sm hover:shadow-md",
        outline:
          "border border-cream-300 bg-cream-50 text-cream-800 hover:bg-cream-100",
        secondary:
          "bg-cream-100 text-cream-800 hover:bg-cream-200",
        ghost: "text-cream-800 hover:bg-cream-100",
        link: "text-forest-green underline-offset-4 hover:underline",
        gradient: "bg-gradient-to-r from-forest-green to-orange text-white hover:from-forest-green-hover hover:to-orange-hover shadow-sm hover:shadow-md",
        glass: "bg-cream-50/90 backdrop-blur-sm border border-cream-200 text-cream-800 hover:bg-cream-50 hover:shadow-sm",
        orange: "bg-orange text-white hover:bg-orange-hover shadow-sm hover:shadow-md",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-10 px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
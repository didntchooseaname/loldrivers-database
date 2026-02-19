import * as React from "react"

import { cn } from "@/lib/utils"

const CardSizeContext = React.createContext<"default" | "sm">("default")

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { size?: "default" | "sm" }
>(({ className, size = "default", ...props }, ref) => (
  <CardSizeContext.Provider value={size}>
    <div
      ref={ref}
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm transition-colors duration-smooth ease-apple",
        className
      )}
      {...props}
    />
  </CardSizeContext.Provider>
))
Card.displayName = "Card"

const useCardSize = () => React.useContext(CardSizeContext)

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const size = useCardSize()
  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col space-y-1.5 relative",
        size === "sm" ? "p-4" : "p-6",
        className
      )}
      {...props}
    />
  )
})
CardHeader.displayName = "CardHeader"

const CardAction = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const size = useCardSize()
  return (
    <div
      ref={ref}
      className={cn(
        "absolute right-0 top-0",
        size === "sm" ? "right-4 top-4" : "right-6 top-6",
        className
      )}
      {...props}
    />
  )
})
CardAction.displayName = "CardAction"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const size = useCardSize()
  return (
    <div
      ref={ref}
      className={cn(size === "sm" ? "p-4 pt-0" : "p-6 pt-0", className)}
      {...props}
    />
  )
})
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const size = useCardSize()
  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center pt-0",
        size === "sm" ? "p-4" : "p-6",
        className
      )}
      {...props}
    />
  )
})
CardFooter.displayName = "CardFooter"

export {
  Card,
  CardAction,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
}

"use client"

import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-surface-container group-[.toaster]:text-on-surface group-[.toaster]:border-outline-variant/30 group-[.toaster]:shadow-lg glass-panel rounded-xl",
          description: "group-[.toast]:text-on-surface-variant",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-surface-container-high group-[.toast]:text-on-surface-variant",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }

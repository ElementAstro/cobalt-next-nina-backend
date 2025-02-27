"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        style: {
          background: "hsl(var(--background))",
          color: "hsl(var(--foreground))",
          border: "1px solid hsl(var(--border))",
        },
        className: "group toast-item",
        descriptionClassName: "text-sm text-muted-foreground",
      }}
      theme="dark"
      closeButton
      richColors
      duration={4000}
      visibleToasts={6}
      expand={false}
    />
  );
}

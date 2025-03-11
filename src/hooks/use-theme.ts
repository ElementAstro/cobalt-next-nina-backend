"use client"

import { useEffect } from "react"
import { useSerialStore } from "@/stores/serial"

export function useTheme() {
  const { theme } = useSerialStore()

  useEffect(() => {
    // Apply theme class to document
    if (theme === "dark") {
      document.documentElement.classList.add("dark")
      document.documentElement.style.colorScheme = "dark"
    } else {
      document.documentElement.classList.remove("dark")
      document.documentElement.style.colorScheme = "light"
    }
  }, [theme])

  return { theme }
}


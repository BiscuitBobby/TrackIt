"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import BottomNavigation from "@/components/bottom-navigation"

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = usePathname()
  return (
    <html lang="en">
      <body>
        {children}
        {pathname !== "/" && pathname !== "/admin" && <BottomNavigation />}
      </body>
    </html>
  )
}

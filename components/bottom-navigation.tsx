"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, History, LayoutGrid } from "lucide-react"
import { cn } from "@/lib/utils"

export default function BottomNavigation() {
  const pathname = usePathname()

  const navItems = [
    { name: "Home", href: "/home", icon: Home },
    { name: "History", href: "/history", icon: History },
    { name: "Groups", href: "/search", icon: LayoutGrid },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
      <div className="flex h-16 items-center justify-around px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href === "/search" && pathname.startsWith("/search"))
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 text-xs font-medium transition-colors",
                isActive ? "text-gray-900" : "text-gray-500 hover:text-gray-700",
              )}
            >
              <item.icon className="h-6 w-6" />
              <span className="sr-only">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

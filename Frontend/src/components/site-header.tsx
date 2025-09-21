"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export function SiteHeader() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()

  const isActive = (href: string) =>
    pathname === href ? "text-foreground" : "text-muted-foreground"

  return (
    <header className="w-full border-b bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
      <div className="container mx-auto px-4 h-14 flex items-center gap-4">
        <Link href="/" className="font-semibold">CrashGuard AI</Link>
        <nav className="ml-auto flex items-center gap-4">
          <Link href="/login" className={`text-sm ${isActive("/login")}`}>Login</Link>
          <Link href="/register" className={`text-sm ${isActive("/register")}`}>Register</Link>
          <Separator orientation="vertical" className="h-6" />
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </nav>
      </div>
    </header>
  )
}


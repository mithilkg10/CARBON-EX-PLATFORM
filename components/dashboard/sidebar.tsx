"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  ArrowLeftRight,
  FileText,
  CreditCard,
  Shield,
  ScrollText,
  LogOut,
  Leaf,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

import type { UserRole } from "@/lib/db/types"

interface SidebarProps {
  userRole: UserRole
  userName: string
}

export function Sidebar({ userRole, userName }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)

  const companyLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/trading", label: "Trading", icon: ArrowLeftRight },
    { href: "/emissions", label: "Emissions", icon: FileText },
    { href: "/passport", label: "Carbon Passport", icon: CreditCard },
  ]

  const regulatorLinks = [
    { href: "/regulator", label: "Overview", icon: LayoutDashboard },
    { href: "/audit-logs", label: "Audit Logs", icon: ScrollText },
    { href: "/trading", label: "Market View", icon: ArrowLeftRight },
  ]

  const links = userRole === "company" ? companyLinks : regulatorLinks

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
  }

  return (
    <aside 
      className={cn(
        "flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 p-4 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Leaf className="w-5 h-5 text-primary" />
        </div>
        {!collapsed && (
          <span className="text-lg font-semibold tracking-tight">CarbonEx</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {links.map((link) => {
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <link.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{link.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User & Logout */}
      <div className="p-2 border-t border-sidebar-border">
        {(userRole === "regulator" || userRole === "admin") && !collapsed && (
          <div className="flex items-center gap-2 px-3 py-2 mb-2 rounded-md bg-primary/10">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-xs text-primary font-medium">
              {userRole === "admin" ? "Admin Access" : "Regulator Access"}
            </span>
          </div>
        )}
        
        {!collapsed && (
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{userName}</p>
            <p className="text-xs text-sidebar-foreground/60 capitalize">{userRole}</p>
          </div>
        )}

        <Button
          variant="ghost"
          size={collapsed ? "icon" : "default"}
          className={cn(
            "w-full text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
            collapsed ? "justify-center" : "justify-start"
          )}
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span className="ml-2">Sign out</span>}
        </Button>

        {/* Collapse toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="w-full mt-2 text-sidebar-foreground/50 hover:text-sidebar-foreground"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
    </aside>
  )
}

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
  Menu,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { Sheet, SheetContent, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet"

import type { UserRole } from "@/lib/db/types"

interface SidebarProps {
  userRole: UserRole
  userName: string
}

export function Sidebar({ userRole, userName }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)")
    const closeOnDesktop = () => { if (desktop.matches) setMobileOpen(false) }
    desktop.addEventListener("change", closeOnDesktop)
    return () => desktop.removeEventListener("change", closeOnDesktop)
  }, [])

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
    <>
    <div className="carbon-mobile-bar flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-[#07100d] px-4 py-3 lg:hidden">
      <Link href={links[0].href} className="flex min-h-11 items-center gap-2 font-semibold"><Leaf className="h-5 w-5 text-primary" />CarbonEx</Link>
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild><Button variant="outline" size="icon" className="h-11 w-11" aria-label="Open navigation"><Menu className="h-5 w-5" /></Button></SheetTrigger>
        <SheetContent side="left" className="carbon-mobile-drawer w-[min(20rem,88vw)] gap-0 overflow-y-auto bg-[#07100d] p-0 text-white">
          <div className="border-b border-white/10 p-5 pr-16"><SheetTitle className="text-white">CarbonEx</SheetTitle><SheetDescription>Navigate your {userRole} workspace.</SheetDescription></div>
          <nav aria-label="Mobile navigation" className="space-y-2 p-3">
            {links.map(link => <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} aria-current={pathname === link.href ? "page" : undefined} className={cn("flex min-h-12 items-center gap-3 rounded-lg px-3 py-3 text-sm", pathname === link.href ? "bg-emerald-300/10 text-emerald-100" : "text-slate-300 hover:bg-white/5")}><link.icon className="h-5 w-5 shrink-0" />{link.label}</Link>)}
          </nav>
          <div className="mt-auto border-t border-white/10 p-4"><p className="break-words text-sm font-medium">{userName}</p><p className="mt-1 text-xs capitalize text-slate-400">{userRole}</p><Button variant="ghost" className="mt-3 min-h-11 w-full justify-start" onClick={handleLogout}><LogOut className="mr-2 h-5 w-5" />Sign out</Button></div>
        </SheetContent>
      </Sheet>
    </div>
    <aside 
      className={cn(
        "hidden h-full shrink-0 flex-col border-r border-white/[0.06] bg-[#07100d]/88 shadow-[12px_0_50px_rgba(0,0,0,0.18)] backdrop-blur-2xl transition-all duration-300 lg:flex",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 border-b border-white/[0.06] p-4">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Leaf className="w-5 h-5 text-primary" />
        </div>
        {!collapsed && (
          <span className="text-lg font-semibold tracking-tight">CarbonEx</span>
        )}
      </div>

      {/* Navigation */}
      <nav aria-label="Desktop navigation" className="min-h-0 flex-1 overflow-y-auto p-2 space-y-1">
        {links.map((link) => {
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              title={link.label}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "border border-emerald-300/10 bg-emerald-300/[0.09] text-emerald-100 shadow-[0_0_18px_rgba(52,211,153,0.05)]"
                  : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
              )}
            >
              <link.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{link.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User & Logout */}
      <div className="border-t border-white/[0.06] p-2">
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
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
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
    </>
  )
}

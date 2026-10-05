"use client"

import { cn } from "@/lib/utils"
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { motion } from "framer-motion"

interface StatsCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: LucideIcon
  iconColor?: string
  className?: string
}

export function StatsCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  iconColor = "text-primary",
  className,
}: StatsCardProps) {
  const TrendIcon = change && change > 0 ? TrendingUp : change && change < 0 ? TrendingDown : Minus
  const trendColor = change && change > 0 ? "text-emerald-500" : change && change < 0 ? "text-red-500" : "text-muted-foreground"

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "rounded-2xl border border-white/[0.07] bg-gradient-to-br from-white/[0.05] via-white/[0.025] to-emerald-400/[0.02] p-6 shadow-[0_16px_50px_rgba(0,0,0,0.18)] backdrop-blur-xl",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-semibold tracking-tight">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1">
              <TrendIcon className={cn("h-4 w-4", trendColor)} />
              <span className={cn("text-sm font-medium", trendColor)}>
                {change > 0 ? "+" : ""}{change}%
              </span>
              {changeLabel && (
                <span className="text-sm text-muted-foreground">
                  {changeLabel}
                </span>
              )}
            </div>
          )}
        </div>
        <div className={cn("rounded-xl border border-white/[0.06] bg-white/[0.04] p-3 shadow-inner", iconColor)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  )
}

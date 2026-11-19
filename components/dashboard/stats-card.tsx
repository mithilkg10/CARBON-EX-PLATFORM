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
  const trendColor = change && change > 0
    ? "text-emerald-600 dark:text-emerald-400"
    : change && change < 0
      ? "text-red-600 dark:text-red-400"
      : "text-muted-foreground"

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "rounded-2xl border border-border bg-card/80 p-6 shadow-sm backdrop-blur-xl dark:border-white/[0.07] dark:bg-gradient-to-br dark:from-white/[0.05] dark:via-white/[0.025] dark:to-emerald-400/[0.02] dark:shadow-[0_16px_50px_rgba(0,0,0,0.18)]",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="truncate text-3xl font-semibold tracking-tight">{value}</p>
          {(change !== undefined || changeLabel) && (
            <div className="flex flex-wrap items-center gap-1">
              {change !== undefined && (
                <>
                  <TrendIcon className={cn("h-4 w-4", trendColor)} />
                  <span className={cn("text-sm font-medium", trendColor)}>
                    {change > 0 ? "+" : ""}{change.toFixed(2)}%
                  </span>
                </>
              )}
              {changeLabel && <span className="text-sm text-muted-foreground">{changeLabel}</span>}
            </div>
          )}
        </div>
        <div className={cn("shrink-0 rounded-xl border border-border bg-muted/60 p-3 dark:border-white/[0.06] dark:bg-white/[0.04]", iconColor)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  )
}

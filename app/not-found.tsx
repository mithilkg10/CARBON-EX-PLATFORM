import Link from "next/link"
import { Leaf } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500/10">
        <Leaf className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
      </span>
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="max-w-sm text-sm text-muted-foreground">This page does not exist in CarbonEx. Head back to your workspace to continue.</p>
      <Button asChild className="bg-emerald-600 text-white hover:bg-emerald-700">
        <Link href="/">Go to my workspace</Link>
      </Button>
    </main>
  )
}

"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Shield, Lock, CheckCircle2, Terminal, AlertCircle } from "lucide-react"
import { TransactionOrchestrator, type TransactionPayload, type CommitResult } from "@/lib/security-layer/transaction"
import { Button } from "@/components/ui/button"

interface SecureTransactionLayerProps {
  payload: TransactionPayload
  commit: (integrityHash: string) => Promise<CommitResult>
  onComplete: () => void
  onCancel: () => void
}

interface LogEntry {
  step: string
  message: string
  output: string
  time: string
}

export function SecureTransactionLayer({ payload, commit, onComplete, onCancel }: SecureTransactionLayerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isProcessing, setIsProcessing] = useState(true)
  const [isDone, setIsDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const logRef = useRef<HTMLDivElement>(null)
  const commitRef = useRef(commit)

  useEffect(() => {
    let mounted = true
    const handleProgress = (step: string, data: { message: string; output: string }) => {
      if (!mounted) return
      setLogs(prev => [...prev, { step, message: data.message, output: data.output, time: new Date().toISOString() }])
    }

    TransactionOrchestrator.execute(payload, handleProgress, (hash) => commitRef.current(hash))
      .then(() => {
        if (!mounted) return
        setIsDone(true)
      })
      .catch((err: unknown) => {
        if (!mounted) return
        const message = err instanceof Error ? err.message : "Transaction failed"
        setError(message)
        setLogs(prev => [...prev, { step: "REJECTED", message, output: "NOTHING WAS CHARGED", time: new Date().toISOString() }])
      })
      .finally(() => {
        if (mounted) setIsProcessing(false)
      })

    return () => { mounted = false }
  }, [payload])

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" })
  }, [logs])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="stl-title">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-card text-card-foreground shadow-2xl"
      >
        <div className="border-b border-border bg-muted/50 p-4">
          <div className="flex items-center gap-3">
            <Shield className={`h-6 w-6 ${isDone ? "text-emerald-500" : error ? "text-red-500" : "animate-pulse text-blue-500"}`} />
            <div>
              <h2 id="stl-title" className="text-lg font-semibold">STL C³T Secure Transaction Layer</h2>
              <p className="text-sm text-muted-foreground">C³T obfuscation, AES 256 GCM, SHA 256 and STAVP ledger commit</p>
            </div>
          </div>
        </div>

        <div ref={logRef} className="max-h-[400px] space-y-3 overflow-y-auto bg-zinc-950 p-4 font-mono text-sm text-green-400 sm:p-6">
          <AnimatePresence>
            {logs.map((log, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex flex-col border-l-2 pl-3 ${log.step === "REJECTED" ? "border-red-700 text-red-400" : "border-green-800"}`}
              >
                <div className="mb-1 text-xs opacity-70">[{log.time.split("T")[1].replace("Z", "")}] SYSTEM_{log.step}</div>
                <div className="break-words font-semibold">{log.message}</div>
                <div className="mt-1 break-all opacity-80">{">"} {log.output}</div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isProcessing && (
            <div className="mt-4 flex animate-pulse items-center gap-2 text-green-600">
              <Terminal className="h-4 w-4" />
              <span>Running next step...</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/20 p-4">
          <div className="flex min-w-0 items-center gap-2">
            {isProcessing ? (
              <>
                <Lock className="h-4 w-4 animate-pulse text-blue-500" />
                <span className="text-sm text-muted-foreground">Securing the transaction...</span>
              </>
            ) : isDone ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Trade settled and chained to the ledger</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
              </>
            )}
          </div>

          <div className="flex gap-2">
            {!isProcessing && !isDone && (
              <Button variant="outline" onClick={onCancel}>Close</Button>
            )}
            {isDone && (
              <Button onClick={onComplete} className="bg-emerald-600 text-white hover:bg-emerald-700">
                Done
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

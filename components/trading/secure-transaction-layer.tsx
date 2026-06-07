"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Shield, Lock, Database, CheckCircle2, Terminal, AlertCircle } from "lucide-react"
import { TransactionOrchestrator, TransactionPayload } from "@/lib/security-layer/transaction"
import { Button } from "@/components/ui/button"

interface SecureTransactionLayerProps {
  payload: TransactionPayload;
  onComplete: () => void;
  onCancel: () => void;
}

interface LogEntry {
  step: string;
  message: string;
  output: string;
  time: string;
}

export function SecureTransactionLayer({ payload, onComplete, onCancel }: SecureTransactionLayerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isProcessing, setIsProcessing] = useState(true)
  const [isDone, setIsDone] = useState(false)

  useEffect(() => {
    let mounted = true;

    const runTransaction = async () => {
      const handleProgress = (step: string, data: any) => {
        if (!mounted) return;
        setLogs(prev => [...prev, {
          step,
          message: data.message,
          output: data.output,
          time: new Date().toISOString()
        }]);
      };

      const result = await TransactionOrchestrator.execute(payload, handleProgress);
      
      if (!mounted) return;
      setIsProcessing(false);
      
      if (result) {
        setIsDone(true);
      }
    };

    runTransaction();

    return () => { mounted = false; };
  }, [payload]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-2xl overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
      >
        <div className="border-b border-border bg-muted/50 p-4">
          <div className="flex items-center gap-3">
            <Shield className={`h-6 w-6 ${isDone ? 'text-emerald-500' : 'text-blue-500 animate-pulse'}`} />
            <div>
              <h2 className="text-lg font-semibold">STL-C³T Secure Transaction Layer</h2>
              <p className="text-sm text-muted-foreground">Executing cryptographic protocol pipeline...</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-black text-green-400 font-mono text-sm max-h-[400px] overflow-y-auto space-y-3">
          <AnimatePresence>
            {logs.map((log, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col border-l-2 border-green-800 pl-3"
              >
                <div className="flex items-center justify-between text-green-600/80 text-xs mb-1">
                  <span>[{log.time.split('T')[1].replace('Z', '')}] SYSTEM_{log.step}</span>
                </div>
                <div className="font-semibold">{log.message}</div>
                <div className="text-green-300 break-all opacity-80 mt-1">{'>'} {log.output}</div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isProcessing && (
            <div className="flex items-center gap-2 text-green-600 animate-pulse mt-4">
              <Terminal className="h-4 w-4" />
              <span>Awaiting next cryptographic operation...</span>
            </div>
          )}
        </div>

        <div className="border-t border-border bg-muted/20 p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            {isProcessing ? (
              <>
                <Lock className="h-4 w-4 text-blue-400 animate-pulse" />
                <span className="text-sm text-muted-foreground">Securing assets...</span>
              </>
            ) : isDone ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-medium text-emerald-500">Transaction cryptographically secured</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-500">Transaction failed validation. Please give try after sometime.</span>
              </>
            )}
          </div>
          
          <div className="flex gap-2">
            {!isProcessing && !isDone && (
              <Button variant="outline" onClick={onCancel}>Close</Button>
            )}
            {isDone && (
              <Button onClick={onComplete} className="bg-emerald-600 hover:bg-emerald-700">
                Acknowledge & Continue
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

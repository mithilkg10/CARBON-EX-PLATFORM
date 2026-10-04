import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { getLedgerStats } from '@/lib/ledger/stavp'
import crypto from 'crypto'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.role !== 'regulator' && session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied. Admin or regulator role required.' },
        { status: 403 }
      )
    }

    // Get audit logs
    const auditLogs = await db.getAuditLogs(100)

    // Get all users for mapping
    const users = await db.getAllUsers()
    const userMap = new Map(users.map(u => [u.id, u]))

    // Format logs into the shape expected by audit-content.tsx:
    // needs: id, timestamp, action, status, entityType, entityId, userId, hash, previousHash, metadata
    let previousHash = '0000000000000000'
    const logs = auditLogs.map((log) => {
      const hashInput = `${log.id}${log.action}${log.created_at}${previousHash}`
      const hash = crypto.createHash('sha256').update(hashInput).digest('hex')
      const prev = previousHash
      previousHash = hash

      return {
        id: log.id,
        timestamp: log.created_at,
        action: log.action.toUpperCase().replace(/ /g, '_'),
        status: 'success',
        entityType: log.resource_type || 'system',
        entityId: log.resource_id || log.id,
        userId: userMap.get(log.user_id)?.email || log.user_id,
        hash,
        previousHash: prev,
        metadata: log.details
          ? (() => { try { return JSON.parse(log.details) } catch { return {} } })()
          : {},
      }
    })

    // Get ledger statistics
    const ledgerStats = await getLedgerStats()

    // Get full ledger for verification display
    const ledger = await db.getLedger()
    const formattedLedger = ledger.slice(-50).reverse().map(entry => ({
      id: entry.id,
      tradeId: entry.trade_id,
      transactionHash: entry.transaction_hash,
      previousHash: entry.previous_hash,
      action: entry.action,
      timestamp: entry.timestamp,
      verified: entry.verified,
    }))

    return NextResponse.json({
      logs,
      ledger: formattedLedger,
      ledgerStats,
      summary: {
        totalAuditEntries: logs.length,
        uniqueUsers: new Set(auditLogs.map(l => l.user_id)).size,
        actionBreakdown: auditLogs.reduce((acc, log) => {
          acc[log.action] = (acc[log.action] || 0) + 1
          return acc
        }, {} as Record<string, number>),
      },
    })
  } catch (error) {
    console.error('Audit GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit data' },
      { status: 500 }
    )
  }
}

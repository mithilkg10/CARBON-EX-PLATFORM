// In-memory database for the CarbonEx prototype.
//
// The seed is deterministic: record IDs, quantities and prices come from a fixed PRNG
// seed and every date is relative to the current UTC day. That keeps every serverless
// instance and every visitor on the same synthetic world, so IDs used by the browser
// always resolve on the server and the numbers on different pages agree.

import { createHash } from 'crypto'
import type {
  User,
  CarbonPassport,
  EmissionLog,
  CarbonCredit,
  Trade,
  LedgerEntry,
  AuditLog,
  RegistrationRequest,
  ReviewItem,
  FlaggedEntity,
} from './types'
import { getMarketSnapshot, seededRandom } from '@/lib/market/engine'

const DAY = 24 * 60 * 60 * 1000

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export function sha256Hex(input: string): string {
  return createHash('sha256').update(input).digest('hex')
}

function startOfUtcDay(ms: number): number {
  return Math.floor(ms / DAY) * DAY
}

function isoDaysAgo(today: number, days: number, hour = 10, minute = 0): string {
  return new Date(today - days * DAY + hour * 3600000 + minute * 60000).toISOString()
}

function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

export const DEMO_COMPANY_ID = 'usr_acme_001'
export const DEMO_REGULATOR_ID = 'usr_reg_001'

class Database {
  users: Map<string, User> = new Map()
  passports: Map<string, CarbonPassport> = new Map()
  emissions: EmissionLog[] = []
  credits: Map<string, CarbonCredit> = new Map()
  trades: Trade[] = []
  ledger: LedgerEntry[] = []
  auditLogs: AuditLog[] = []
  registrationRequests: RegistrationRequest[] = []
  reviews: ReviewItem[] = []
  flagged: FlaggedEntity[] = []
  private initialized = false

  async initialize() {
    if (this.initialized) return
    this.seed()
    this.initialized = true
  }

  private seed() {
    const rand = seededRandom(20260419)
    const int = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min
    const money = (min: number, max: number) => Math.round((min + rand() * (max - min)) * 100) / 100

    const today = startOfUtcDay(Date.now())
    const seededAt = new Date(today - 400 * DAY).toISOString()

    // Owner account: only created when both the signing secret and a bcrypt hash are configured.
    const adminEmail = process.env.ADMIN_EMAIL
    const adminHash = process.env.ADMIN_PASSWORD_HASH
    if (process.env.JWT_SECRET && adminEmail && adminHash) {
      this.users.set('usr_admin_001', {
        id: 'usr_admin_001',
        email: adminEmail,
        password_hash: adminHash,
        name: 'Platform Admin',
        role: 'admin',
        created_at: seededAt,
        updated_at: seededAt,
      })
    }

    const companies: Array<{ user: User; sector: string; target: number; status: CarbonPassport['compliance_status']; trust: number; rating: CarbonPassport['sustainability_rating']; scale: number }> = [
      {
        user: { id: DEMO_COMPANY_ID, email: 'demo.company@mithilkg.dev', password_hash: 'one-click-demo-only', name: 'ACME Corporation', role: 'company', company_name: 'ACME Corp', is_demo: true, is_blocked: false, wallet_balance: 50000, created_at: seededAt, updated_at: seededAt },
        sector: 'Manufacturing', target: 30, status: 'compliant', trust: 78, rating: 'B', scale: 1,
      },
      {
        user: { id: 'usr_greentech_001', email: 'greentech@company.com', password_hash: 'disabled', name: 'GreenTech Industries', role: 'company', company_name: 'GreenTech Industries', is_blocked: true, wallet_balance: 80000, created_at: seededAt, updated_at: seededAt },
        sector: 'Technology', target: 50, status: 'compliant', trust: 92, rating: 'A', scale: 0.45,
      },
      {
        user: { id: 'usr_ecofirst_001', email: 'ecofirst@company.com', password_hash: 'disabled', name: 'EcoFirst Solutions', role: 'company', company_name: 'EcoFirst Solutions', is_blocked: true, wallet_balance: 65000, created_at: seededAt, updated_at: seededAt },
        sector: 'Energy', target: 40, status: 'pending', trust: 65, rating: 'C', scale: 0.7,
      },
    ]

    for (const c of companies) this.users.set(c.user.id, c.user)
    this.users.set(DEMO_REGULATOR_ID, {
      id: DEMO_REGULATOR_ID, email: 'demo.regulator@mithilkg.dev', password_hash: 'one-click-demo-only',
      name: 'Regulatory Review', role: 'regulator', is_demo: true, is_blocked: false, created_at: seededAt, updated_at: seededAt,
    })

    // Emissions: the last 12 months; the current month is still awaiting verification.
    const current = new Date(today)
    for (const c of companies) {
      let verifiedTotal = 0
      for (let m = 11; m >= 0; m--) {
        const d = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() - m, 15, 10))
        const period = monthKey(d)
        const pending = m === 0
        for (const type of ['scope1', 'scope2', 'scope3'] as const) {
          const base = type === 'scope1' ? 420 : type === 'scope2' ? 310 : 520
          const amount = Math.round(base * c.scale * (0.8 + rand() * 0.4))
          if (!pending) verifiedTotal += amount
          this.emissions.push({
            id: `em_${c.user.id.split('_')[1]}_${period}_${type}`,
            user_id: c.user.id,
            emission_type: type,
            amount_tonnes: amount,
            reporting_period: period,
            verification_status: pending ? 'pending' : 'verified',
            data_source: type === 'scope2' ? 'Smart Meter' : type === 'scope1' ? 'IoT Sensors' : 'Third Party Audit',
            created_at: new Date(Math.min(
              pending ? d.getTime() : Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 5, 10),
              today - DAY + 10 * 3600000,
            )).toISOString(),
          })
        }
      }
      this.passports.set(`psp_${c.user.id.split('_')[1]}_001`, {
        id: `psp_${c.user.id.split('_')[1]}_001`,
        user_id: c.user.id,
        company_name: c.user.company_name!,
        industry_sector: c.sector,
        annual_emissions: verifiedTotal,
        emission_reduction_target: c.target,
        compliance_status: c.status,
        trust_score: c.trust,
        sustainability_rating: c.rating,
        last_audit_date: isoDaysAgo(today, 45 + int(0, 60)).slice(0, 10),
        created_at: seededAt,
        updated_at: seededAt,
      })
    }

    // Credits: the demo company holds a portfolio; the others list theirs on the market.
    const creditTypes: CarbonCredit['credit_type'][] = ['renewable', 'forestry', 'industrial', 'agriculture']
    const certBodies = ['Gold Standard', 'Verra VCS', 'Climate Action Reserve', 'American Carbon Registry']
    const marketPrice = getMarketSnapshot('1D').price
    const year = current.getUTCFullYear()
    for (let i = 0; i < 20; i++) {
      const owner = companies[i % 3].user.id
      const type = creditTypes[i % 4]
      const premium = type === 'forestry' ? 1.15 : type === 'renewable' ? 1.08 : type === 'agriculture' ? 0.92 : 0.85
      const id = `crd_${String(i + 1).padStart(3, '0')}`
      this.credits.set(id, {
        id,
        owner_id: owner,
        credit_type: type,
        vintage_year: year - 2 + (i % 3),
        quantity: int(150, 1100),
        price_per_unit: Math.round(marketPrice * premium * (0.92 + rand() * 0.16) * 100) / 100,
        expiry_date: `${year + 2 + (i % 3)}-12-31`,
        status: 'available',
        listed: owner !== DEMO_COMPANY_ID,
        certification_body: certBodies[i % 4],
        created_at: seededAt,
      })
    }

    // Trades over the last 30 days, chained into the ledger with SHA-256.
    const creditIds = Array.from(this.credits.keys())
    const tradeTimes = Array.from({ length: 18 }, () => int(1, 29 * 24)).sort((a, b) => b - a)
    tradeTimes.forEach((hoursAgo, i) => {
      const buyer = companies[i % 3].user.id
      const seller = companies[(i + 1) % 3].user.id
      const credit = this.credits.get(creditIds[(i * 7) % creditIds.length])!
      const quantity = int(10, 60)
      const price = money(credit.price_per_unit * 0.94, credit.price_per_unit * 1.04)
      const createdAt = new Date(Date.now() - hoursAgo * 3600000)
      createdAt.setUTCMinutes(0, 0, 0)
      const tradeId = `trd_${String(i + 1).padStart(3, '0')}`
      const previousHash = this.ledger.length ? this.ledger[this.ledger.length - 1].transaction_hash : '0'.repeat(64)
      const data = JSON.stringify({ tradeId, buyer, seller, creditId: credit.id, quantity, price })
      const hash = sha256Hex(`${previousHash}|${data}`)
      this.trades.push({
        id: tradeId, buyer_id: buyer, seller_id: seller, credit_id: credit.id, quantity,
        price_per_unit: price, total_price: Math.round(quantity * price * 100) / 100, trade_type: 'buy',
        status: 'completed', ledger_hash: hash, created_at: createdAt.toISOString(), completed_at: createdAt.toISOString(),
      })
      this.ledger.push({
        id: `led_${String(i + 1).padStart(3, '0')}`, trade_id: tradeId, transaction_hash: hash, previous_hash: previousHash,
        nonce: sha256Hex(`nonce|${tradeId}`).slice(0, 32), action: 'trade', data, timestamp: createdAt.toISOString(), verified: true,
      })
    })

    // Regulator queues.
    const reviewCompanies = ['EcoSteel Industries', 'GreenTech Solutions', 'Carbon Neutral Corp', 'SustainaPower Ltd', 'BlueOcean Shipping', 'AeroDynamics Inc', 'SolarFlare Energy', 'Global Logistics', 'AgriGrow Co', 'NextGen Motors', 'WindForce Power', 'PetroChem Dynamics']
    const reviewTypes: ReviewItem['type'][] = ['Emission Report', 'Credit Transfer', 'Offset Verification', 'Compliance Audit']
    const risks: ReviewItem['risk'][] = ['high', 'low', 'medium', 'low', 'high', 'medium']
    this.reviews = reviewCompanies.map((company, i) => ({
      id: `REV-${String(i + 1).padStart(3, '0')}`,
      company,
      type: reviewTypes[i % 4],
      submitted: isoDaysAgo(today, i + 1).slice(0, 10),
      status: i % 3 === 2 ? 'in-review' : 'pending',
      risk: risks[i % risks.length],
    }))

    const flaggedSeed: Array<[string, string, FlaggedEntity['severity']]> = [
      ['DarkCarbon Inc', 'Wash trading pattern: 14 round trip trades with one counterparty', 'critical'],
      ['GrayZone Manufacturing', 'Two monthly emission reports missing Scope 3 data', 'warning'],
      ['QuestionMark Energy', 'Trust score fell below the 40 point threshold', 'warning'],
      ['Shadow Logistics', 'Credits sourced from an unverified registry', 'critical'],
      ['Obscure Holdings', 'Transfer volume up 6x against its 90 day average', 'warning'],
      ['Phantom Exports', 'Ledger record does not match the declared trade value', 'critical'],
    ]
    this.flagged = flaggedSeed.map(([company, reason, severity], i) => ({
      id: `FL-${String(i + 1).padStart(3, '0')}`,
      company, reason, severity,
      flaggedAt: isoDaysAgo(today, i).slice(0, 10),
      trustScore: severity === 'critical' ? int(18, 36) : int(37, 52),
      tradesLast30d: int(6, 40),
      volumeLast30d: money(18000, 240000),
      suspended: false,
    }))

    this.registrationRequests = [
      { id: 'req_001', email: 'compliance@terravolt.example', company_name: 'TerraVolt Energy', name: 'Priya Raman', status: 'pending', created_at: isoDaysAgo(today, 1, 9, 20) },
      { id: 'req_002', email: 'esg@northwindfreight.example', company_name: 'Northwind Freight', name: 'Daniel Okafor', status: 'pending', created_at: isoDaysAgo(today, 2, 14, 5) },
      { id: 'req_003', email: 'carbon@lumenagri.example', company_name: 'Lumen Agritech', name: 'Sofia Marquez', status: 'pending', created_at: isoDaysAgo(today, 4, 11, 40) },
    ]

    // Audit history built from the seeded activity above, oldest first.
    const audit: AuditLog[] = []
    for (const t of this.trades) {
      audit.push({ id: `aud_${t.id}`, user_id: t.buyer_id, action: 'trade_buy', resource_type: 'trade', resource_id: t.id, details: JSON.stringify({ creditId: t.credit_id, quantity: t.quantity, totalPrice: t.total_price, ledgerHash: t.ledger_hash }), status: 'success', created_at: t.created_at })
    }
    for (const e of this.emissions.filter(e => Date.parse(e.created_at) > today - 30 * DAY)) {
      audit.push({ id: `aud_${e.id}`, user_id: e.user_id, action: 'emission_submit', resource_type: 'emission', resource_id: e.id, details: JSON.stringify({ type: e.emission_type, amount: e.amount_tonnes, period: e.reporting_period }), status: e.verification_status === 'pending' ? 'pending' : 'success', created_at: e.created_at })
    }
    for (const r of this.reviews.slice(0, 6)) {
      audit.push({ id: `aud_${r.id}`, user_id: DEMO_REGULATOR_ID, action: 'review_opened', resource_type: 'review', resource_id: r.id, details: JSON.stringify({ company: r.company, type: r.type, risk: r.risk }), status: 'success', created_at: `${r.submitted}T12:00:00.000Z` })
    }
    for (const f of this.flagged) {
      audit.push({ id: `aud_${f.id}`, user_id: 'system', action: 'entity_flagged', resource_type: 'entity', resource_id: f.id, details: JSON.stringify({ company: f.company, reason: f.reason, severity: f.severity }), status: 'success', created_at: `${f.flaggedAt}T08:30:00.000Z` })
    }
    for (const req of this.registrationRequests) {
      audit.push({ id: `aud_${req.id}`, user_id: 'system', action: 'registration_request', resource_type: 'registration', resource_id: req.id, details: JSON.stringify({ company: req.company_name }), status: 'pending', created_at: req.created_at })
    }
    this.auditLogs = audit.sort((a, b) => a.created_at.localeCompare(b.created_at))
  }

  // User operations
  async getUserByEmail(email: string): Promise<User | undefined> {
    await this.initialize()
    return Array.from(this.users.values()).find(u => u.email.toLowerCase() === email.toLowerCase())
  }

  async getUserById(id: string): Promise<User | undefined> {
    await this.initialize()
    return this.users.get(id)
  }

  async getAllUsers(): Promise<User[]> {
    await this.initialize()
    return Array.from(this.users.values())
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    await this.initialize()
    const user = this.users.get(id)
    if (!user) return undefined
    const updated = { ...user, ...data, updated_at: new Date().toISOString() }
    this.users.set(id, updated)
    return updated
  }

  // Registration requests
  async getRegistrationRequests(): Promise<RegistrationRequest[]> {
    await this.initialize()
    return this.registrationRequests
  }

  async updateRegistrationRequest(id: string, status: 'accepted' | 'rejected'): Promise<RegistrationRequest | undefined> {
    await this.initialize()
    const req = this.registrationRequests.find(r => r.id === id)
    if (!req) return undefined
    req.status = status
    if (status === 'accepted') {
      const now = new Date().toISOString()
      const userId = `usr_${generateId()}`
      this.users.set(userId, {
        id: userId, email: req.email, name: req.name, company_name: req.company_name, password_hash: '',
        role: 'company', requires_password_setup: true, wallet_balance: 0, created_at: now, updated_at: now,
      })
      const passportId = `psp_${generateId()}`
      this.passports.set(passportId, {
        id: passportId, user_id: userId, company_name: req.company_name, industry_sector: 'Other', annual_emissions: 0,
        emission_reduction_target: 0, compliance_status: 'pending', trust_score: 50, sustainability_rating: 'C',
        last_audit_date: now.slice(0, 10), created_at: now, updated_at: now,
      })
    }
    return req
  }

  // Regulator queues
  async getReviews(): Promise<ReviewItem[]> {
    await this.initialize()
    return this.reviews
  }

  async updateReview(id: string, status: ReviewItem['status']): Promise<ReviewItem | undefined> {
    await this.initialize()
    const review = this.reviews.find(r => r.id === id)
    if (review) review.status = status
    return review
  }

  async getFlagged(): Promise<FlaggedEntity[]> {
    await this.initialize()
    return this.flagged
  }

  async setFlaggedSuspended(id: string, suspended: boolean): Promise<FlaggedEntity | undefined> {
    await this.initialize()
    const entity = this.flagged.find(f => f.id === id)
    if (entity) entity.suspended = suspended
    return entity
  }

  // Passport operations
  async getPassportByUserId(userId: string): Promise<CarbonPassport | undefined> {
    await this.initialize()
    return Array.from(this.passports.values()).find(p => p.user_id === userId)
  }

  async getAllPassports(): Promise<CarbonPassport[]> {
    await this.initialize()
    return Array.from(this.passports.values())
  }

  async addPassport(passport: CarbonPassport): Promise<CarbonPassport> {
    await this.initialize()
    this.passports.set(passport.id, passport)
    return passport
  }

  async updatePassport(id: string, data: Partial<CarbonPassport>): Promise<CarbonPassport | undefined> {
    await this.initialize()
    const passport = this.passports.get(id)
    if (!passport) return undefined
    const updated = { ...passport, ...data, updated_at: new Date().toISOString() }
    this.passports.set(id, updated)
    return updated
  }

  // Emission operations
  async getEmissionsByUserId(userId: string): Promise<EmissionLog[]> {
    await this.initialize()
    return this.emissions.filter(e => e.user_id === userId)
  }

  async getAllEmissions(): Promise<EmissionLog[]> {
    await this.initialize()
    return this.emissions
  }

  async addEmission(emission: EmissionLog): Promise<EmissionLog> {
    await this.initialize()
    this.emissions.push(emission)
    return emission
  }

  // Credit operations
  async getCreditsByOwnerId(ownerId: string): Promise<CarbonCredit[]> {
    await this.initialize()
    return Array.from(this.credits.values()).filter(c => c.owner_id === ownerId)
  }

  async getAvailableCredits(): Promise<CarbonCredit[]> {
    await this.initialize()
    return Array.from(this.credits.values()).filter(c => c.status === 'available')
  }

  async getCreditById(id: string): Promise<CarbonCredit | undefined> {
    await this.initialize()
    return this.credits.get(id)
  }

  async addCredit(credit: CarbonCredit): Promise<CarbonCredit> {
    await this.initialize()
    this.credits.set(credit.id, credit)
    return credit
  }

  async updateCredit(id: string, data: Partial<CarbonCredit>): Promise<CarbonCredit | undefined> {
    await this.initialize()
    const credit = this.credits.get(id)
    if (!credit) return undefined
    const updated = { ...credit, ...data }
    this.credits.set(id, updated)
    return updated
  }

  // Trade operations
  async getTradesByUserId(userId: string): Promise<Trade[]> {
    await this.initialize()
    return this.trades.filter(t => t.buyer_id === userId || t.seller_id === userId)
  }

  async getAllTrades(): Promise<Trade[]> {
    await this.initialize()
    return this.trades
  }

  async addTrade(trade: Trade): Promise<Trade> {
    await this.initialize()
    this.trades.push(trade)
    return trade
  }

  // Ledger operations
  async getLedger(): Promise<LedgerEntry[]> {
    await this.initialize()
    return this.ledger
  }

  async addLedgerEntry(entry: LedgerEntry): Promise<LedgerEntry> {
    await this.initialize()
    this.ledger.push(entry)
    return entry
  }

  async getLastLedgerEntry(): Promise<LedgerEntry | undefined> {
    await this.initialize()
    return this.ledger[this.ledger.length - 1]
  }

  // Audit operations
  async addAuditLog(log: AuditLog): Promise<AuditLog> {
    await this.initialize()
    this.auditLogs.push({ status: 'success', ...log })
    return log
  }

  /** Oldest first, so the caller can build the hash chain in order. */
  async getAuditLogs(limit = 200): Promise<AuditLog[]> {
    await this.initialize()
    return this.auditLogs.slice(-limit)
  }

  // Market statistics, all from the shared market engine.
  async getMarketStats() {
    await this.initialize()
    const day = getMarketSnapshot('1D')
    const listed = Array.from(this.credits.values()).filter(c => c.status === 'available' && c.listed)
    const totalSupply = listed.reduce((sum, c) => sum + c.quantity, 0)
    const passports = Array.from(this.passports.values())
    const avgTrustScore = passports.length > 0 ? passports.reduce((sum, p) => sum + p.trust_score, 0) / passports.length : 0
    return {
      current_price: day.price,
      price_change_24h: day.change,
      volume_24h: day.periodVolume,
      total_supply: totalSupply,
      market_cap: Math.round(totalSupply * day.price * 100) / 100,
      avg_trust_score: Math.round(avgTrustScore * 10) / 10,
    }
  }
}

// Singleton that survives Next.js hot reloads.
declare global {
  // eslint-disable-next-line no-var
  var __carbonExDb: Database | undefined
}

if (!global.__carbonExDb) {
  global.__carbonExDb = new Database()
}

export const db = global.__carbonExDb

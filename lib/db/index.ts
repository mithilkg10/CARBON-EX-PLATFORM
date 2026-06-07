// In-memory database for the Carbon Credit Exchange
// This simulates a real database for demo purposes

import bcrypt from 'bcryptjs'
import type {
  User,
  CarbonPassport,
  EmissionLog,
  CarbonCredit,
  Trade,
  LedgerEntry,
  AuditLog,
  RegistrationRequest,
} from './types'

// Generate unique IDs
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// In-memory data store
class Database {
  users: Map<string, User> = new Map()
  passports: Map<string, CarbonPassport> = new Map()
  emissions: EmissionLog[] = []
  credits: Map<string, CarbonCredit> = new Map()
  trades: Trade[] = []
  ledger: LedgerEntry[] = []
  auditLogs: AuditLog[] = []
  registrationRequests: RegistrationRequest[] = []
  private initialized = false

  async initialize() {
    if (this.initialized) return

    // Seed default users
    const adminHash = await bcrypt.hash('admin123', 10)
    const companyHash = await bcrypt.hash('company123', 10)
    const regulatorHash = await bcrypt.hash('regulator123', 10)

    const now = new Date().toISOString()

    // Admin user
    const admin: User = {
      id: 'usr_admin_001',
      email: 'admin@carbonex.com',
      password_hash: adminHash,
      name: 'Platform Admin',
      role: 'regulator', // uses regulator role so they can access the dashboard
      created_at: now,
      updated_at: now,
    }

    // Company users
    const acme: User = {
      id: 'usr_acme_001',
      email: 'acme@company.com',
      password_hash: companyHash,
      name: 'ACME Corporation',
      role: 'company',
      company_name: 'ACME Corp',
      created_at: now,
      updated_at: now,
    }

    const greentech: User = {
      id: 'usr_greentech_001',
      email: 'greentech@company.com',
      password_hash: companyHash,
      name: 'GreenTech Industries',
      role: 'company',
      company_name: 'GreenTech Industries',
      created_at: now,
      updated_at: now,
    }

    const ecofirst: User = {
      id: 'usr_ecofirst_001',
      email: 'ecofirst@company.com',
      password_hash: companyHash,
      name: 'EcoFirst Solutions',
      role: 'company',
      company_name: 'EcoFirst Solutions',
      created_at: now,
      updated_at: now,
    }

    // Regulator user
    const regulator: User = {
      id: 'usr_reg_001',
      email: 'reg@gov.com',
      password_hash: regulatorHash,
      name: 'EPA Regulator',
      role: 'regulator',
      created_at: now,
      updated_at: now,
    }

    this.users.set(admin.id, admin)
    this.users.set(acme.id, acme)
    this.users.set(greentech.id, greentech)
    this.users.set(ecofirst.id, ecofirst)
    this.users.set(regulator.id, regulator)

    // Seed carbon passports
    const acmePassport: CarbonPassport = {
      id: 'psp_acme_001',
      user_id: acme.id,
      company_name: 'ACME Corp',
      industry_sector: 'Manufacturing',
      annual_emissions: 15000,
      emission_reduction_target: 30,
      compliance_status: 'compliant',
      trust_score: 78,
      sustainability_rating: 'B',
      last_audit_date: '2026-01-15',
      created_at: now,
      updated_at: now,
    }

    const greentechPassport: CarbonPassport = {
      id: 'psp_greentech_001',
      user_id: greentech.id,
      company_name: 'GreenTech Industries',
      industry_sector: 'Technology',
      annual_emissions: 5000,
      emission_reduction_target: 50,
      compliance_status: 'compliant',
      trust_score: 92,
      sustainability_rating: 'A',
      last_audit_date: '2026-02-20',
      created_at: now,
      updated_at: now,
    }

    const ecofirstPassport: CarbonPassport = {
      id: 'psp_ecofirst_001',
      user_id: ecofirst.id,
      company_name: 'EcoFirst Solutions',
      industry_sector: 'Energy',
      annual_emissions: 8500,
      emission_reduction_target: 40,
      compliance_status: 'pending',
      trust_score: 65,
      sustainability_rating: 'C',
      last_audit_date: '2025-11-10',
      created_at: now,
      updated_at: now,
    }

    this.passports.set(acmePassport.id, acmePassport)
    this.passports.set(greentechPassport.id, greentechPassport)
    this.passports.set(ecofirstPassport.id, ecofirstPassport)

    // Seed emission logs
    const emissionTypes: EmissionLog['emission_type'][] = ['scope1', 'scope2', 'scope3']
    const months = ['2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03']

    for (const userId of [acme.id, greentech.id, ecofirst.id]) {
      for (const month of months) {
        for (const type of emissionTypes) {
          this.emissions.push({
            id: generateId(),
            user_id: userId,
            emission_type: type,
            amount_tonnes: Math.floor(Math.random() * 500) + 100,
            reporting_period: month,
            verification_status: 'verified',
            data_source: 'Smart Meter',
            created_at: `${month}-15T10:00:00Z`,
          })
        }
      }
    }

    // Seed carbon credits
    const creditTypes: CarbonCredit['credit_type'][] = ['renewable', 'forestry', 'industrial', 'agriculture']
    const certBodies = ['Gold Standard', 'Verra VCS', 'Climate Action Reserve', 'American Carbon Registry']

    for (let i = 0; i < 20; i++) {
      const credit: CarbonCredit = {
        id: `crd_${generateId()}`,
        owner_id: [acme.id, greentech.id, ecofirst.id][i % 3],
        credit_type: creditTypes[i % 4],
        vintage_year: 2024 + (i % 3),
        quantity: Math.floor(Math.random() * 1000) + 100,
        price_per_unit: parseFloat((Math.random() * 20 + 10).toFixed(2)),
        expiry_date: `202${7 + (i % 3)}-12-31`,
        status: 'available',
        certification_body: certBodies[i % 4],
        created_at: now,
      }
      this.credits.set(credit.id, credit)
    }

    // Seed some trades
    const creditIds = Array.from(this.credits.keys())
    for (let i = 0; i < 15; i++) {
      const buyerId = [acme.id, greentech.id, ecofirst.id][i % 3]
      const sellerId = [acme.id, greentech.id, ecofirst.id][(i + 1) % 3]
      const creditId = creditIds[i % creditIds.length]
      const quantity = Math.floor(Math.random() * 50) + 10
      const pricePerUnit = parseFloat((Math.random() * 20 + 10).toFixed(2))

      const trade: Trade = {
        id: `trd_${generateId()}`,
        buyer_id: buyerId,
        seller_id: sellerId,
        credit_id: creditId,
        quantity,
        price_per_unit: pricePerUnit,
        total_price: parseFloat((quantity * pricePerUnit).toFixed(2)),
        trade_type: 'buy',
        status: 'completed',
        ledger_hash: this.generateHash(`${buyerId}-${sellerId}-${creditId}-${quantity}`),
        created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      }
      this.trades.push(trade)

      // Add to ledger
      const previousHash = this.ledger.length > 0 ? this.ledger[this.ledger.length - 1].transaction_hash : '0'.repeat(64)
      const ledgerEntry: LedgerEntry = {
        id: `led_${generateId()}`,
        trade_id: trade.id,
        transaction_hash: this.generateHash(`${previousHash}-${trade.id}-${Date.now()}`),
        previous_hash: previousHash,
        nonce: Math.random().toString(36).substring(2),
        action: 'trade',
        data: JSON.stringify({ trade }),
        timestamp: trade.created_at,
        verified: true,
      }
      this.ledger.push(ledgerEntry)
    }

    this.initialized = true
  }

  private generateHash(input: string): string {
    // Simple hash for demo - in production use crypto.subtle.digest
    let hash = 0
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(16).padStart(64, '0')
  }

  // User operations
  async getUserByEmail(email: string): Promise<User | undefined> {
    await this.initialize()
    return Array.from(this.users.values()).find(u => u.email === email)
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
    if (user) {
      const updated = { ...user, ...data, updated_at: new Date().toISOString() }
      this.users.set(id, updated)
      return updated
    }
    return undefined
  }

  // Registration Request operations
  async addRegistrationRequest(req: Omit<RegistrationRequest, 'id' | 'created_at' | 'status'>): Promise<RegistrationRequest> {
    await this.initialize()
    const newReq: RegistrationRequest = {
      ...req,
      id: `req_${generateId()}`,
      status: 'pending',
      created_at: new Date().toISOString()
    }
    this.registrationRequests.push(newReq)
    return newReq
  }

  async getRegistrationRequests(): Promise<RegistrationRequest[]> {
    await this.initialize()
    return this.registrationRequests
  }

  async updateRegistrationRequest(id: string, status: 'accepted' | 'rejected'): Promise<RegistrationRequest | undefined> {
    await this.initialize()
    const req = this.registrationRequests.find(r => r.id === id)
    if (req) {
      req.status = status
      
      // If accepted, create a user with requires_password_setup
      if (status === 'accepted') {
        const newUser: User = {
          id: `usr_${generateId()}`,
          email: req.email,
          name: req.name,
          company_name: req.company_name,
          password_hash: '', // User will set it later
          role: 'company',
          requires_password_setup: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        this.users.set(newUser.id, newUser)
        
        // Setup initial empty passport
        const passport: CarbonPassport = {
          id: `psp_${generateId()}`,
          user_id: newUser.id,
          company_name: req.company_name,
          industry_sector: 'Other',
          annual_emissions: 0,
          emission_reduction_target: 0,
          compliance_status: 'pending',
          trust_score: 50,
          sustainability_rating: 'C',
          last_audit_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        this.passports.set(passport.id, passport)
      } else if (status === 'rejected') {
         // remove from the list
         this.registrationRequests = this.registrationRequests.filter(r => r.id !== id);
      }
      return req
    }
    return undefined
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

  async updatePassport(id: string, data: Partial<CarbonPassport>): Promise<CarbonPassport | undefined> {
    await this.initialize()
    const passport = this.passports.get(id)
    if (passport) {
      const updated = { ...passport, ...data, updated_at: new Date().toISOString() }
      this.passports.set(id, updated)
      return updated
    }
    return undefined
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

  async updateCredit(id: string, data: Partial<CarbonCredit>): Promise<CarbonCredit | undefined> {
    await this.initialize()
    const credit = this.credits.get(id)
    if (credit) {
      const updated = { ...credit, ...data }
      this.credits.set(id, updated)
      return updated
    }
    return undefined
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
    this.auditLogs.push(log)
    return log
  }

  async getAuditLogs(limit = 100): Promise<AuditLog[]> {
    await this.initialize()
    return this.auditLogs.slice(-limit).reverse()
  }

  // Market statistics
  async getMarketStats() {
    await this.initialize()
    const credits = Array.from(this.credits.values())
    const availableCredits = credits.filter(c => c.status === 'available')
    const totalSupply = availableCredits.reduce((sum, c) => sum + c.quantity, 0)
    const avgPrice = availableCredits.length > 0
      ? availableCredits.reduce((sum, c) => sum + c.price_per_unit, 0) / availableCredits.length
      : 0

    const passports = Array.from(this.passports.values())
    const avgTrustScore = passports.length > 0
      ? passports.reduce((sum, p) => sum + p.trust_score, 0) / passports.length
      : 0

    const recentTrades = this.trades.slice(-24)
    const volume24h = recentTrades.reduce((sum, t) => sum + t.total_price, 0)

    return {
      current_price: parseFloat(avgPrice.toFixed(2)),
      price_change_24h: parseFloat((Math.random() * 10 - 5).toFixed(2)),
      volume_24h: parseFloat(volume24h.toFixed(2)),
      total_supply: totalSupply,
      market_cap: parseFloat((totalSupply * avgPrice).toFixed(2)),
      avg_trust_score: parseFloat(avgTrustScore.toFixed(1)),
    }
  }
}

// Export singleton instance — use globalThis to survive Next.js hot reloads
// Without this, every hot-reload wipes the in-memory DB including newly registered users.
declare global {
  // eslint-disable-next-line no-var
  var __carbonExDb: Database | undefined
}

if (!global.__carbonExDb) {
  global.__carbonExDb = new Database()
}

export const db = global.__carbonExDb

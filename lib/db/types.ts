// Database types for the Carbon Credit Exchange

export type UserRole = 'admin' | 'company' | 'regulator'

export interface User {
  id: string
  email: string
  password_hash: string
  name: string
  role: UserRole
  company_name?: string
  is_blocked?: boolean
  requires_password_setup?: boolean
  created_at: string
  updated_at: string
}

export interface RegistrationRequest {
  id: string
  email: string
  company_name: string
  name: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
}

export interface CarbonPassport {
  id: string
  user_id: string
  company_name: string
  industry_sector: string
  annual_emissions: number
  emission_reduction_target: number
  compliance_status: 'compliant' | 'non-compliant' | 'pending'
  trust_score: number
  sustainability_rating: 'A' | 'B' | 'C' | 'D' | 'F'
  last_audit_date: string
  created_at: string
  updated_at: string
}

export interface EmissionLog {
  id: string
  user_id: string
  emission_type: 'scope1' | 'scope2' | 'scope3'
  amount_tonnes: number
  reporting_period: string
  verification_status: 'pending' | 'verified' | 'rejected'
  data_source: string
  created_at: string
}

export interface CarbonCredit {
  id: string
  owner_id: string
  credit_type: 'renewable' | 'forestry' | 'industrial' | 'agriculture'
  vintage_year: number
  quantity: number
  price_per_unit: number
  expiry_date: string
  status: 'available' | 'locked' | 'retired' | 'expired'
  certification_body: string
  created_at: string
}

export interface Trade {
  id: string
  buyer_id: string
  seller_id: string
  credit_id: string
  quantity: number
  price_per_unit: number
  total_price: number
  trade_type: 'buy' | 'sell'
  status: 'pending' | 'completed' | 'cancelled' | 'failed'
  ledger_hash: string
  created_at: string
  completed_at?: string
}

export interface LedgerEntry {
  id: string
  trade_id: string
  transaction_hash: string
  previous_hash: string
  nonce: string
  action: 'trade' | 'issuance' | 'retirement' | 'transfer'
  data: string // JSON string of transaction details
  timestamp: string
  verified: boolean
}

export interface Session {
  id: string
  user_id: string
  token: string
  expires_at: string
  created_at: string
}

export interface AuditLog {
  id: string
  user_id: string
  action: string
  resource_type: string
  resource_id: string
  details: string
  ip_address?: string
  created_at: string
}

// API Response types
export interface PricePredict {
  predicted_price: number
  confidence: number
  factors: {
    demand_impact: number
    supply_impact: number
    trust_impact: number
    volatility_impact: number
  }
  explanation: string
}

export interface TrustScore {
  overall_score: number
  components: {
    compliance: number
    sustainability: number
    reporting: number
    trading: number
  }
  trend: 'improving' | 'stable' | 'declining'
}

// Market data types
export interface MarketData {
  current_price: number
  price_change_24h: number
  volume_24h: number
  total_supply: number
  market_cap: number
  avg_trust_score: number
}

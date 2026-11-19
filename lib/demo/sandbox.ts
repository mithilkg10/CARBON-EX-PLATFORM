"use client"

/**
 * Recruiter demo sandbox.
 *
 * Demo sessions run every action through the real API, which validates it, computes the
 * real hashes and returns the result marked `simulated: true` without changing the shared
 * dataset. The results are kept here, in sessionStorage, so that a purchase shows up in the
 * wallet, holdings, trade history, passport and audit trail of the same browser tab, and
 * one recruiter's actions never leak into another recruiter's view.
 */

import { useSyncExternalStore } from "react"

export interface SandboxTrade {
  id: string
  buyerName: string
  sellerName: string
  quantity: number
  pricePerUnit: number
  totalPrice: number
  status: string
  ledgerHash: string
  createdAt: string
  isUserBuyer: boolean
  isUserSeller: boolean
}

export interface SandboxCredit {
  id: string
  type: string
  vintageYear: number
  quantity: number
  pricePerUnit: number
  expiryDate: string
  certificationBody: string
  listed: boolean
}

export interface SandboxEmission {
  id: string
  type: string
  amount: number
  period: string
  status: string
  source: string
  createdAt: string
}

export interface SandboxAction {
  id: string
  timestamp: string
  action: string
  entityType: string
  entityId: string
  details: Record<string, unknown>
}

export interface SandboxState {
  walletDelta: number
  trades: SandboxTrade[]
  /** Credits bought in this session, keyed by credit id. */
  acquired: SandboxCredit[]
  /** Quantity bought out of each market listing, keyed by listing id. */
  consumed: Record<string, number>
  /** Listing state changes on owned credits, keyed by credit id. */
  listings: Record<string, boolean>
  emissions: SandboxEmission[]
  reviews: Record<string, "approved" | "rejected">
  suspended: Record<string, boolean>
  registrations: Record<string, "accepted" | "rejected">
  actions: SandboxAction[]
}

const KEY = "carbonex-demo-sandbox-v1"

const EMPTY: SandboxState = {
  walletDelta: 0,
  trades: [],
  acquired: [],
  consumed: {},
  listings: {},
  emissions: [],
  reviews: {},
  suspended: {},
  registrations: {},
  actions: [],
}

let state: SandboxState = EMPTY
let loaded = false
const listeners = new Set<() => void>()

function load() {
  if (loaded || typeof window === "undefined") return
  loaded = true
  try {
    const raw = window.sessionStorage.getItem(KEY)
    if (raw) state = { ...EMPTY, ...JSON.parse(raw) }
  } catch {
    state = EMPTY
  }
}

function save() {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // Storage can be unavailable (private mode); the sandbox then lasts for the page only.
  }
}

export function updateSandbox(change: (s: SandboxState) => SandboxState) {
  load()
  state = change(state)
  save()
  listeners.forEach((l) => l())
}

export function recordAction(action: Omit<SandboxAction, "id" | "timestamp">) {
  updateSandbox((s) => ({
    ...s,
    actions: [
      { ...action, id: `demo_${Date.now().toString(36)}_${s.actions.length}`, timestamp: new Date().toISOString() },
      ...s.actions,
    ].slice(0, 100),
  }))
}

export function resetSandbox() {
  updateSandbox(() => EMPTY)
}

function subscribe(listener: () => void) {
  load()
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useSandbox(): SandboxState {
  return useSyncExternalStore(
    subscribe,
    () => {
      load()
      return state
    },
    () => EMPTY,
  )
}

/** Clears the sandbox when a new demo session starts or the user signs out. */
export function clearSandboxStorage() {
  try {
    window.sessionStorage.removeItem(KEY)
  } catch {
    // ignore
  }
  state = EMPTY
  listeners.forEach((l) => l())
}

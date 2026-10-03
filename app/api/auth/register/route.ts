import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  void req
  // No verified invitation or email-ownership flow exists in this prototype.
  return NextResponse.json({ error: 'Self-service registration is unavailable in this demo' }, { status: 403 })
}

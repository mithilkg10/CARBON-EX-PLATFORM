import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { action, email, name, company_name, password } = body

    if (action === 'register') {
      if (!email || !name || !company_name) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
      }
      
      const existingUser = await db.getUserByEmail(email)
      if (existingUser) {
        return NextResponse.json({ error: 'User already exists' }, { status: 400 })
      }

      await db.addRegistrationRequest({ email, name, company_name })
      return NextResponse.json({ message: 'Registration request submitted successfully. Waiting for admin approval.' })
    } 
    
    if (action === 'set_password') {
      if (!email || !password) {
        return NextResponse.json({ error: 'Missing email or password' }, { status: 400 })
      }

      const user = await db.getUserByEmail(email)
      if (!user || !user.requires_password_setup) {
        return NextResponse.json({ error: 'User not found or password already set' }, { status: 400 })
      }

      const password_hash = await bcrypt.hash(password, 10)
      await db.updateUser(user.id, { 
        password_hash,
        requires_password_setup: false
      })

      return NextResponse.json({ message: 'Password set successfully. You can now login.' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'

const PYTHON_API = process.env.PYTHON_API_URL || 'http://localhost:8000'

export async function GET() {
  try {
    const res = await fetch(`${PYTHON_API}/wallet`, { cache: 'no-store' })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Backend offline' }, { status: 503 })
  }
}

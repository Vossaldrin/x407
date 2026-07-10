import { NextResponse } from 'next/server'

const PYTHON_API = process.env.PYTHON_API_URL || 'http://localhost:8000'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const params = searchParams.toString()
    const res = await fetch(`${PYTHON_API}/marketplace${params ? '?' + params : ''}`, { cache: 'no-store' })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ templates: [], error: 'Backend offline' }, { status: 503 })
  }
}

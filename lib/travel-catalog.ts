export interface TravelOption {
  id: string
  type: 'flight' | 'hotel'
  name: string
  detail: string
  price: number
}

// Deterministic pseudo-random generator so results vary per destination
// without needing a real (crypto-payable) travel API — demo/simulated only.
function seedFrom(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
  return h
}

function rand(seed: number, i: number): number {
  const x = Math.sin(seed + i * 999) * 10000
  return x - Math.floor(x)
}

const AIRLINES = ['SkyLine', 'BlueWing', 'Continental Air', 'Northstar']
const HOTELS = ['Grand Plaza', 'Harbor Inn', 'The Meridian', 'Oakwood Suites']

export function searchTravel(destination: string, maxBudget: number): TravelOption[] {
  const seed = seedFrom(destination.trim().toLowerCase() || 'anywhere')
  const options: TravelOption[] = []

  for (let i = 0; i < 3; i++) {
    const price = Math.round((150 + rand(seed, i) * 450) * 100) / 100
    options.push({
      id: `flight_${i}`,
      type: 'flight',
      name: AIRLINES[Math.floor(rand(seed, i + 10) * AIRLINES.length)],
      detail: `Round-trip to ${destination}`,
      price,
    })
  }
  for (let i = 0; i < 2; i++) {
    const price = Math.round((80 + rand(seed, i + 20) * 220) * 100) / 100
    options.push({
      id: `hotel_${i}`,
      type: 'hotel',
      name: HOTELS[Math.floor(rand(seed, i + 30) * HOTELS.length)],
      detail: `3 nights in ${destination}`,
      price,
    })
  }

  return options.filter(o => o.price <= maxBudget || maxBudget <= 0).sort((a, b) => a.price - b.price)
}

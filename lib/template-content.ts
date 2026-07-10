// Illustrative demo content for marketplace template detail pages — sample
// activity and reviews are examples, not a hired instance's real history.
export interface SampleActivity {
  label: string
  detail: string
}

export interface Review {
  name: string
  role: string
  quote: string
  rating: number
}

const ACTIVITY_BY_CATEGORY: Record<string, SampleActivity[]> = {
  Finance: [
    { label: 'Swapped 0.05 ETH → 87.42 USDC', detail: 'Base · 2h ago' },
    { label: 'Blocked a trade exceeding daily limit', detail: 'Base · 6h ago' },
    { label: 'Paid $0.03 for a market data snapshot', detail: 'Base · 1d ago' },
  ],
  Shopping: [
    { label: 'Found a lower price and switched merchants', detail: 'saved $8.40 · 3h ago' },
    { label: 'Completed weekly grocery order', detail: '$62.10 · 1d ago' },
    { label: 'Skipped a purchase — over budget', detail: '2d ago' },
  ],
  Research: [
    { label: 'Paid $0.02 for a web research snippet', detail: 'Base · 1h ago' },
    { label: 'Synthesized a report from 3 paid sources', detail: '4h ago' },
    { label: 'Compiled daily briefing', detail: '1d ago' },
  ],
  Travel: [
    { label: 'Booked a 3-night stay under budget', detail: '$214.00 · 5h ago' },
    { label: 'Found a cheaper flight and rebooked', detail: 'saved $46 · 1d ago' },
    { label: 'Searched 12 destinations for best price', detail: '2d ago' },
  ],
  'Dev tools': [
    { label: 'Paid for a compute job', detail: '$0.05 · Base · 2h ago' },
    { label: 'Provisioned a staging instance', detail: '5h ago' },
    { label: 'Blocked an unexpected billing spike', detail: '1d ago' },
  ],
  Business: [
    { label: 'Processed a customer refund', detail: '$18.00 · 3h ago' },
    { label: 'Launched an outreach campaign batch', detail: '1d ago' },
    { label: 'Flagged a request outside policy', detail: '2d ago' },
  ],
  Personal: [
    { label: 'Compared 4 options before booking', detail: '2h ago' },
    { label: 'Paid a monthly bill on schedule', detail: '1d ago' },
    { label: 'Switched to a cheaper plan', detail: 'saved $6/mo · 3d ago' },
  ],
}

const REVIEWS_BY_CATEGORY: Record<string, Review[]> = {
  Finance: [
    { name: 'Priya K.', role: 'Independent trader', quote: 'Runs my rebalancing rules while I sleep. The spend caps are what sold me.', rating: 5 },
    { name: 'Marcus T.', role: 'Crypto-curious', quote: 'Real on-chain transactions I can verify myself on Basescan — not a black box.', rating: 5 },
  ],
  Shopping: [
    { name: 'Dana L.', role: 'Busy parent', quote: 'Set it once and stopped thinking about the weekly order.', rating: 4 },
    { name: 'Sam R.', role: 'Budget-conscious', quote: 'Caught a better deal I would have missed.', rating: 5 },
  ],
  Research: [
    { name: 'Wei C.', role: 'Analyst', quote: 'Pays for exactly the sources it uses, then writes the summary. Cuts my research time in half.', rating: 5 },
    { name: 'Aisha B.', role: 'Writer', quote: 'Cited sources are a nice touch — I can check its work.', rating: 4 },
  ],
  Travel: [
    { name: 'Jonas H.', role: 'Frequent flyer', quote: 'Found a cheaper flight than I did on three separate sites.', rating: 4 },
    { name: 'Liv S.', role: 'Remote worker', quote: 'Books within my budget without me having to double-check every time.', rating: 5 },
  ],
  'Dev tools': [
    { name: 'Theo M.', role: 'Indie developer', quote: 'Pays for compute the moment I need it, nothing sitting idle.', rating: 5 },
    { name: 'Grace P.', role: 'Backend engineer', quote: 'The per-tx cap saved me from a runaway bill once already.', rating: 5 },
  ],
  Business: [
    { name: 'Elena V.', role: 'Support lead', quote: 'Handles the small refunds so my team can focus on the hard cases.', rating: 4 },
    { name: 'Omar F.', role: 'Growth marketer', quote: 'Scales outreach without needing sign-off on every batch.', rating: 4 },
  ],
  Personal: [
    { name: 'Nadia J.', role: 'Everyday user', quote: 'It quietly found a cheaper plan and just told me afterward. Exactly what I wanted.', rating: 5 },
    { name: 'Ben O.', role: 'First-time user', quote: 'Easiest way I have found to try a crypto-native agent without babysitting it.', rating: 4 },
  ],
}

const DEFAULT_ACTIVITY: SampleActivity[] = [
  { label: 'Completed a task within configured limits', detail: '2h ago' },
  { label: 'Awaiting next scheduled run', detail: '1d ago' },
]
const DEFAULT_REVIEWS: Review[] = [
  { name: 'Early user', role: 'Beta tester', quote: 'Does what it says, and I can see every transaction on-chain.', rating: 4 },
]

export function getSampleActivity(category: string): SampleActivity[] {
  return ACTIVITY_BY_CATEGORY[category] || DEFAULT_ACTIVITY
}
export function getReviews(category: string): Review[] {
  return REVIEWS_BY_CATEGORY[category] || DEFAULT_REVIEWS
}

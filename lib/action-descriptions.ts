// Plain-language explanations for the action tags used across marketplace
// templates (backend/main.py's MARKETPLACE) and the custom-agent builder
// (app/create/page.tsx's ACTIONS).
export const ACTION_DESCRIPTIONS: Record<string, string> = {
  pay_api:             'Pays for API and data access automatically, within your limits.',
  fetch_data:          'Reads market data, prices, or other information sources.',
  buy_compute:         'Pays for cloud compute or inference jobs on demand.',
  trade:               'Executes trades according to your risk rules.',
  swap:                'Swaps one asset for another on-chain.',
  shop:                'Finds and purchases items within your budget.',
  book_travel:         'Searches and books flights or hotels within your rules.',
  deploy:              'Spins up or configures infrastructure autonomously.',
  scan:                'Monitors for opportunities or issues in the background.',
  cancel_subscription: 'Identifies and cancels unused subscriptions.',
  issue_refund:        'Issues refunds for approved requests within limits.',
  run_campaign:        'Runs and scales outreach or marketing campaigns.',
}

export function describeAction(action: string): string {
  return ACTION_DESCRIPTIONS[action] || 'Performs this action within your configured limits.'
}

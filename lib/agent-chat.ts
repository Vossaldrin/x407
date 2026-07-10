const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
}

export interface ProposedAction {
  type: 'research' | 'finance' | 'travel' | 'defi' | 'api'
  params: Record<string, any>
}

export async function sendChatMessage(
  agentId: string, flowType: string, message: string, history: ChatMessage[]
): Promise<{ reply: string; proposedAction: ProposedAction | null } | null> {
  try {
    const res = await fetch(`${API}/agents/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId, flowType, message, history }),
    })
    const data = await res.json()
    if (!res.ok) return { reply: data.detail || 'Chat is unavailable right now.', proposedAction: null }
    return data
  } catch {
    return { reply: 'Backend offline — chat is unavailable right now.', proposedAction: null }
  }
}

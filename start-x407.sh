#!/bin/bash
# ─────────────────────────────────────────────────────────
# x407 — one-command startup for backend + frontend
# Usage: ./start-x407.sh
# ─────────────────────────────────────────────────────────

PROJECT_DIR="$HOME/Downloads/arno"

echo "🦅 Starting x407..."
echo ""

# Start backend in background
echo "→ Starting backend (FastAPI) on :8000"
cd "$PROJECT_DIR/backend" || exit 1
source ../venv/bin/activate
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!

# Give backend a moment to boot
sleep 2

# Start frontend in foreground
echo "→ Starting frontend (Next.js) on :3000"
cd "$PROJECT_DIR" || exit 1
npm run dev

# When frontend is stopped (Ctrl+C), also kill backend
kill $BACKEND_PID 2>/dev/null

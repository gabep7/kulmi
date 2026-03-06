#!/bin/bash
ROOT="$(cd "$(dirname "$0")" && pwd)"

# Start backend in background
(cd "$ROOT/backend" && source .venv/bin/activate && uvicorn main:app --port 8000) &
BACKEND_PID=$!

# Kill backend when this script exits (Ctrl+C, etc.)
trap "kill $BACKEND_PID 2>/dev/null" EXIT INT TERM

# Start frontend (keeps running in foreground)
cd "$ROOT/frontend" && npm run dev

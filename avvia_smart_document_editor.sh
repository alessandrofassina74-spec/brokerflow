#!/bin/bash
# Launcher for Smart Document Editor MVP

PORT=8090
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR/smart_document_editor"

echo "=========================================================="
echo "    AVVIO SMART DOCUMENT EDITOR (MVP FASE 1)"
echo "    Character Bank Document-Local + Interactive Canvas"
echo "=========================================================="
echo "Apertura su http://localhost:$PORT ..."

# Start Python HTTP server
python3 -m http.server $PORT &
SERVER_PID=$!

sleep 1
open "http://localhost:$PORT"

echo "Server attivo (PID: $SERVER_PID). Premi CTRL+C per arrestare."
wait $SERVER_PID

#!/bin/bash
# SMART DOCUMENT EDITOR — Launcher
# Porta dedicata: 9350 (nessun conflitto con broker flow o parser)

PORT=9350
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "=========================================================="
echo "    AVVIO SMART DOCUMENT EDITOR (FASE 1: MVP)"
echo "    Character Bank Document-Local + Interactive Canvas"
echo "=========================================================="
echo "Porta dedicata: $PORT"
echo "Apertura su http://localhost:$PORT ..."

# Avvia server HTTP Python in background
python3 -m http.server $PORT &
SERVER_PID=$!

sleep 1
open "http://localhost:$PORT"

echo "Server attivo (PID: $SERVER_PID). Premi CTRL+C per arrestare."
wait $SERVER_PID

#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "================================================="
echo "   BrokerFlow - Avvio Server & Tunnel Remoto     "
echo "================================================="

if ! lsof -i :8080 >/dev/null 2>&1; then
    echo "Avvio server Python locale (porta 8080)..."
    python3 server.py &
    sleep 2
else
    echo "✓ Server Python già attivo sulla porta 8080."
fi

echo "Avvio tunnel sicuro HTTPS Cloudflare..."
./bin/cloudflared tunnel --url http://localhost:8080

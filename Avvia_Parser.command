#!/usr/bin/env bash
WORKSPACE="/Users/alessandrofassina/Desktop/broker flow"
cd "$WORKSPACE" || exit 1

if curl -s --connect-timeout 0.4 http://localhost:8085/ >/dev/null 2>&1; then
    echo "✓ BrokerFlow Parser è già attivo. Apertura browser..."
    open "http://localhost:8085/"
else
    echo "Avvio BrokerFlow Parser Dashboard..."
    /usr/bin/python3 "$WORKSPACE/scripts/gui_launcher.py" --open
fi

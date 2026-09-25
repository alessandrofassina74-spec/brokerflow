#!/bin/bash
# Move to the workspace directory
cd "/Users/alessandrofassina/Desktop/broker flow"

# Check if port 8080 is already responsive
if curl -s --connect-timeout 0.5 http://localhost:8080/ >/dev/null 2>&1; then
    open "http://localhost:8080/"
else
    # Start python server in background detached mode
    pkill -f "python3 server.py" 2>/dev/null
    nohup python3 server.py > server_desktop.log 2>&1 &
    
    # Wait until server responds
    for i in {1..20}; do
        if curl -s --connect-timeout 0.2 http://localhost:8080/ >/dev/null 2>&1; then
            break
        fi
        sleep 0.1
    done
    open "http://localhost:8080/"
fi

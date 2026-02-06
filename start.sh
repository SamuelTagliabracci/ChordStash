#!/bin/bash

# ChordStash Start Script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Parse config.yaml for port
PORT=$(grep 'port:' "$SCRIPT_DIR/config.yaml" | head -1 | awk '{print $2}')
PORT=${PORT:-3000}

export PORT
export NODE_ENV=${NODE_ENV:-production}

# Stop any existing instance
echo "Stopping any existing ChordStash process..."
pkill -f "node.*server.js" 2>/dev/null || true
sleep 1

cd "$SCRIPT_DIR"
echo "Starting ChordStash on port $PORT..."
node server.js

# Cleanup on exit
trap "echo 'Stopping ChordStash...'; pkill -f 'node.*server.js' 2>/dev/null" EXIT

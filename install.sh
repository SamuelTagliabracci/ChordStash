#!/bin/bash
set -e

# ChordStash Installation Script
# Run with sudo: sudo ./install.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source <(grep -A 100 '^app:' "$SCRIPT_DIR/config.yaml" | head -20 | sed 's/: /=/g' | sed 's/  //g')

APP_NAME="${name:-chordstash}"
APP_PORT="${port:-9010}"
DOMAIN="${domain:-localhost}"
INSTALL_PATH="${install_path:-$SCRIPT_DIR}"
USER="${user:-$USER}"

echo "=========================================="
echo "  ChordStash Installer"
echo "=========================================="
echo "App: $APP_NAME"
echo "Port: $APP_PORT"
echo "Domain: $DOMAIN"
echo "Path: $INSTALL_PATH"
echo "User: $USER"
echo ""

# Check if running as root for system installs
if [[ $EUID -ne 0 ]]; then
   echo "Note: Run with sudo to install systemd service and nginx config"
   echo "Running in user mode (npm install only)..."
   SYSTEM_INSTALL=false
else
   SYSTEM_INSTALL=true
fi

# Install Node.js dependencies
echo "[1/5] Installing Node.js dependencies..."
cd "$INSTALL_PATH"
npm install --production

# Install Playwright Chromium browser
echo "[2/5] Installing Playwright Chromium browser..."
npx playwright install chromium --with-deps

# Create data directory if needed
echo "[3/5] Setting up data directory..."
mkdir -p "$INSTALL_PATH/data"
chown -R $USER:$USER "$INSTALL_PATH/data" 2>/dev/null || true

if [ "$SYSTEM_INSTALL" = true ]; then
    # Install systemd service
    echo "[4/5] Installing systemd service..."

    # Update service file with correct paths
    sed -e "s|WorkingDirectory=.*|WorkingDirectory=$INSTALL_PATH|g" \
        -e "s|User=.*|User=$USER|g" \
        -e "s|PORT=.*|PORT=$APP_PORT|g" \
        "$INSTALL_PATH/deploy/systemd/chordstash.service" > /etc/systemd/system/$APP_NAME.service

    systemctl daemon-reload
    systemctl enable $APP_NAME

    # Install nginx config
    echo "[5/5] Installing nginx configuration..."

    # Update nginx config with correct port and domain
    sed -e "s|server_name .*|server_name $DOMAIN;|g" \
        -e "s|proxy_pass .*|proxy_pass http://127.0.0.1:$APP_PORT;|g" \
        "$INSTALL_PATH/deploy/nginx/chordstash.conf" > /etc/nginx/sites-available/$APP_NAME

    ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/$APP_NAME

    # Test nginx config
    nginx -t

    echo ""
    echo "=========================================="
    echo "  Installation Complete!"
    echo "=========================================="
    echo ""
    echo "Start the app:    sudo systemctl start $APP_NAME"
    echo "Reload nginx:     sudo systemctl reload nginx"
    echo "View logs:        sudo journalctl -u $APP_NAME -f"
    echo ""
else
    echo "[4/5] Skipping systemd service (run with sudo)"
    echo "[5/5] Skipping nginx config (run with sudo)"
    echo ""
    echo "=========================================="
    echo "  Dependencies Installed!"
    echo "=========================================="
    echo ""
    echo "Run with sudo to complete system installation."
    echo "Or start manually: ./start.sh"
    echo ""
fi

#!/bin/bash

# Start all 3 services for ACP Production Demo

# Store the root directory
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    kill 0
    exit 0
}

trap cleanup SIGINT SIGTERM

# Check for --setup flag
FORCE_SETUP=false
if [[ "$1" == "--setup" ]]; then
    FORCE_SETUP=true
fi

# ============================================
# Environment Setup
# ============================================

setup_env() {
    local service_dir="$1"
    local service_name="$2"
    
    if [ ! -f "$service_dir/.env" ] || [ "$FORCE_SETUP" = true ]; then
        if [ -f "$service_dir/.env.example" ]; then
            echo ""
            echo "📋 Setting up $service_name environment..."
            
            # Read .env.example and prompt for placeholder values BEFORE copying
            local temp_file=$(mktemp)
            
            while IFS= read -r line || [ -n "$line" ]; do
                # Skip comments and empty lines
                if [[ "$line" =~ ^#.*$ ]] || [[ -z "$line" ]]; then
                    echo "$line" >> "$temp_file"
                    continue
                fi
                
                # Check if line contains a placeholder value
                if echo "$line" | grep -qE "Replace|YOUR_"; then
                    # Extract key and current value
                    key="${line%%=*}"
                    current_value="${line#*=}"
                    
                    echo ""
                    echo "   $key"
                    echo "   Current: $current_value"
                    printf "   Enter value (or press Enter to skip): "
                    read new_value </dev/tty
                    
                    if [ -n "$new_value" ]; then
                        echo "$key=$new_value" >> "$temp_file"
                    else
                        echo "$line" >> "$temp_file"
                    fi
                else
                    echo "$line" >> "$temp_file"
                fi
            done < "$service_dir/.env.example"
            
            mv "$temp_file" "$service_dir/.env"
            echo ""
            echo "   ✅ $service_name .env configured"
        fi
    else
        echo "✅ $service_name .env already exists"
    fi
}

# Setup environment for services that need it
echo ""
echo "═══════════════════════════════════════════════════"
echo "  🔧 Environment Setup"
echo "═══════════════════════════════════════════════════"

setup_env "$ROOT_DIR/agent-service" "Agent Service"
setup_env "$ROOT_DIR/merchant-service" "Merchant Service"

echo ""
echo "🚀 Starting all services..."
echo ""

# Start each service in the background (suppress output initially)
(cd "$ROOT_DIR/agent-service" && npm run dev 2>&1) &
(cd "$ROOT_DIR/merchant-service" && npm run dev 2>&1) &
(cd "$ROOT_DIR/frontend" && npm run dev 2>&1) &

# Give services a moment to start
sleep 2

echo ""
echo "═══════════════════════════════════════════════════"
echo "  🚀 ACP Production Demo - All Services Running"
echo "═══════════════════════════════════════════════════"
echo ""
echo "  📱 Frontend         http://localhost:3000"
echo "  🤖 Agent Service    http://localhost:3001"
echo "  🏪 Merchant Service http://localhost:4000"
echo ""
echo "═══════════════════════════════════════════════════"
echo "  Press Ctrl+C to stop all services"
echo "  Run with --setup to reconfigure .env files"
echo "═══════════════════════════════════════════════════"
echo ""

# Wait for all background processes
wait


#!/bin/sh
# Idaho Events - Docker Entrypoint Script

set -e

echo "Idaho Events - Starting application..."

# Start proxy server in background
echo "Starting proxy server..."
cd /app
NODE_ENV=production node proxy-server.js &
PROXY_PID=$!

# Wait for proxy server to be ready
echo "Waiting for proxy server to be ready..."
for i in $(seq 1 30); do
    if nc -z localhost 8080; then
        echo "Proxy server is ready!"
        break
    fi
    echo "Waiting for proxy server... ($i/30)"
    sleep 1
done

# Check if proxy server started successfully
if ! nc -z localhost 8080; then
    echo "ERROR: Proxy server failed to start"
    exit 1
fi

echo "Application services started successfully"

# Execute the main command (nginx)
exec "$@"

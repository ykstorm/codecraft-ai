#!/bin/sh
# Docker healthcheck for the codecraft app container.

# Check if the app is responding
response=$(wget -q --spider --timeout=5 http://localhost:3000/api/health && echo "ok" || echo "fail")

if [ "$response" = "ok" ]; then
  exit 0
else
  exit 1
fi
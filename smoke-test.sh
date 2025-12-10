#!/bin/bash

# Smoke test for key API endpoints
# Checks that the server is up and main routes are accessible

set -e

BASE_URL="http://localhost:3000"
HEALTH_CHECK_URL="$BASE_URL"
MAX_ATTEMPTS=30
ATTEMPT=0

echo "🔍 Smoke testing key API endpoints..."
echo "🌐 Base URL: $BASE_URL"
echo ""

# Wait for server to be healthy
echo "⏳ Waiting for server to be ready..."
while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  if curl -s -f "$HEALTH_CHECK_URL" > /dev/null 2>&1; then
    echo "✅ Server is ready"
    break
  fi
  ATTEMPT=$((ATTEMPT + 1))
  echo "  Attempt $ATTEMPT/$MAX_ATTEMPTS..."
  sleep 2
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
  echo "❌ Server did not start within timeout"
  exit 1
fi

echo ""
echo "🧪 Running smoke tests..."
echo ""

# Test homepage (no auth required)
echo "1️⃣ Testing GET / (homepage)"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "307" ] || [ "$HTTP_CODE" = "308" ]; then
  echo "   ✅ Homepage accessible (HTTP $HTTP_CODE)"
else
  echo "   ❌ Homepage failed (HTTP $HTTP_CODE)"
fi

echo ""

# Test API routes (these require auth; we'll just check if the route exists)
echo "2️⃣ Testing GET /api/quotes (requires auth, so check for 401 is OK)"
RESPONSE=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer invalid" "$BASE_URL/api/quotes")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
if [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ] || [ "$HTTP_CODE" = "200" ]; then
  echo "   ✅ API route exists (HTTP $HTTP_CODE - auth expected)"
else
  echo "   ⚠️  Unexpected response (HTTP $HTTP_CODE)"
fi

echo ""

echo "3️⃣ Testing GET /api/finance (requires auth)"
RESPONSE=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer invalid" "$BASE_URL/api/finance")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
if [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ] || [ "$HTTP_CODE" = "200" ]; then
  echo "   ✅ API route exists (HTTP $HTTP_CODE - auth expected)"
else
  echo "   ⚠️  Unexpected response (HTTP $HTTP_CODE)"
fi

echo ""

echo "4️⃣ Testing GET /api/quotes/test-id/history (requires auth)"
RESPONSE=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer invalid" "$BASE_URL/api/quotes/test-id/history")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
if [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ] || [ "$HTTP_CODE" = "200" ]; then
  echo "   ✅ API route exists (HTTP $HTTP_CODE - auth expected)"
else
  echo "   ⚠️  Unexpected response (HTTP $HTTP_CODE)"
fi

echo ""
echo "✨ Smoke tests complete!"

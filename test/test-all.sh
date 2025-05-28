#!/bin/bash

set -e

echo "🔐 1. Login user 'admin'..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{ "username": "admin" }')

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r .token)
if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Login gagal. Response:"
  echo "$LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Access Token: $TOKEN"

echo ""
echo "🏢 2. Membuat account baru..."
ACCOUNT_RESPONSE=$(curl -s -X POST http://localhost:3000/accounts \
  -H "Authorization: Bearer $TOKEN")

echo "📦 Response from /accounts:"
echo "$ACCOUNT_RESPONSE"

ACCOUNT_ID=$(echo "$ACCOUNT_RESPONSE" | jq -r .account._id)
echo "✅ Account ID: $ACCOUNT_ID"

echo ""
echo "👤 3. Membuat user admin untuk account..."
curl -s -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"accountId\": \"$ACCOUNT_ID\",
    \"username\": \"admin\",
    \"email\": \"admin@example.com\",
    \"group\": \"admin\"
  }" > /dev/null
echo "✅ User created."

echo ""
echo "📦 4. Membuat schema produk..."
curl -s -X POST http://localhost:3000/schemas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"accountId\": \"$ACCOUNT_ID\",
    \"schemaId\": \"product\",
    \"description\": \"Schema untuk produk\",
    \"fields\": [],
    \"version\": \"1.0\",
    \"reducerCode\": \"function reducer(events) { let stock=0; for (const e of events) { if(e.type==='product.receive') stock+=e.data.qty; } return {stock}; }\"
  }" > /dev/null
echo "✅ Schema created."

echo ""
echo "📥 5. Kirim event product.receive..."
curl -s -X POST http://localhost:3000/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-account-id: $ACCOUNT_ID" \
  -d "{
    \"type\": \"product.receive\",
    \"data\": {
      \"product_id\": \"P001\",
      \"qty\": 10
    }
  }" > /dev/null
echo "✅ Event dikirim."

echo ""
echo "📊 6. Ambil state produk P001..."
curl -s http://localhost:3000/states/product/P001 \
  -H "Authorization: Bearer $TOKEN" | jq


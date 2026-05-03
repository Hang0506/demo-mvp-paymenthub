#!/bin/bash
# reset-demo.sh — Xóa toàn bộ data để demo lại từ đầu

echo "🗑️  Clearing demo data..."

docker exec -i payment-hub-postgres \
  psql -U postgres -d PaymentHubDb \
  < "$(dirname "$0")/reset-demo.sql"

echo ""
echo "✅ Done! Bây giờ chạy lại demo:"
echo "   ./scripts/01-setup-tenant.sh"
echo "   ./scripts/02-register-providers.sh"
echo "   ./scripts/03-create-order.sh"

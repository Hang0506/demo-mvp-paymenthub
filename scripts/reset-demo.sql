-- ============================================================
-- reset-demo.sql — Xóa toàn bộ data để demo lại từ đầu
-- Giữ nguyên schema, chỉ truncate data
--
-- Cách chạy:
--   docker exec -i payment-hub-postgres psql -U postgres -d PaymentHubDb < scripts/reset-demo.sql
-- ============================================================

-- Truncate theo thứ tự đúng (child trước, parent sau — tránh FK violation)
TRUNCATE TABLE
    "InboxEntries",
    "TransactionEvents",
    "PaymentSplits",
    "Transactions",
    "ProviderConfigs",
    "PaymentMethods",
    "Merchants",
    "Tenants"
RESTART IDENTITY CASCADE;

SELECT 'Demo data cleared successfully ✅' AS result;

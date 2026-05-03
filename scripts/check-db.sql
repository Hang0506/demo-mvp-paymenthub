SELECT 
  t."PaymentRequestCode",
  t."TransactionCode",
  t."State" as txn_state,
  s."SplitCode",
  s."MethodId",
  s."Amount",
  s."State" as split_state,
  s."ProviderOrderId",
  s."CreationTime"
FROM "Transactions" t
LEFT JOIN "PaymentSplits" s ON t."Id" = s."TransactionId"
ORDER BY t."CreationTime" DESC
LIMIT 10;

# Payment Hub Backend - ABP Framework

## Cấu trúc Project (ABP Framework)

```
PaymentHub.sln
├── src/
│   ├── PaymentHub.Domain.Shared/          # Enums, Constants, Localization
│   ├── PaymentHub.Domain/                 # Entities, Domain Services
│   ├── PaymentHub.Application.Contracts/  # DTOs, Application Interfaces
│   ├── PaymentHub.Application/            # Application Services
│   ├── PaymentHub.EntityFrameworkCore/    # DbContext, Repositories
│   ├── PaymentHub.HttpApi/                # Controllers
│   └── PaymentHub.HttpApi.Host/           # Startup, Program.cs
└── host/
    └── PaymentHub.HttpApi.Host/

```

## Cấu trúc đã tạo

✅ **PaymentHub.Domain.Shared** - Hoàn thành
- TransactionState enum
- Localization resources
- Module configuration

✅ **PaymentHub.Domain** - Hoàn thành  
- Transaction (AggregateRoot)
- PaymentSplit
- Tenant
- PaymentMethod
- ProviderConfig
- TransactionEvent
- InboxEntry

✅ **PaymentHub.Application.Contracts** - Đang xây dựng
- DTOs
- Application Service Interfaces

## Các bước tiếp theo

1. Hoàn thiện Application.Contracts layer
2. Tạo Application layer (Service implementations)
3. Tạo EntityFrameworkCore layer (DbContext + Repositories)
4. Tạo HttpApi layer (Controllers)
5. Tạo HttpApi.Host layer (Startup + Program.cs)
6. Tạo Provider Adapters (ZaloPay, MoMo, Cash)

## Build & Run

```bash
# Restore packages
dotnet restore

# Build solution
dotnet build

# Run migrations
dotnet ef database update --project src/PaymentHub.EntityFrameworkCore

# Run API
dotnet run --project host/PaymentHub.HttpApi.Host
```

## Dependencies

- .NET 8.0
- ABP Framework 8.0.0
- PostgreSQL (via Docker)
- Entity Framework Core

## Notes

- Theo đúng mô hình ABP Framework như paymentcore
- Sử dụng AggregateRoot, Entity base classes từ ABP
- Audit fields tự động (CreatedAt, UpdatedAt, CreatorId, etc.)
- Multi-tenancy ready
- Localization support

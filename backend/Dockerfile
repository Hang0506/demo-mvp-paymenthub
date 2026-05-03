# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution + project files trước để cache restore
COPY PaymentHub.sln ./
COPY src/PaymentHub.Domain.Shared/PaymentHub.Domain.Shared.csproj src/PaymentHub.Domain.Shared/
COPY src/PaymentHub.Domain/PaymentHub.Domain.csproj src/PaymentHub.Domain/
COPY src/PaymentHub.Application.Contracts/PaymentHub.Application.Contracts.csproj src/PaymentHub.Application.Contracts/
COPY src/PaymentHub.Application/PaymentHub.Application.csproj src/PaymentHub.Application/
COPY src/PaymentHub.EntityFrameworkCore/PaymentHub.EntityFrameworkCore.csproj src/PaymentHub.EntityFrameworkCore/
COPY src/PaymentHub.HttpApi/PaymentHub.HttpApi.csproj src/PaymentHub.HttpApi/
COPY host/PaymentHub.HttpApi.Host/PaymentHub.HttpApi.Host.csproj host/PaymentHub.HttpApi.Host/

RUN dotnet restore PaymentHub.sln

# Copy toàn bộ source
COPY . .

# Build & publish
RUN dotnet publish host/PaymentHub.HttpApi.Host/PaymentHub.HttpApi.Host.csproj \
    -c Release \
    -o /app/publish \
    --no-restore

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Install curl for healthcheck
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/publish .

# Create logs directory
RUN mkdir -p Logs

EXPOSE 8080

ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "PaymentHub.HttpApi.Host.dll"]
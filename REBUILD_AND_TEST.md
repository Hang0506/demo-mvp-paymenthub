# 🐳 Docker Rebuild & Verification Guide

## 📋 Prerequisites

- Docker Desktop installed and running
- Docker Compose installed
- Ports available: 3000 (frontend), 5000 (backend), 5432 (postgres), 6379 (redis)

---

## 🔧 Step 1: Clean Up Old Containers

```bash
# Navigate to mvp-demo directory
cd mvp-demo

# Stop all running containers
docker-compose down

# Remove all containers, networks, and volumes (clean slate)
docker-compose down -v

# Remove old images (optional - forces rebuild)
docker rmi payment-hub-api payment-hub-frontend payment-hub-mock-tenant
```

---

## 🏗️ Step 2: Rebuild Docker Images

```bash
# Build all services (this will take a few minutes)
docker-compose build --no-cache

# Expected output:
# [+] Building frontend...
# [+] Building api...
# [+] Building mock-tenant...
```

**Note**: `--no-cache` ensures a fresh build with all your latest code changes.

---

## 🚀 Step 3: Start All Services

```bash
# Start all services in detached mode
docker-compose up -d

# Check status of all containers
docker-compose ps

# Expected output:
# NAME                      STATUS              PORTS
# payment-hub-api           Up (healthy)        0.0.0.0:5000->8080/tcp
# payment-hub-frontend      Up                  0.0.0.0:3000->80/tcp
# payment-hub-postgres      Up (healthy)        0.0.0.0:5432->5432/tcp
# payment-hub-redis         Up (healthy)        0.0.0.0:6379->6379/tcp
# payment-hub-mock-tenant   Up                  0.0.0.0:5001->5001/tcp
```

---

## 📊 Step 4: Monitor Logs

```bash
# View logs from all services
docker-compose logs -f

# View logs from specific service
docker-compose logs -f frontend
docker-compose logs -f api

# Check for errors
docker-compose logs | grep -i error
```

---

## ✅ Step 5: Verify Services Are Running

### Check Backend API

```bash
# Test API health
curl http://localhost:5000/swagger/index.html

# Test tenant API endpoint
curl http://localhost:5000/api/payment-tenants

# Expected response:
# [
#   {"tenantId":"ict-oms","tenantName":"ICT OMS",...},
#   {"tenantId":"nha-thuoc","tenantName":"Nhà Thuốc",...}
# ]
```

### Check Frontend

```bash
# Test frontend is accessible
curl http://localhost:3000

# Should return HTML content
```

---

## 🧪 Step 6: Test Bug Fixes in Browser

### Test 1: Tenant Dropdown Fix

1. **Open browser**: `http://localhost:3000/portal/payment-methods`

2. **Open DevTools** (F12) → Network tab

3. **Verify API call**:
   - Look for `GET /api/payment-tenants` request
   - Status should be `200 OK`
   - Response should contain tenant list

4. **Check dropdown**:
   - Click on "Tenant" dropdown
   - Should show tenants from database (not hardcoded list)
   - Should show loading spinner while fetching

5. **Repeat for other pages**:
   - `http://localhost:3000/portal/providers`
   - `http://localhost:3000/portal/test-payment`

**✅ Success**: All three pages call API and show dynamic tenant list

---

### Test 2: Payment Input Fix

1. **Create a test payment**:
   - Go to: `http://localhost:3000/portal/test-payment`
   - Select tenant: `nha-thuoc`
   - Amount: `100000`
   - Click "Generate Payment Link"

2. **Open payment page**:
   - Click "Open Payment Page →"
   - New tab opens with payment form

3. **Test split payment**:
   - Select 2 payment methods (e.g., CASH + MoMo)
   - **Try typing in the SECOND input field** (MoMo amount)
   - Type: `50000`

4. **Verify fix**:
   - ✅ Input should display `50,000` immediately
   - ✅ You can change the value multiple times
   - ✅ Paste should work
   - ✅ Validation shows if total doesn't match

**✅ Success**: Second input field is responsive and accepts user input

---

## 🔍 Step 7: Verify Database State

```bash
# Connect to PostgreSQL container
docker exec -it payment-hub-postgres psql -U postgres -d PaymentHubDb

# Check tenants table
SELECT * FROM "PaymentTenants";

# Check payment methods
SELECT * FROM "PaymentMethods";

# Exit psql
\q
```

---

## 📸 Step 8: Screenshot Verification Checklist

Take screenshots to document the fixes:

### Tenant Dropdown Fix Screenshots

- [ ] Network tab showing `GET /api/payment-tenants` call
- [ ] Dropdown showing dynamic tenant list on PaymentMethodsPage
- [ ] Dropdown showing dynamic tenant list on ProvidersPage
- [ ] Dropdown showing dynamic tenant list on TestPaymentPage
- [ ] Loading spinner while fetching tenants

### Payment Input Fix Screenshots

- [ ] Payment page with 2 payment methods selected
- [ ] Second input field accepting typed input (showing `50,000`)
- [ ] Validation message when total doesn't match
- [ ] Successfully changed value multiple times

---

## 🐛 Troubleshooting

### Issue: Containers won't start

```bash
# Check logs for errors
docker-compose logs

# Check if ports are already in use
netstat -ano | findstr :3000
netstat -ano | findstr :5000
netstat -ano | findstr :5432

# Kill processes using those ports (Windows)
taskkill /PID <PID> /F
```

### Issue: Frontend shows blank page

```bash
# Check frontend logs
docker-compose logs frontend

# Rebuild frontend only
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

### Issue: API returns 500 errors

```bash
# Check API logs
docker-compose logs api

# Check database connection
docker exec -it payment-hub-postgres psql -U postgres -d PaymentHubDb -c "SELECT 1;"

# Restart API
docker-compose restart api
```

### Issue: Tenant dropdown is empty

```bash
# Check if API endpoint works
curl http://localhost:5000/api/payment-tenants

# Check database has tenants
docker exec -it payment-hub-postgres psql -U postgres -d PaymentHubDb -c "SELECT * FROM \"PaymentTenants\";"

# If empty, seed some test data
curl -X POST http://localhost:5000/api/payment-tenants \
  -H "Content-Type: application/json" \
  -d '{"tenantId":"test-clinic","tenantName":"Test Clinic"}'
```

### Issue: CORS errors in browser console

Check API CORS configuration in `backend/Program.cs`:
```csharp
app.UseCors(policy => policy
    .AllowAnyOrigin()
    .AllowAnyMethod()
    .AllowAnyHeader());
```

---

## 🎯 Quick Verification Commands

```bash
# One-liner to check all services are healthy
docker-compose ps | grep -E "(Up|healthy)"

# One-liner to test both fixes
curl http://localhost:5000/api/payment-tenants && \
curl http://localhost:3000 && \
echo "✅ Both services are responding!"

# One-liner to rebuild and restart everything
docker-compose down -v && \
docker-compose build --no-cache && \
docker-compose up -d && \
docker-compose logs -f
```

---

## 📝 Expected Results Summary

| Test | Expected Result | Status |
|------|----------------|--------|
| Backend API accessible | `curl http://localhost:5000/swagger` returns HTML | ⬜ |
| Frontend accessible | `curl http://localhost:3000` returns HTML | ⬜ |
| Tenant API works | `GET /api/payment-tenants` returns JSON array | ⬜ |
| PaymentMethodsPage calls API | Network tab shows API call | ⬜ |
| ProvidersPage calls API | Network tab shows API call | ⬜ |
| TestPaymentPage calls API | Network tab shows API call | ⬜ |
| Tenant dropdown shows data | Dropdown populated with tenants | ⬜ |
| Second input accepts typing | Can type in second payment input | ⬜ |
| Second input accepts paste | Can paste in second payment input | ⬜ |
| Validation still works | Shows warnings when total wrong | ⬜ |

---

## 🎉 Success Criteria

Both fixes are working correctly if:

1. ✅ All 5 Docker containers are running and healthy
2. ✅ Backend API responds to `/api/payment-tenants`
3. ✅ Frontend loads without errors
4. ✅ All three portal pages call `GET /api/payment-tenants` on mount
5. ✅ Tenant dropdowns show dynamic data from database
6. ✅ Second payment input field accepts user input
7. ✅ No console errors in browser DevTools
8. ✅ Form submissions still work correctly

---

## 📞 Need Help?

If you encounter issues:

1. Check logs: `docker-compose logs -f`
2. Verify all containers are running: `docker-compose ps`
3. Test API directly: `curl http://localhost:5000/api/payment-tenants`
4. Check browser console for errors (F12)
5. Verify database has data: `docker exec -it payment-hub-postgres psql ...`

---

**Last Updated**: 2026-04-28  
**Fixes Verified**: Tenant Dropdown + Payment Input Frozen

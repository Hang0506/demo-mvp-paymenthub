# 🧪 Testing Guide After Docker Build

## ✅ Build Status

Docker containers are being built with the latest code changes including:
- ✅ **Tenant Dropdown Fix** - All portal pages now load tenants from API
- ✅ **Payment Input Fix** - Second input field now accepts user input

---

## 🚀 After Build Completes

### Step 1: Start All Services

```bash
cd mvp-demo
docker compose up -d
```

Wait ~30 seconds for all services to start and become healthy.

### Step 2: Check Service Status

```bash
docker compose ps
```

**Expected output:**
```
NAME                      STATUS              PORTS
payment-hub-api           Up (healthy)        0.0.0.0:5000->8080/tcp
payment-hub-frontend      Up                  0.0.0.0:3000->80/tcp
payment-hub-postgres      Up (healthy)        0.0.0.0:5432->5432/tcp
payment-hub-redis         Up (healthy)        0.0.0.0:6379->6379/tcp
payment-hub-mock-tenant   Up                  0.0.0.0:5001->5001/tcp
```

---

## 🧪 Test 1: Tenant Dropdown Fix

### Test on PaymentMethodsPage

1. **Open browser**: `http://localhost:3000/portal/payment-methods`

2. **Open DevTools** (Press F12)
   - Go to **Network** tab
   - Refresh the page

3. **Verify API Call**:
   - Look for: `GET /api/payment-tenants`
   - Status: `200 OK`
   - Response should contain tenant array

4. **Check Dropdown**:
   - Click on "Tenant" dropdown
   - Should show tenants from database
   - Should show loading spinner while fetching

**✅ Success Criteria:**
- API call appears in Network tab
- Dropdown shows dynamic tenant list
- No hardcoded `['ict-oms', 'nha-thuoc', ...]` array

### Test on ProvidersPage

1. **Open**: `http://localhost:3000/portal/providers`
2. **Repeat steps above**
3. **Verify**: Same API call and dynamic dropdown

### Test on TestPaymentPage

1. **Open**: `http://localhost:3000/portal/test-payment`
2. **Repeat steps above**
3. **Verify**: Same API call and dynamic dropdown

---

## 🧪 Test 2: Payment Input Fix

### Create Test Payment

1. **Go to**: `http://localhost:3000/portal/test-payment`

2. **Fill form**:
   - Tenant: Select `nha-thuoc` (or any tenant)
   - Order Code: Leave empty (auto-generated)
   - Amount: `100000`
   - Customer Name: `Nguyen Van A`
   - Customer Phone: `0901234567`

3. **Click**: "Generate Payment Link"

4. **Click**: "Open Payment Page →"

### Test Split Payment Input

1. **Select 2 payment methods**:
   - Check: ☑️ Tiền mặt (CASH)
   - Check: ☑️ MoMo

2. **Test FIRST input (CASH)**:
   - Click on first input field
   - Type: `30000`
   - **Verify**: Shows `30,000` ✅

3. **Test SECOND input (MoMo)** - THIS IS THE BUG FIX:
   - Click on second input field
   - Type: `50000`
   - **✅ VERIFY**: Shows `50,000` immediately (NOT frozen!)

4. **Test multiple changes**:
   - Change second input to: `60000`
   - **Verify**: Updates to `60,000` ✅
   - Change again to: `40000`
   - **Verify**: Updates to `40,000` ✅

5. **Test paste**:
   - Copy: `25000`
   - Paste into second input
   - **Verify**: Shows `25,000` ✅

6. **Test validation**:
   - Enter amounts that don't total 100,000
   - **Verify**: Shows warning message ✅

**✅ Success Criteria:**
- Second input accepts typing immediately
- Can change value multiple times
- Paste works correctly
- Validation still works

---

## 📊 Quick Verification Checklist

### Tenant Dropdown Fix
- [ ] PaymentMethodsPage calls `GET /api/payment-tenants`
- [ ] ProvidersPage calls `GET /api/payment-tenants`
- [ ] TestPaymentPage calls `GET /api/payment-tenants`
- [ ] All dropdowns show dynamic tenant list
- [ ] Loading spinner appears while fetching
- [ ] No hardcoded tenant arrays

### Payment Input Fix
- [ ] Can type in second payment input field
- [ ] Input displays typed value immediately
- [ ] Can change value multiple times
- [ ] Paste works in second input
- [ ] Validation messages still appear
- [ ] First input still works correctly

---

## 🐛 Troubleshooting

### If services don't start:

```bash
# Check logs
docker compose logs

# Check specific service
docker compose logs api
docker compose logs frontend
```

### If API returns 500 errors:

```bash
# Check API logs
docker compose logs api

# Restart API
docker compose restart api
```

### If tenant dropdown is empty:

```bash
# Test API directly
curl http://localhost:5000/api/payment-tenants

# Should return JSON array with tenants
```

### If frontend shows blank page:

```bash
# Check frontend logs
docker compose logs frontend

# Rebuild frontend
docker compose build --no-cache frontend
docker compose up -d frontend
```

---

## 🎯 Expected Results Summary

| Test | Expected Result | Pass/Fail |
|------|----------------|-----------|
| Backend API accessible | Returns tenant list | ⬜ |
| Frontend loads | Shows portal pages | ⬜ |
| PaymentMethodsPage API call | Calls `/api/payment-tenants` | ⬜ |
| ProvidersPage API call | Calls `/api/payment-tenants` | ⬜ |
| TestPaymentPage API call | Calls `/api/payment-tenants` | ⬜ |
| Tenant dropdowns dynamic | Shows DB data | ⬜ |
| Second input accepts typing | Shows typed value | ⬜ |
| Second input accepts paste | Shows pasted value | ⬜ |
| Multiple value changes | Updates each time | ⬜ |
| Validation still works | Shows warnings | ⬜ |

---

## 📸 Screenshot Checklist

Take these screenshots to document the fixes:

### Tenant Dropdown Fix
1. Network tab showing `GET /api/payment-tenants` call
2. Dropdown with dynamic tenant list on PaymentMethodsPage
3. Dropdown with dynamic tenant list on ProvidersPage
4. Dropdown with dynamic tenant list on TestPaymentPage

### Payment Input Fix
1. Payment page with 2 methods selected
2. Second input showing typed value `50,000`
3. Validation message when total doesn't match
4. Successfully completed payment with split amounts

---

## 🎉 Success!

Both fixes are working if:

1. ✅ All 5 containers are running and healthy
2. ✅ All three portal pages call `GET /api/payment-tenants` on mount
3. ✅ Tenant dropdowns show dynamic data from database
4. ✅ Second payment input field accepts user input
5. ✅ No console errors in browser DevTools
6. ✅ Form submissions still work correctly

---

## 📞 Quick Commands

```bash
# View all logs
docker compose logs -f

# View specific service logs
docker compose logs -f frontend
docker compose logs -f api

# Restart a service
docker compose restart api

# Stop all services
docker compose down

# Check service status
docker compose ps

# Test API
curl http://localhost:5000/api/payment-tenants

# Test frontend
curl http://localhost:3000
```

---

**Ready to test!** Follow the steps above after the build completes. 🚀

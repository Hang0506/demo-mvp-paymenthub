# Bug Condition Exploration Test - Setup Instructions

## Overview

This document explains how to set up and run the bug condition exploration test for the tenant dropdown bug.

**CRITICAL**: This test is EXPECTED TO FAIL on unfixed code. Test failure confirms the bug exists.

## Prerequisites

### Required Software

1. **Node.js** (v16 or higher)
2. **npm** (comes with Node.js)

**Note**: Node.js is NOT currently installed on this machine. You need to install it first.

### Install Node.js

Download and install from: https://nodejs.org/

After installation, verify:
```bash
node --version
npm --version
```

## Setup Steps

### 1. Install Dependencies

Navigate to the frontend directory and install dependencies:

```bash
cd mvp-demo/frontend
npm install
```

This will install:
- `vitest` - Test runner
- `@testing-library/react` - React testing utilities
- `@testing-library/jest-dom` - DOM matchers
- `@testing-library/user-event` - User interaction simulation
- `jsdom` - DOM environment for tests

### 2. Verify Test Configuration

The following files have been configured:

- `vite.config.ts` - Added vitest configuration
- `package.json` - Added test scripts and devDependencies
- `src/__tests__/setup.ts` - Test setup file
- `src/__tests__/bugCondition.test.tsx` - Bug condition exploration test

### 3. Run the Test

Run the bug condition exploration test:

```bash
npm test
```

Or run with verbose output:

```bash
npx vitest run src/__tests__/bugCondition.test.tsx --reporter=verbose
```

## Expected Test Results (UNFIXED CODE)

### All 7 Tests Should FAIL

The test suite contains 7 tests that verify the bug condition:

#### Test 1-3-5: API Call Tests (EXPECTED TO FAIL)

```
❌ FAIL PaymentMethodsPage: should call GET /api/payment-tenants on mount
❌ FAIL ProvidersPage: should call GET /api/payment-tenants on mount
❌ FAIL TestPaymentPage: should call GET /api/payment-tenants on mount
```

**Why they fail**:
- Components use hardcoded `TENANT_OPTIONS` array
- `axios.get('/api/payment-tenants')` is NEVER called
- Test expects API call but it never happens

**Expected error message**:
```
Error: expect(mockedAxios.get).toHaveBeenCalledWith('/api/payment-tenants')

Expected: "/api/payment-tenants"
Received: never called
```

#### Test 2-4-6: Dropdown Options Tests (EXPECTED TO FAIL)

```
❌ FAIL PaymentMethodsPage: dropdown options should match API response, not hardcode
❌ FAIL ProvidersPage: dropdown options should match API response, not hardcode
❌ FAIL TestPaymentPage: dropdown options should match API response, not hardcode
```

**Why they fail**:
- Dropdown options come from hardcoded `TENANT_OPTIONS`
- API mock returns `['new-tenant', 'another-tenant']`
- But dropdown shows `['ict-oms', 'nha-thuoc', 'lab-vaccine', ...]`

**Expected error message**:
```
Error: Unable to find element with text: /new-tenant/i

This could be because:
- The text is not in the document
- The dropdown is showing hardcoded options instead
```

#### Test 7: New Tenant Visibility (EXPECTED TO FAIL)

```
❌ FAIL All pages: new tenant from API should appear in dropdown
```

**Why it fails**:
- API returns `'brand-new-tenant-2024'`
- But dropdown shows hardcoded list
- New tenant never appears

## Documenting Test Failures

After running the tests, document the failures:

### 1. Capture Test Output

Save the full test output to a file:

```bash
npm test > test-output.txt 2>&1
```

### 2. Document Counterexamples

Create a file documenting the counterexamples found:

**Example: `BUG_CONDITION_EVIDENCE.md`**

```markdown
# Bug Condition Evidence

## Test Execution Date
2024-XX-XX

## Summary
All 7 tests FAILED as expected, confirming the bug exists.

## Counterexamples Found

### Counterexample 1: API Never Called
- **Component**: PaymentMethodsPage
- **Expected**: `axios.get('/api/payment-tenants')` called once
- **Actual**: Never called
- **Evidence**: `mockedAxios.get` call count = 0

### Counterexample 2: Hardcoded Options Displayed
- **Component**: PaymentMethodsPage
- **Expected**: Dropdown shows `['new-tenant', 'another-tenant']`
- **Actual**: Dropdown shows `['ict-oms', 'nha-thuoc', 'lab-vaccine', ...]`
- **Evidence**: Hardcoded `TENANT_OPTIONS` array used

### Counterexample 3: New Tenant Not Visible
- **Component**: PaymentMethodsPage
- **Expected**: `'brand-new-tenant-2024'` appears in dropdown
- **Actual**: Not found in dropdown
- **Evidence**: Dropdown ignores API response

(Repeat for ProvidersPage and TestPaymentPage)
```

## What This Test Proves

This test proves the bug exists by demonstrating:

1. **No API Call**: Components never call `GET /api/payment-tenants`
2. **Hardcoded Data**: Dropdown options come from `TENANT_OPTIONS` constant
3. **Ignores API**: Even when API returns data, it's ignored
4. **New Tenants Invisible**: Newly registered tenants don't appear

## Next Steps

After documenting the test failures:

1. **Mark Task 1 as Complete** - Test written and failures documented
2. **Proceed to Task 2** - Write preservation property tests
3. **DO NOT FIX THE CODE YET** - Task 3 will implement the fix

## Troubleshooting

### Issue: `npm: command not found`

**Solution**: Install Node.js from https://nodejs.org/

### Issue: `Cannot find module 'vitest'`

**Solution**: Run `npm install` in the frontend directory

### Issue: Tests timeout

**Solution**: Increase timeout in test:
```typescript
await waitFor(() => {
  expect(mockedAxios.get).toHaveBeenCalled();
}, { timeout: 5000 }); // Increase from 3000 to 5000
```

### Issue: Antd components not rendering

**Solution**: May need to mock Antd components or add additional setup

## Test File Location

- Test file: `mvp-demo/frontend/src/__tests__/bugCondition.test.tsx`
- Setup file: `mvp-demo/frontend/src/__tests__/setup.ts`
- Config: `mvp-demo/frontend/vite.config.ts`

## References

- Vitest docs: https://vitest.dev/
- Testing Library: https://testing-library.com/docs/react-testing-library/intro/
- Task spec: `.kiro/specs/tenant-dropdown-not-loading/tasks.md`

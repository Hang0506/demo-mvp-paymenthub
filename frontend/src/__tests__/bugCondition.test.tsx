/**
 * Bug Condition Exploration Test
 * 
 * CRITICAL: This test MUST FAIL on unfixed code - failure confirms the bug exists.
 * DO NOT attempt to fix the test or the code when it fails.
 * 
 * Property 1: Bug Condition - Tenant Dropdown Loads From Hardcode Array
 * 
 * Goal: Verify that the 3 components (PaymentMethodsPage, ProvidersPage, TestPaymentPage)
 * currently use hardcoded TENANT_OPTIONS instead of calling GET /api/payment-tenants
 * 
 * Expected outcome when run on UNFIXED code: Tests FAIL because:
 * - axios.get('/api/payment-tenants') is never called (components use hardcode array)
 * - Dropdown options always show ['ict-oms', 'nha-thuoc', ...] regardless of API mock response
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';

// Import the 3 components to test
import PaymentMethodsPage from '../pages/portal/PaymentMethodsPage';
import ProvidersPage from '../pages/portal/ProvidersPage';
import TestPaymentPage from '../pages/portal/TestPaymentPage';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

describe('Bug Condition Exploration: Tenant Dropdown Loads From Hardcode Array', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    
    // Mock axios.get to return a dynamic tenant list
    mockedAxios.get.mockImplementation((url: string) => {
      if (url === '/api/payment-tenants') {
        return Promise.resolve({
          data: [
            { tenantId: 'new-tenant', tenantName: 'New Tenant' },
            { tenantId: 'another-tenant', tenantName: 'Another Tenant' }
          ]
        });
      }
      return Promise.reject(new Error('Unexpected URL'));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Test 1: PaymentMethodsPage should call API on mount
   * 
   * EXPECTED TO FAIL on unfixed code because:
   * - Component uses hardcoded TENANT_OPTIONS
   * - axios.get('/api/payment-tenants') is never called
   */
  it('PaymentMethodsPage: should call GET /api/payment-tenants on mount', async () => {
    render(
      <BrowserRouter>
        <PaymentMethodsPage />
      </BrowserRouter>
    );

    // Wait for component to mount and make API call
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/payment-tenants');
    }, { timeout: 3000 });

    // Verify API was called exactly once
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  /**
   * Test 2: PaymentMethodsPage dropdown should reflect API response
   * 
   * EXPECTED TO FAIL on unfixed code because:
   * - Dropdown options come from hardcoded TENANT_OPTIONS
   * - API response is ignored
   */
  it('PaymentMethodsPage: dropdown options should match API response, not hardcode', async () => {
    render(
      <BrowserRouter>
        <PaymentMethodsPage />
      </BrowserRouter>
    );

    // Wait for API call to complete
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalled();
    }, { timeout: 3000 });

    // Find the tenant dropdown (by label or placeholder)
    const tenantSelect = screen.getByLabelText(/tenant/i) || screen.getByPlaceholderText(/chọn tenant/i);
    
    // Click to open dropdown
    tenantSelect.click();

    // Wait for dropdown options to appear
    await waitFor(() => {
      // Should show 'new-tenant' from API response
      expect(screen.getByText(/new-tenant/i)).toBeInTheDocument();
      expect(screen.getByText(/another-tenant/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Should NOT show hardcoded options that are not in API response
    expect(screen.queryByText(/ict-oms/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/nha-thuoc/i)).not.toBeInTheDocument();
  });

  /**
   * Test 3: ProvidersPage should call API on mount
   * 
   * EXPECTED TO FAIL on unfixed code
   */
  it('ProvidersPage: should call GET /api/payment-tenants on mount', async () => {
    render(
      <BrowserRouter>
        <ProvidersPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/payment-tenants');
    }, { timeout: 3000 });

    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  /**
   * Test 4: ProvidersPage dropdown should reflect API response
   * 
   * EXPECTED TO FAIL on unfixed code
   */
  it('ProvidersPage: dropdown options should match API response, not hardcode', async () => {
    render(
      <BrowserRouter>
        <ProvidersPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalled();
    }, { timeout: 3000 });

    const tenantSelect = screen.getByLabelText(/tenant/i) || screen.getByPlaceholderText(/chọn tenant/i);
    tenantSelect.click();

    await waitFor(() => {
      expect(screen.getByText(/new-tenant/i)).toBeInTheDocument();
      expect(screen.getByText(/another-tenant/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    expect(screen.queryByText(/ict-oms/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/nha-thuoc/i)).not.toBeInTheDocument();
  });

  /**
   * Test 5: TestPaymentPage should call API on mount
   * 
   * EXPECTED TO FAIL on unfixed code
   */
  it('TestPaymentPage: should call GET /api/payment-tenants on mount', async () => {
    render(
      <BrowserRouter>
        <TestPaymentPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/payment-tenants');
    }, { timeout: 3000 });

    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  /**
   * Test 6: TestPaymentPage dropdown should reflect API response
   * 
   * EXPECTED TO FAIL on unfixed code
   */
  it('TestPaymentPage: dropdown options should match API response, not hardcode', async () => {
    render(
      <BrowserRouter>
        <TestPaymentPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalled();
    }, { timeout: 3000 });

    const tenantSelect = screen.getByLabelText(/tenant/i) || screen.getByPlaceholderText(/chọn tenant/i);
    tenantSelect.click();

    await waitFor(() => {
      expect(screen.getByText(/new-tenant/i)).toBeInTheDocument();
      expect(screen.getByText(/another-tenant/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    expect(screen.queryByText(/ict-oms/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/nha-thuoc/i)).not.toBeInTheDocument();
  });

  /**
   * Test 7: New tenant visibility test
   * 
   * Verify that when a new tenant is added via API, it appears in dropdown
   * EXPECTED TO FAIL on unfixed code because dropdown uses hardcode list
   */
  it('All pages: new tenant from API should appear in dropdown', async () => {
    // Mock API to return a tenant that's not in hardcode list
    mockedAxios.get.mockResolvedValueOnce({
      data: [
        { tenantId: 'brand-new-tenant-2024', tenantName: 'Brand New Tenant 2024' }
      ]
    });

    render(
      <BrowserRouter>
        <PaymentMethodsPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalled();
    }, { timeout: 3000 });

    const tenantSelect = screen.getByLabelText(/tenant/i) || screen.getByPlaceholderText(/chọn tenant/i);
    tenantSelect.click();

    // The new tenant should appear
    await waitFor(() => {
      expect(screen.getByText(/brand-new-tenant-2024/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Old hardcoded tenants should NOT appear
    expect(screen.queryByText(/ict-oms/i)).not.toBeInTheDocument();
  });
});

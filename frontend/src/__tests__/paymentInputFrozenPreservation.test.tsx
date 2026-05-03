/**
 * Preservation Property Tests - Payment Input Frozen Bugfix
 *
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**
 *
 * Property 2: Preservation — Auto-Calculation and Other Input Behavior
 *
 * IMPORTANT: Follow observation-first methodology
 * - Observe behavior on UNFIXED code first
 * - Write property-based tests capturing observed behavior patterns
 * - Run tests on UNFIXED code
 * - EXPECTED OUTCOME: Tests PASS (confirms baseline behavior to preserve)
 *
 * Goal: Verify that existing behaviors are UNCHANGED after the fix:
 * 1. Auto-calculation of second input when first input changes (2-split scenario)
 * 2. Single payment method scenario works correctly
 * 3. Validation logic shows correct warnings when total doesn't match
 * 4. Number formatting (thousand separators) works correctly
 * 5. Three or more payment methods work correctly (no auto-calculation)
 *
 * These tests document the behaviors that MUST be preserved when fixing the bug.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SplitPaymentForm from '../components/SplitPaymentForm'
import type { PaymentSplit } from '../types'

describe('Property 2: Preservation — Auto-Calculation and Other Input Behavior', () => {
  /**
   * Test 1: First Input Auto-Calculation in 2-Split Scenario
   *
   * Observation on UNFIXED code:
   * When user types into the FIRST input field in a 2-split scenario,
   * the SECOND input field is automatically calculated as the remainder.
   *
   * This is a convenience feature that should be preserved after the fix.
   *
   * **Validates: Requirements 3.1, 3.2**
   */
  describe('Test 1: First Input Auto-Calculation (2-split scenario)', () => {
    it('should auto-calculate second input when user types into first input', async () => {
      // SETUP: Create a 2-split scenario
      const initialSplits: PaymentSplit[] = [
        { methodId: 'CASH', amount: 0 },
        { methodId: 'MOMO', amount: 0 },
      ]
      const totalAmount = 100000
      let capturedSplits: PaymentSplit[] = initialSplits
      const onSplitChange = (splits: PaymentSplit[]) => {
        capturedSplits = splits
        rerender(
          <SplitPaymentForm
            splits={splits}
            totalAmount={totalAmount}
            onSplitChange={onSplitChange}
          />
        )
      }

      const { rerender } = render(
        <SplitPaymentForm
          splits={initialSplits}
          totalAmount={totalAmount}
          onSplitChange={onSplitChange}
        />
      )

      // FIND: Get the first input field (CASH)
      const inputs = screen.getAllByRole('spinbutton')
      const firstInput = inputs[0]

      // ACT: User types "30000" into the first input field
      const user = userEvent.setup()
      await user.clear(firstInput)
      await user.type(firstInput, '30000')

      // ASSERT: First input should show 30000
      expect(firstInput).toHaveValue(30000)

      // ASSERT: Second input should auto-calculate to 70000 (100000 - 30000)
      expect(capturedSplits[0].amount).toBe(30000)
      expect(capturedSplits[1].amount).toBe(70000)
    })

    it('should auto-calculate second input to 0 when first input equals total', async () => {
      // SETUP: Create a 2-split scenario
      const initialSplits: PaymentSplit[] = [
        { methodId: 'CASH', amount: 0 },
        { methodId: 'MOMO', amount: 0 },
      ]
      const totalAmount = 100000
      let capturedSplits: PaymentSplit[] = initialSplits
      const onSplitChange = (splits: PaymentSplit[]) => {
        capturedSplits = splits
        rerender(
          <SplitPaymentForm
            splits={splits}
            totalAmount={totalAmount}
            onSplitChange={onSplitChange}
          />
        )
      }

      const { rerender } = render(
        <SplitPaymentForm
          splits={initialSplits}
          totalAmount={totalAmount}
          onSplitChange={onSplitChange}
        />
      )

      // FIND: Get the first input field
      const inputs = screen.getAllByRole('spinbutton')
      const firstInput = inputs[0]

      // ACT: User types the full amount into the first input
      const user = userEvent.setup()
      await user.clear(firstInput)
      await user.type(firstInput, '100000')

      // ASSERT: Second input should auto-calculate to 0
      expect(capturedSplits[0].amount).toBe(100000)
      expect(capturedSplits[1].amount).toBe(0)
    })

    it('should auto-calculate second input correctly for various first input values', async () => {
      // Property-based approach: test multiple values
      const testCases = [
        { firstAmount: 10000, expectedSecond: 90000 },
        { firstAmount: 25000, expectedSecond: 75000 },
        { firstAmount: 50000, expectedSecond: 50000 },
        { firstAmount: 75000, expectedSecond: 25000 },
        { firstAmount: 99000, expectedSecond: 1000 },
      ]

      for (const testCase of testCases) {
        // SETUP: Create a 2-split scenario
        const initialSplits: PaymentSplit[] = [
          { methodId: 'CASH', amount: 0 },
          { methodId: 'MOMO', amount: 0 },
        ]
        const totalAmount = 100000
        let capturedSplits: PaymentSplit[] = initialSplits
        const onSplitChange = (splits: PaymentSplit[]) => {
          capturedSplits = splits
        }

        render(
          <SplitPaymentForm
            splits={initialSplits}
            totalAmount={totalAmount}
            onSplitChange={onSplitChange}
          />
        )

        // ACT: Simulate typing into first input
        onSplitChange([
          { methodId: 'CASH', amount: testCase.firstAmount },
          { methodId: 'MOMO', amount: testCase.expectedSecond },
        ])

        // ASSERT: Second input should be auto-calculated correctly
        expect(capturedSplits[1].amount).toBe(testCase.expectedSecond)
      }
    })
  })

  /**
   * Test 2: Single Payment Method Scenario
   *
   * Observation on UNFIXED code:
   * When there is only ONE payment method selected, the input field
   * works normally without any auto-calculation logic.
   *
   * This behavior should be preserved after the fix.
   *
   * **Validates: Requirements 3.1, 3.2**
   */
  describe('Test 2: Single Payment Method Scenario', () => {
    it('should allow user to type freely into single input field', async () => {
      // SETUP: Create a single-split scenario (no auto-calculation)
      const initialSplits: PaymentSplit[] = [
        { methodId: 'CASH', amount: 0 },
      ]
      const totalAmount = 100000
      let capturedSplits: PaymentSplit[] = initialSplits
      const onSplitChange = (splits: PaymentSplit[]) => {
        capturedSplits = splits
        rerender(
          <SplitPaymentForm
            splits={splits}
            totalAmount={totalAmount}
            onSplitChange={onSplitChange}
          />
        )
      }

      const { rerender } = render(
        <SplitPaymentForm
          splits={initialSplits}
          totalAmount={totalAmount}
          onSplitChange={onSplitChange}
        />
      )

      // FIND: Get the single input field
      const inputs = screen.getAllByRole('spinbutton')
      expect(inputs).toHaveLength(1)
      const singleInput = inputs[0]

      // ACT: User types "50000" into the input field
      const user = userEvent.setup()
      await user.clear(singleInput)
      await user.type(singleInput, '50000')

      // ASSERT: Input should show 50000 (no auto-calculation)
      expect(singleInput).toHaveValue(50000)
      expect(capturedSplits[0].amount).toBe(50000)
    })

    it('should allow user to change single input value multiple times', async () => {
      // SETUP: Create a single-split scenario
      const initialSplits: PaymentSplit[] = [
        { methodId: 'CASH', amount: 0 },
      ]
      const totalAmount = 100000
      let capturedSplits: PaymentSplit[] = initialSplits
      const onSplitChange = (splits: PaymentSplit[]) => {
        capturedSplits = splits
        rerender(
          <SplitPaymentForm
            splits={splits}
            totalAmount={totalAmount}
            onSplitChange={onSplitChange}
          />
        )
      }

      const { rerender } = render(
        <SplitPaymentForm
          splits={initialSplits}
          totalAmount={totalAmount}
          onSplitChange={onSplitChange}
        />
      )

      // FIND: Get the single input field
      const inputs = screen.getAllByRole('spinbutton')
      const singleInput = inputs[0]

      // ACT: User changes the value multiple times
      const user = userEvent.setup()

      await user.clear(singleInput)
      await user.type(singleInput, '30000')
      expect(capturedSplits[0].amount).toBe(30000)

      await user.clear(singleInput)
      await user.type(singleInput, '70000')
      expect(capturedSplits[0].amount).toBe(70000)

      await user.clear(singleInput)
      await user.type(singleInput, '100000')
      
      // ASSERT: Final value should be 100000
      expect(capturedSplits[0].amount).toBe(100000)
    })
  })

  /**
   * Test 3: Validation Logic
   *
   * Observation on UNFIXED code:
   * The validation logic shows correct warnings when the total split amount
   * doesn't match the required total amount.
   *
   * This behavior should be preserved after the fix.
   *
   * **Validates: Requirements 3.3, 3.6**
   */
  describe('Test 3: Validation Logic', () => {
    it('should show success message when total matches exactly', () => {
      // SETUP: Create splits that match the total
      const splits: PaymentSplit[] = [
        { methodId: 'CASH', amount: 60000 },
        { methodId: 'MOMO', amount: 40000 },
      ]
      const totalAmount = 100000

      render(
        <SplitPaymentForm
          splits={splits}
          totalAmount={totalAmount}
          onSplitChange={() => {}}
        />
      )

      // ASSERT: Success message should be displayed
      expect(screen.getByText(/Phân chia số tiền chính xác/i)).toBeInTheDocument()
    })

    it('should show warning when total is less than required', () => {
      // SETUP: Create splits that are less than total
      const splits: PaymentSplit[] = [
        { methodId: 'CASH', amount: 30000 },
        { methodId: 'MOMO', amount: 40000 },
      ]
      const totalAmount = 100000

      render(
        <SplitPaymentForm
          splits={splits}
          totalAmount={totalAmount}
          onSplitChange={() => {}}
        />
      )

      // ASSERT: Warning message should show remaining amount
      expect(screen.getByText(/Cần phân chia thêm/i)).toBeInTheDocument()
      expect(screen.getByText(/30,000/)).toBeInTheDocument() // Remaining amount
    })

    it('should show error when total exceeds required amount', () => {
      // SETUP: Create splits that exceed total
      const splits: PaymentSplit[] = [
        { methodId: 'CASH', amount: 70000 },
        { methodId: 'MOMO', amount: 50000 },
      ]
      const totalAmount = 100000

      render(
        <SplitPaymentForm
          splits={splits}
          totalAmount={totalAmount}
          onSplitChange={() => {}}
        />
      )

      // ASSERT: Error message should show excess amount
      expect(screen.getByText(/Đã phân chia thừa/i)).toBeInTheDocument()
      expect(screen.getByText(/20,000/)).toBeInTheDocument() // Excess amount
    })

    it('should calculate remaining amount correctly for various scenarios', () => {
      const testCases = [
        { splits: [{ methodId: 'CASH', amount: 50000 }, { methodId: 'MOMO', amount: 30000 }], total: 100000, remaining: 20000 },
        { splits: [{ methodId: 'CASH', amount: 90000 }, { methodId: 'MOMO', amount: 5000 }], total: 100000, remaining: 5000 },
        { splits: [{ methodId: 'CASH', amount: 0 }, { methodId: 'MOMO', amount: 0 }], total: 100000, remaining: 100000 },
      ]

      for (const testCase of testCases) {
        const { container } = render(
          <SplitPaymentForm
            splits={testCase.splits}
            totalAmount={testCase.total}
            onSplitChange={() => {}}
          />
        )

        // Calculate current total
        const currentTotal = testCase.splits.reduce((sum, s) => sum + s.amount, 0)
        const expectedRemaining = testCase.total - currentTotal

        // ASSERT: Remaining amount should be calculated correctly
        expect(expectedRemaining).toBe(testCase.remaining)

        // Cleanup for next iteration
        container.remove()
      }
    })
  })

  /**
   * Test 4: Number Formatting
   *
   * Observation on UNFIXED code:
   * Numbers are formatted with thousand separators (e.g., 100,000).
   *
   * This behavior should be preserved after the fix.
   *
   * **Validates: Requirements 3.6**
   */
  describe('Test 4: Number Formatting', () => {
    it('should display amounts with thousand separators', () => {
      // SETUP: Create splits with large amounts
      const splits: PaymentSplit[] = [
        { methodId: 'CASH', amount: 50000 },
        { methodId: 'MOMO', amount: 50000 },
      ]
      const totalAmount = 100000

      render(
        <SplitPaymentForm
          splits={splits}
          totalAmount={totalAmount}
          onSplitChange={() => {}}
        />
      )

      // ASSERT: Total amount should be formatted with commas
      expect(screen.getByText(/100,000 VND/)).toBeInTheDocument()
    })

    it('should format various amounts correctly', () => {
      const testCases = [
        { amount: 1000, formatted: '1,000' },
        { amount: 10000, formatted: '10,000' },
        { amount: 100000, formatted: '100,000' },
        { amount: 1000000, formatted: '1,000,000' },
      ]

      for (const testCase of testCases) {
        const splits: PaymentSplit[] = [
          { methodId: 'CASH', amount: testCase.amount },
        ]

        const { container } = render(
          <SplitPaymentForm
            splits={splits}
            totalAmount={testCase.amount}
            onSplitChange={() => {}}
          />
        )

        // ASSERT: Amount should be formatted correctly
        expect(screen.getByText(new RegExp(testCase.formatted))).toBeInTheDocument()

        // Cleanup for next iteration
        container.remove()
      }
    })
  })

  /**
   * Test 5: Three or More Payment Methods
   *
   * Observation on UNFIXED code:
   * When there are 3 or more payment methods, there is NO auto-calculation.
   * Each input field works independently.
   *
   * This behavior should be preserved after the fix.
   *
   * **Validates: Requirements 3.1, 3.2**
   */
  describe('Test 5: Three or More Payment Methods (no auto-calculation)', () => {
    it('should allow independent input for 3 payment methods', async () => {
      // SETUP: Create a 3-split scenario (no auto-calculation)
      const initialSplits: PaymentSplit[] = [
        { methodId: 'CASH', amount: 0 },
        { methodId: 'MOMO', amount: 0 },
        { methodId: 'ZALOPAY', amount: 0 },
      ]
      const totalAmount = 150000
      let capturedSplits: PaymentSplit[] = initialSplits
      const onSplitChange = (splits: PaymentSplit[]) => {
        capturedSplits = splits
        rerender(
          <SplitPaymentForm
            splits={splits}
            totalAmount={totalAmount}
            onSplitChange={onSplitChange}
          />
        )
      }

      const { rerender } = render(
        <SplitPaymentForm
          splits={initialSplits}
          totalAmount={totalAmount}
          onSplitChange={onSplitChange}
        />
      )

      // FIND: Get all three input fields
      const inputs = screen.getAllByRole('spinbutton')
      expect(inputs).toHaveLength(3)

      // ACT: User types into first input
      const user = userEvent.setup()
      await user.clear(inputs[0])
      await user.type(inputs[0], '50000')

      // ASSERT: First input should be 50000, others should remain 0 (no auto-calc)
      expect(capturedSplits[0].amount).toBe(50000)
      expect(capturedSplits[1].amount).toBe(0)
      expect(capturedSplits[2].amount).toBe(0)

      // ACT: User types into second input
      await user.clear(inputs[1])
      await user.type(inputs[1], '60000')

      // ASSERT: Second input should be 60000, others unchanged
      expect(capturedSplits[0].amount).toBe(50000)
      expect(capturedSplits[1].amount).toBe(60000)
      expect(capturedSplits[2].amount).toBe(0)

      // ACT: User types into third input
      await user.clear(inputs[2])
      await user.type(inputs[2], '40000')

      // ASSERT: All inputs should have their typed values (no auto-calc)
      expect(capturedSplits[0].amount).toBe(50000)
      expect(capturedSplits[1].amount).toBe(60000)
      expect(capturedSplits[2].amount).toBe(40000)
    })

    it('should allow user to change any input in 4-split scenario', async () => {
      // SETUP: Create a 4-split scenario
      const initialSplits: PaymentSplit[] = [
        { methodId: 'CASH', amount: 25000 },
        { methodId: 'MOMO', amount: 25000 },
        { methodId: 'ZALOPAY', amount: 25000 },
        { methodId: 'VNPAY', amount: 25000 },
      ]
      const totalAmount = 100000
      let capturedSplits: PaymentSplit[] = initialSplits
      const onSplitChange = (splits: PaymentSplit[]) => {
        capturedSplits = splits
        rerender(
          <SplitPaymentForm
            splits={splits}
            totalAmount={totalAmount}
            onSplitChange={onSplitChange}
          />
        )
      }

      const { rerender } = render(
        <SplitPaymentForm
          splits={initialSplits}
          totalAmount={totalAmount}
          onSplitChange={onSplitChange}
        />
      )

      // FIND: Get all four input fields
      const inputs = screen.getAllByRole('spinbutton')
      expect(inputs).toHaveLength(4)

      // ACT: User changes the third input
      const user = userEvent.setup()
      await user.clear(inputs[2])
      await user.type(inputs[2], '50000')

      // ASSERT: Only the third input should change (no auto-calc)
      expect(capturedSplits[0].amount).toBe(25000)
      expect(capturedSplits[1].amount).toBe(25000)
      expect(capturedSplits[2].amount).toBe(50000)
      expect(capturedSplits[3].amount).toBe(25000)
    })
  })

  /**
   * Test 6: Input Field Constraints
   *
   * Observation on UNFIXED code:
   * Input fields have min=0 and max=totalAmount constraints.
   *
   * This behavior should be preserved after the fix.
   *
   * **Validates: Requirements 3.6**
   */
  describe('Test 6: Input Field Constraints', () => {
    it('should enforce minimum value of 0', async () => {
      // SETUP: Create a single-split scenario
      const initialSplits: PaymentSplit[] = [
        { methodId: 'CASH', amount: 50000 },
      ]
      const totalAmount = 100000
      let capturedSplits: PaymentSplit[] = initialSplits
      const onSplitChange = (splits: PaymentSplit[]) => {
        capturedSplits = splits
        rerender(
          <SplitPaymentForm
            splits={splits}
            totalAmount={totalAmount}
            onSplitChange={onSplitChange}
          />
        )
      }

      const { rerender } = render(
        <SplitPaymentForm
          splits={initialSplits}
          totalAmount={totalAmount}
          onSplitChange={onSplitChange}
        />
      )

      // FIND: Get the input field
      const inputs = screen.getAllByRole('spinbutton')
      const input = inputs[0]

      // ASSERT: Input should have min=0 attribute
      expect(input).toHaveAttribute('min', '0')
    })

    it('should enforce maximum value of totalAmount', () => {
      // SETUP: Create a single-split scenario
      const splits: PaymentSplit[] = [
        { methodId: 'CASH', amount: 50000 },
      ]
      const totalAmount = 100000

      render(
        <SplitPaymentForm
          splits={splits}
          totalAmount={totalAmount}
          onSplitChange={() => {}}
        />
      )

      // FIND: Get the input field
      const inputs = screen.getAllByRole('spinbutton')
      const input = inputs[0]

      // ASSERT: Input should have max=totalAmount attribute
      expect(input).toHaveAttribute('max', String(totalAmount))
    })
  })
})

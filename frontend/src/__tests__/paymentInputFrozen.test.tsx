/**
 * Bug Condition Exploration Test - Payment Input Frozen
 * 
 * CRITICAL: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * DO NOT attempt to fix the test or the code when it fails
 * 
 * Property 1: Bug Condition - Second Input Field Frozen
 * 
 * This test validates that typing into the second payment split input field
 * updates the displayed value immediately. On UNFIXED code, this test will FAIL
 * because the second input field is frozen and doesn't respond to user input.
 * 
 * Expected Outcome: TEST FAILS (this proves the bug exists)
 * 
 * Requirements: 2.2, 2.3, 2.4, 2.5
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SplitPaymentForm from '../components/SplitPaymentForm'
import type { PaymentSplit } from '../types'

describe('Bug Condition Exploration - Payment Input Frozen', () => {
  describe('Property 1: Second Input Field Responsiveness', () => {
    it('should update second input field value when user types directly into it', async () => {
      // SETUP: Create a 2-split scenario (bug condition)
      const initialSplits: PaymentSplit[] = [
        { methodId: 'CASH', amount: 0 },
        { methodId: 'MOMO', amount: 0 },
      ]
      const totalAmount = 100000
      const onSplitChange = (splits: PaymentSplit[]) => {
        // Re-render with new splits
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

      // FIND: Get the second input field (MoMo)
      const inputs = screen.getAllByRole('spinbutton')
      expect(inputs).toHaveLength(2)
      const secondInput = inputs[1] // Second input field (MoMo)

      // ACT: User types "50000" into the second input field
      const user = userEvent.setup()
      await user.clear(secondInput)
      await user.type(secondInput, '50000')

      // ASSERT: The second input field should display "50,000"
      // On UNFIXED code, this will FAIL because the input is frozen
      expect(secondInput).toHaveValue(50000)
    })

    it('should update second input field value when user pastes into it', async () => {
      // SETUP: Create a 2-split scenario (bug condition)
      const initialSplits: PaymentSplit[] = [
        { methodId: 'CASH', amount: 0 },
        { methodId: 'MOMO', amount: 0 },
      ]
      const totalAmount = 100000
      const onSplitChange = (splits: PaymentSplit[]) => {
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

      // FIND: Get the second input field (MoMo)
      const inputs = screen.getAllByRole('spinbutton')
      const secondInput = inputs[1]

      // ACT: User pastes "25000" into the second input field
      const user = userEvent.setup()
      await user.click(secondInput)
      await user.paste('25000')

      // ASSERT: The second input field should display "25,000"
      // On UNFIXED code, this will FAIL because paste has no effect
      expect(secondInput).toHaveValue(25000)
    })

    it('should allow user to type different values into second input multiple times', async () => {
      // SETUP: Create a 2-split scenario
      const initialSplits: PaymentSplit[] = [
        { methodId: 'CASH', amount: 30000 },
        { methodId: 'MOMO', amount: 70000 },
      ]
      const totalAmount = 100000
      const onSplitChange = (splits: PaymentSplit[]) => {
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

      // FIND: Get the second input field
      const inputs = screen.getAllByRole('spinbutton')
      const secondInput = inputs[1]

      // ACT: User changes the second input value multiple times
      const user = userEvent.setup()
      
      // First change: type 60000
      await user.clear(secondInput)
      await user.type(secondInput, '60000')
      expect(secondInput).toHaveValue(60000)

      // Second change: type 80000
      await user.clear(secondInput)
      await user.type(secondInput, '80000')
      expect(secondInput).toHaveValue(80000)

      // Third change: type 40000
      await user.clear(secondInput)
      await user.type(secondInput, '40000')
      
      // ASSERT: The second input should reflect the latest value
      // On UNFIXED code, this will FAIL because the input is frozen
      expect(secondInput).toHaveValue(40000)
    })

    it('should show cursor and accept focus when user clicks second input field', async () => {
      // SETUP: Create a 2-split scenario
      const initialSplits: PaymentSplit[] = [
        { methodId: 'CASH', amount: 0 },
        { methodId: 'MOMO', amount: 0 },
      ]
      const totalAmount = 100000
      const onSplitChange = (splits: PaymentSplit[]) => {
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

      // FIND: Get the second input field
      const inputs = screen.getAllByRole('spinbutton')
      const secondInput = inputs[1]

      // ACT: User clicks on the second input field
      const user = userEvent.setup()
      await user.click(secondInput)

      // ASSERT: The input should receive focus
      expect(secondInput).toHaveFocus()

      // ACT: User types after clicking
      await user.type(secondInput, '50000')

      // ASSERT: The typed value should appear
      // On UNFIXED code, this will FAIL because the input is frozen
      expect(secondInput).toHaveValue(50000)
    })
  })

  describe('Bug Condition Context - Verify 2-split scenario triggers bug', () => {
    it('should demonstrate bug only occurs in 2-split scenario', async () => {
      // This test documents that the bug is specific to 2-split scenarios
      // where the auto-calculation logic interferes with manual input

      // SETUP: Create a 2-split scenario
      const twoSplits: PaymentSplit[] = [
        { methodId: 'CASH', amount: 0 },
        { methodId: 'MOMO', amount: 0 },
      ]
      const totalAmount = 100000
      let capturedSplits: PaymentSplit[] = twoSplits
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
          splits={twoSplits}
          totalAmount={totalAmount}
          onSplitChange={onSplitChange}
        />
      )

      // FIND: Get both input fields
      const inputs = screen.getAllByRole('spinbutton')
      const firstInput = inputs[0]
      const secondInput = inputs[1]

      // ACT: Type into first input - this should work (auto-calc second)
      const user = userEvent.setup()
      await user.clear(firstInput)
      await user.type(firstInput, '30000')

      // VERIFY: First input works correctly
      expect(firstInput).toHaveValue(30000)
      
      // The auto-calculation should set second input to 70000
      // (This is the existing behavior that should be preserved)
      expect(capturedSplits[1].amount).toBe(70000)

      // ACT: Now try to type into second input - THIS IS WHERE BUG OCCURS
      await user.clear(secondInput)
      await user.type(secondInput, '50000')

      // ASSERT: Second input should show 50000, but on UNFIXED code it will FAIL
      // because the auto-calculation logic prevents manual input
      expect(secondInput).toHaveValue(50000)
    })
  })
})

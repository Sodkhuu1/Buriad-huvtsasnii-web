import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, vi } from 'vitest'
import PaymentModal from '../../src/components/PaymentModal'
import { api } from '../../src/api'

vi.mock('../../src/api', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
  },
}))

describe('PaymentModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('creates a static/mock invoice and polls until paid', async () => {
    const onSuccess = vi.fn()
    api.post.mockResolvedValue({
      payment_id: 'payment-1',
      qr_image: 'data:image/png;base64,qr',
      qr_text: 'MOCK_QPAY|payment-1|120000',
      urls: [],
      is_mock: true,
    })
    api.get.mockResolvedValue({ success: true, paid: true, order_status: 'accepted' })

    render(
      <PaymentModal
        orderId="order-1"
        amount={120000}
        onClose={vi.fn()}
        onSuccess={onSuccess}
      />
    )

    await act(async () => {
      await Promise.resolve()
    })

    expect(api.post).toHaveBeenCalledWith('/payments/orders/order-1/invoice')
    expect(screen.getByAltText('QPay QR')).toHaveAttribute('src', 'data:image/png;base64,qr')
    expect(screen.getByText(/Тестийн горим/)).toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(3000)
      await Promise.resolve()
    })

    expect(api.get).toHaveBeenCalledWith('/payments/payment-1/check')
    expect(screen.getByText(/Төлбөр амжилттай/)).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(1200)
    })

    expect(onSuccess).toHaveBeenCalledTimes(1)
  })
})

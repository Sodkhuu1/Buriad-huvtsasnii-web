import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { beforeEach, expect, vi } from 'vitest'
import OrderChat from '../../src/components/OrderChat'
import { api } from '../../src/api'

vi.mock('../../src/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

vi.mock('../../src/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'customer-1', full_name: 'Bat', role: 'customer' },
  }),
}))

describe('OrderChat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Element.prototype.scrollTo = vi.fn()
  })

  it('loads and renders existing messages', async () => {
    api.get.mockResolvedValue({
      messages: [
        {
          id: 'm1',
          sender_id: 'tailor-1',
          sender_name: 'Oyuna',
          sender_role: 'tailor',
          message_body: 'Хэмжээсээ дахин шалгаарай',
          sent_at: '2026-04-28T08:00:00.000Z',
        },
      ],
    })

    render(<OrderChat orderId="order-1" title="Оёдолчинтой чатлах" />)

    expect(await screen.findByText('Хэмжээсээ дахин шалгаарай')).toBeInTheDocument()
    expect(screen.getByText('Oyuna')).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledWith('/chat/orders/order-1/messages')
  })

  it('sends a new message and appends it locally', async () => {
    api.get.mockResolvedValue({ messages: [] })
    api.post.mockResolvedValue({
      message: {
        id: 'm2',
        sender_id: 'customer-1',
        sender_role: 'customer',
        message_body: 'Маргааш очиж хэмжээс өгч болох уу?',
        sent_at: '2026-04-28T09:00:00.000Z',
      },
    })

    render(<OrderChat orderId="order-1" />)

    await screen.findByText(/Одоогоор мессеж алга/)
    fireEvent.change(screen.getByPlaceholderText('Мессеж бичих...'), {
      target: { value: 'Маргааш очиж хэмжээс өгч болох уу?' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Илгээх' }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/chat/orders/order-1/messages', {
        message_body: 'Маргааш очиж хэмжээс өгч болох уу?',
      })
    })
    expect(await screen.findByText('Маргааш очиж хэмжээс өгч болох уу?')).toBeInTheDocument()
    expect(screen.getByText('Та')).toBeInTheDocument()
  })
})

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, expect, vi } from 'vitest'
import Zahialga from '../../src/pages/Zahialga'
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

const renderPage = () =>
  render(
    <MemoryRouter>
      <Zahialga />
    </MemoryRouter>
  )

describe('Zahialga page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lets signed-in customer create an order with measurements', async () => {
    api.get.mockResolvedValue({
      garments: [
        {
          id: 'design-1',
          name: 'Buriad degel',
          category_name: 'Deel',
          audience: 'women',
          ceremonial_use: 'Tsagaan sar',
          base_price: 120000,
          image_url: 'https://example.com/degel.jpg',
          flat_image_url: 'https://example.com/degel-flat.jpg',
        },
      ],
    })
    api.post.mockResolvedValue({
      order: {
        id: 'order-1',
        order_number: 'ORD-12345678',
        status: 'submitted',
        total_amount: 120000,
      },
    })

    renderPage()

    expect(await screen.findByText('Buriad degel')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Сагсанд нэмэх' }))
    fireEvent.click(screen.getByRole('button', { name: 'Үргэлжлүүлэх' }))

    const measurementInputs = screen.getAllByPlaceholderText('0')
    const values = ['170', '90', '72', '96', '58', '42']
    measurementInputs.forEach((input, index) => {
      fireEvent.change(input, { target: { value: values[index] } })
    })

    fireEvent.click(screen.getByRole('button', { name: 'Үргэлжлүүлэх' }))
    fireEvent.click(screen.getByRole('button', { name: 'Захиалга илгээх' }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/orders', {
        items: [
          {
            design_id: 'design-1',
            quantity: 1,
            custom_note: undefined,
          },
        ],
        measurements: {
          height: '170',
          chest: '90',
          waist: '72',
          hip: '96',
          sleeve: '58',
          shoulder: '42',
        },
        custom_note: undefined,
      })
    })

    expect(await screen.findByText(/Захиалга амжилттай/)).toBeInTheDocument()
    expect(screen.getByText('#ORD-12345678')).toBeInTheDocument()
  })
})

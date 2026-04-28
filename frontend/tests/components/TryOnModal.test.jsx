import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { beforeEach, expect, vi } from 'vitest'
import TryOnModal from '../../src/components/TryOnModal'
import { api } from '../../src/api'

vi.mock('../../src/api', () => ({
  api: {
    post: vi.fn(),
  },
}))

const garment = {
  name: 'Дэгэл',
  image_url: 'https://example.com/degel.jpg',
  flat_image_url: 'https://example.com/degel-flat.jpg',
}

describe('TryOnModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.URL.createObjectURL = vi.fn(() => 'blob:preview')
  })

  it('requires a user photo before running try-on', () => {
    render(<TryOnModal garment={garment} onClose={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Өмсөөд үзэх →' })).toBeDisabled()
    expect(screen.getByText(/Дэгэл/)).toBeInTheDocument()
  })

  it('posts selected photo and garment image to backend try-on endpoint', async () => {
    api.post.mockResolvedValue({ result_url: 'https://example.com/result.png' })
    render(<TryOnModal garment={garment} onClose={vi.fn()} />)

    const file = new File(['fake-image'], 'person.png', { type: 'image/png' })
    fireEvent.change(screen.getByLabelText(/Зураг сонгох/i, { selector: 'input' }), {
      target: { files: [file] },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Өмсөөд үзэх →' }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/tryon', {
        human_image_data_url: expect.stringMatching(/^data:image\/png;base64,/),
        garment_image_url: garment.flat_image_url,
        garment_name: garment.name,
      })
    })
    expect(await screen.findByAltText('Үр дүн')).toHaveAttribute('src', 'https://example.com/result.png')
  })

  it('falls back to image_url when flat_image_url is missing', async () => {
    api.post.mockResolvedValue({ result_url: 'https://example.com/result.png' })
    render(
      <TryOnModal
        garment={{ ...garment, flat_image_url: '' }}
        onClose={vi.fn()}
      />
    )

    const file = new File(['fake-image'], 'person.png', { type: 'image/png' })
    fireEvent.change(screen.getByLabelText(/Зураг сонгох/i, { selector: 'input' }), {
      target: { files: [file] },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Өмсөөд үзэх →' }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/tryon', expect.objectContaining({
        garment_image_url: garment.image_url,
      }))
    })
  })
})

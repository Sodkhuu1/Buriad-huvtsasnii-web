import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, expect, vi } from 'vitest'
import Profile from '../../src/pages/Profile'
import { api } from '../../src/api'

const setUser = vi.fn()

vi.mock('../../src/api', () => ({
  api: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}))

vi.mock('../../src/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', full_name: 'Bat', role: 'customer' },
    setUser,
  }),
}))

const renderProfile = () =>
  render(
    <MemoryRouter>
      <Profile />
    </MemoryRouter>
  )

describe('Profile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads and renders basic profile fields', async () => {
    api.get.mockResolvedValue({
      profile: {
        id: 'user-1',
        full_name: 'Bat',
        email: 'bat@example.com',
        phone: '99112233',
        gender: 'male',
        age: 25,
        role: 'customer',
        status: 'active',
        city: 'Улаанбаатар',
        district: 'Баянгол',
        street: '3-р хороо',
        address_detail: '12-р байр',
      },
    })

    renderProfile()

    expect(await screen.findByDisplayValue('Bat')).toBeInTheDocument()
    expect(screen.getByDisplayValue('bat@example.com')).toBeDisabled()
    expect(screen.getByDisplayValue('99112233')).toBeInTheDocument()
    expect(screen.getByDisplayValue('25')).toBeInTheDocument()
    expect(screen.getByText('Хаяг')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Улаанбаатар')).toBeInTheDocument()
  })

  it('saves profile changes and updates auth user', async () => {
    api.get.mockResolvedValue({
      profile: {
        id: 'user-1',
        full_name: 'Bat',
        email: 'bat@example.com',
        phone: '',
        gender: '',
        age: '',
        role: 'customer',
        status: 'active',
        city: '',
        district: '',
        street: '',
        address_detail: '',
      },
    })
    api.patch.mockResolvedValue({
      profile: {
        id: 'user-1',
        full_name: 'Bat Bold',
        email: 'bat@example.com',
        phone: '99112233',
        gender: 'male',
        age: 26,
        role: 'customer',
        status: 'active',
        city: 'Улаанбаатар',
        district: 'Баянгол',
        street: '3-р хороо',
        address_detail: '12-р байр',
      },
      user: {
        id: 'user-1',
        full_name: 'Bat Bold',
        email: 'bat@example.com',
        phone: '99112233',
        gender: 'male',
        age: 26,
        role: 'customer',
        status: 'active',
      },
    })

    renderProfile()

    const nameInput = await screen.findByDisplayValue('Bat')
    fireEvent.change(nameInput, { target: { value: 'Bat Bold' } })
    fireEvent.change(screen.getByPlaceholderText('9911 2233'), {
      target: { value: '99112233' },
    })
    fireEvent.change(screen.getByPlaceholderText('25'), {
      target: { value: '26' },
    })
    fireEvent.change(screen.getByRole('combobox', { name: 'Хүйс' }), {
      target: { value: 'male' },
    })
    fireEvent.change(screen.getByPlaceholderText('Улаанбаатар'), {
      target: { value: 'Улаанбаатар' },
    })
    fireEvent.change(screen.getByPlaceholderText('Баянгол'), {
      target: { value: 'Баянгол' },
    })
    fireEvent.change(screen.getByPlaceholderText('3-р хороо, 12-р байр'), {
      target: { value: '3-р хороо' },
    })
    fireEvent.change(screen.getByPlaceholderText('Орц, давхар, хаалганы дугаар'), {
      target: { value: '12-р байр' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Профайл хадгалах' }))

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/auth/profile', {
        full_name: 'Bat Bold',
        phone: '99112233',
        gender: 'male',
        age: 26,
        city: 'Улаанбаатар',
        district: 'Баянгол',
        street: '3-р хороо',
        address_detail: '12-р байр',
      })
    })
    expect(setUser).toHaveBeenCalledWith(expect.objectContaining({ full_name: 'Bat Bold' }))
    expect(await screen.findByText('Профайл амжилттай хадгалагдлаа')).toBeInTheDocument()
  })
})

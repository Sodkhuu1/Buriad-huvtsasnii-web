import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, expect, vi } from 'vitest'

vi.mock('../../src/context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../../src/components/NotificationBell', () => ({
  default: () => <button aria-label="Мэдэгдэл" />,
}))

import { useAuth } from '../../src/context/AuthContext'
import Navbar from '../../src/components/Navbar'

const renderNavbar = (path = '/') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Navbar />
    </MemoryRouter>
  )

describe('Navbar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders public navigation and login link for guests', () => {
    useAuth.mockReturnValue({ user: null, logout: vi.fn() })
    renderNavbar()

    expect(screen.getByRole('link', { name: 'Дэнз нүүр хуудас' })).toHaveAttribute('href', '/')
    expect(screen.getAllByRole('link', { name: 'Эхлэл' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: 'Захиалга' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: 'Нэвтрэх' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: 'Захиалга өгөх' }).length).toBeGreaterThan(0)
  })

  it('shows customer dashboard link when customer is signed in', () => {
    useAuth.mockReturnValue({
      user: { full_name: 'Bat', role: 'customer' },
      logout: vi.fn(),
    })
    renderNavbar()

    expect(screen.getAllByText('Bat').length).toBeGreaterThan(0)
    expect(screen.getByText('Захиалагч')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Миний захиалгууд' }).length).toBeGreaterThan(0)
  })

  it('shows admin management links when admin is signed in', () => {
    useAuth.mockReturnValue({
      user: { full_name: 'Admin', role: 'admin' },
      logout: vi.fn(),
    })
    renderNavbar()

    expect(screen.getByText('Админ')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Удирдлага' })).toHaveAttribute('href', '/admin')
    expect(screen.getByRole('link', { name: 'Админ удирдлага' })).toHaveAttribute('href', '/admin')
  })

  it('shows tailor dashboard links when tailor is signed in', () => {
    useAuth.mockReturnValue({
      user: { full_name: 'Oyuna', role: 'tailor' },
      logout: vi.fn(),
    })
    renderNavbar()

    expect(screen.getByText('Оёдолчин')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Самбар' })).toHaveAttribute('href', '/tailor')
    expect(screen.getByRole('link', { name: 'Оёдолчны самбар' })).toHaveAttribute('href', '/tailor')
  })

  it('calls logout when the desktop logout button is clicked', () => {
    const logout = vi.fn()
    useAuth.mockReturnValue({
      user: { full_name: 'Bat', role: 'customer' },
      logout,
    })
    renderNavbar()

    fireEvent.click(screen.getAllByRole('button', { name: 'Гарах' })[0])

    expect(logout).toHaveBeenCalledTimes(1)
  })
})

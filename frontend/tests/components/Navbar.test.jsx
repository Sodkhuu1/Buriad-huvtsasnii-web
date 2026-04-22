// Navbar iin test — useAuth iig mock hiij baigaa tul API deer zaluulagdahgui
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'

// AuthContext iig modul bolgon mock hiij, useAuth iig test bolgondoo solih
vi.mock('../../src/context/AuthContext', () => ({
  useAuth: vi.fn(),
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
  it('nevtreegui uyd "Нэвтрэх" towchtoi bn', () => {
    useAuth.mockReturnValue({ user: null, logout: vi.fn() })
    renderNavbar()

    // desktop + mobile hoyoloo n haragdahgui uchir getAllByRole
    expect(screen.getAllByRole('link', { name: 'Нэвтрэх' }).length).toBeGreaterThan(0)
  })

  it('customer nevtersen uyd "Миний захиалгууд" link haragdana', () => {
    useAuth.mockReturnValue({
      user: { full_name: 'Bat', role: 'customer' },
      logout: vi.fn(),
    })
    renderNavbar()

    // Desktop bolon mobile menu 2 talaas haragdaj baigaa uchir getAllByRole
    const links = screen.getAllByRole('link', { name: 'Миний захиалгууд' })
    expect(links.length).toBeGreaterThan(0)
  })

  it('admin nevtersen uyd "Админ" link haragdana', () => {
    useAuth.mockReturnValue({
      user: { full_name: 'Admin', role: 'admin' },
      logout: vi.fn(),
    })
    renderNavbar()

    expect(screen.getAllByRole('link', { name: 'Админ' }).length).toBeGreaterThan(0)
  })
})

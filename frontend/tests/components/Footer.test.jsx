import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Footer from '../../src/components/Footer'

const renderFooter = () =>
  render(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>
  )

describe('Footer', () => {
  it('brand identity and description are visible', () => {
    renderFooter()

    expect(screen.getByText('Дэнз')).toBeInTheDocument()
    expect(screen.getByText('буриад хувцасны захиалга')).toBeInTheDocument()
    expect(screen.getByText(/уламжлалт буриад хувцасны захиалга/)).toBeInTheDocument()
  })

  it('renders primary navigation links', () => {
    renderFooter()

    expect(screen.getByRole('link', { name: 'Эхлэл' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Захиалга өгөх' })).toHaveAttribute('href', '/zahialga')
    expect(screen.getByRole('link', { name: 'Утга, хэв маяг' })).toHaveAttribute('href', '/huvtsasnii-utga')
    expect(screen.getByRole('link', { name: 'Бидний тухай' })).toHaveAttribute('href', '/bidnii-tuhaid')
  })

  it('renders contact details and ordering CTA', () => {
    renderFooter()

    expect(screen.getByText(/\+976 9900 0000/)).toBeInTheDocument()
    expect(screen.getByText(/info@denz\.mn/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Захиалга эхлэх' })).toHaveAttribute('href', '/zahialga')
  })
})

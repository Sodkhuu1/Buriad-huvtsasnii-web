// Footer iin test — hamgiin enghiin jishee. React Router ni Link ashigldag tul
// MemoryRouter oor boodog.
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
  it('brandiin nerig haruulna', () => {
    renderFooter()
    expect(screen.getByText('БУРИАД')).toBeInTheDocument()
    expect(screen.getByText('ХУВЦАС')).toBeInTheDocument()
  })

  it('ued holbos uudiig haruulna', () => {
    renderFooter()
    expect(screen.getByRole('link', { name: 'Нүүр хуудас' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Захиалга өгөх' })).toHaveAttribute('href', '/zahialga')
    expect(screen.getByRole('link', { name: 'Бидний тухай' })).toHaveAttribute('href', '/bidnii-tuhaid')
  })

  it('holboo barih medeelel baina', () => {
    renderFooter()
    expect(screen.getByText(/\+976 9900 0000/)).toBeInTheDocument()
    expect(screen.getByText(/info@buriad-huvtsas\.mn/)).toBeInTheDocument()
  })
})

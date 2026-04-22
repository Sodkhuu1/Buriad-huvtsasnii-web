// Test setup — jest-dom matcher uud iig neemj, test bur darah automat cleanup
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})

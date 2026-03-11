import { test, expect } from 'vitest'
import '../setupTests'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Header from '../components/Header'

test('renders title and right button when not authenticated', () => {
  const { getByText, getByRole } = render(
    <MemoryRouter>
      <Header rightLabel="Login" rightTo="/login" />
    </MemoryRouter>
  )

  expect(getByText('Arcade Mania')).toBeInTheDocument()
  expect(getByRole('button', { name: /login/i })).toBeInTheDocument()
})

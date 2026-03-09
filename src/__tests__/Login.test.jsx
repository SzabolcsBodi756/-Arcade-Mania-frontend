import React from 'react'
import '../setupTests'
import { render, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Login from '../pages/Login'
test('successful login shows success message', async () => {
  const mockLogin = async (u, p) => ({ id: 1, username: u })

  const { getByPlaceholderText, getByRole, getByText, container } = render(
    <MemoryRouter>
      <Login loginFn={mockLogin} initialValues={{ username: 'alice', password: 'secret' }} />
    </MemoryRouter>
  )

  const usernameInput = getByPlaceholderText('Username')
  const passwordInput = getByPlaceholderText('Password')
  const submit = getByRole('button', { name: /login/i })

  // initial values prefill state; submit directly
  fireEvent.submit(container.querySelector('form'))

  await waitFor(() => {
    expect(getByText('Succes')).toBeInTheDocument()
  })
})

afterEach(() => cleanup())

test('shows error when credentials missing', async () => {
  const { getByText, getByRole, container } = render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  )

  fireEvent.submit(container.querySelector('form'))

  await waitFor(() => {
    expect(getByText(/Felhasználónév és jelszó megadása kötelező./)).toBeInTheDocument()
  })
})

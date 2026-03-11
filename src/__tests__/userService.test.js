import { describe, test, expect, afterEach } from 'vitest'
import { strict as assert } from 'assert'
import * as userService from '../services/userService'

describe('userService', () => {
  const originalFetch = globalThis.fetch

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  test('getPublicUser returns result on valid response', async () => {
    globalThis.fetch = async () => ({
      status: 200,
      ok: true,
      text: async () => JSON.stringify({ message: '', result: { id: 1, name: 'Alice' } })
    })

    const res = await userService.getPublicUser(1)
    assert.deepEqual(res, { id: 1, name: 'Alice' })
  })

  test('getAllPublicUsers returns array', async () => {
    globalThis.fetch = async () => ({
      status: 200,
      ok: true,
      text: async () => JSON.stringify({ message: '', result: [{ id: 1 }] })
    })

    const res = await userService.getAllPublicUsers()
    assert.deepEqual(res, [{ id: 1 }])
  })

  test('401 response throws', async () => {
    globalThis.fetch = async () => ({
      status: 401,
      ok: false,
      text: async () => ''
    })

    await expect(userService.getPublicUser(2)).rejects.toThrow()
  })

  test('invalid JSON response throws', async () => {
    globalThis.fetch = async () => ({
      status: 200,
      ok: true,
      text: async () => 'not-json'
    })

    await expect(userService.getPublicUser(3)).rejects.toThrow('Érvénytelen JSON válasz érkezett a szervertől.')
  })
})

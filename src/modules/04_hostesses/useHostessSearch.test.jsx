import { Suspense } from 'react'
import { afterEach, expect, it } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { BrowserRouter, useNavigate, useSearchParams } from 'react-router-dom'
import useHostessSearch from './useHostessSearch'

afterEach(() => window.history.replaceState(null, '', '/'))

it('keeps typing responsive while a URL navigation is still rendering', async () => {
  window.history.replaceState(null, '', '/hostesses?returnTo=%2Freports')
  let release
  let pending = true
  const work = new Promise((resolve) => {
    release = () => {
      pending = false
      resolve()
    }
  })
  function Search() {
    const [value, setValue] = useHostessSearch('q')
    return <input aria-label="search" value={value} onChange={(e) => setValue(e.target.value)} />
  }
  function SlowResults() {
    const [params] = useSearchParams()
    if (params.get('q') && pending) throw work
    return <output>{params.get('q')}</output>
  }
  render(
    <BrowserRouter>
      <Suspense fallback="loading">
        <Search />
        <SlowResults />
      </Suspense>
    </BrowserRouter>,
  )
  const input = screen.getByRole('textbox', { name: 'search' })
  try {
    fireEvent.change(input, { target: { value: 'א' } })
    expect(input).toHaveValue('א')
    fireEvent.change(input, { target: { value: 'אביב יוסף' } })
    expect(input).toHaveValue('אביב יוסף')
  } finally {
    await act(async () => release())
  }
  expect(input).toHaveValue('אביב יוסף')
  expect(new URL(window.location.href).searchParams.get('q')).toBe('אביב יוסף')
  expect(new URL(window.location.href).searchParams.get('returnTo')).toBe('/reports')
})

it('restores search after navigation back and keeps other URL parameters', async () => {
  window.history.replaceState(null, '', '/hostesses?q=first&hostessQ=050&filter=missing')
  function Search() {
    const [value, setValue] = useHostessSearch('q')
    const navigate = useNavigate()
    return (
      <>
        <input aria-label="search" value={value} onChange={(e) => setValue(e.target.value)} />
        <button onClick={() => navigate('?q=second&hostessQ=052&filter=urgent')}>next</button>
        <button onClick={() => navigate(-1)}>back</button>
      </>
    )
  }
  render(
    <BrowserRouter>
      <Search />
    </BrowserRouter>,
  )
  const input = screen.getByRole('textbox', { name: 'search' })
  fireEvent.change(input, { target: { value: 'edited' } })
  expect(input).toHaveValue('edited')
  fireEvent.click(screen.getByRole('button', { name: 'next' }))
  expect(input).toHaveValue('second')
  fireEvent.click(screen.getByRole('button', { name: 'back' }))
  await screen.findByDisplayValue('edited')
  expect(new URL(window.location.href).searchParams.get('hostessQ')).toBe('050')
  expect(new URL(window.location.href).searchParams.get('filter')).toBe('missing')
})

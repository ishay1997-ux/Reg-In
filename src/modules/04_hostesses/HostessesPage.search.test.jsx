import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import HostessesPage from './HostessesPage'
import * as api from './api'
import { getParamValues } from '@/api/params'

vi.mock('./api', () => ({
  listStaffingOverview: vi.fn(),
  listHostesses: vi.fn(),
  listRepositoryAssignments: vi.fn(),
  getHostessScreenParams: vi.fn(),
  resendExpiredInvites: vi.fn(),
  setHostessStatus: vi.fn(),
  releaseAssignment: vi.fn(),
}))
vi.mock('@/api/params', () => ({ getParamValues: vi.fn() }))
vi.mock('./HostessFormDialog', () => ({ default: () => null }))
vi.mock('./HostessViewCard', () => ({ default: () => null }))
vi.mock('./SmartMatchPage', () => ({ default: () => null }))
vi.mock('@/components/ToastProvider', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}))
const auth = { permissions: { דיילות: 'edit', פרויקטים: 'view' } }
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => auth }))

function project(id, event, customer, full = false) {
  return {
    project_id: id,
    event_name: event,
    customer_name: customer,
    final_event_date: '2099-10-16',
    final_start_time: '10:00:00',
    required_hostess_count: 1,
    assignments: full
      ? [{ assignment_status: 'finally_approved', hostess_id: 1, assignment_number: 1 }]
      : [],
  }
}

function Where() {
  const { search } = useLocation()
  return <output data-testid="search-url">{search}</output>
}

function renderPage(entry = '/hostesses?returnTo=%2Freports') {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <HostessesPage />
      <Where />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  auth.permissions = { דיילות: 'edit', פרויקטים: 'view' }
  api.listStaffingOverview.mockResolvedValue([
    project(701, 'כנס האוניברסיטה', 'האוניברסיטה הפתוחה'),
    project(702, 'יריד תעסוקה', 'Acme', true),
  ])
  api.listHostesses.mockResolvedValue([
    { hostess_id: 1, full_name: 'דנה לוי', phone: '050-1111111', status: 'active' },
    { hostess_id: 2, full_name: 'נועה כהן', phone: '052-2222222', status: 'inactive' },
  ])
  api.listRepositoryAssignments.mockResolvedValue([])
  api.getHostessScreenParams.mockResolvedValue({})
  getParamValues.mockResolvedValue({
    שעות_תוקף_זימון: '48',
    שעות_סף_זימון_לפני_אירוע: '24',
    שעות_אירוע_דחוף: '72',
  })
})

describe('Hostesses search across both real tabs', () => {
  it.each([' כנס ', 'הפתוחה', '701'])('finds an event by %s', async (query) => {
    renderPage()
    await screen.findByTestId('overview-row-702')
    fireEvent.change(screen.getByTestId('overview-search'), { target: { value: query } })
    expect(screen.getByTestId('overview-row-701')).toBeInTheDocument()
    expect(screen.queryByTestId('overview-row-702')).not.toBeInTheDocument()
    expect(screen.getByTestId('search-url')).toHaveTextContent('returnTo=%2Freports')
  })

  it('combines case-insensitive search with staffing filters and clears only search', async () => {
    renderPage('/hostesses?filter=missing&returnTo=%2Freports')
    await screen.findByTestId('overview-row-701')
    fireEvent.change(screen.getByTestId('overview-search'), { target: { value: 'ACME' } })
    expect(screen.getByTestId('overview-empty-filtered')).toBeInTheDocument()
    expect(screen.getByTestId('overview-kpi-missing')).toHaveTextContent('1')
    fireEvent.click(screen.getByTestId('overview-filter-all'))
    expect(screen.getByTestId('overview-row-702')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'נקה חיפוש אירועים' }))
    expect(screen.getByTestId('overview-row-701')).toBeInTheDocument()
    expect(screen.getByTestId('overview-row-702')).toBeInTheDocument()
    expect(screen.getByTestId('search-url')).not.toHaveTextContent('q=')
  })

  it('restores the tab and each search from a copied address and keeps them across tab changes', async () => {
    renderPage('/hostesses?tab=repository&q=701&hostessQ=050&filter=missing&returnTo=%2Freports')
    const repository = await screen.findByTestId('repository-search')
    expect(repository).toHaveValue('050')
    expect(screen.getByTestId('repository-row-1')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('hostesses-tab-overview'))
    expect(await screen.findByTestId('overview-search')).toHaveValue('701')
    expect(screen.getByTestId('overview-filter-missing')).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByTestId('hostesses-tab-repository'))
    expect(await screen.findByTestId('repository-search')).toHaveValue('050')
    fireEvent.change(screen.getByTestId('repository-search'), { target: { value: 'דנה' } })
    expect(screen.getByTestId('search-url')).toHaveTextContent('q=701')
    expect(screen.getByTestId('search-url')).toHaveTextContent('returnTo=%2Freports')
    expect(screen.getByTestId('search-url')).toHaveTextContent('filter=missing')
  })

  it('clears a repository query without changing active-only filtering or the other search', async () => {
    renderPage('/hostesses?tab=repository&hostessQ=נועה&q=701')
    await screen.findByTestId('repository-empty-filtered')
    fireEvent.click(screen.getByTestId('repository-active-only'))
    expect(screen.getByTestId('repository-row-2')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'נקה חיפוש דיילות' }))
    expect(screen.getByTestId('repository-row-1')).toBeInTheDocument()
    expect(screen.getByTestId('repository-row-2')).toBeInTheDocument()
    expect(screen.getByTestId('search-url')).toHaveTextContent('q=701')
    expect(screen.getByTestId('search-url')).not.toHaveTextContent('hostessQ=')
  })

  it('shows permission denial before an empty search result', async () => {
    auth.permissions = { דיילות: 'view' }
    api.listStaffingOverview.mockResolvedValue([])
    renderPage('/hostesses?q=missing')
    expect(await screen.findByTestId('overview-empty-no-permission')).toBeInTheDocument()
    expect(screen.queryByTestId('overview-empty-filtered')).not.toBeInTheDocument()
    expect(screen.queryByTestId('overview-resend-all')).not.toBeInTheDocument()
  })

  it('reports a failed load instead of no matching events', async () => {
    api.listStaffingOverview.mockRejectedValue(new Error('network failure'))
    renderPage('/hostesses?q=missing')
    expect(await screen.findByTestId('overview-retry')).toBeInTheDocument()
    expect(screen.queryByTestId('overview-empty-filtered')).not.toBeInTheDocument()
  })
})

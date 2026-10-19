
import { useState } from 'react'
import {
  ArrowLeft,
  AlertTriangle,
  Package,
  Search,
  CalendarClock,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react'
import './Alerts.css'

function getDateOnly(value) {
  return String(value || '').slice(0, 10)
}

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getAlertStatus(medicine, today, next30Days) {
  const expiry = getDateOnly(medicine.expiry_date)
  const quantity = Number(medicine.quantity)

  // Expired medicines take priority over other alerts.
  if (expiry && expiry < today) {
    return 'expired'
  }

  // Low stock means 10 units or fewer.
  if (Number.isFinite(quantity) && quantity <= 10) {
    return 'low'
  }

  // Medicines expiring within the next 30 days.
  if (expiry && expiry >= today && expiry <= next30Days) {
    return 'soon'
  }

  return 'healthy'
}

function Alerts({
  onBack,
  medicines: providedMedicines,
  onRefresh,
}) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [refreshMessage, setRefreshMessage] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  // Use actual inventory supplied by the dashboard.
  // Do not display fake or demo medicines.
  const medicines = Array.isArray(providedMedicines)
    ? providedMedicines
    : []

  const today = getLocalDateString()

  const future = new Date()
  future.setDate(future.getDate() + 30)

  const next30Days = getLocalDateString(future)

  // Calculate alert statuses directly to avoid stale or unstable Hook dependencies.
  const rows = medicines.map(medicine => ({
    ...medicine,
    alertStatus: getAlertStatus(medicine, today, next30Days),
  }))

  const expiredCount = rows.filter(
    medicine => medicine.alertStatus === 'expired'
  ).length

  const lowCount = rows.filter(
    medicine => medicine.alertStatus === 'low'
  ).length

  const soonCount = rows.filter(
    medicine => medicine.alertStatus === 'soon'
  ).length

  const healthyCount = rows.filter(
    medicine => medicine.alertStatus === 'healthy'
  ).length

  const filtered = rows.filter(medicine => {
    const text = [
      medicine.name,
      medicine.category,
      medicine.manufacturer,
    ]
      .map(value => String(value || ''))
      .join(' ')
      .toLowerCase()

    const matchesSearch = text.includes(
      search.trim().toLowerCase()
    )

    const matchesFilter =
      filter === 'all' ||
      (filter === 'expired' &&
        medicine.alertStatus === 'expired') ||
      (filter === 'low' &&
        medicine.alertStatus === 'low') ||
      (filter === 'soon' &&
        medicine.alertStatus === 'soon') ||
      (filter === 'healthy' &&
        medicine.alertStatus === 'healthy')

    return matchesSearch && matchesFilter
  })

  async function refreshInventory() {
    if (refreshing) return

    if (typeof onRefresh !== 'function') {
      setRefreshMessage(
        'Refresh is unavailable. Check the dashboard connection.'
      )
      return
    }

    setRefreshing(true)
    setRefreshMessage('Refreshing live inventory...')

    try {
      const result = await onRefresh()

      if (result === false) {
        throw new Error('Inventory refresh failed.')
      }

      setRefreshMessage(
        'Inventory refreshed successfully.'
      )
    } catch {
      setRefreshMessage(
        'Could not refresh inventory. Check the backend and try again.'
      )
    } finally {
      setRefreshing(false)
    }
  }

  function statusLabel(status) {
    if (status === 'expired') return 'Expired'
    if (status === 'low') return 'Low stock'
    if (status === 'soon') return 'Expiring soon'

    return 'Healthy'
  }

  function selectFilter(nextFilter) {
    setFilter(current =>
      current === nextFilter ? 'all' : nextFilter
    )
  }

  return (
    <main className="alerts-page">
      <header className="alerts-header">
        <button
          type="button"
          className="alerts-back"
          onClick={onBack}
        >
          <ArrowLeft size={18} />
          Dashboard
        </button>

        <div className="alerts-title">
          <span className="alerts-title-icon">
            <ShieldAlert size={25} />
          </span>

          <div>
            <h1>Stock &amp; Expiry Alerts</h1>
            <p>
              Monitor medicine stock levels and expiry dates.
            </p>
          </div>
        </div>

        <span className="alerts-demo-label">
          INVENTORY
        </span>
      </header>

      <section className="alerts-banner">
        <div className="alerts-banner-icon">
          <AlertTriangle size={24} />
        </div>

        <div>
          <h2>Inventory health overview</h2>
          <p>
            Review stock shortages and expiry risks before
            they affect pharmacy operations.
          </p>
        </div>
      </section>

      <section className="alerts-stats">
        <button
          type="button"
          className={`alerts-stat-card red-card ${
            filter === 'expired' ? 'selected' : ''
          }`}
          onClick={() => selectFilter('expired')}
        >
          <span className="alerts-stat-top">
            <span>Expired medicines</span>
            <AlertTriangle size={21} />
          </span>

          <strong>{expiredCount}</strong>
          <small>Past their expiry date</small>
        </button>

        <button
          type="button"
          className={`alerts-stat-card orange-card ${
            filter === 'low' ? 'selected' : ''
          }`}
          onClick={() => selectFilter('low')}
        >
          <span className="alerts-stat-top">
            <span>Low stock</span>
            <Package size={21} />
          </span>

          <strong>{lowCount}</strong>
          <small>10 units or fewer</small>
        </button>

        <button
          type="button"
          className={`alerts-stat-card yellow-card ${
            filter === 'soon' ? 'selected' : ''
          }`}
          onClick={() => selectFilter('soon')}
        >
          <span className="alerts-stat-top">
            <span>Expiring soon</span>
            <CalendarClock size={21} />
          </span>

          <strong>{soonCount}</strong>
          <small>Within the next 30 days</small>
        </button>

        <button
          type="button"
          className={`alerts-stat-card green-card ${
            filter === 'healthy' ? 'selected' : ''
          }`}
          onClick={() => selectFilter('healthy')}
        >
          <span className="alerts-stat-top">
            <span>Healthy stock</span>
            <CheckCircle2 size={21} />
          </span>

          <strong>{healthyCount}</strong>
          <small>No current alerts</small>
        </button>
      </section>

      <section className="alerts-panel">
        <div className="alerts-panel-heading">
          <div>
            <h2>Medicine Alert Register</h2>
            <p>
              Search medicines and filter by alert type.
            </p>
          </div>

          <button
            type="button"
            className="alerts-refresh"
            onClick={refreshInventory}
            disabled={refreshing}
          >
            <RefreshCw
              size={16}
              className={refreshing ? 'refresh-spinning' : ''}
            />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {refreshMessage && (
          <p className="alerts-message" role="status">
            {refreshMessage}
          </p>
        )}

        <div className="alerts-controls">
          <div className="alerts-search">
            <Search size={18} />

            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search medicine or manufacturer..."
              aria-label="Search medicines"
            />
          </div>

          <select
            aria-label="Filter medicines by alert status"
            value={filter}
            onChange={event => setFilter(event.target.value)}
          >
            <option value="all">All medicines</option>
            <option value="expired">Expired</option>
            <option value="low">Low stock</option>
            <option value="soon">Expiring soon</option>
            <option value="healthy">Healthy</option>
          </select>
        </div>

        <div className="alerts-table-wrap">
          <table className="alerts-table">
            <thead>
              <tr>
                <th>MEDICINE</th>
                <th>CATEGORY</th>
                <th>QUANTITY</th>
                <th>EXPIRY DATE</th>
                <th>PRICE</th>
                <th>ALERT STATUS</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((medicine, index) => (
                <tr
                  key={
                    medicine.id ??
                    medicine._id ??
                    `${medicine.name}-${index}`
                  }
                >
                  <td>
                    <strong>
                      {medicine.name || 'Unnamed medicine'}
                    </strong>
                    <small>
                      {medicine.manufacturer || '—'}
                    </small>
                  </td>

                  <td>{medicine.category || 'General'}</td>

                  <td>
                    <span
                      className={
                        Number(medicine.quantity) <= 10
                          ? 'quantity-warning'
                          : 'quantity-normal'
                      }
                    >
                      {medicine.quantity ?? 0}
                    </span>
                  </td>

                  <td>
                    {getDateOnly(medicine.expiry_date) || '—'}
                  </td>

                  <td>
                    ₹{Number(medicine.price || 0).toFixed(2)}
                  </td>

                  <td>
                    <span
                      className={`alert-status ${medicine.alertStatus}`}
                    >
                      {statusLabel(medicine.alertStatus)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="alerts-empty">
              <Package size={32} />

              <strong>
                {medicines.length === 0
                  ? 'No inventory data available'
                  : 'No matching medicines'}
              </strong>

              <p>
                {medicines.length === 0
                  ? 'Check the backend connection and refresh your inventory.'
                  : 'Try another search or alert filter.'}
              </p>

              {medicines.length > 0 && (
                <button
                  type="button"
                  className="alerts-refresh"
                  onClick={() => {
                    setSearch('')
                    setFilter('all')
                  }}
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>

        <footer className="alerts-footer">
          <span>
            Showing {filtered.length} of {medicines.length} medicines
          </span>

          <span>Low-stock threshold: 10 units</span>
        </footer>
      </section>

      <p className="alerts-disclaimer">
        Alert status is calculated from the inventory supplied
        by the dashboard. Refresh retrieves the latest inventory
        from the backend.
      </p>
    </main>
  )
}

export default Alerts

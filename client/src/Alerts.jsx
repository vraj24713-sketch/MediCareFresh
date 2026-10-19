
import { useMemo, useState } from 'react'
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

const demoMedicines = [
  { id: 1, name: 'Paracetamol 500mg', category: 'Pain Relief', manufacturer: 'ABC Pharma', quantity: 5, expiry_date: '2027-06-15', price: 25 },
  { id: 2, name: 'Vitamin C 500mg', category: 'Vitamins', manufacturer: 'HealthPlus', quantity: 8, expiry_date: '2026-11-02', price: 60 },
  { id: 3, name: 'Cetirizine 10mg', category: 'Allergy', manufacturer: 'MediLife', quantity: 30, expiry_date: '2026-10-10', price: 35 },
  { id: 4, name: 'ORS Sachet', category: 'Hydration', manufacturer: 'ABC Pharma', quantity: 60, expiry_date: '2026-10-25', price: 20 },
  { id: 5, name: 'Antacid Tablets', category: 'Digestive Health', manufacturer: 'CareWell', quantity: 4, expiry_date: '2027-04-20', price: 45 },
  { id: 6, name: 'Cough Syrup 100ml', category: 'Cold & Cough', manufacturer: 'MediLife', quantity: 18, expiry_date: '2026-10-30', price: 85 },
  { id: 7, name: 'Calcium Tablets', category: 'Supplements', manufacturer: 'HealthPlus', quantity: 22, expiry_date: '2028-03-15', price: 75 },
  { id: 8, name: 'Iron Tablets', category: 'Supplements', manufacturer: 'ABC Pharma', quantity: 2, expiry_date: '2026-09-30', price: 55 },
]

function getDateOnly(value) {
  return String(value || '').slice(0, 10)
}

function getAlertStatus(medicine, today, next30Days) {
  const expiry = getDateOnly(medicine.expiry_date)

  if (expiry && expiry < today) return 'expired'
  if (Number(medicine.quantity) <= 10) return 'low'
  if (expiry && expiry <= next30Days) return 'soon'

  return 'healthy'
}

function Alerts({ onBack, medicines: providedMedicines }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [refreshMessage, setRefreshMessage] = useState('')

  const medicines = Array.isArray(providedMedicines)
    ? providedMedicines
    : demoMedicines

  const today = new Date().toISOString().slice(0, 10)
  const future = new Date()
  future.setDate(future.getDate() + 30)
  const next30Days = future.toISOString().slice(0, 10)

  const rows = useMemo(() => {
    return medicines.map(medicine => ({
      ...medicine,
      alertStatus: getAlertStatus(medicine, today, next30Days),
    }))
  }, [medicines, today, next30Days])

  const expiredCount = rows.filter(m => m.alertStatus === 'expired').length
  const lowCount = rows.filter(m => m.alertStatus === 'low').length
  const soonCount = rows.filter(m => m.alertStatus === 'soon').length
  const healthyCount = rows.filter(m => m.alertStatus === 'healthy').length

  const filtered = rows.filter(m => {
    const text = `${m.name} ${m.category} ${m.manufacturer}`.toLowerCase()
    const matchesSearch = text.includes(search.toLowerCase())

    const matchesFilter =
      filter === 'all' ||
      (filter === 'expired' && m.alertStatus === 'expired') ||
      (filter === 'low' && m.alertStatus === 'low') ||
      (filter === 'soon' && m.alertStatus === 'soon') ||
      (filter === 'healthy' && m.alertStatus === 'healthy')

    return matchesSearch && matchesFilter
  })

  function refreshDemo() {
    setRefreshMessage(
      providedMedicines
        ? 'Alert list refreshed from the supplied inventory.'
        : 'Demo alerts refreshed. Connect MongoDB to use live inventory.'
    )
  }

  function statusLabel(status) {
    if (status === 'expired') return 'Expired'
    if (status === 'low') return 'Low stock'
    if (status === 'soon') return 'Expiring soon'
    return 'Healthy'
  }

  return (
    <main className="alerts-page">
      <header className="alerts-header">
        <button className="alerts-back" onClick={onBack}>
          <ArrowLeft size={18} /> Dashboard
        </button>

        <div className="alerts-title">
          <span className="alerts-title-icon">
            <ShieldAlert size={25} />
          </span>
          <div>
            <h1>Stock & Expiry Alerts</h1>
            <p>Monitor medicine stock levels and expiry dates.</p>
          </div>
        </div>

        <span className="alerts-demo-label">
          {providedMedicines ? 'INVENTORY' : 'DEMO DATA'}
        </span>
      </header>

      <section className="alerts-banner">
        <div className="alerts-banner-icon">
          <AlertTriangle size={24} />
        </div>
        <div>
          <h2>Inventory health overview</h2>
          <p>
            Review stock shortages and expiry risks before they affect
            pharmacy operations.
          </p>
        </div>
      </section>

      <section className="alerts-stats">
        <button
          className={`alerts-stat-card red-card ${filter === 'expired' ? 'selected' : ''}`}
          onClick={() => setFilter(filter === 'expired' ? 'all' : 'expired')}
        >
          <span className="alerts-stat-top">
            <span>Expired medicines</span>
            <AlertTriangle size={21} />
          </span>
          <strong>{expiredCount}</strong>
          <small>Past their expiry date</small>
        </button>

        <button
          className={`alerts-stat-card orange-card ${filter === 'low' ? 'selected' : ''}`}
          onClick={() => setFilter(filter === 'low' ? 'all' : 'low')}
        >
          <span className="alerts-stat-top">
            <span>Low stock</span>
            <Package size={21} />
          </span>
          <strong>{lowCount}</strong>
          <small>10 units or fewer</small>
        </button>

        <button
          className={`alerts-stat-card yellow-card ${filter === 'soon' ? 'selected' : ''}`}
          onClick={() => setFilter(filter === 'soon' ? 'all' : 'soon')}
        >
          <span className="alerts-stat-top">
            <span>Expiring soon</span>
            <CalendarClock size={21} />
          </span>
          <strong>{soonCount}</strong>
          <small>Within the next 30 days</small>
        </button>

        <button
          className={`alerts-stat-card green-card ${filter === 'healthy' ? 'selected' : ''}`}
          onClick={() => setFilter(filter === 'healthy' ? 'all' : 'healthy')}
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
            <p>Search medicines and filter by alert type.</p>
          </div>

          <button className="alerts-refresh" onClick={refreshDemo}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        {refreshMessage && (
          <p className="alerts-message">{refreshMessage}</p>
        )}

        <div className="alerts-controls">
          <div className="alerts-search">
            <Search size={18} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search medicine or manufacturer..."
            />
          </div>

          <select
            aria-label="Filter medicines by alert status"
            value={filter}
            onChange={e => setFilter(e.target.value)}
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
              {filtered.map(medicine => (
                <tr key={medicine.id ?? medicine._id ?? medicine.name}>
                  <td>
                    <strong>{medicine.name}</strong>
                    <small>{medicine.manufacturer || '—'}</small>
                  </td>
                  <td>{medicine.category || 'General'}</td>
                  <td>
                    <span className={
                      Number(medicine.quantity) <= 10
                        ? 'quantity-warning'
                        : 'quantity-normal'
                    }>
                      {medicine.quantity}
                    </span>
                  </td>
                  <td>{getDateOnly(medicine.expiry_date) || '—'}</td>
                  <td>₹{Number(medicine.price || 0).toFixed(2)}</td>
                  <td>
                    <span className={`alert-status ${medicine.alertStatus}`}>
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
              <strong>No matching medicines</strong>
              <p>Try another search or alert filter.</p>
              <button
                className="alerts-refresh"
                onClick={() => {
                  setSearch('')
                  setFilter('all')
                }}
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        <footer className="alerts-footer">
          <span>Showing {filtered.length} of {medicines.length} medicines</span>
          <span>Low-stock threshold: 10 units</span>
        </footer>
      </section>

      <p className="alerts-disclaimer">
        {providedMedicines
          ? 'Alert status is calculated from the inventory supplied by the dashboard.'
          : 'This page currently uses sample data for demonstration. It does not update or change actual medicine stock.'}
      </p>
    </main>
  )
}

export default Alerts


import { useEffect, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  Boxes,
  LayoutDashboard,
  Package,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  ReceiptText,
} from 'lucide-react'
import './App.css'
import Billing from './Billing'
import Alerts from './Alerts'
import SalesHistory from './SalesHistory'

const API = 'http://localhost:5000/api/medicines'

const emptyForm = {
  name: '',
  category: '',
  manufacturer: '',
  price: '',
  quantity: '',
  expiry_date: '',
  prescription_required: false,
}

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [medicines, setMedicines] = useState([])
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })

  async function loadMedicines() {
    try {
      setError('')
      const response = await fetch(API)

      if (!response.ok) {
        throw new Error('Could not load medicines')
      }

      const data = await response.json()

      setMedicines(
        Array.isArray(data)
          ? data
          : data.medicines || data.data || []
      )
    } catch {
      setError(
        'Cannot connect to the backend. Make sure the server is running on port 5000.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMedicines()
  }, [])

  function openAddForm() {
    setEditingId(null)
    setForm({ ...emptyForm })
    setError('')
    setShowForm(true)
  }

  function openEditForm(medicine) {
    setEditingId(medicine.id ?? medicine._id)

    setForm({
      name: medicine.name || '',
      category: medicine.category || '',
      manufacturer: medicine.manufacturer || '',
      price: String(medicine.price ?? ''),
      quantity: String(medicine.quantity ?? ''),
      expiry_date: medicine.expiry_date
        ? String(medicine.expiry_date).slice(0, 10)
        : '',
      prescription_required: Boolean(
        medicine.prescription_required
      ),
    })

    setError('')
    setShowForm(true)
  }

  async function saveMedicine(event) {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      const url = editingId
        ? `${API}/${encodeURIComponent(editingId)}`
        : API

      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          quantity: Number(form.quantity),
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || data.success === false) {
        throw new Error(
          data.message ||
          data.error ||
          'Could not save medicine.'
        )
      }

      setShowForm(false)
      setEditingId(null)
      setForm({ ...emptyForm })

      await loadMedicines()
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteMedicine(medicine) {
    const id = medicine.id ?? medicine._id

    if (id == null) {
      setError('This medicine has no ID.')
      return
    }

    if (
      !window.confirm(
        `Delete ${medicine.name}? This cannot be undone.`
      )
    ) {
      return
    }

    try {
      setError('')

      const response = await fetch(
        `${API}/${encodeURIComponent(id)}`,
        {
          method: 'DELETE',
        }
      )

      const data = await response.json().catch(() => ({}))

      if (!response.ok || data.success === false) {
        throw new Error(
          data.message ||
          data.error ||
          'Could not delete medicine.'
        )
      }

      await loadMedicines()
    } catch (err) {
      setError(err.message || 'Could not delete medicine.')
    }
  }

  if (currentPage === 'billing') {
    return (
      <Billing
        onBack={() => {
          setCurrentPage('dashboard')
          loadMedicines()
        }}
      />
    )
  }

  if (currentPage === 'alerts') {
    return (
      <Alerts
        onBack={() => setCurrentPage('dashboard')}
      />
    )
  }

  if (currentPage === 'sales') {
    return (
      <SalesHistory
        onBack={() => setCurrentPage('dashboard')}
      />
    )
  }

  const today = new Date().toISOString().slice(0, 10)

  const lowStock = medicines.filter(
    medicine => Number(medicine.quantity) <= 10
  )

  const expired = medicines.filter(
    medicine =>
      medicine.expiry_date &&
      String(medicine.expiry_date).slice(0, 10) < today
  )

  const inventoryValue = medicines.reduce(
    (total, medicine) =>
      total +
      Number(medicine.price || 0) *
      Number(medicine.quantity || 0),
    0
  )

  const filtered = medicines.filter(medicine =>
    `${medicine.name} ${medicine.category} ${medicine.manufacturer}`
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">
            <Activity />
          </span>

          <div>
            <strong>MediCare</strong>
            <small>STORE MANAGEMENT</small>
          </div>
        </div>

        <p className="nav-label">WORKSPACE</p>

        <button
          type="button"
          className={`nav-item ${
            currentPage === 'dashboard' ? 'active' : ''
          }`}
          onClick={() => setCurrentPage('dashboard')}
        >
          <LayoutDashboard size={19} />
          Dashboard
        </button>

        <button
          type="button"
          className="nav-item"
          onClick={() =>
            document
              .querySelector('.inventory-panel')
              ?.scrollIntoView({ behavior: 'smooth' })
          }
        >
          <Package size={19} />
          Medicine Inventory
        </button>

        <button
          type="button"
          className="nav-item"
          onClick={() => setCurrentPage('alerts')}
        >
          <AlertTriangle size={19} />
          Stock & Expiry Alerts
        </button>

        <button
          type="button"
          className="nav-item"
          onClick={() => setCurrentPage('billing')}
        >
          <ReceiptText size={19} />
          Sales & Billing
        </button>

        <button
          type="button"
          className="nav-item"
          onClick={() => setCurrentPage('sales')}
        >
          <ReceiptText size={19} />
          Sales History
        </button>

        <div className="sidebar-bottom">
          <div className="status-dot" />
          Inventory system
          <span>●</span>
          <small>Full Stack Mini Project</small>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="breadcrumb">Workspace /</span>
            {' '}
            <strong>Dashboard</strong>
          </div>

          <div className="profile">
            <span className="profile-avatar">M</span>

            <div>
              <strong>Store Admin</strong>
              <small>Administrator</small>
            </div>
          </div>
        </header>

        <section className="welcome">
          <div>
            <p className="eyebrow">OVERVIEW</p>
            <h1>Good day, Store Admin 👋</h1>
            <p>
              Here's what's happening with your medical inventory.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={openAddForm}
          >
            <Plus size={18} />
            Add Medicine
          </button>
        </section>

        {error && (
          <div className="error-banner">{error}</div>
        )}

        <section className="stats-grid">
          <article className="stat-card">
            <div className="stat-heading">
              Total medicines
              <span className="stat-icon blue">
                <Boxes />
              </span>
            </div>

            <strong className="stat-number">
              {medicines.length}
            </strong>

            <p>Different products in inventory</p>
          </article>

          <article className="stat-card">
            <div className="stat-heading">
              Low stock
              <span className="stat-icon orange">
                <AlertTriangle />
              </span>
            </div>

            <strong className="stat-number">
              {lowStock.length}
            </strong>

            <p>Medicines with 10 or fewer units</p>
          </article>

          <article className="stat-card">
            <div className="stat-heading">
              Expired medicines
              <span className="stat-icon red">
                <AlertTriangle />
              </span>
            </div>

            <strong className="stat-number">
              {expired.length}
            </strong>

            <p>Past their expiry date</p>
          </article>

          <article className="stat-card">
            <div className="stat-heading">
              Inventory value
              <span className="stat-icon green">
                <Package />
              </span>
            </div>

            <strong className="stat-number">
              ₹
              {inventoryValue.toLocaleString('en-IN', {
                maximumFractionDigits: 2,
              })}
            </strong>

            <p>Based on price × quantity</p>
          </article>
        </section>

        <section className="inventory-panel">
          <div className="panel-heading">
            <div>
              <h2>Medicine Inventory</h2>
              <p>
                Manage and review your available medicines.
              </p>
            </div>

            <button
              className="secondary-button"
              onClick={loadMedicines}
            >
              Refresh
            </button>
          </div>

          <div className="search-box">
            <Search size={18} />

            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search medicine, category or manufacturer..."
            />
          </div>

          {loading ? (
            <p className="empty-state">
              Loading inventory...
            </p>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <Package size={35} />

              <strong>No medicines found</strong>

              <p>
                {search
                  ? 'Try a different search term.'
                  : 'Add your first medicine to get started.'}
              </p>

              <button
                className="primary-button"
                onClick={openAddForm}
              >
                <Plus size={17} />
                Add Medicine
              </button>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>MEDICINE</th>
                    <th>CATEGORY</th>
                    <th>PRICE</th>
                    <th>QUANTITY</th>
                    <th>EXPIRY DATE</th>
                    <th>STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map(medicine => {
                    const expiry = medicine.expiry_date
                      ? String(medicine.expiry_date).slice(0, 10)
                      : ''

                    const isExpired =
                      expiry && expiry < today

                    return (
                      <tr
                        key={medicine.id ?? medicine._id}
                      >
                        <td>
                          <strong>{medicine.name}</strong>
                          <small className="sub-cell">
                            {medicine.manufacturer || '—'}
                          </small>
                        </td>

                        <td>{medicine.category || '—'}</td>

                        <td>
                          ₹{Number(medicine.price || 0).toFixed(2)}
                        </td>

                        <td>{medicine.quantity}</td>

                        <td>{expiry || '—'}</td>

                        <td>
                          {isExpired ? (
                            <span className="badge expired">
                              Expired
                            </span>
                          ) : Number(medicine.quantity) <= 10 ? (
                            <span className="badge low">
                              Low stock
                            </span>
                          ) : (
                            <span className="badge available">
                              In stock
                            </span>
                          )}
                        </td>

                        <td>
                          <div className="action-buttons">
                            <button
                              type="button"
                              className="icon-button edit-button"
                              title="Edit medicine"
                              onClick={() =>
                                openEditForm(medicine)
                              }
                            >
                              <Pencil size={16} />
                            </button>

                            <button
                              type="button"
                              className="icon-button delete-button"
                              title="Delete medicine"
                              onClick={() =>
                                deleteMedicine(medicine)
                              }
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className="footer">
          <span>MediCare Inventory Management</span>
          <span>Full Stack Development Mini Project</span>
        </footer>
      </main>

      {showForm && (
        <div
          className="modal-backdrop"
          onClick={() => setShowForm(false)}
        >
          <section
            className="modal"
            onClick={event => event.stopPropagation()}
          >
            <div className="modal-heading">
              <div>
                <h2>
                  {editingId ? 'Edit Medicine' : 'Add Medicine'}
                </h2>

                <p>Enter the medicine details below.</p>
              </div>

              <button
                type="button"
                className="close-button"
                onClick={() => setShowForm(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveMedicine}>
              <label>
                Medicine name *
                <input
                  required
                  value={form.name}
                  onChange={event =>
                    setForm({
                      ...form,
                      name: event.target.value,
                    })
                  }
                  placeholder="e.g. Vitamin C 500mg"
                />
              </label>

              <div className="form-row">
                <label>
                  Category *
                  <input
                    required
                    value={form.category}
                    onChange={event =>
                      setForm({
                        ...form,
                        category: event.target.value,
                      })
                    }
                    placeholder="e.g. Vitamins"
                  />
                </label>

                <label>
                  Manufacturer
                  <input
                    value={form.manufacturer}
                    onChange={event =>
                      setForm({
                        ...form,
                        manufacturer: event.target.value,
                      })
                    }
                    placeholder="Company name"
                  />
                </label>
              </div>

              <div className="form-row">
                <label>
                  Price (₹) *
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={event =>
                      setForm({
                        ...form,
                        price: event.target.value,
                      })
                    }
                    placeholder="60"
                  />
                </label>

                <label>
                  Quantity *
                  <input
                    required
                    type="number"
                    min="0"
                    step="1"
                    value={form.quantity}
                    onChange={event =>
                      setForm({
                        ...form,
                        quantity: event.target.value,
                      })
                    }
                    placeholder="25"
                  />
                </label>
              </div>

              <label>
                Expiry date *
                <input
                  required
                  type="date"
                  value={form.expiry_date}
                  onChange={event =>
                    setForm({
                      ...form,
                      expiry_date: event.target.value,
                    })
                  }
                />
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={form.prescription_required}
                  onChange={event =>
                    setForm({
                      ...form,
                      prescription_required:
                        event.target.checked,
                    })
                  }
                />
                Prescription required
              </label>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving
                    ? 'Saving...'
                    : editingId
                      ? 'Update Medicine'
                      : 'Save Medicine'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}

export default App


import { useEffect, useState } from 'react'
import { Activity, AlertTriangle, Boxes, LayoutDashboard, Package, Plus, Search, Trash2 } from 'lucide-react'
import './App.css'

const API = 'http://localhost:5000/api/medicines'

function App() {
  const [medicines, setMedicines] = useState([])
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    name: '',
    category: '',
    manufacturer: '',
    price: '',
    quantity: '',
    expiry_date: '',
    prescription_required: false,
  })

  async function loadMedicines() {
    try {
      setError('')
      const response = await fetch(API)
      if (!response.ok) throw new Error('Could not load medicines')
      const data = await response.json()
      setMedicines(Array.isArray(data) ? data : data.medicines || [])
    } catch {
      setError('Cannot connect to the backend. Make sure the server is running on port 5000.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMedicines()
  }, [])

  async function addMedicine(event) {
    event.preventDefault()
    setError('')

    try {
      const response = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          quantity: Number(form.quantity),
        }),
      })

      const data = await response.json()
      if (!response.ok || data.success === false) {
        throw new Error(data.message || data.error || 'Could not save medicine')
      }

      setForm({
        name: '',
        category: '',
        manufacturer: '',
        price: '',
        quantity: '',
        expiry_date: '',
        prescription_required: false,
      })
      setShowForm(false)
      await loadMedicines()
    } catch (err) {
      setError(err.message || 'Could not save medicine.')
    }
  }

  const today = new Date().toISOString().slice(0, 10)
  const lowStock = medicines.filter(m => Number(m.quantity) <= 10)
  const expired = medicines.filter(m => m.expiry_date && m.expiry_date < today)
  const inventoryValue = medicines.reduce(
    (total, m) => total + Number(m.price || 0) * Number(m.quantity || 0), 0
  )
  const filtered = medicines.filter(m =>
    `${m.name} ${m.category} ${m.manufacturer}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-icon"><Activity /></span><div><strong>MediCare</strong><small>STORE MANAGEMENT</small></div></div>
        <p className="nav-label">WORKSPACE</p>
        <div className="nav-item active"><LayoutDashboard size={19} /> Dashboard</div>
        <div className="nav-item"><Package size={19} /> Medicine Inventory</div>
        <div className="nav-item"><AlertTriangle size={19} /> Stock & Expiry Alerts</div>
        <div className="sidebar-bottom"><div className="status-dot" /> Inventory system <span>●</span><small>Full Stack Mini Project</small></div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div><span className="breadcrumb">Workspace /</span> <strong>Dashboard</strong></div>
          <div className="profile"><span className="profile-avatar">M</span><div><strong>Store Admin</strong><small>Administrator</small></div></div>
        </header>

        <section className="welcome">
          <div><p className="eyebrow">OVERVIEW</p><h1>Good day, Store Admin 👋</h1><p>Here's what's happening with your medical inventory.</p></div>
          <button className="primary-button" onClick={() => setShowForm(true)}><Plus size={18} /> Add Medicine</button>
        </section>

        {error && <div className="error-banner">{error}</div>}

        <section className="stats-grid">
          <article className="stat-card"><div className="stat-heading">Total medicines <span className="stat-icon blue"><Boxes /></span></div><strong className="stat-number">{medicines.length}</strong><p>Different products in inventory</p></article>
          <article className="stat-card"><div className="stat-heading">Low stock <span className="stat-icon orange"><AlertTriangle /></span></div><strong className="stat-number">{lowStock.length}</strong><p>Medicines with 10 or fewer units</p></article>
          <article className="stat-card"><div className="stat-heading">Expired medicines <span className="stat-icon red"><AlertTriangle /></span></div><strong className="stat-number">{expired.length}</strong><p>Past their expiry date</p></article>
          <article className="stat-card"><div className="stat-heading">Inventory value <span className="stat-icon green"><Package /></span></div><strong className="stat-number">₹{inventoryValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</strong><p>Based on price × quantity</p></article>
        </section>

        <section className="inventory-panel">
          <div className="panel-heading"><div><h2>Medicine Inventory</h2><p>Manage and review your available medicines.</p></div><button className="secondary-button" onClick={loadMedicines}>Refresh</button></div>
          <div className="search-box"><Search size={18} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search medicine, category or manufacturer..." /></div>

          {loading ? <p className="empty-state">Loading inventory...</p> : filtered.length === 0 ? (
            <div className="empty-state"><Package size={35} /><strong>No medicines found</strong><p>{search ? 'Try a different search term.' : 'Add your first medicine to get started.'}</p><button className="primary-button" onClick={() => setShowForm(true)}><Plus size={17} /> Add Medicine</button></div>
          ) : (
            <div className="table-wrap"><table><thead><tr><th>MEDICINE</th><th>CATEGORY</th><th>PRICE</th><th>QUANTITY</th><th>EXPIRY DATE</th><th>STATUS</th></tr></thead><tbody>
              {filtered.map(m => <tr key={m.id}><td><strong>{m.name}</strong><small className="sub-cell">{m.manufacturer || '—'}</small></td><td>{m.category || '—'}</td><td>₹{Number(m.price).toFixed(2)}</td><td>{m.quantity}</td><td>{m.expiry_date || '—'}</td><td>{m.expiry_date && m.expiry_date < today ? <span className="badge expired">Expired</span> : Number(m.quantity) <= 10 ? <span className="badge low">Low stock</span> : <span className="badge available">In stock</span>}</td></tr>)}
            </tbody></table></div>
          )}
        </section>

        <footer className="footer"><span>MediCare Inventory Management</span><span>Full Stack Development Mini Project</span></footer>
      </main>

      {showForm && <div className="modal-backdrop" onClick={() => setShowForm(false)}><section className="modal" onClick={e => e.stopPropagation()}><div className="modal-heading"><div><h2>Add Medicine</h2><p>Enter the medicine details below.</p></div><button className="close-button" onClick={() => setShowForm(false)}>×</button></div>
        <form onSubmit={addMedicine}>
          <label>Medicine name *<input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Vitamin C 500mg" /></label>
          <div className="form-row"><label>Category *<input required value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g. Vitamins" /></label><label>Manufacturer<input value={form.manufacturer} onChange={e => setForm({ ...form, manufacturer: e.target.value })} placeholder="Company name" /></label></div>
          <div className="form-row"><label>Price (₹) *<input required type="number" min="0" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="60" /></label><label>Quantity *<input required type="number" min="0" step="1" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} placeholder="25" /></label></div>
          <label>Expiry date *<input required type="date" value={form.expiry_date} onChange={e => setForm({ ...form, expiry_date: e.target.value })} /></label>
          <label className="checkbox-label"><input type="checkbox" checked={form.prescription_required} onChange={e => setForm({ ...form, prescription_required: e.target.checked })} /> Prescription required</label>
          <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" className="primary-button">Save Medicine</button></div>
        </form>
      </section></div>}
    </div>
  )
}

export default App

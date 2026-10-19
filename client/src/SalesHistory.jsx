
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Search, ReceiptText, RefreshCw, Eye, X } from 'lucide-react'
import './SalesHistory.css'

const API_URL = 'http://localhost:5000/api/sales'

function formatMoney(value) {
  return `₹${(Number(value) || 0).toFixed(2)}`
}

function formatDate(value) {
  if (!value) return 'Date unavailable'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : date.toLocaleString('en-IN')
}

function SalesHistory({ onBack }) {
  const [sales, setSales] = useState([])
  const [search, setSearch] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('All')
  const [selectedSale, setSelectedSale] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadSales = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(API_URL)
      const result = await response.json()

      if (!response.ok || result.success === false) {
        throw new Error(result.message || 'Could not load sales history.')
      }

      const records = Array.isArray(result)
        ? result
        : result.data || result.sales || []

      setSales(records)
    } catch (err) {
      setError(err.message || 'Unable to connect to the backend.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSales()
  }, [loadSales])

  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const invoice = String(sale.invoiceNumber || sale._id || '')
      const customer = String(sale.customer || 'Walk-in Customer')
      const payment = String(sale.paymentMethod || 'Unknown')

      const matchesSearch =
        `${invoice} ${customer} ${sale.phone || ''}`
          .toLowerCase()
          .includes(search.toLowerCase())

      const matchesPayment =
        paymentFilter === 'All' || payment === paymentFilter

      return matchesSearch && matchesPayment
    })
  }, [sales, search, paymentFilter])

  const totalRevenue = filteredSales.reduce(
    (sum, sale) => sum + (Number(sale.total) || 0),
    0
  )

  function printSelectedSale() {
    window.print()
  }

  return (
    <main className="sales-history-page">
      <header className="sales-history-header">
        <button className="sales-back-button" onClick={onBack}>
          <ArrowLeft size={18} /> Dashboard
        </button>

        <div>
          <h1>Sales History</h1>
          <p>View invoices saved in the MediCare database.</p>
        </div>

        <button
          className="sales-refresh-button"
          onClick={loadSales}
          disabled={loading}
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </header>

      {error && (
        <div className="sales-error" role="alert">
          {error}
        </div>
      )}

      <section className="sales-summary">
        <article className="sales-summary-card">
          <span>Total invoices shown</span>
          <strong>{filteredSales.length}</strong>
        </article>
        <article className="sales-summary-card">
          <span>Revenue shown</span>
          <strong>{formatMoney(totalRevenue)}</strong>
        </article>
      </section>

      <section className="sales-history-panel">
        <div className="sales-history-toolbar">
          <label className="sales-search">
            <Search size={18} />
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search invoice, customer or phone..."
            />
          </label>

          <select
            value={paymentFilter}
            onChange={event => setPaymentFilter(event.target.value)}
            aria-label="Filter by payment method"
          >
            <option value="All">All payment methods</option>
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Card">Card</option>
          </select>
        </div>

        {loading ? (
          <p className="sales-history-message">Loading saved invoices...</p>
        ) : filteredSales.length === 0 ? (
          <p className="sales-history-message">
            {error
              ? 'Sales could not be loaded. Check the backend and refresh.'
              : 'No matching saved invoices found.'}
          </p>
        ) : (
          <div className="sales-table-wrapper">
            <table className="sales-history-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Payment</th>
                  <th>Total</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((sale, index) => (
                  <tr key={sale._id || sale.invoiceNumber || index}>
                    <td>{sale.invoiceNumber || sale._id || '—'}</td>
                    <td>{formatDate(sale.createdAt)}</td>
                    <td>{sale.customer || 'Walk-in Customer'}</td>
                    <td>{sale.paymentMethod || 'Unknown'}</td>
                    <td>{formatMoney(sale.total)}</td>
                    <td>
                      <button
                        className="sales-view-button"
                        onClick={() => setSelectedSale(sale)}
                      >
                        <Eye size={16} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedSale && (
        <div className="sales-detail-overlay">
          <section
            className="sales-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Invoice details"
          >
            <header className="sales-detail-header">
              <div>
                <ReceiptText size={22} />
                <h2>Invoice Details</h2>
              </div>
              <button
                onClick={() => setSelectedSale(null)}
                aria-label="Close invoice details"
              >
                <X size={20} />
              </button>
            </header>

            <p>
              <strong>Invoice:</strong>{' '}
              {selectedSale.invoiceNumber || selectedSale._id}
            </p>
            <p><strong>Date:</strong> {formatDate(selectedSale.createdAt)}</p>
            <p><strong>Customer:</strong> {selectedSale.customer || 'Walk-in Customer'}</p>
            <p><strong>Phone:</strong> {selectedSale.phone || 'Not provided'}</p>
            <p><strong>Payment:</strong> {selectedSale.paymentMethod || 'Unknown'}</p>

            <h3>Items</h3>
            <div className="sales-detail-items">
              {(selectedSale.items || []).map((item, index) => (
                <div
                  className="sales-detail-item"
                  key={item._id || item.medicineId || item.name || index}
                >
                  <span>
                    {item.name} × {item.quantity}
                  </span>
                  <strong>
                    {formatMoney(
                      item.lineTotal ??
                      Number(item.price || 0) * Number(item.quantity || 0)
                    )}
                  </strong>
                </div>
              ))}
            </div>

            <hr />
            <p><strong>Subtotal:</strong> {formatMoney(selectedSale.subtotal)}</p>
            <p><strong>Discount:</strong> {formatMoney(selectedSale.discount)}</p>
            <p className="sales-detail-total">
              Total: {formatMoney(selectedSale.total)}
            </p>

            <button
              className="sales-print-button"
              onClick={printSelectedSale}
            >
              Print Invoice
            </button>
          </section>
        </div>
      )}
    </main>
  )
}

export default SalesHistory

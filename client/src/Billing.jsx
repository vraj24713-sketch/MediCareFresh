
import { useMemo, useState, useEffect, useCallback } from 'react'
import {
  ArrowLeft, ReceiptText, Search, ShoppingCart,
  Trash2, Plus, Minus, CheckCircle2
} from 'lucide-react'
import './Billing.css'

const API_URL = 'http://localhost:5000/api'

function Billing({ onBack }) {
  const [medicines, setMedicines] = useState([])
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState([])
  const [customer, setCustomer] = useState('')
  const [phone, setPhone] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [discount, setDiscount] = useState('0')
  const [bill, setBill] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadMedicines = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/medicines`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Could not load medicines.')
      }

      const list = Array.isArray(result)
        ? result
        : result.data || result.medicines || result.value || []

      setMedicines(list.map(medicine => ({
        ...medicine,
        id: String(medicine._id ?? medicine.id),
        price: Number(medicine.price) || 0,
        stock: Number(medicine.quantity ?? medicine.stock) || 0
      })))
    } catch (err) {
      setError(
        `${err.message} Make sure the backend is running on port 5000.`
      )
    } finally {
      setLoading(false)
    }
  }, [])

   
useEffect(() => {
  let cancelled = false

  async function fetchInitialMedicines() {
    try {
      const response = await fetch(`${API_URL}/medicines`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Could not load medicines.')
      }

      const list = Array.isArray(result)
        ? result
        : result.data || result.medicines || result.value || []

      if (!cancelled) {
        setMedicines(
          list.map(medicine => ({
            ...medicine,
            id: String(medicine._id ?? medicine.id),
            price: Number(medicine.price) || 0,
            stock: Number(medicine.quantity ?? medicine.stock) || 0,
          }))
        )
        setError('')
      }
    } catch (err) {
      if (!cancelled) {
        setError(
          `${err.message} Make sure the backend is running on port 5000.`
        )
      }
    } finally {
      if (!cancelled) {
        setLoading(false)
      }
    }
  }

  fetchInitialMedicines()

  return () => {
    cancelled = true
  }
}, [])
 

  const filteredMedicines = medicines.filter(medicine =>
    medicine.name?.toLowerCase().includes(search.toLowerCase())
  )

  const subtotal = useMemo(
    () => cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    ),
    [cart]
  )

  const discountAmount = Math.min(
    subtotal,
    Math.max(0, Number(discount) || 0)
  )

  const total = Math.max(0, subtotal - discountAmount)

  function addToCart(medicine) {
    setError('')
    setNotice('')
    setBill(null)

    if (medicine.stock < 1) {
      setError(`${medicine.name} is out of stock.`)
      return
    }

    setCart(current => {
      const existing = current.find(item => item.id === medicine.id)

      if (existing) {
        if (existing.quantity >= medicine.stock) {
          setNotice(`Only ${medicine.stock} units of ${medicine.name} are available.`)
          return current
        }

        return current.map(item =>
          item.id === medicine.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }

      return [...current, { ...medicine, quantity: 1 }]
    })
  }

  function changeQuantity(id, amount) {
    setBill(null)
    setError('')
    setNotice('')

    setCart(current =>
      current
        .map(item => {
          if (item.id !== id) return item

          const medicine = medicines.find(m => m.id === id)
          if (!medicine) return item

          const quantity = Math.min(
            medicine.stock,
            Math.max(0, item.quantity + amount)
          )

          return { ...item, quantity }
        })
        .filter(item => item.quantity > 0)
    )
  }

  function removeItem(id) {
    setBill(null)
    setCart(current => current.filter(item => item.id !== id))
  }

  async function generateBill() {
    if (cart.length === 0) {
      setError('Add at least one medicine before checkout.')
      return
    }

    setSaving(true)
    setError('')
    setNotice('')
    setBill(null)

    try {
      const response = await fetch(`${API_URL}/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: customer.trim() || 'Walk-in Customer',
          phone: phone.trim(),
          paymentMethod,
          discount: discountAmount,
          items: cart.map(item => ({
            medicineId: item.id,
            quantity: item.quantity
          }))
        })
      })

      const result = await response.json()

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message || result.error || 'The sale could not be completed.'
        )
      }

      const sale = result.data || result.sale || result

      const savedItems = (sale.items || []).map(item => ({
        ...item,
        id: String(item.medicineId ?? item._id ?? item.id ?? item.name),
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 0,
        lineTotal: Number(
          item.lineTotal ?? item.price * item.quantity
        )
      }))

      setBill({
        number: sale.invoiceNumber || sale.invoice || sale._id || `MC-${Date.now()}`,
        date: sale.createdAt
          ? new Date(sale.createdAt).toLocaleString('en-IN')
          : new Date().toLocaleString('en-IN'),
        customer: sale.customer || customer.trim() || 'Walk-in Customer',
        phone: sale.phone || phone.trim() || 'Not provided',
        paymentMethod: sale.paymentMethod || paymentMethod,
        items: savedItems.length ? savedItems : cart.map(item => ({
          ...item,
          lineTotal: item.price * item.quantity
        })),
        subtotal: Number(sale.subtotal ?? subtotal),
        discount: Number(sale.discount ?? discountAmount),
        total: Number(sale.total ?? total)
      })

      setCart([])
      setNotice('Sale saved successfully. Inventory has been updated.')
      await loadMedicines()
    } catch (err) {
      setError(err.message || 'Unable to complete the sale.')
      await loadMedicines()
    } finally {
      setSaving(false)
    }
  }

  function printBill() {
    window.print()
  }

  function startNewBill() {
    setCart([])
    setCustomer('')
    setPhone('')
    setPaymentMethod('Cash')
    setDiscount('0')
    setBill(null)
    setError('')
    setNotice('')
    setSearch('')
    loadMedicines()
  }

  return (
    <main className="billing-page">
      <header className="billing-header">
        <button className="billing-back" onClick={onBack}>
          <ArrowLeft size={18} /> Dashboard
        </button>

        <div className="billing-title">
          <span className="billing-icon">
            <ReceiptText size={25} />
          </span>
          <div>
            <h1>Sales &amp; Billing</h1>
            <p>Create bills and save sales to the database.</p>
          </div>
        </div>

        <span className="demo-label">LIVE DATABASE</span>
      </header>

      <div className="billing-layout">
        <section className="billing-products">
          <div className="billing-section-heading">
            <div>
              <h2>Available Medicines</h2>
              <p>Select products to add them to the bill.</p>
            </div>
            <span className="product-count">
              {filteredMedicines.length} products
            </span>
          </div>

          <div className="billing-search">
            <Search size={18} />
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search medicines..."
            />
          </div>

          {loading ? (
            <p className="billing-empty">Loading medicines from database...</p>
          ) : error && medicines.length === 0 ? (
            <p className="billing-empty">{error}</p>
          ) : (
            <div className="product-grid">
              {filteredMedicines.map(medicine => (
                <article className="product-card" key={medicine.id}>
                  <div className="product-card-icon">
                    <ShoppingCart size={22} />
                  </div>
                  <span className="product-category">
                    {medicine.category || 'General'}
                  </span>
                  <h3>{medicine.name}</h3>
                  <p className="product-stock">
                    {medicine.stock} units available
                  </p>
                  <div className="product-card-bottom">
                    <strong>₹{medicine.price.toFixed(2)}</strong>
                    <button
                      className="add-product-button"
                      onClick={() => addToCart(medicine)}
                      disabled={
                        medicine.stock === 0 ||
                        (cart.find(item => item.id === medicine.id)?.quantity || 0)
                          >= medicine.stock
                      }
                    >
                      <Plus size={16} /> Add
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {!loading && filteredMedicines.length === 0 && !error && (
            <p className="billing-empty">No matching medicines found.</p>
          )}
        </section>

        <section className="billing-cart">
          {bill ? (
            <div className="bill-success">
              <CheckCircle2 size={46} />
              <h2>Sale Saved Successfully!</h2>
              <p>Your invoice is saved in the database.</p>

              <div className="receipt-preview">
                <h3>MediCare Pharmacy</h3>
                <p>Invoice: {bill.number}</p>
                <p>Date: {bill.date}</p>
                <p>Customer: {bill.customer}</p>
                <p>Phone: {bill.phone}</p>
                <p>Payment: {bill.paymentMethod}</p>
                <hr />

                {bill.items.map((item, index) => (
                  <div
                    className="receipt-row"
                    key={`${item.id}-${index}`}
                  >
                    <span>{item.name} × {item.quantity}</span>
                    <strong>
                      ₹{Number(item.lineTotal).toFixed(2)}
                    </strong>
                  </div>
                ))}

                <hr />
                <div className="receipt-row">
                  <span>Subtotal</span>
                  <span>₹{bill.subtotal.toFixed(2)}</span>
                </div>
                <div className="receipt-row">
                  <span>Discount</span>
                  <span>−₹{bill.discount.toFixed(2)}</span>
                </div>
                <div className="receipt-total">
                  <span>Total</span>
                  <strong>₹{bill.total.toFixed(2)}</strong>
                </div>
              </div>

              <button
                className="billing-primary full-width"
                onClick={printBill}
              >
                <ReceiptText size={17} /> Print Bill
              </button>
              <button
                className="billing-secondary full-width"
                onClick={startNewBill}
              >
                Create New Bill
              </button>
            </div>
          ) : (
            <>
              <div className="billing-section-heading">
                <div>
                  <h2>Current Bill</h2>
                  <p>{cart.length} different products</p>
                </div>
                <span className="cart-icon">
                  <ShoppingCart size={21} />
                </span>
              </div>

              <div className="customer-fields">
                <label>
                  Customer name
                  <input
                    value={customer}
                    onChange={e => setCustomer(e.target.value)}
                    placeholder="Walk-in customer"
                  />
                </label>
                <label>
                  Phone number
                  <input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    inputMode="tel"
                    placeholder="Optional"
                  />
                </label>
                <label>
                  Payment method
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                  </select>
                </label>
              </div>

              <div className="cart-items">
                {cart.length === 0 ? (
                  <div className="cart-empty">
                    <ShoppingCart size={32} />
                    <strong>Your bill is empty</strong>
                    <p>Add a medicine from the product list.</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <article className="cart-item" key={item.id}>
                      <div className="cart-item-info">
                        <strong>{item.name}</strong>
                        <span>₹{item.price.toFixed(2)} each</span>
                      </div>
                      <div className="quantity-controls">
                        <button
                          aria-label="Decrease quantity"
                          onClick={() => changeQuantity(item.id, -1)}
                        >
                          <Minus size={14} />
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          aria-label="Increase quantity"
                          disabled={item.quantity >= item.stock}
                          onClick={() => changeQuantity(item.id, 1)}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <strong className="cart-line-total">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </strong>
                      <button
                        className="remove-item"
                        aria-label={`Remove ${item.name}`}
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </article>
                  ))
                )}
              </div>

              <label className="discount-field">
                Discount amount (₹)
                <input
                  type="number"
                  min="0"
                  max={subtotal}
                  step="0.01"
                  value={discount}
                  onChange={e => setDiscount(e.target.value)}
                />
              </label>

              <div className="bill-summary">
                <div>
                  <span>Subtotal</span>
                  <strong>₹{subtotal.toFixed(2)}</strong>
                </div>
                <div>
                  <span>Discount</span>
                  <strong>−₹{discountAmount.toFixed(2)}</strong>
                </div>
                <div className="bill-total">
                  <span>Total payable</span>
                  <strong>₹{total.toFixed(2)}</strong>
                </div>
              </div>

              {error && (
                <p role="alert" style={{ color: '#c62828' }}>{error}</p>
              )}
              {notice && (
                <p role="status" style={{ color: '#247a45' }}>{notice}</p>
              )}

              <button
                className="billing-primary full-width"
                disabled={cart.length === 0 || saving || loading}
                onClick={generateBill}
              >
                <ReceiptText size={17} />
                {saving ? 'Saving Sale...' : 'Complete Sale & Save Bill'}
              </button>

              <p className="demo-note">
                Sales are saved to MongoDB and stock is updated by the backend.
              </p>
            </>
          )}

          {bill && notice && (
            <p role="status" style={{ color: '#247a45' }}>{notice}</p>
          )}
          {bill && error && (
            <p role="alert" style={{ color: '#c62828' }}>{error}</p>
          )}
        </section>
      </div>
    </main>
  )
}

export default Billing

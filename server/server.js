
const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Create/open the local database file
const dbPath = path.join(__dirname, "medicare.db");
const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

// Create the medicines table
db.exec(`
  CREATE TABLE IF NOT EXISTS medicines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General',
    manufacturer TEXT NOT NULL DEFAULT '',
    price REAL NOT NULL CHECK (price >= 0),
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    expiry_date TEXT NOT NULL,
    prescription_required INTEGER NOT NULL DEFAULT 0
      CHECK (prescription_required IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

console.log("SQLite database connected successfully");

// Welcome route
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to MediCare API",
    status: "Server is running successfully",
  });
});

// Health-check route
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "MediCare backend is healthy",
    database: "connected",
  });
});

// List all medicines
app.get("/api/medicines", (req, res) => {
  const medicines = db
    .prepare("SELECT * FROM medicines ORDER BY name")
    .all();

  res.json({
    success: true,
    count: medicines.length,
    data: medicines,
  });
});

// Add a medicine
app.post("/api/medicines", (req, res) => {
  const {
    name,
    category = "General",
    manufacturer = "",
    price,
    quantity = 0,
    expiry_date,
    prescription_required = false,
  } = req.body;

  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof expiry_date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(expiry_date) ||
    !Number.isFinite(price) ||
    price < 0 ||
    !Number.isInteger(quantity) ||
    quantity < 0
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Provide a name, valid expiry_date (YYYY-MM-DD), non-negative price, and non-negative integer quantity.",
    });
  }

  const result = db.prepare(`
    INSERT INTO medicines
      (name, category, manufacturer, price, quantity, expiry_date, prescription_required)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    name.trim(),
    category,
    manufacturer,
    price,
    quantity,
    expiry_date,
    prescription_required ? 1 : 0
  );

  const medicine = db
    .prepare("SELECT * FROM medicines WHERE id = ?")
    .get(result.lastInsertRowid);

  res.status(201).json({
    success: true,
    message: "Medicine added successfully",
    data: medicine,
  });
});

// Report low-stock medicines
app.get("/api/medicines/low-stock", (req, res) => {
  const medicines = db
    .prepare("SELECT * FROM medicines WHERE quantity <= 10 ORDER BY quantity")
    .all();

  res.json({
    success: true,
    count: medicines.length,
    data: medicines,
  });
});

// Report expired medicines
app.get("/api/medicines/expired", (req, res) => {
  const today = new Date().toISOString().slice(0, 10);

  const medicines = db
    .prepare("SELECT * FROM medicines WHERE expiry_date < ? ORDER BY expiry_date")
    .all(today);

  res.json({
    success: true,
    count: medicines.length,
    data: medicines,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`MediCare server running at http://localhost:${PORT}`);
});

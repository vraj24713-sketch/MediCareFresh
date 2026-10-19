
const express = require("express");
const cors = require("cors");
const dns = require("node:dns");
require("dotenv").config();

const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 5000;

// Work around the DNS resolver issue encountered on this computer.
dns.setServers(["8.8.8.8", "1.1.1.1"]);

app.use(cors());
app.use(express.json());

// ==================== MEDICINE MODEL ====================

const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, default: "General", trim: true },
    manufacturer: { type: String, default: "", trim: true },
    price: { type: Number, required: true, min: 0 },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      validate: Number.isInteger,
    },
    expiry_date: {
      type: String,
      required: true,
      validate: {
        validator(value) {
          return (
            /^\d{4}-\d{2}-\d{2}$/.test(value) &&
            !Number.isNaN(Date.parse(value)) &&
            new Date(value).toISOString().slice(0, 10) === value
          );
        },
        message: "Provide a valid expiry date in YYYY-MM-DD format.",
      },
    },
    prescription_required: { type: Boolean, default: false },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

const Medicine = mongoose.model("Medicine", medicineSchema);

// ==================== SALES MODEL ====================

const saleItemSchema = new mongoose.Schema(
  {
    medicineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Medicine",
      required: true,
    },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const saleSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    customer: { type: String, default: "Walk-in Customer", trim: true },
    phone: { type: String, default: "", trim: true },
    paymentMethod: {
      type: String,
      enum: ["Cash", "UPI", "Card"],
      default: "Cash",
    },
    items: {
      type: [saleItemSchema],
      required: true,
      validate: {
        validator(items) {
          return items.length > 0;
        },
        message: "A sale must contain at least one item.",
      },
    },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

const Sale = mongoose.model("Sale", saleSchema);

// ==================== VALIDATION HELPERS ====================

function validateMedicine(body) {
  const { name, price, quantity, expiry_date } = body;

  if (typeof name !== "string" || !name.trim()) {
    return "Medicine name is required.";
  }

  if (
    typeof expiry_date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(expiry_date) ||
    Number.isNaN(Date.parse(expiry_date)) ||
    new Date(expiry_date).toISOString().slice(0, 10) !== expiry_date
  ) {
    return "Provide a valid expiry date in YYYY-MM-DD format.";
  }

  if (
    typeof price !== "number" ||
    !Number.isFinite(price) ||
    price < 0
  ) {
    return "Price must be a non-negative number.";
  }

  if (!Number.isInteger(quantity) || quantity < 0) {
    return "Quantity must be a non-negative whole number.";
  }

  return null;
}

function formatMedicine(medicine) {
  if (!medicine) return medicine;

  const item =
    typeof medicine.toObject === "function"
      ? medicine.toObject()
      : medicine;

  return {
    ...item,
    id: String(item._id),
    prescription_required: Boolean(item.prescription_required),
  };
}

function formatSale(sale) {
  const item =
    typeof sale.toObject === "function"
      ? sale.toObject()
      : sale;

  return {
    ...item,
    id: String(item._id),
    number: item.invoiceNumber,
    date: item.createdAt,
    payment: item.paymentMethod,
    items: item.items.map((line) => ({
      ...line,
      id: String(line.medicineId),
      medicineId: String(line.medicineId),
    })),
  };
}

function handleDatabaseError(res, error, message) {
  console.error(message, error.message);

  if (error.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: Object.values(error.errors)
        .map((entry) => entry.message)
        .join(" "),
    });
  }

  return res.status(500).json({
    success: false,
    message,
  });
}

// ==================== GENERAL ROUTES ====================

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to MediCare API",
    status: "Server is running successfully",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "MediCare backend is running",
    database:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",
  });
});

// ==================== MEDICINE ROUTES ====================

// Get all medicines.
app.get("/api/medicines", async (req, res) => {
  try {
    const medicines = await Medicine.find().sort({ name: 1 });
    res.json(medicines.map(formatMedicine));
  } catch (error) {
    handleDatabaseError(res, error, "Could not load medicines.");
  }
});

// Add a medicine.
app.post("/api/medicines", async (req, res) => {
  const error = validateMedicine(req.body);

  if (error) {
    return res.status(400).json({ success: false, message: error });
  }

  try {
    const {
      name,
      category = "General",
      manufacturer = "",
      price,
      quantity,
      expiry_date,
      prescription_required = false,
    } = req.body;

    const medicine = await Medicine.create({
      name: name.trim(),
      category:
        typeof category === "string" && category.trim()
          ? category.trim()
          : "General",
      manufacturer:
        typeof manufacturer === "string" ? manufacturer.trim() : "",
      price,
      quantity,
      expiry_date,
      prescription_required: Boolean(prescription_required),
    });

    res.status(201).json({
      success: true,
      message: "Medicine added successfully.",
      data: formatMedicine(medicine),
    });
  } catch (error) {
    handleDatabaseError(res, error, "Could not add medicine.");
  }
});

// Update a medicine.
app.put("/api/medicines/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid medicine ID.",
    });
  }

  const error = validateMedicine(req.body);

  if (error) {
    return res.status(400).json({ success: false, message: error });
  }

  try {
    const {
      name,
      category = "General",
      manufacturer = "",
      price,
      quantity,
      expiry_date,
      prescription_required = false,
    } = req.body;

    const medicine = await Medicine.findByIdAndUpdate(
      req.params.id,
      {
        name: name.trim(),
        category:
          typeof category === "string" && category.trim()
            ? category.trim()
            : "General",
        manufacturer:
          typeof manufacturer === "string" ? manufacturer.trim() : "",
        price,
        quantity,
        expiry_date,
        prescription_required: Boolean(prescription_required),
      },
      { new: true, runValidators: true }
    );

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: "Medicine not found.",
      });
    }

    res.json({
      success: true,
      message: "Medicine updated successfully.",
      data: formatMedicine(medicine),
    });
  } catch (error) {
    handleDatabaseError(res, error, "Could not update medicine.");
  }
});

// Delete a medicine.
app.delete("/api/medicines/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid medicine ID.",
    });
  }

  try {
    const medicine = await Medicine.findByIdAndDelete(req.params.id);

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: "Medicine not found.",
      });
    }

    res.json({
      success: true,
      message: "Medicine deleted successfully.",
    });
  } catch (error) {
    handleDatabaseError(res, error, "Could not delete medicine.");
  }
});

// Get low-stock medicines.
app.get("/api/medicines/low-stock", async (req, res) => {
  try {
    const medicines = await Medicine.find({
      quantity: { $lte: 10 },
    }).sort({ quantity: 1 });

    res.json({
      success: true,
      count: medicines.length,
      data: medicines.map(formatMedicine),
    });
  } catch (error) {
    handleDatabaseError(res, error, "Could not load low-stock medicines.");
  }
});

// Get expired medicines.
app.get("/api/medicines/expired", async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const medicines = await Medicine.find({
      expiry_date: { $lt: today },
    }).sort({ expiry_date: 1 });

    res.json({
      success: true,
      count: medicines.length,
      data: medicines.map(formatMedicine),
    });
  } catch (error) {
    handleDatabaseError(res, error, "Could not load expired medicines.");
  }
});

// ==================== SALES ROUTES ====================

// Create a sale, validate stock, reduce inventory, and save the invoice.
// Stock updates and invoice creation are performed in one transaction.
app.post("/api/sales", async (req, res) => {
  const {
    customer = "",
    phone = "",
    paymentMethod = "Cash",
    items,
    discount = 0,
  } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Add at least one medicine to the bill.",
    });
  }

  if (!["Cash", "UPI", "Card"].includes(paymentMethod)) {
    return res.status(400).json({
      success: false,
      message: "Payment method must be Cash, UPI, or Card.",
    });
  }

  if (
    typeof discount !== "number" ||
    !Number.isFinite(discount) ||
    discount < 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Discount must be a non-negative number.",
    });
  }

  // Combine repeated medicine IDs before checking stock.
  const quantities = new Map();

  for (const item of items) {
    const medicineId = item.medicineId || item.id;

    if (
      !mongoose.isValidObjectId(medicineId) ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Each item needs a valid medicine ID and positive whole-number quantity.",
      });
    }

    const key = String(medicineId);
    quantities.set(key, (quantities.get(key) || 0) + item.quantity);
  }

  let session;

  try {
    session = await mongoose.startSession();

    let savedSale;

    await session.withTransaction(async () => {
      const invoiceItems = [];
      let subtotal = 0;

      for (const [medicineId, quantity] of quantities.entries()) {
        // Atomic conditional decrement: cannot reduce stock below zero.
        const medicine = await Medicine.findOneAndUpdate(
          {
            _id: medicineId,
            quantity: { $gte: quantity },
          },
          {
            $inc: { quantity: -quantity },
          },
          {
            new: true,
            session,
          }
        );

        if (!medicine) {
          const exists = await Medicine.exists({ _id: medicineId }).session(
            session
          );

          if (!exists) {
            throw new Error(`Medicine not found: ${medicineId}`);
          }

          throw new Error(
            `Insufficient stock for ${exists.name || medicineId}. Please refresh inventory and try again.`
          );
        }

        if (medicine.expiry_date < new Date().toISOString().slice(0, 10)) {
          throw new Error(
            `${medicine.name} is expired and cannot be sold.`
          );
        }

        const lineTotal = Number(
          (medicine.price * quantity).toFixed(2)
        );

        subtotal = Number((subtotal + lineTotal).toFixed(2));

        invoiceItems.push({
          medicineId: medicine._id,
          name: medicine.name,
          price: medicine.price,
          quantity,
          lineTotal,
        });
      }

      if (discount > subtotal) {
        throw new Error("Discount cannot exceed the bill subtotal.");
      }

      const total = Number((subtotal - discount).toFixed(2));

      const invoiceNumber =
        `MC-${Date.now()}-${Math.floor(Math.random() * 10000)
          .toString()
          .padStart(4, "0")}`;

      const created = await Sale.create(
        [
          {
            invoiceNumber,
            customer:
              typeof customer === "string" && customer.trim()
                ? customer.trim()
                : "Walk-in Customer",
            phone: typeof phone === "string" ? phone.trim() : "",
            paymentMethod,
            items: invoiceItems,
            subtotal,
            discount,
            total,
          },
        ],
        { session }
      );

      savedSale = created[0];
    });

    res.status(201).json({
      success: true,
      message: "Sale completed and inventory updated successfully.",
      data: formatSale(savedSale),
    });
  } catch (error) {
    const clientErrorMessages = [
      "Insufficient stock",
      "Medicine not found",
      "is expired and cannot be sold",
      "Discount cannot exceed",
    ];

    if (clientErrorMessages.some((message) => error.message.includes(message))) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Could not complete sale:", error.message);

    res.status(500).json({
      success: false,
      message:
        "Could not complete the sale. No sale should be recorded unless the transaction succeeds.",
    });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
});

// Get sales history, newest first.
app.get("/api/sales", async (req, res) => {
  try {
    const sales = await Sale.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      count: sales.length,
      data: sales.map(formatSale),
    });
  } catch (error) {
    handleDatabaseError(res, error, "Could not load sales history.");
  }
});

// Get one invoice.
app.get("/api/sales/:id", async (req, res) => {
  const id = req.params.id;

  try {
    let sale;

    if (mongoose.isValidObjectId(id)) {
      sale = await Sale.findById(id);
    }

    if (!sale) {
      sale = await Sale.findOne({ invoiceNumber: id });
    }

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found.",
      });
    }

    res.json({
      success: true,
      data: formatSale(sale),
    });
  } catch (error) {
    handleDatabaseError(res, error, "Could not load invoice.");
  }
});

// ==================== START SERVER ====================

async function startServer() {
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is missing from the server/.env file.");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
    });

    console.log(
      `MongoDB Atlas connected. Database: ${mongoose.connection.name}`
    );

    app.listen(PORT, () => {
      console.log(`MediCare server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

startServer();

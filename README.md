
# MediCare — Smart Medical Store Management System

MediCare is a full-stack web application designed to simplify medical store operations. It helps manage medicine inventory, process customer purchases, track stock levels, and maintain sales records using a centralized database.

## Problem Statement

Traditional medical store management can involve manual stock tracking, time-consuming billing, difficulty monitoring medicine expiry dates, and errors in maintaining sales records.

MediCare aims to reduce these problems through a digital inventory and billing system.

## Objectives

- Digitize medicine inventory management.
- Simplify medicine billing and invoice generation.
- Automatically update stock after successful sales.
- Prevent sales when stock is insufficient.
- Maintain persistent sales records.
- Identify low-stock and expired medicines.

## Features

### 1. Medicine Inventory
- Add, view, update, and delete medicine records.
- Retrieve medicine information from MongoDB Atlas.
- Track available stock and medicine details.

### 2. Billing and Sales
- Select medicines and quantities for a purchase.
- Calculate totals and apply discounts.
- Generate invoices.
- Support Cash, UPI, and Card payment methods.
- Validate stock availability before completing sales.
- Automatically reduce stock after a successful sale.

### 3. Sales History
- View saved sales and invoices.
- Search sales records.
- Filter transactions by payment method.
- View individual invoice details.

### 4. Stock and Expiry Alerts
- Identify low-stock medicines.
- Identify expired medicines.

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React |
| Development server and build tool | Vite |
| Styling | CSS |
| Icons | Lucide React |
| Backend | Node.js |
| API framework | Express.js |
| Database | MongoDB Atlas |
| Database integration | Mongoose |
| Environment configuration | dotenv |
| Cross-origin requests | CORS |
| Development utility | Nodemon |
| Version control | Git and GitHub |

## System Architecture

```text
User
  |
  v
React Frontend (Vite)
  |
  | HTTP API Requests
  v
Express.js Backend
  |
  | Mongoose
  v
MongoDB Atlas
  |
  v
Medicine Inventory and Sales Records
```

## Project Structure

```text
MediCareFresh/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── Alerts.jsx
│   │   ├── Alerts.css
│   │   ├── Billing.jsx
│   │   ├── Billing.css
│   │   ├── SalesHistory.jsx
│   │   ├── SalesHistory.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── server.js
│   ├── package.json
│   └── .env
├── .gitignore
└── README.md
```

## Requirements

- Node.js and npm
- A MongoDB Atlas account
- A web browser
- Visual Studio Code or another code editor

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/vraj24713-sketch/MediCareFresh.git
cd MediCareFresh
```

### 2. Configure the backend

```bash
cd server
npm install
```

Create a `.env` file inside the `server` directory:

```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
```

Replace the placeholder with your own MongoDB Atlas connection string. Never commit real credentials to GitHub.

### 3. Start the backend

From the `server` directory, run:

```bash
npm run dev
```

The backend should run at:

`http://localhost:5000`

### 4. Start the frontend

Open a second terminal:

```bash
cd client
npm install
npm run dev
```

Open the local URL displayed by Vite in your terminal.

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check backend and database status |
| GET | `/api/medicines` | Retrieve medicines |
| POST | `/api/medicines` | Add a medicine |
| PUT | `/api/medicines/:id` | Update a medicine |
| DELETE | `/api/medicines/:id` | Delete a medicine |
| GET | `/api/medicines/low-stock` | Retrieve low-stock medicines |
| GET | `/api/medicines/expired` | Retrieve expired medicines |
| GET | `/api/sales` | Retrieve sales history |
| POST | `/api/sales` | Create a sale |
| GET | `/api/sales/:id` | Retrieve a sale by ID or invoice number |

## Testing

The following workflows have been manually tested during development:

- Adding a test medicine through the inventory interface.
- Creating a sale and displaying the invoice.
- Reducing inventory after a successful sale.
- Refreshing sales history and confirming saved records persist.
- Blocking a sale when the requested quantity exceeds available stock.
- Building the frontend successfully using `npm run build`.
- Checking backend JavaScript syntax using `node --check server.js`.

## Future Enhancements

- User authentication and role-based access for administrators, staff, and customers.
- Supplier and purchase management.
- Barcode scanning.
- PDF invoice downloads.
- Dashboard analytics and reports.
- Automated notifications for low stock and approaching expiry dates.
- Deployment to a production hosting platform.

## Academic Project

**Project:** MediCare — Smart Medical Store Management System  
**Subject:** Full Stack Development  
**Purpose:** Academic mini project

---

MediCare demonstrates how full-stack web technologies can be combined to digitize inventory management, billing, and sales recordkeeping for a medical store.

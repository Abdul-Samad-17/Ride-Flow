# 🚗 RideFlow — Premium Ride-Hailing Platform

> **A full-stack ride-hailing web application** built with the MERN stack (MySQL edition), featuring real-time ride tracking, Google Maps integration, role-based dashboards, atomic payment processing, and a complete MySQL backend demonstrating advanced database concepts.

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Live Demo](#-live-demo)
- [Tech Stack](#-tech-stack)
- [Features](#-features)
- [Database Schema](#-database-schema)
- [Database Concepts Implemented](#-database-concepts-implemented)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Role-Based Access](#-role-based-access)
- [Deployment](#-deployment)
- [Screenshots](#-screenshots)
- [Authors](#-authors)

---

## 🌐 Overview

**RideFlow** is a production-grade ride-hailing platform inspired by Uber, Careem, and InDrive. It manages the entire lifecycle of a trip — from a rider requesting a ride, to driver matching using real GPS coordinates, live route tracking, fare calculation via a MySQL stored procedure, atomic wallet-based payment processing, and post-trip mutual ratings.

The project is built as a **Database Systems Lab semester project** with a focus on demonstrating advanced MySQL concepts (stored procedures, triggers, views, indexes, DCL) through real-world functionality rather than isolated scripts.

---

## 🔗 Live Demo

| Service | URL |
|---|---|
| **Frontend** | [https://rideflow.vercel.app](https://ride--flow.vercel.app) |
| **Backend API** | [https://rideflow-backend.onrender.com](https://rideflow-backend.onrender.com) |

> **Note:** The backend is hosted on Render's free tier and may take ~30 seconds to wake up after inactivity.

---

## 🛠 Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18 | UI framework |
| Vite | 5 | Build tool |
| Tailwind CSS | 3 | Utility-first styling |
| Framer Motion | 11 | Animations and transitions |
| GSAP | 3.12 | Scroll-based animations |
| Zustand | 4 | Global state management |
| Axios | 1 | HTTP client with interceptors |
| Recharts | 2 | Analytics charts and graphs |
| Lucide React | latest | Icon system |
| @vis.gl/react-google-maps | latest | Maps, routing, autocomplete |
| React Router DOM | 6 | Client-side routing |
| React Hot Toast | latest | Notification toasts |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | 20 | Runtime |
| Express.js | 4 | Web framework |
| mysql2/promise | 3 | MySQL driver with async/await |
| bcrypt | 5 | Password hashing (12 rounds) |
| jsonwebtoken | 9 | Access + refresh token auth |
| Joi | 17 | Request validation schemas |
| Multer | 1 | File upload handling |
| Cloudinary | 2 | Profile photo storage |
| @googlemaps/google-maps-services-js | 3 | Server-side Geocoding + Distance Matrix |
| helmet | 7 | HTTP security headers |
| express-rate-limit | 7 | Route-level rate limiting |
| dotenv | 16 | Environment variable management |

### Database & Infrastructure
| Technology | Purpose |
|---|---|
| MySQL 8 | Primary relational database |
| Railway | Cloud MySQL hosting |
| Render | Backend hosting |
| Vercel | Frontend hosting |
| Cloudinary | Media storage |
| Google Maps Platform | Geocoding, Distance Matrix, Maps JS, Places Autocomplete |

---

## ✨ Features

### 🧑‍💼 User Management
- Role-based registration — **Rider**, **Driver**, and **Admin**
- JWT authentication with **access token + refresh token** strategy
- Silent token refresh via Axios interceptor (user never sees expiry)
- Account status management — Active / Suspended / Banned
- Profile photo upload via Cloudinary with face-crop transformation
- Password change with bcrypt re-hashing and forced re-login

### 🚕 Ride Lifecycle (Hierarchical Approval System)
Full 6-stage ride status progression:

```
Requested → Accepted → Driver En Route → Arrived at Pickup → In Progress → Completed
```

- **Wallet pre-check** before ride request — rejects booking if balance insufficient
- **Coordinate-based driver matching** using the Haversine formula in SQL
- **Automated surge pricing** — triggers when demand/supply ratio exceeds 2.0x
- Driver confirms arrival within **500m** of pickup (GPS validation)
- Driver starts ride — trip timer begins, fare locks
- Driver confirms destination within **300m** of dropoff
- **Real distance and duration** fetched from Google Distance Matrix API (with live traffic)
- Fare calculated by MySQL **stored procedure** using actual trip data

### 💳 Payment System
- **Atomic MySQL transaction** — rider wallet debit + driver wallet credit happen together or not at all
- Promo code validation (expiry, usage limit, minimum fare, discount type)
- Commission deduction per vehicle type (configurable via Admin)
- Full wallet transaction ledger for both riders and drivers
- Driver payout request system with Admin approval flow
- Idempotency check — prevents double-payment on duplicate requests

### ⭐ Ratings & Reviews
- Mutual rating system — rider rates driver, driver rates rider
- **Payment gate** — rider cannot rate until payment is confirmed
- One rating per side per ride (DB constraint + controller validation)
- Automatic `avg_rating` recalculation via MySQL **trigger**
- Driver auto-flagged if average drops below 3.5 stars
- Star breakdown display (5★ distribution bars)

### 🗺️ Google Maps Integration
- **Places Autocomplete** — address inputs with Pakistan-biased suggestions
- **Geocoding API** (server-side) — converts addresses to coordinates for storage
- **Distance Matrix API** (server-side, with live traffic) — real km and minutes
- **Live map** — dark-themed, shows driver marker, pickup/dropoff pins, amber route polyline
- Driver location tracked via browser Geolocation API, sent to backend every 10 seconds
- Map bounds auto-fit to show all relevant markers

### 🛡️ Admin Panel
- User management — suspend, ban, activate with reason logging
- Vehicle verification — approve or reject driver vehicles
- Fare configuration — edit base rate, per-km rate, per-minute rate, surge multiplier per vehicle type
- **7 live report types** with Recharts visualizations and CSV export
- Admin activity log — every admin action recorded in `Admin_Log`
- KPI overview — 9 real-time metrics with count-up animations

### 🎨 UI/UX
- **Dark Luxury Automotive** design system — amber `#F5A623` on near-black `#050508`
- Three-level glassmorphism card system with backdrop-filter blur
- Framer Motion animations — page transitions, card entrances, hover micro-interactions
- GSAP ScrollTrigger scaffold — ready for Three.js 3D car scene
- Fully responsive — mobile bottom tab bar, drawer sidebar, bottom sheet modals
- Amber-tinted skeleton loaders, empty states, and error states throughout

---

## 🗄️ Database Schema

The database `RideFlowDB` contains **12 tables**:

| Table | Purpose |
|---|---|
| `User` | All users — Riders, Drivers, Admins |
| `Driver` | Driver-specific profile extending User |
| `Vehicle` | Vehicles registered by drivers |
| `Ride` | Core ride records with full coordinate data |
| `Ride_History` | Archived completed/cancelled rides |
| `Payment` | Payment records per ride |
| `Rating` | Mutual post-ride ratings |
| `Wallet` | Driver earnings wallet |
| `Rider_Wallet` | Rider balance for in-app payments |
| `Wallet_Transaction` | Full ledger for all wallet movements |
| `Promo_Code` | Discount codes with usage tracking |
| `Payout_Request` | Driver payout requests to admin |
| `Fare_Config` | Configurable rates per vehicle type |
| `Admin_Log` | Audit trail of all admin actions |

### Key Constraints
- `NOT NULL`, `UNIQUE`, `CHECK`, `DEFAULT` on all critical columns
- `FOREIGN KEY` with `ON DELETE CASCADE` on dependent tables
- `ENUM` types for all status and role fields
- Coordinate columns: `DECIMAL(10,8)` for latitude, `DECIMAL(11,8)` for longitude

---

## 📚 Database Concepts Implemented

### 1. Basic SQL
```sql
-- Completed rides for a specific rider ordered by date
SELECT * FROM Ride
WHERE rider_id = ? AND status = 'Completed'
ORDER BY end_time DESC;

-- All drivers in a city ordered by rating
SELECT * FROM Driver d
JOIN User u ON d.driver_id = u.user_id
WHERE d.current_city = ?
ORDER BY d.avg_rating DESC;
```

### 2. Aggregate Functions & HAVING
```sql
-- Total revenue per city
SELECT pickup_city, SUM(p.amount) AS total_revenue
FROM Payment p JOIN Ride r ON p.ride_id = r.ride_id
WHERE p.payment_status = 'Paid'
GROUP BY pickup_city
ORDER BY total_revenue DESC;

-- Low-rated drivers (HAVING clause)
SELECT d.driver_id, AVG(score) AS avg_rating
FROM Rating r JOIN Driver d ON r.rated_user_id = d.driver_id
WHERE r.rated_by = 'Rider'
GROUP BY d.driver_id
HAVING AVG(score) < 3.5;
```

### 3. Joins
```sql
-- INNER JOIN: Full trip report
SELECT r.ride_id, ru.full_name AS rider, du.full_name AS driver,
       v.license_plate, v.vehicle_type, r.fare
FROM Ride r
INNER JOIN User ru ON r.rider_id = ru.user_id
INNER JOIN Driver d ON r.driver_id = d.driver_id
INNER JOIN User du ON d.driver_id = du.user_id
INNER JOIN Vehicle v ON r.vehicle_id = v.vehicle_id;

-- LEFT JOIN: All riders including those with no rides
SELECT u.full_name, COUNT(r.ride_id) AS total_rides
FROM User u
LEFT JOIN Ride r ON r.rider_id = u.user_id
WHERE u.role = 'Rider'
GROUP BY u.user_id;
```

### 4. Views
```sql
-- ActiveRidesView: all ongoing trips with full details
CREATE VIEW ActiveRidesView AS
SELECT r.ride_id, r.status, ru.full_name AS rider_name,
       du.full_name AS driver_name, d.avg_rating,
       v.make, v.model, v.license_plate
FROM Ride r
JOIN User ru ON r.rider_id = ru.user_id
JOIN Driver d ON r.driver_id = d.driver_id
JOIN User du ON d.driver_id = du.user_id
JOIN Vehicle v ON r.vehicle_id = v.vehicle_id
WHERE r.status IN ('Accepted', 'Driver En Route', 'In Progress');

-- TopDriversView: only verified drivers rated above 4.5
CREATE VIEW TopDriversView AS
SELECT d.driver_id, u.full_name, d.avg_rating, d.total_trips
FROM Driver d JOIN User u ON d.driver_id = u.user_id
WHERE d.avg_rating >= 4.5
  AND d.verification_status = 'Verified'
  AND u.account_status = 'Active'
ORDER BY d.avg_rating DESC;
```

### 5. Stored Procedure
```sql
-- CalculateFare: computes fare from actual trip data
CREATE PROCEDURE CalculateFare(
  IN p_distance_km DECIMAL(8,2),
  IN p_duration_minutes INT,
  IN p_vehicle_type ENUM('Economy','Premium','Bike'),
  IN p_is_surge BOOLEAN,
  OUT p_fare DECIMAL(10,2)
)
BEGIN
  -- Fetches rates from Fare_Config, applies formula, applies surge
  -- fare = base_rate + (per_km × distance) + (per_min × duration)
  -- if surge: fare = fare × surge_multiplier
END;
```

### 6. Triggers
```sql
-- Trigger 1: Auto-archive ride and increment driver trip count
CREATE TRIGGER after_ride_completed
AFTER UPDATE ON Ride FOR EACH ROW ...

-- Trigger 2: Recalculate avg_rating, flag driver if below 3.5
CREATE TRIGGER after_rating_inserted
AFTER INSERT ON Rating FOR EACH ROW ...

-- Trigger 3: Increment promo usage count on paid payment
CREATE TRIGGER after_payment_paid_promo
AFTER UPDATE ON Payment FOR EACH ROW ...
```

### 7. MySQL Event Scheduler
```sql
-- Expires promo codes automatically every night at midnight
CREATE EVENT expire_promo_codes
ON SCHEDULE EVERY 1 DAY
STARTS (TIMESTAMP(CURDATE()) + INTERVAL 1 DAY)
DO UPDATE Promo_Code
   SET is_active = FALSE
   WHERE expiry_date < CURDATE() AND is_active = TRUE;
```

### 8. DCL — Role-Based Access Control
```sql
CREATE ROLE 'rideflow_rider_role';
CREATE ROLE 'rideflow_driver_role';
CREATE ROLE 'rideflow_support_role';
CREATE ROLE 'rideflow_admin_role';

GRANT SELECT, INSERT ON RideFlowDB.Ride TO 'rideflow_rider_role';
GRANT SELECT, INSERT ON RideFlowDB.Payment TO 'rideflow_rider_role';
GRANT SELECT, UPDATE ON RideFlowDB.Ride TO 'rideflow_driver_role';
GRANT SELECT ON RideFlowDB.* TO 'rideflow_support_role';
REVOKE DELETE ON RideFlowDB.Ride FROM 'rideflow_support_role';
GRANT ALL PRIVILEGES ON RideFlowDB.* TO 'rideflow_admin_role';
```

### 9. Indexes
```sql
CREATE INDEX idx_ride_rider_id ON Ride(rider_id);
CREATE INDEX idx_ride_driver_id ON Ride(driver_id);
CREATE INDEX idx_ride_status ON Ride(status);
CREATE INDEX idx_ride_city ON Ride(pickup_city);
CREATE INDEX idx_driver_availability ON Driver(availability_status);
CREATE INDEX idx_driver_location ON Driver(latitude, longitude);
CREATE INDEX idx_vehicle_type_status ON Vehicle(vehicle_type, verification_status);
CREATE INDEX idx_rating_driver ON Rating(rated_user_id);
```

---

## 📁 Project Structure

```
RideFlow/
├── rideflow-backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.config.js          # MySQL pool configuration
│   │   ├── controllers/
│   │   │   ├── auth.controller.js    # Register, login, logout, refresh
│   │   │   ├── ride.controller.js    # Full ride lifecycle
│   │   │   ├── driver.controller.js  # Availability, profile, stats
│   │   │   ├── vehicle.controller.js # Add vehicle, admin verify
│   │   │   ├── payment.controller.js # Atomic payment processing
│   │   │   ├── wallet.controller.js  # Top-up, payout, transactions
│   │   │   ├── rating.controller.js  # Submit and fetch ratings
│   │   │   ├── promo.controller.js   # Promo CRUD and validation
│   │   │   └── admin.controller.js   # Reports, user management
│   │   ├── db/
│   │   │   ├── index.js              # MySQL connection pool
│   │   │   └── setup.js             # Views, triggers, indexes on startup
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.js    # verifyJWT, authorizeRoles
│   │   │   ├── validate.middleware.js# Joi schema validation
│   │   │   └── multer.middleware.js  # File upload config
│   │   ├── models/                   # Raw SQL query functions (no ORM)
│   │   ├── routes/                   # Express routers per domain
│   │   ├── sql/
│   │   │   ├── views.sql            # ActiveRidesView, TopDriversView
│   │   │   ├── indexes.sql          # All 9 indexes
│   │   │   ├── stored_procedures.sql# CalculateFare procedure
│   │   │   ├── triggers.sql         # All 3 triggers
│   │   │   ├── events.sql           # Promo expiry event
│   │   │   └── dcl.sql             # GRANT/REVOKE statements
│   │   ├── utils/
│   │   │   ├── ApiError.js          # Standardized error class
│   │   │   ├── ApiResponse.js       # Standardized response class
│   │   │   ├── asyncHandler.js      # Async error wrapper
│   │   │   ├── googleMapsService.js # Geocoding + Distance Matrix
│   │   │   ├── tokenUtils.js        # JWT generation and verification
│   │   │   ├── promoUtils.js        # Shared promo validation logic
│   │   │   └── cloudinary.js        # Cloudinary upload config
│   │   ├── app.js                   # Express app, CORS, middleware
│   │   └── index.js                 # Entry point, DB connection
│   ├── .env.example
│   └── package.json
│
└── rideflow-frontend/
    ├── src/
    │   ├── components/
    │   │   ├── ui/                  # Button, GlassCard, Input, Badge, Modal
    │   │   ├── layout/              # Navbar, Sidebar, DashboardLayout, BottomTabBar
    │   │   ├── maps/                # RideMap, AddressAutocomplete, RoutePolyline
    │   │   ├── landing/             # HeroSection, HowItWorks, VehicleTypes, Footer
    │   │   ├── rider/               # BookRideForm, ActiveRideTracker, WalletPanel
    │   │   ├── driver/              # AvailabilityToggle, ActiveRidePanel, EarningsChart
    │   │   └── admin/               # KPIGrid, DataTable, ReportCard, PromoModal
    │   ├── pages/
    │   │   ├── Landing.jsx
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── rider/RiderDashboard.jsx
    │   │   ├── driver/DriverDashboard.jsx
    │   │   └── admin/AdminDashboard.jsx
    │   ├── services/                # Axios service files per domain
    │   ├── store/                   # Zustand — authStore, rideStore
    │   ├── hooks/                   # useApi, useWindowSize, useIsMobile
    │   ├── utils/                   # formatCurrency, formatDate, exportCSV
    │   ├── styles/
    │   │   ├── globals.css          # CSS variables, glass utilities
    │   │   └── animations.css       # Keyframe definitions
    │   └── App.jsx                  # Routes + ProtectedRoute
    ├── vercel.json                  # SPA rewrite rules
    ├── .env.example
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js v20 or above
- MySQL 8.0 or above
- A Google Cloud project with these APIs enabled:
  - Maps JavaScript API
  - Geocoding API
  - Distance Matrix API
- A Cloudinary account (free tier works)

---

### Backend Setup

**1. Clone the repository**
```bash
git clone https://github.com/Abdul-Samad-17/Ride-Flow.git
cd Ride-Flow/rideflow-backend
```

**2. Install dependencies**
```bash
npm install
```

**3. Set up environment variables**
```bash
cp .env.example .env
# Fill in all values in .env (see Environment Variables section below)
```

**4. Create the database**
```bash
mysql -u root -p
```
```sql
CREATE DATABASE RideFlowDB;
EXIT;
```

**5. Run the SQL schema**
```bash
mysql -u root -p RideFlowDB < ../rideflow_DB.sql
```

**6. Start the server**
```bash
npm run dev
```

The backend will:
- Connect to MySQL and test the connection
- Automatically create views, indexes, triggers, stored procedure, and events
- Apply DCL roles and permissions
- Start listening on `http://localhost:8000`

---

### Frontend Setup

**1. Navigate to frontend**
```bash
cd ../rideflow-frontend
```

**2. Install dependencies**
```bash
npm install
```

**3. Set up environment variables**
```bash
cp .env.example .env
# Fill in VITE_API_BASE_URL and VITE_GOOGLE_MAPS_API_KEY
```

**4. Start development server**
```bash
npm run dev
```

Frontend runs on `http://localhost:5173`

---

## 🔐 Environment Variables

### Backend — `.env`

```env
# Server
PORT=8000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# MySQL Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=RideFlowDB
DB_CONNECTION_LIMIT=10

# JWT
ACCESS_TOKEN_SECRET=your_strong_64_char_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_strong_64_char_secret
REFRESH_TOKEN_EXPIRY=10d

# Google Maps (server-side key — restrict to your server IP)
GOOGLE_MAPS_API_KEY=your_server_side_key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Frontend — `.env`

```env
# Backend URL
VITE_API_BASE_URL=http://localhost:8000/api/v1

# Google Maps (browser key — restrict to HTTP referrers)
VITE_GOOGLE_MAPS_API_KEY=your_browser_key
```

> ⚠️ **Security:** Use two separate Google Maps API keys. The server-side key (Geocoding + Distance Matrix) must be restricted to your server's IP. The browser key (Maps JS) must be restricted to your domain's HTTP referrer.

---

## 📡 API Reference

All endpoints are prefixed with `/api/v1`

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | None | Register Rider or Driver |
| `POST` | `/auth/login` | None | Login, returns tokens in cookies |
| `POST` | `/auth/logout` | ✅ | Clear tokens and session |
| `POST` | `/auth/refresh-token` | None | Refresh access token silently |
| `GET` | `/auth/me` | ✅ | Get current user data |
| `PATCH` | `/auth/profile` | ✅ | Update name and phone |
| `POST` | `/auth/profile/photo` | ✅ | Upload profile photo |
| `PATCH` | `/auth/password` | ✅ | Change password |

### Rides
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/rides/estimate` | Rider | Get fare estimate with real distance |
| `POST` | `/rides/request` | Rider | Request a ride (wallet pre-checked) |
| `GET` | `/rides/active` | Rider/Driver | Get current active ride |
| `GET` | `/rides/history` | Rider | Paginated ride history |
| `PATCH` | `/rides/:id/arrive` | Driver | Confirm arrival at pickup |
| `PATCH` | `/rides/:id/start` | Driver | Start the ride |
| `PATCH` | `/rides/:id/destination-reached` | Driver | Confirm destination arrival |
| `PATCH` | `/rides/:id/cancel` | Rider/Driver | Cancel ride (status-dependent) |

### Payments & Wallet
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/payments/process-ride/:rideId` | Rider | Atomic ride payment |
| `GET` | `/payments/my` | Rider | Payment history with JOIN |
| `GET` | `/wallet/balance` | Rider/Driver | Current wallet balance |
| `POST` | `/wallet/topup` | Rider | Add funds to rider wallet |
| `GET` | `/wallet/transactions` | Rider/Driver | Full transaction ledger |
| `POST` | `/wallet/payout` | Driver | Request earnings payout |

### Admin
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/admin/overview` | Admin | 9 KPI metrics in one query |
| `GET` | `/admin/users` | Admin | Paginated, filterable user list |
| `PATCH` | `/admin/users/:id/status` | Admin | Suspend / Ban / Activate user |
| `GET` | `/admin/vehicles/pending` | Admin | Vehicles awaiting verification |
| `PATCH` | `/admin/vehicles/:id/verify` | Admin | Approve or reject vehicle |
| `GET` | `/admin/fare-config` | Admin | Get all fare configurations |
| `PATCH` | `/admin/fare-config/:type` | Admin | Update fare rates |
| `GET` | `/admin/reports/revenue/by-city` | Admin | SUM revenue grouped by city |
| `GET` | `/admin/reports/drivers/low-rated` | Admin | HAVING AVG < 3.5 report |
| `GET` | `/admin/reports/trips/full` | Admin | Full INNER JOIN trip report |

---

## 👥 Role-Based Access

| Feature | Rider | Driver | Admin |
|---|---|---|---|
| Book a ride | ✅ | ❌ | ❌ |
| Request ride (wallet checked) | ✅ | ❌ | ❌ |
| Toggle online/offline | ❌ | ✅ | ❌ |
| Confirm arrival / start / complete | ❌ | ✅ | ❌ |
| Pay for ride | ✅ | ❌ | ❌ |
| Top up wallet | ✅ | ❌ | ❌ |
| Request payout | ❌ | ✅ | ❌ |
| Approve payouts | ❌ | ❌ | ✅ |
| Verify vehicles | ❌ | ❌ | ✅ |
| Suspend / ban users | ❌ | ❌ | ✅ |
| Configure fare rates | ❌ | ❌ | ✅ |
| View all reports | ❌ | ❌ | ✅ |
| Rate after ride | ✅ | ✅ | ❌ |

---

## ☁️ Deployment

### Backend → Render

1. Push backend to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your repository
4. Set:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Add all environment variables from the backend `.env`
6. Deploy

### Database → Railway

1. Go to [railway.app](https://railway.app) → New Project → MySQL
2. Copy the connection credentials into your Render environment variables
3. Connect to Railway MySQL shell and run `rideflow_DB.sql`

### Frontend → Vercel

1. Push frontend to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project
3. Import repository — Vercel auto-detects Vite
4. Add environment variables (`VITE_API_BASE_URL`, `VITE_GOOGLE_MAPS_API_KEY`)
5. Ensure `vercel.json` exists at the frontend root:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```
6. Deploy

---

## 🧑‍💻 Authors

**Abdul Samad**
- GitHub: [@Abdul-Samad-17](https://github.com/Abdul-Samad-17)

---

## 📄 License

This project was developed as a **Database Systems Lab semester project** at university (Spring 2026). It is intended for educational purposes.

---

<div align="center">

**Built with ❤️ in Pakistan 🇵🇰**

*RideFlow — Arrive in Your Element*

</div>

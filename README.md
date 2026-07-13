# Ship Happens 

An enterprise-grade, full-stack Transport Operations & Logistics Management Platform designed for seamless supply chain tracking, role-based fleet orchestration, real-time routing simulations, and dynamic document generation.

Designed for high-reliability dispatcher workflows, fleet owners, contracted drivers, and enterprise retail clients.

---

## Design Vision & Theme Hierarchy

"Ship Happens" bridges heavy-duty utility with modern, responsive high-contrast aesthetics:
- **Light Theme**: Clean, industrial, high-contrast layouts. Features soft off-whites (`#F6F5F0`), crisp borders, and bold slate typography coupled with our primary energetic red accent (`#EF233C`).
- **Dark Theme (Premium Surface Layout)**: Modelled after dark enterprise consoles like GitHub Dark and Linear. Rather than flat, inverted colors, it uses tiered, layered surfaces (`#0B0F19` deep space background, `#121824` elegant elevated cards, and `#0C101A` embedded inset inputs) to maintain perfect spatial awareness, reduce visual fatigue, and highlight critical logistical alerts without unnecessary brightness.

---

##  Key Architectural Highlights

- **Multi-Role Orchestration**: Tailored interfaces for `ADMIN`, `DISPATCHER`, `DRIVER`, and `CLIENT` users with secure state propagation.
- **Vite & React 19 Frontend**: Lightning-fast visual response times, reactive routing state managers, and fluid transition orchestration powered by `motion` (Motion for React).
- **Embedded Express Backend Services**: Custom server layer (`server.ts`) managing mock-persistent states, trip scheduling API routes, driver availability, and server-side document indexing.
- **Map & Asset Visualizer**: Custom HUD-style nighttime map overlays, real-time vehicle vitals monitoring (engine health, battery diagnostics, tire pressure, and fuel efficiencies), and live-updating route progression bars.
- **Enterprise Ledger Controls**: Integrated document tracking including automated invoice numbering, Lorry Receipts (LR), Proof of Delivery (POD) IDs, and Toll/Fuel expense logging.

---

##  Core Personas & Workspace Flows

### 1.  Vikram Malhotra (Admin Workspace)
- **Logistics Oversight**: Consolidated metrics for active fleet utilization, total operational costs, driver performance indices, and pending maintenance schedules.
- **Financial Analytics**: High-fidelity charts for tracking transport expenses across fuel, toll gates, and vehicle upkeep.
- **Dynamic Fleet Controls**: Ability to CRUD vehicle assets and schedule proactive maintenance cycles before failures occur.

### 2. Neha Sharma (Dispatcher Control Tower)
- **Dispatch Hub**: Instant cross-matching of active bookings, ready drivers, and vacant multi-ton commercial vehicles.
- **Interactive Map HUD**: Monitor shipment steps (Booked  In Transit  Out For Delivery  Delivered) and update live driver-route attachments.
- **Consolidated Ledgers**: Search, filter, and issue Lorry Receipts (LR) instantly to client accounts.

### 3.  Rajesh Yadav & Contract Drivers (Driver Workspace)
- **Active Navigation Assistance**: Dedicated route guidelines, remaining distance indicators, and live turn-by-turn simulation logs.
- **Safety Rating Center**: Visibility into safety ratings (e.g. `92% Level-A`) and trip counts to incentivize cautious commercial driving.
- **Trip Status Broadcaster**: Simple trigger buttons to mark pickup completion, report delay exceptions, or confirm final handovers.

### 4.  Arjun Mehta (Enterprise Client Dashboard)
- **Shipment Tracker**: Search live status histories, ETA indicators, and driver-contact details.
- **Downloadable Receipts**: Clean, downloadable and printable digital Lorry Receipts (LRs) featuring official transit timestamps, booking stamps, and itemized freight weight calculations.

---

##  Project Structure

```bash
 server.ts                 # Full-stack Express server with integrated API endpoints
 vite.config.ts            # Vite bundler, plugin settings, and server middleware configs
 package.json              # App dependencies, tsx runner, and custom CJS build scripts
 src
    App.tsx               # Main routing router and auth context broadcaster
    main.tsx              # React mounting root entrypoint
    types.ts              # Strongly-typed logistics, user, and ledger interfaces
    index.css             # Global CSS containing custom Tailwind v4 and refined dark-mode surfaces
    components
        AuthScreen.tsx            # Beautiful gateway with credential auto-fills and theme toggles
        AdminDashboard.tsx        # High-level analytics and supervisor configurations
        DispatcherDashboard.tsx   # Fleet scheduling hub, map tracker, and dispatch queue
        DriverDashboard.tsx       # Live driver transit controls, navigator, and rating meters
        ClientDashboard.tsx       # Secure customer self-service, order search, and receipt desk
        MapWidget.tsx             # Customized visual routing board
        VehiclesCrud.tsx          # Vehicle diagnostic logs and asset registry
        DriversCrud.tsx           # Fleet driver records and safety evaluations
        BookingsCrud.tsx          # Booking dispatch queues
        RoutesCrud.tsx            # Standard route registries
        LorryReceiptsCrud.tsx     # Transport receipt (LR) tables & exportable dispatch registers
```

---

##  Setup & Development

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) (v18 or higher) installed.

### 2. Install Dependencies
Run the package installation to fetch compiler systems and interface styles:
```bash
npm install
```

### 3. Start Development Server
Boot both the Express API endpoints and the Vite middleware:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
To package the React SPA and bundle the Express backend into a standalone, ultra-fast CJS script, run:
```bash
npm run build
```
This outputs compiled static files and `dist/server.cjs` ready for Cloud Run, VPS, or high-performance container deployment.

---

##  Standard Demo Credentials
For testing convenience during reviews, we've pre-loaded standard profiles into the system. You can switch roles seamlessly from the login gateway using the one-click pre-fill tags:

*   **Admin**: `admin@transitops.com` / `password`
*   **Dispatcher**: `dispatcher@transitops.com` / `password`
*   **Driver**: `driver@transitops.com` / `password`
*   **Client**: `client@transitops.com` / `password`
*   **Other Driver**: `gurpreet.singh@transitops.com`,`amit.k@transitops.com` / `password`




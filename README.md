# 📦 AssetFlow — Enterprise Asset & Resource Management System

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-blue.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.0-38bdf8.svg)](https://tailwindcss.com/)
[![Built with Vite](https://img.shields.io/badge/Built%20with-Vite-646cff.svg)](https://vitejs.dev/)

**AssetFlow** is a modern, enterprise-grade Asset & Resource Management ERP application built to track, allocate, schedule, audit, and maintain corporate hardware, software licenses, shared facilities, and custom enterprise physical assets.

Crafted with high-contrast displays, intuitive navigation, and smooth motion choreographies, AssetFlow delivers a secure, offline-capable local state engine (coupled with optional Firebase integration) and an immutable compliance logging mechanism built to satisfy rigorous internal and SOX-compliance audits.

---
## 🚀 Live Demo

🌐 **Application:** https://asset-flow-blue-eight.vercel.app/

## 🎥 Demo Video

📹 **Google Drive:** https://drive.google.com/file/d/1GQDBBzb7I-_a5vY4y6Sk4R6_M-FzW5mt/view?usp=sharing

> **Note:** If the live demo is temporarily unavailable due to Firebase quota, network restrictions, or maintenance, please refer to the demo video above for the complete application walkthrough.
---

## 🎨 Visual Identity & Theme

AssetFlow utilizes a clean, tech-forward, high-contrast dark palette tailored for enterprise operations rooms and administrative dashboards:
- **Primary Canvas**: Ambient deep-charcoal and cosmic slate tones (`bg-slate-950`, `bg-slate-900`) that minimize eye fatigue.
- **Accents**: Indigo interactive controls, emerald success states, rose maintenance warnings, and amber alert indicators.
- **Typography**: Paired display systems featuring structural headings styled with Inter alongside monospaced telemetry fonts (JetBrains Mono) for status indicators, IDs, and financial audits.
- **Micro-interactions**: Hand-choreographed transitions and staggered lists engineered using `motion` for visual continuity and tactile responsiveness.

---

## 🚀 Core Features & Business Modules

AssetFlow is split into highly responsive, contextual panels customized for different organizational roles (Admins, Asset Managers, Department Heads, and standard Employees):

### 1. Unified Control Command Dashboard
* **Dynamic KPI Trackers**: High-level financial reporting on total asset value, deployment percentages, active repairs, and pending transfer approvals.
* **Smart Alert Queues**: Real-time notifications for overdue returns, imminent audit deadlines, and active support tickets.
* **Quick-Actions Hub**: Speed-run critical ERP workflows—such as procuring an asset, auditing, or scheduling a transfer request—directly from the primary pane.

### 2. Comprehensive Asset Directory
* **Granular Records**: Register assets with customized metadata, serial keys, procurement costs, visual image attachments, and dynamic deprecation profiles.
* **Automatic Barcode Generator**: Every asset automatically compiles a printable standard Code 128 / QR mockup representation for physical scanning procedures.
* **Instant Custody Toggles**: Direct check-in, check-out, and retire actions with live custodian tracking.

### 3. Smart Custody & Asset Allocations
* **Multi-Tier Transfers**: Shift custody of devices across different departments or directly assign hardware to specific staff members.
* **Managerial Sign-Offs**: Structured multi-stage approval workflow. Any transfer request requires department heads' approvals to prevent silent inventory leakage.

### 4. Shared Facility & Equipment Bookings
* **Resource Timeline Scheduler**: Secure reservations for conference rooms, corporate vehicles, lab gear, and staging environments.
* **Conflict Guard**: Real-time reservation verification prevents double-bookings or concurrent allocation overlap.

### 5. Preventative & Corrective Maintenance Engine
* **Repair Pipeline**: Monitor support tickets, repair categories, technical logs, associated costs, and contractor assignments.
* **Lifecycle Synchronization**: Automatically changes asset status fields (e.g., to "In Maintenance") upon issue reporting, ensuring other departments cannot mistakenly book a broken item.

### 6. Visual Count Compliance Auditing
* **Audit Cycles**: Schedule organizational inventories with target categories or regional divisions.
* **Reconciliation Toolkit**: Scan items, confirm physical counts, log discrepancies, and commit secure verdicts to resolve inventory inaccuracies.

### 7. Organization & Department Configuration
* **System Settings**: Administer corporate departments, add customizable asset categories with custom data schema properties, and manage the full corporate employee roster.

### 8. Financial Reporting & Lifespan Analytics
* **Depreciation Models**: Real-time calculators showing straight-line asset depreciation, residual book value, and remaining useful lifespans.
* **Utilization Visualizations**: Staggered graphs detailing asset allocations and high-density sector statistics.

### 9. Immutable SOX-Compliant Logs
* **Granular Actor Filters**: Search and classify operational trails across five actor classifications (`System`, `Admin`, `Asset Manager`, `Department Head`, and `Employee`).
* **Entity Mapping**: Drill down specifically to tracking logs of `Asset`, `Allocation`, `Transfer`, `Booking`, `Maintenance`, or `Audit` types.

---

## 🛠️ Technology Stack

* **Front-End Library**: React 19 (Functional Hooks architecture)
* **Build Pipeline**: Vite 6.2 (Highly performant compilation and server routing)
* **Styling & Presentation**: Tailwind CSS v4 + `@tailwindcss/vite` (Utility-first styling with modern CSS variables)
* **Animation Engine**: Framer Motion / Motion (Tactile interactions and view-state choreography)
* **Iconography**: Lucide React (Clean, minimalist vector icons)
* **Data Core**: Extensible React Context and client-side database layer with high-integrity seed presets (`src/seedData.ts` and `src/db.ts`).

---

## 📦 Directory Structure

```bash
├── .env.example                # Example environment variables definition
├── .gitignore                  # Git untracked path rules
├── package.json                # Project dependencies and script declarations
├── metadata.json               # Platform configuration, permissions, and app naming
├── index.html                  # Core HTML file mounting the applet
├── vite.config.ts              # Vite server and bundler config
├── tsconfig.json               # TypeScript compilation guidelines
└── src
    ├── main.tsx                # Client entry-point
    ├── index.css               # Global stylesheets importing Tailwind CSS v4
    ├── types.ts                # Strong TypeScript interfaces, enums, and state schemas
    ├── db.ts                   # Storage API layer, local-storage handlers, and state synchronization
    ├── seedData.ts             # Rich placeholder datasets for rapid testing
    ├── App.tsx                 # Main application structure, routing, and notifications controller
    └── components              # Modular UI visualizers
        ├── DashboardView.tsx        # Command center KPIs & pending activities
        ├── AssetDirectoryView.tsx   # Asset inventory list, check-in/out, and barcodes
        ├── AllocationsView.tsx      # Custody transfers and head approvals
        ├── ResourceBookingView.tsx  # Shared scheduler and timelines
        ├── MaintenanceView.tsx      # Active repairs and support tickets
        ├── AuditView.tsx            # Visual-count compliance cycles & reconciliation
        ├── ReportsView.tsx          # Depreciations and visual metrics
        ├── OrganizationSetupView.tsx# Department metadata schemas & employees
        └── ImageDropzone.tsx        # Drag-and-drop file upload engine
```

---

## ⚙️ Local Development Instructions

Follow these steps to run the application in a local workspace or secondary host container:

### 1. Prerequisites
Ensure you have **Node.js (v18.0.0 or higher)** and **npm** installed on your system.

### 2. Clone and Setup Project
```bash
# Clone the repository
git clone <your-repository-url>
cd AssetFlow

# Install dependencies from package.json
npm install
```

### 3. Environment Configuration
If you plan to connect external services or Firebase, define your local keys in your environment. Copy the provided sample template:
```bash
cp .env.example .env
```

### 4. Spin up Development Server
Run the local Vite development server:
```bash
npm run dev
```
The server will boot up and serve the application locally at:
👉 **`http://localhost:3000`**

---

## 🏗️ Build & Deployment

### Production Compilation
Compile a optimized, statically-bundled production build:
```bash
npm run build
```
The output assets will be cleanly written into the `/dist` directory, ready to be hosted on Netlify, Vercel, AWS S3, or Cloud Run containers.

### Type Verification & Code Standards
Validate code syntax, check type integrity, and detect potential build failures using the strict TypeScript compiler:
```bash
npm run lint
```

---

## 🛡️ License

This project is licensed under the **MIT License**. Check the LICENSE file for more details.

# 🌴 Holiday Maximizer

Smart PTO planner that helps you maximize your time off by finding "bridge" days between public holidays.

## 🔗 Live Demo
Visit the live app at: [holidaycalendar.btopencloude.com](https://holidaycalendar.btopencloude.com)

## ✨ Features

- **Hybrid Storage**: Use it privately on your NAS or publicly via Cloudflare.
- **Local-First**: Public version stores all data in your browser (IndexedDB).
- **Smart Suggestions**: Automatically find the best days to take off for maximum consecutive break.
- **Interactive Projections**: Hover over suggestions to see the impact on your PTO balance.
- **Custom Categories**: Color-code your days (Remote, PTO, Unpaid, etc.).

## 🚀 Storage Modes

The app supports two modes via the `VITE_APP_MODE` environment variable:

1.  **`LOCAL_FIRST`** (Default for Cloudflare): Uses IndexedDB. Your data never leaves your browser.
2.  **`SERVER_BASED`** (Default for NAS/Docker): Uses the Express/SQLite backend for persistent multi-device storage.

## 🐳 Docker Deployment (NAS/Local)

Perfect for running on a Synology, QNAP, or any local server.

1.  **Clone the repo** to your NAS.
2.  **Start the app**:
    ```bash
    docker-compose up -d
    ```
3.  Access the app at `http://<your-nas-ip>:4173`.

Your data will be safely stored in the `./data` directory on your host machine.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Development

```bash
# To run with Local Storage (No backend needed)
VITE_APP_MODE=LOCAL_FIRST npm run dev:client

# To run with Server Backend
npm run dev
```

### Build & Production

```bash
# Build for Cloudflare Pages (Local-First)
VITE_APP_MODE=LOCAL_FIRST npm run build

# Build for Self-Hosting (Server-Based)
npm run build
npm start
```

## 🌐 Deployment

This project is ready to be deployed on any VPS (like DigitalOcean, Hetzner, or AWS) that supports Node.js.

1.  Build the frontend: `npm run build`
2.  Set `PORT=4173` (or your preferred port).
3.  Run the server: `npm start`

*Note: For Cloudflare Pages deployment, you would need to adapt the backend to use D1 or a separate API, as SQLite is local-only.*

## 🔒 Privacy & Security

No personal data is collected or tracked. All your plans are stored in a local SQLite database (`data/holidaymax.db`).
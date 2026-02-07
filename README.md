# 🌴 Holiday Maximizer

Smart PTO planner that helps you maximize your time off by finding "bridge" days between public holidays.

## ✨ Features

- **Full Year Calendar**: Visual overview of your vacations and public holidays.
- **Smart Suggestions**: Automatically find the best days to take off for maximum consecutive break.
- **Interactive Projections**: Hover over suggestions to see the impact on your PTO balance.
- **Custom Categories**: Color-code your days (Remote, PTO, Unpaid, etc.).
- **Multi-Profile Support**: Plan for yourself and compare with others.

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
npm run dev
```

### Build & Production

```bash
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
# CarbonEx — AI-Governed Carbon Credit Trading Platform

> A full-stack, AI-driven carbon credit exchange platform built with Next.js, featuring real-time analytics, regulator dashboards, and cryptographic security.

---

## 🌍 Overview

**CarbonEx** is a next-generation carbon credit trading platform that leverages Artificial Intelligence and Explainable AI (XAI) to govern, monitor, and optimize carbon credit exchanges. The system provides transparent, model-anchored KPI tracking through real-time dashboards for regulators, traders, and auditors.

### Key Features

- 🤖 **AI-Governed Trading** — Real-time AI pricing engine with explainable decision logic
- 📊 **Regulator Dashboard** — Live KPI monitoring with XAI transparency layers
- 🔐 **STL-C³T Cryptographic Security** — Secure transaction ledger architecture
- 📈 **STAVP Ledger** — Immutable audit trail for all trades
- 👥 **Role-Based Access** — Admin, Regulator, Trader, and Auditor roles
- 🔍 **AI Analytics** — Model accuracy tracking, drift detection, and performance metrics

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Frontend | React 19, TypeScript |
| Styling | Tailwind CSS v4, Radix UI |
| Charts | Recharts |
| Animation | Framer Motion |
| Forms | React Hook Form + Zod |
| Auth | JWT (jose) + bcryptjs |
| Data Fetching | SWR |

---

## 📁 Project Structure

```
├── app/                    # Next.js App Router pages & API routes
│   ├── (auth)/            # Authentication pages
│   ├── api/               # Backend API endpoints
│   └── ...
├── components/            # Reusable React components
│   ├── regulator/         # Regulator dashboard components
│   ├── audit/             # Audit log components
│   └── ...
├── backend/               # Backend logic & database
├── frontend/              # Additional frontend modules
├── lib/                   # Shared utilities & helpers
├── hooks/                 # Custom React hooks
├── data/                  # Static/seed data
├── public/                # Static assets
└── styles/                # Global styles
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.x
- npm >= 9.x

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/carbonex-platform.git
cd carbonex-platform

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

---

## 🔑 Environment Variables

Create a `.env.local` file in the root directory:

```env
# Authentication
JWT_SECRET=your_jwt_secret_here

# Database (if applicable)
DATABASE_URL=your_database_url

# Add other required environment variables
```

> ⚠️ **Never commit your `.env.local` file.** It is already in `.gitignore`.

---

## 👥 Team

| Name | Role | GitHub |
|------|------|--------|
| Mithil K Gowda | Lead Developer | [@MithilKGowda](https://github.com/MithilKGowda) |
'

> 📝 *Update the table above with your teammates' actual GitHub usernames.*

---

## 📄 License

This project is developed as a team academic/research project.

---

## 🤝 Contributing

1. Create a new branch: `git checkout -b feature/your-feature-name`
2. Make your changes and commit: `git commit -m "feat: add your feature"`
3. Push to your branch: `git push origin feature/your-feature-name`
4. Open a Pull Request on GitHub

### Commit Message Convention

- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation update
- `style:` — Formatting/style changes
- `refactor:` — Code refactoring
- `test:` — Adding tests

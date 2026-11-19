# CarbonEx

[Portfolio case study](https://mithilkg-portfolio.vercel.app/projects/carbon-credit-exchange)

## Secure AI-Governed Carbon Credit Exchange Prototype

CarbonEx is a full stack prototype for carbon credit trading, digital carbon passports, regulator visibility, audit workflows, pricing experiments, and security focused transaction handling.

The project is designed as an engineering and research demonstration. It should not be interpreted as a production financial exchange, a certified cryptographic product, or a regulatory compliance system.

## Problem and architecture

Carbon credit workflows need traceable passport records, distinct company and regulator access, and reviewable transaction history. CarbonEx combines these paths in a Next.js prototype:

```text
Company / regulator users → authenticated application
                           → passport and trading APIs
                           → audit and analytics views
```

The repository includes demonstration data and prototype storage paths; it does not establish production-grade settlement or regulatory compliance.

## Security capabilities

* JWT-based sessions and company/regulator role views
* Trading and passport API workflows
* Audit logging and regulator visibility
* Transaction security experiments with documented boundaries

## Main capabilities

* Digital Carbon Passport workflows
* Carbon credit marketplace views
* Trading APIs
* Regulator and company roles
* Audit logging
* Authentication with JWT based sessions
* Pricing and analytics interfaces
* Security layer experiments
* Deployed web demonstration

## Technology

* Next.js
* React
* TypeScript
* Tailwind CSS
* Radix UI
* Recharts
* React Hook Form
* Zod
* jose
* bcryptjs
* SWR

## Project structure

```text
app/            Next.js routes and API handlers
components/     UI for dashboard, trading, emissions, passport, regulator and audit
docs/           technical report, methodology notes and mobile review
hooks/          shared React hooks (portfolio data with the demo sandbox applied)
lib/            market engine, in-memory database, STAVP ledger, STL C³T pipeline, auth
public/         static assets

```

## Local development

### Prerequisites

* Node.js 18 or later
* npm 9 or later

### Install

```bash
git clone https://github.com/mithilkg10/CARBON-EX-PLATFORM.git
cd CARBON-EX-PLATFORM
npm install
```

### Environment

Copy `.env.example` to `.env.local` locally, or set the same names in deployment secrets. Leave values out of source control.

```env
JWT_SECRET=
ADMIN_EMAIL=
ADMIN_PASSWORD_HASH=
```

`JWT_SECRET` must be a unique random string of at least 32 characters. The owner account exists only when `JWT_SECRET`, `ADMIN_EMAIL` and `ADMIN_PASSWORD_HASH` are all set. `ADMIN_PASSWORD_HASH` is a bcrypt hash of the owner password with the value of `JWT_SECRET` appended before hashing.

When using `.env.local`, escape each `$` in the bcrypt hash as `\$` so Next.js environment expansion preserves it. Deployment secret dashboards accept the unescaped hash.

### Recruiter demo

The login page has one click Company demo and Regulator demo buttons. Demo sessions call the same API routes as real accounts: trades run the full STAVP checks and SHA 256 ledger chaining, and the browser side STL C³T step uses AES 256 GCM and SHA 256 from the Web Crypto API. For demo accounts the server returns the computed result marked as simulated and does not change the shared dataset. The result is kept in the visitor's browser tab, so a purchase updates the wallet, holdings, trade history, passport and audit trail for that visitor only.

### Data model

Storage is in memory. The seed is deterministic (fixed PRNG seed, dates relative to the current day) and all prices and volumes come from one market engine in `lib/market/engine.ts`, so every page, every API route and every serverless instance shows the same numbers. Self service registration is disabled because the prototype has no verified invitation or email ownership flow.

### Start

```bash
npm run dev
```

### Build

```bash
npm run build
npm start
```

## Validation

Run `npx tsc --noEmit` and `npm run build` locally. Authentication and authorization require separate HTTP checks with configured environment secrets. The repository does not claim fraud-model performance results.

## Security boundaries

CarbonEx contains security and cryptographic experiments that are suitable for demonstration and further research.

The repository should not describe prototype ledger structures as independently verified immutability, and custom cryptographic components should not be treated as substitutes for audited standard cryptographic libraries.

A production implementation should use:

* Strong secret management
* Persistent transactional storage
* Strict input validation
* Distributed rate limiting
* Standard authenticated encryption
* Standard digital signatures or message authentication
* Atomic trade settlement
* Independent security review
* Automated tests for authorization and business rules

## Data status

The current project includes demonstration data and prototype storage paths. Demo users, demo credentials, synthetic records, and generated values should remain clearly separated from production concepts.

## Live demonstration

[Open the deployed CarbonEx demonstration](https://carbon-ex-platform.vercel.app). No product screenshots are committed to this repository.

## Project status

Active prototype and research project. Future work includes persistent transactional storage, authorization tests, standard cryptographic primitives, and independent security review.

[Portfolio](https://mithilkg-portfolio.vercel.app) · [LinkedIn](https://www.linkedin.com/in/mithil-k-gowda) · [GitHub profile](https://github.com/mithilkg10)

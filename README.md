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
app/
components/
backend/
frontend/
hooks/
lib/
public/
styles/
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
DEMO_PASSWORD=
```

`JWT_SECRET` must be a unique random string of at least 32 characters. `ADMIN_PASSWORD_HASH` is a bcrypt hash of your private owner password; configure it together with `ADMIN_EMAIL`. `DEMO_PASSWORD` is a separate password of at least 12 characters. When set, it provisions `demo.company@mithilkg.dev` and `demo.regulator@mithilkg.dev` over synthetic in-memory data. Both demo roles can view but cannot trade, change records, approve registrations, block users, or read private audit logs. Share the demo password separately with recruiters.

When using `.env.local`, escape each `$` in the bcrypt hash as `\$` so Next.js environment expansion preserves it. Deployment secret dashboards accept the unescaped hash.

Owner login: `/login` with the configured `ADMIN_EMAIL` and its original private password (the value represented by `ADMIN_PASSWORD_HASH`). Demo login: `/login` with either demo email and `DEMO_PASSWORD`. The page offers email selection and never displays a privileged password.

Self-service registration and password setup are disabled because this prototype has no verified invitation or email-ownership flow. Storage is in-memory and resets across processes; a successful local login does not prove a deployed serverless session works across instances.

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

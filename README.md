# StellarCarry 🛍️

Decentralized cross-border personal shopping & delivery on Stellar. Buyers request products from abroad, travelers buy and deliver them, and payment is held in **Soroban smart-contract escrow** and released on confirmed delivery.

## 🔗 Links

| Resource | URL |
|----------|-----|
| **Live App** | [stellarcarry.vercel.app](https://stellarcarry.vercel.app) |
| **GitHub** | [github.com/SmtDcs/stellarcarry](https://github.com/SmtDcs/stellarcarry) |
| **Contract (Testnet)** | `CCLY7LHZYMEZKT72BU3D2XDBASF5SO7QK4UJCIXOUP4NRWVDLFJUEUVI` |
| **Network** | Stellar Testnet (Protocol 27) |

---

## 🎯 Problem & Solution

**Problem:** Cross-border shopping is broken — high shipping costs, customs complexity, zero trust between strangers.

**Solution:** Connect buyers with travelers who have luggage space. Funds are locked in a Soroban escrow contract, released only when delivery is confirmed. Reputation is recorded on-chain for permanent trust.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        apps/web (Next.js 16)                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────────┐  │
│  │  Landing  │ │   Post   │ │  Match   │ │  Escrow (Vault)   │  │
│  │  Page     │ │  Request │ │  Engine  │ │  State Machine    │  │
│  └──────────┘ └──────────┘ └──────────┘ └─────────┬─────────┘  │
│                                                    │             │
│  ┌─────────────────────────────────────────────────┼──────────┐  │
│  │              API Routes (/api)                  │          │  │
│  │  /api/build-send-tx    /api/escrow ◄───────────┘          │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                    packages/core (SDK)                           │
│  ┌──────────────────┐ ┌────────────────┐ ┌───────────────────┐  │
│  │  EscrowClient     │ │  matchTravelers│ │  formatStroops    │  │
│  │  (tx builder +    │ │  (algorithm)   │ │  (utility)        │  │
│  │   RPC simulation) │ │                │ │                   │  │
│  └──────────────────┘ └────────────────┘ └───────────────────┘  │
└──────────────────────────┬──────────────────────────────────────┘
                           │ @stellar/stellar-sdk
┌──────────────────────────▼──────────────────────────────────────┐
│              Stellar Testnet (Soroban RPC)                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  contracts/escrow (Rust + soroban-sdk 22.0.0)            │   │
│  │  create_escrow → fund → confirm_delivery → release       │   │
│  │                                   └→ refund               │   │
│  │  get_escrow · get_reputation                              │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
stellarcarry/
├── apps/web/                    # Next.js 16 frontend
│   ├── app/
│   │   ├── page.tsx             # Landing page
│   │   ├── layout.tsx           # Root layout (navbar + analytics)
│   │   ├── globals.css          # Design tokens + Tailwind
│   │   ├── send/page.tsx        # Send XLM
│   │   ├── post/page.tsx        # Post delivery request
│   │   ├── travelers/page.tsx   # Traveler directory
│   │   ├── match/               # Match engine UI
│   │   ├── reputation/          # Reputation profile
│   │   ├── escrow/              # Escrow vault (Soroban)
│   │   ├── kit/page.tsx         # Design system gallery
│   │   └── api/
│   │       ├── build-send-tx/   # Payment transaction builder
│   │       └── escrow/          # Escrow simulation + submit
│   ├── components/
│   │   ├── brand/               # Logo, icons, wordmark
│   │   ├── travel/              # Boarding pass, vault seal, star map...
│   │   ├── ui/                  # shadcn/ui components
│   │   ├── navbar.tsx           # Responsive navigation
│   │   ├── wallet-connect.tsx   # Freighter wallet button
│   │   ├── EscrowStepper.tsx    # State machine visualization
│   │   └── OnboardingWizard.tsx # New user tour
│   ├── lib/                     # Utilities, seed data, types
│   ├── hooks/                   # React hooks
│   └── e2e/                     # Playwright tests (37+)
│
├── packages/
│   ├── core/                    # TypeScript SDK
│   │   ├── src/
│   │   │   ├── client.ts        # EscrowClient (tx builder + RPC)
│   │   │   ├── matching.ts      # matchTravelers algorithm
│   │   │   ├── types.ts         # Escrow, EscrowState, Request...
│   │   │   ├── errors.ts        # ValidationError, NetworkError
│   │   │   ├── format.ts        # formatStroops utility
│   │   │   └── utils.ts         # Deadline converter
│   │   └── test/                # Vitest tests (9)
│   └── cli/                     # CLI tool
│       ├── src/
│       │   ├── index.ts         # CLI entry (match command)
│       │   └── store.ts         # Config file store
│       └── test/                # Vitest tests (8)
│
├── contracts/
│   ├── Cargo.toml               # Workspace root
│   └── escrow/
│       ├── Cargo.toml           # soroban-sdk 22.0.0
│       └── src/lib.rs           # 7 functions, 5-state machine (50 tests)
│
├── scripts/                     # Deployment scripts
│   ├── deploy-clean.mts         # Full deploy pipeline
│   ├── deploy-contract.mts      # Contract upload + create
│   └── create-contract.mts      # Contract instance creation
│
├── .github/workflows/ci.yml     # CI/CD (TypeScript → tests → build → Vercel)
├── PITCH.md                     # Pitch deck
├── SUBMISSION.md                # Belt submission form
├── .contract-address            # Deployed contract ID
└── vitest.config.ts             # Test configuration
```

---

## ⚙️ Smart Contract

### State Machine

```
                    ┌─────────────┐
                    │   Created   │
                    └──────┬──────┘
                           │ fund()
                    ┌──────▼──────┐
              ┌─────│   Funded    │─────┐
              │     └──────┬──────┘     │
              │            │ confirm_   │ refund()
              │            │ delivery() │ (deadline
              │     ┌──────▼──────┐     │  passed)
              │     │  Delivered  │     │
              │     └──────┬──────┘     │
              │            │ release()  │
              │     ┌──────▼──────┐     │
              │     │  Released   │     │
              │     └─────────────┘     │
              │                   ┌─────▼─────┐
              └──────────────────►│  Refunded  │
                                  └───────────┘
```

### Functions

| Function | Auth | State Required | Effect |
|----------|------|----------------|--------|
| `create_escrow(buyer, traveler, token, amount, deadline)` | buyer | — | Creates new escrow (#ID) |
| `fund(id)` | buyer | Created | Transfers tokens from buyer → contract |
| `confirm_delivery(id)` | buyer | Funded | Marks as delivered |
| `release(id)` | traveler | Delivered | Transfers tokens → traveler, +reputation |
| `refund(id)` | buyer | Funded + deadline passed | Returns tokens → buyer |
| `get_escrow(id)` | — | — | Returns escrow details |
| `get_reputation(traveler)` | — | — | Returns reputation score |

### Storage

| Key | Type | Purpose |
|-----|------|---------|
| `Counter` | `u64` | Auto-increment escrow ID |
| `Escrow(id)` | `Escrow` | Escrow data (buyer, traveler, token, amount, deadline, state) |
| `Reputation(address)` | `i128` | Successful delivery count per traveler |

---

## 🌐 API Reference

### `POST /api/escrow`

Simulates any escrow action against the deployed testnet contract.

**Request:**
```json
{
  "action": "fund",
  "sourcePubKey": "G...",
  "params": { "escrowId": "0" }
}
```

**Success Response:**
```json
{
  "success": true,
  "xdr": "AAAAAgAAA...",
  "simulation": {
    "minResourceFee": "100000",
    "cost": { "cpuInsns": "12345", "memBytes": "1024" },
    "latestLedger": 3345678
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "type": "state",
    "message": "escrow must be in Funded state"
  }
}
```

### `POST /api/build-send-tx`

Builds an unsigned XLM payment transaction.

**Request:**
```json
{
  "sourcePubKey": "G...",
  "destination": "G...",
  "amountStroops": "50000000",
  "sequence": "123456789"
}
```

---

## 🎨 Design System — "Departures"

A cosmic/aviation hybrid theme inspired by airport departure boards and stellar cartography.

| Token | Value | Usage |
|-------|-------|-------|
| `--space-900` | #05060A | Deepest background |
| `--space-800` | #0A0B12 | Card backgrounds |
| `--star-yellow` | #FDDA24 | Primary accent (Stellar brand) |
| `--aurora-teal` | #3DE1C8 | Success states |
| `--aurora-violet` | #7C6CF0 | Interactive elements |
| `--ink` | #F5F3EC | Primary text |
| `--ink-dim` | #8A8B96 | Secondary text |
| `--hairline` | rgba(255,255,255,0.08) | Borders, dividers |

**Components:**
- **VaultSeal** — Animated circular seal showing escrow state (locked → funded → open → shattered)
- **BoardingPassCard** — Boarding pass style cards with perforated tear lines
- **DepartureBoard** — Split-flap airport departure display
- **PassportStamp** — Ink stamp animation for completed deliveries
- **WorldStarMap** — Interactive globe with animated flight arcs (d3-geo + topojson)
- **StarField** — Parallax star background with twinkle animation

---

## 🧪 Testing

### Test Matrix

| Package | Framework | Tests | Focus |
|---------|-----------|-------|-------|
| `@stellarcarry/core` | Vitest | 9 | Validation, edge cases, bigint, matching |
| `@stellarcarry/cli` | Vitest | 8 | Commands, config store |
| `contracts/escrow` | Cargo test | 50 | Full state machine, all states, auth, errors |
| `apps/web` (unit) | Vitest | 2 | Formatting, seed data |
| `apps/web` (e2e) | Playwright | 37+ | All 9 pages, forms, navigation, states |
| **Total** | | **106+** | |

### Run Tests

```bash
npm test                     # Core + CLI (19 tests)
cargo test                   # Contract (50 tests)
cd apps/web && npx playwright test  # E2E (37+ tests)
```

---

## 🚀 Deployment

### Local Development

```bash
git clone https://github.com/SmtDcs/stellarcarry.git
cd stellarcarry
npm install
cd apps/web
npm run dev                   # http://localhost:3000
```

### Production

```bash
npm run build -w apps/web     # Production build
```

Deploy to Vercel with zero configuration — `vercel.json` handles routing and build settings.

---

## 📱 Mobile Responsive

All pages adapt seamlessly across devices using Tailwind CSS v4 breakpoints:

| Breakpoint | Behavior |
|-----------|----------|
| **< 640px** | Single column, hamburger menu, stacked cards |
| **640-768px** | Two-column grids where appropriate |
| **768-1024px** | Full nav visible, wider layouts |
| **1024px+** | Desktop layout, sidebar-ready |

- Navbar collapses to animated hamburger on mobile
- All forms, cards, and tables use responsive grid/flex
- Touch-friendly button sizes (minimum 44px tap targets)
- Tested on Chrome, Firefox, Safari (iOS + macOS)

---

## 🔍 Error Handling

8 categorized error types with descriptive messages, icons, and user guidance:

| Type | Icon | When |
|------|------|------|
| `auth` | 🔐 | Missing/incorrect signer |
| `state` | 🚫 | Wrong escrow state for action |
| `deadline` | ⏰ | Deadline not yet reached |
| `sequence` | 🔢 | Invalid account sequence number |
| `funds` | 💰 | Insufficient balance |
| `not_found` | 🔍 | Escrow or account not found |
| `validation` | ⚠️ | Invalid parameters |
| `unknown` | ❌ | Unexpected errors |

---

## 📊 Analytics

Vercel Analytics tracks:
- Page views and unique visitors
- Route transitions
- Session duration
- Device and browser breakdown

Dashboard: https://vercel.com/smtdcs-projects/stellarcarry/analytics

---

## 📋 Submission Checklist (Stellar Ambassador Belt — Level 4)

- [x] Public GitHub repository
- [x] README with complete documentation
- [x] 20 meaningful commits
- [x] Live demo link: https://stellarcarry.vercel.app
- [x] Contract deployment: `CCRMSOOFXVD34F5RBDYI5X6DZ2Z5XJIV2GEWTRAP5T6NBXFPXYPDNJFC`
- [x] Screenshots (11 pages/states)
- [x] Mobile responsive design
- [x] Analytics (Vercel Analytics)
- [x] CI/CD pipeline (GitHub Actions)
- [x] 106+ automated tests
- [x] Product UI screenshots
- [x] Project structure documentation
- [x] API documentation
- [x] Error handling documentation
- [ ] 10+ real user wallet interactions
- [ ] User feedback summary
- [ ] Demo video

---

## 📄 License

MIT

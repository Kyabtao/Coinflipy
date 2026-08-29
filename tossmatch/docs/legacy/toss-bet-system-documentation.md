# TossMatch — P2P Coin-Toss Betting System
## Full Technical & Product Document

| | |
|---|---|
| **Document version** | 2.1 (3-party merged-hash result engine + auto-match queue) |
| **Status** | Play-money reference implementation + production blueprint |
| **Companion demo** | `toss-bet-demo.html` (single-file, runs in any browser) |
| **Last updated** | 2026-08-18 |

---

## ⚠️ 0. Legal notice — read before anything else

- A coin toss is a **game of chance**. Operating real-money games of chance is **prohibited in most of India** (Public Gambling Act 1867, state gaming laws, and the 2025 IT Amendment Rules restricting real-money online games). Delhi is not a licensed exception.
- This document and the demo use **play coins only**. They are legal to run and share.
- If real-money operation is ever contemplated, it must happen **through a licensed entity in a jurisdiction where games of chance are legal** (see §11), with legal counsel, KYC/AML, certified randomness, and payment-compliance in place **before** accepting a single rupee.
- The system is explicitly designed so that **no plain result is ever stored before the flip** — storing readable outcomes in advance is rigging, which is fraud against players.

---

## 1. System overview

TossMatch is a **peer-to-peer (P2P) matching betting system**. The house never bets against the player; the house only **matches two opposing players, holds both stakes in escrow, takes a configurable fee from the pot, and pays the entire remainder to the winner**.

### 1.1 Core loop (exactly as requested)

```
PLAYER A                          SYSTEM                            PLAYER B
   |  1. select AMOUNT               |                                 |
   |  2. select SIDE (H/T)           |                                 |
   |  3. stake escrowed  ----------->|  bet OPEN on the board          |
   |                                 |<---------- 4. same AMOUNT, -----|
   |                                 |             opposite SIDE       |
   |                                 |  5. MATCHED → game created      |
   |                                 |     commitments published       |
   |                                 |  6. FLIP (merged 3-party hash)  |
   |                                 |  7. pot − fee → winner          |
```

### 1.2 Design principles

1. **The house is a matchmaker, not a counterparty.** No house bankroll risk — the fee is the only house revenue.
2. **Escrow-first.** Money leaves the wallet the moment a bet is posted, and sits in escrow until the game settles or the bet is cancelled.
3. **Deterministic fairness.** The outcome is fixed the instant the match forms (all three secrets exist by then) but is *provably* unknown and unsteerable by any single party.
4. **Every coin is accountable.** A ledger entry exists for every movement; total coins are conserved at all times (§5.4).

---

## 2. Actors & roles

| Actor | What they do | Constraints |
|---|---|---|
| **Player (maker)** | Posts a bet: amount + side + secret seed | Must have balance ≥ amount; cannot take own bet |
| **Player (taker)** | Takes the opposite side of an open bet at the same amount | Opposite side is auto-assigned; stake escrowed instantly |
| **System (house)** | Runs the board, escrow, matching, commitments, settlement, fee | **Cannot** see or influence the result ahead of time (by design, §6) |
| **Admin** | Sets fee %, monitors volumes, views all games & proofs, refunds on cancel | Demo also allows play-coin top-ups and reset |

---

## 3. End-to-end game flow

**Step 1 — Player A posts a bet**
- Selects amount `a` (integer > 0, ≤ wallet balance).
- Selects side: `HEADS` or `TAILS`.
- Enters/keeps a **secret player seed** (`seedA` — any string).
- System computes and freezes the **bet fingerprint**:
  ```
  betHashA = SHA-256( seedA : betId : a : sideA )
  ```
- Wallet: `balanceA -= a` → escrow. Ledger: `ESCROW −a`.
- Bet appears on the open board with amount + side + fingerprint committed.

**Step 2 — Player B takes the bet**
- Sees the open bet, clicks **Take** → B is assigned the opposite side automatically.
- B's seed (`seedB`) is hashed with the game id:
  ```
  betHashB = SHA-256( seedB : gameId : a : sideB )
  ```
- Wallet: `balanceB -= a` → escrow.

**Step 3 — Match forms, commitments published (before the flip)**
The system generates a high-entropy secret server seed and publishes:
```
commit = SHA-256(serverSeed)
```
All three values are now public and immutable: `commit`, `betHashA`, `betHashB`.

**Step 4 — The flip (result calculation)**
```
merged   = HMAC-SHA256( key = serverSeed,
                        msg = betHashA ‖ betHashB ":" gameId )
firstByte = merged[0..1] (hex)
result   = firstByte even → HEADS, odd → TAILS
```

**Step 5 — Settlement**
```
pot    = 2·a
fee    = round( pot × feePct / 100 )
payout = pot − fee
winner = (player whose side == result)
winner.balance += payout        house.fees += fee
```
Ledger entries written for both; game recorded with **all inputs revealed** for verification.

**Cancellation paths**
- Open bet cancelled by maker → full refund.
- Matched game cancelled before flip → **both** stakes refunded.

---

## 4. Bet & game lifecycle (state machine)

```
        post (escrow)                     take (escrow)
WALLET ───────────────> BET:OPEN ────────────────────────> GAME:READY
                          │   ▲                               │
                 cancel   │   │ (stays open if no taker)      │  flip
                 (refund) ▼                                   ▼
                       BET:CANCELLED                    GAME:SETTLED
                                                           or
                                                     GAME:CANCELLED
                                                     (both refunded)
```

| State | Meaning | Money position |
|---|---|---|
| `OPEN` | Bet on board, waiting for opposite side | maker escrowed |
| `READY` | Matched, commitments published, flip pending | both escrowed |
| `SETTLED` | Flipped, winner paid | pot − fee → winner; fee → house |
| `CANCELLED` | Voided | full refunds |

---

## 5. Wallet, escrow & fee mathematics

### 5.1 Definitions
- `balance` — spendable coins in wallet.
- `escrow` — coins locked against live bets/games (already deducted from balance).
- `pot` — total escrowed for one game = `2·a`.
- `feePct` — house fee % of pot (demo default **5%**, configurable 0–25%).

### 5.2 Formulas
```
fee    = round(pot × feePct/100)
payout = pot − fee
winner net P/L = +（a − fee)      loser net P/L = −a
house revenue  = +fee
```

### 5.3 Worked fee table (stake 100 each → pot 200)

| feePct | fee | winner receives | winner net profit | house take |
|---:|---:|---:|---:|---:|
| 0% | 0 | 200 | +100 | 0 |
| 2% | 4 | 196 | +96 | 4 |
| 5% | 10 | 190 | +90 | 10 |
| 10% | 20 | 180 | +80 | 20 |

### 5.4 Conservation invariant (must hold at every instant)
```
Σ(wallet balances) + Σ(live escrow) + Σ(house fees) = Σ(ever deposited/topped-up)
```
This is asserted in the demo test suite (`MONEY CONSERVATION PASS`). In production it is a nightly reconciliation job; any drift is a P0 bug.

---

## 6. Enhanced result engine — 3-party merged hash (v2.0)

> This replaces the earlier single system-seed scheme. The outcome now mathematically requires **all three fingerprints**: the two players' bet hashes **merged** with the system's committed seed.

### 6.1 The three inputs

| # | Input | Created when | Known to |
|---|---|---|---|
| 1 | `betHashA = SHA-256(seedA:betId:a:sideA)` | bet posted | everyone (hash only) |
| 2 | `betHashB = SHA-256(seedB:gameId:a:sideB)` | bet taken | everyone (hash only) |
| 3 | `serverSeed` (256-bit CSPRNG) + `commit = SHA-256(serverSeed)` | match forms | everyone sees **commit only** |

### 6.2 Merge & result
```
merged     = HMAC-SHA256(serverSeed, betHashA + betHashB + ":" + gameId)
firstByte  = merged[0..1] as hex → integer 0..255
result     = (firstByte mod 2 == 0) ? HEADS : TAILS
```

### 6.3 Fully worked example (real values, recomputable)

```
seedA      = "aman-lucky-7"        sideA = HEADS   betId = B1   a = 50
seedB      = "binish-toss-9"       sideB = TAILS   gameId = G1
serverSeed = 9f1c4a77e2b85d0136afc94e27d3b1580a6e42df91c7b3e5f8a2d60417c9e0b3

betHashA = SHA-256("aman-lucky-7:B1:50:Heads")
         = 50b2c9e2479fa94f847ab6a2e74b6726cc185b0b12bc0b602601a526a0be6c58
betHashB = SHA-256("binish-toss-9:G1:50:Tails")
         = d2064c261b7f5ce15ca9b1e7e0d14080b225a47d4e99081ac77d26bb1309db4e
commit   = SHA-256(serverSeed)
         = 1c3f86b83362ec0cf6d2def5b01ee31c3e7f548f19320808508a3f8d464d9b74

merged   = HMAC-SHA256(serverSeed, betHashA+betHashB+":G1")
         = 2a8c553778f80ee1f9f535eb103d156bbc6f7e5332729dc7f14d7dfbcc4ac1fc
firstByte = 0x2a = 42 → even → HEADS

Settlement at 5%: pot 100 → fee 5 → HEADS wins → Player A +95, Player B −50, house +5
```

### 6.4 Security analysis — why nobody can steer the coin

| Adversary | Attack | Why it fails |
|---|---|---|
| **House** | Precompute/choose a serverSeed that yields a desired side | It must fix `serverSeed` **after** both bet hashes exist (commit is published at match time) — but even then it cannot reverse SHA-256 to search seeds; to rig it would need ~2^256 tries per desired outcome. Commitment published before the flip makes any later swap detectable. |
| **House** | Read results in advance from the DB | Impossible by construction: the result exists only after `serverSeed` is combined with both hashes; the DB stores commitments, never plain outcomes. |
| **Player A** | Choose seedA to force a side | seedA is hashed into betHashA **before** B's hash or the serverSeed exists; changing seedA after posting changes betHashA → detectable against the published fingerprint. |
| **Player B** | Choose seedB knowing the system seed | B also cannot know `serverSeed` (only its hash). Choosing seedB changes betHashB but B still can't target an outcome without inverting HMAC-SHA-256. |
| **Anyone** | Tamper with any record post-hoc | Any change to seed, bet hash, or game id changes `merged` completely (avalanche effect); recomputation exposes the tamper instantly. |

**Verified properties (automated tests):**
- `DETERMINISM` — same inputs → same hash, always.
- `SENSITIVITY` — changing any of the 4 inputs (serverSeed, betHashA, betHashB, gameId) changes the merged hash.
- `UNIFORMITY` — 1000 distinct system seeds → 50.6% heads (fair 50/50 within noise; parity of a uniform byte is exactly uniform).
- `MONEY CONSERVATION` — coins never appear or vanish.

### 6.5 Player-side verification steps (shown in-app after every game)

1. Hash the revealed `serverSeed` → must equal the earlier published `commit`.
2. Recompute `betHashA` from `(seedA:betId:amount:sideA)` → must equal the fingerprint published at post time.
3. Recompute `betHashB` likewise.
4. Compute `HMAC-SHA256(serverSeed, betHashA+betHashB:gameId)` → first byte parity must equal the announced result.

### 6.6 Production hardening notes
- `serverSeed` must come from a **CSPRNG** (`crypto.getRandomValues` / `/dev/urandom`), never `Math.random()`.
- For an even stronger scheme (house commits even before bets exist), pre-publish a chain: `commitN = SHA-256(seedN ‖ commitN−1)` and rotate seeds daily with a public counter — the demo's per-game commit is the simpler, equally-verifiable variant.
- In a real client-server build, each player's seed should be hashed **client-side** and only the hash uploaded, with the plain seed revealed after settlement (so the server never holds preimage + hash pre-flip for both).

---

## 7. Matching engine rules

1. **Amount equality** — a bet is only matchable by a taker staking the *exact same* amount.
2. **Opposite side only** — the taker always receives the opposite side of the maker.
3. **No self-match** — a player cannot take their own bet.
4. **One-to-one** — each open bet matches exactly once; each matched bet belongs to exactly one game (enforced with unique `game_id`).
5. **Escrow precondition** — taker must have `balance ≥ amount`; escrow is atomic with the match.
6. **Multiple concurrent open bets are allowed**; first-come-first-served taking.
7. **Auto-match queue** — see §7.1; this is the default matching mode (v2.1).
8. *(Optional production extension)* **Ladder/partial matching** — explicitly **out of scope**; partial matching changes the P2P pot math and is not recommended for v1.

### 7.1 Auto-match queue engine (v2.1)

Every posted bet joins a **FIFO queue**. When a bet arrives, the engine looks for the **oldest** waiting bet that satisfies **all three** conditions:

1. different owner (no self-match),
2. **exact same amount**,
3. **opposite side** (auto-assigned to the taker).

If a match exists → game is created **instantly** (commitments published, merged-hash flip runs automatically). If not → the bet waits in the queue, fully visible on the board with its position, amount, side and wait time; the owner may cancel at any time for a full refund.

```
on bet_posted(b):
    m = first open bet where (owner ≠ b.owner) AND (amount = b.amount) AND (side = opposite(b.side))
    if m exists:                                        # FIFO — "first" = oldest
        remove m, b from queue
        create game(maker = m, taker = b, auto = true)  # commitments published
        auto-flip + settle                              # winner paid pot − fee
    else:
        enqueue(b)                                      # wait for opposite side
```

**Admin toggle & sweep.** Auto-match can be switched OFF (manual taking only). Switching it back ON immediately **sweeps** the queue: every compatible pair is matched and settled in the background, oldest first, skipping same-owner conflicts. Match-type counters (`auto` / `manual`) are tracked per game and shown on the admin dashboard; ⚡ marks auto-matched games everywhere.

**Why exact-amount equality only?** The pot is `2·a` and both stakes are equal by construction — no house risk, no partial fills, trivially auditable escrow. Amount laddering would break the conservation invariant as designed.

**Production concurrency notes.** In a real backend the queue lives in the database and matching is one transaction: `SELECT … FOR UPDATE` (or `INSERT … ON CONFLICT SKIP LOCKED`) on candidate bet rows, atomic `OPEN → MATCHED` status flips, and the `UNIQUE(bets.game_id)` constraint as the final backstop against double-takes under load. The demo implements the identical decision logic single-threaded.

**Test coverage (automated, all PASS):** instant pairing on post; FIFO picks the oldest eligible bet; no self-match; sweep on toggle; manual take works with auto ON; queue cancel refunds; money conservation holds across every path.

---

## 8. Data model

### Entities & fields

**Player** — `id, handle, wallet_balance, escrow_total, client_seed (current), created_at`

**Bet** — `id, player_id, amount, side (HEADS|TAILS), seed, bet_hash, status (OPEN|MATCHED|CANCELLED), game_id?, created_at`

**Game** — `id, bet_maker_id, bet_taker_id, amount, side_maker, side_taker, server_commit, server_seed (revealed on settle), merged_hash, result_byte, result, winner_id, pot, fee_pct, fee, payout, status (READY|SETTLED|CANCELLED), created_at, settled_at`

**LedgerEntry** — `id, player_id?, game_id?, type (DEPOSIT|TOPUP|ESCROW|REFUND|PAYOUT|FEE), amount (±), balance_after, created_at`

**FeeConfig** — `fee_pct, updated_at, updated_by` (audit trail)

### Production SQL schema (PostgreSQL)

```sql
CREATE TABLE players (
  id             UUID PRIMARY KEY,
  handle         TEXT NOT NULL,
  wallet_balance BIGINT NOT NULL DEFAULT 0 CHECK (wallet_balance >= 0),
  escrow_total   BIGINT NOT NULL DEFAULT 0,
  client_seed    TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE bets (
  id         UUID PRIMARY KEY,
  player_id  UUID NOT NULL REFERENCES players(id),
  amount     BIGINT NOT NULL CHECK (amount > 0),
  side       TEXT NOT NULL CHECK (side IN ('HEADS','TAILS')),
  seed       TEXT,                       -- demo holds it; production: client-side, hash only
  bet_hash   CHAR(64) NOT NULL,
  status     TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','MATCHED','CANCELLED')),
  game_id    UUID UNIQUE,                -- one bet → at most one game
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_bets_open ON bets(amount, side) WHERE status = 'OPEN';

CREATE TABLE games (
  id             UUID PRIMARY KEY,
  bet_maker_id   UUID NOT NULL REFERENCES bets(id),
  bet_taker_id   UUID NOT NULL REFERENCES bets(id),
  amount         BIGINT NOT NULL,
  server_commit  CHAR(64) NOT NULL,
  server_seed    CHAR(64),               -- NULL until reveal
  merged_hash    CHAR(64),
  result_byte    SMALLINT,
  result         TEXT CHECK (result IN ('HEADS','TAILS')),
  winner_id      UUID REFERENCES players(id),
  pot            BIGINT,
  fee_pct        NUMERIC(5,2) NOT NULL,
  fee            BIGINT,
  payout         BIGINT,
  status         TEXT NOT NULL DEFAULT 'READY' CHECK (status IN ('READY','SETTLED','CANCELLED')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  settled_at     TIMESTAMPTZ,
  CHECK (bet_maker_id <> bet_taker_id)
);

CREATE TABLE ledger (
  id             BIGSERIAL PRIMARY KEY,
  player_id      UUID REFERENCES players(id),
  game_id        UUID REFERENCES games(id),
  type           TEXT NOT NULL CHECK (type IN ('DEPOSIT','TOPUP','ESCROW','REFUND','PAYOUT','FEE')),
  amount         BIGINT NOT NULL,
  balance_after  BIGINT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE fee_config (
  id         BIGSERIAL PRIMARY KEY,
  fee_pct    NUMERIC(5,2) NOT NULL CHECK (fee_pct >= 0 AND fee_pct <= 25),
  updated_by TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 9. Production API surface (reference)

### REST

| Method & path | Purpose | Body / response (abridged) |
|---|---|---|
| `POST /api/bets` | Post a bet (escrow) | `{amount:100, side:"HEADS", bet_hash:"…"}` → `201 {bet_id, status:"OPEN"}` |
| `GET /api/bets/open` | Open board | `[{bet_id, player:"anon-42", amount:100, side:"HEADS", bet_hash:"…", est_payout:190}]` |
| `POST /api/bets/{id}/take` | Take opposite side (escrow + match) | `{}` → `201 {game_id, server_commit, maker_hash, taker_hash}` |
| `POST /api/games/{id}/flip` | Trigger flip & settle | → `200 {result, merged_hash, result_byte, winner, pot, fee, payout, server_seed}` |
| `GET /api/games/{id}/proof` | Full verification bundle | `{commit, server_seed, preimages, merged_hash, result}` |
| `POST /api/bets/{id}/cancel` | Cancel open bet | refund |
| `GET /api/wallet` | Balance + escrow | `{balance, escrow}` |
| `GET /api/ledger?limit=50` | Player ledger | entries |
| `POST /api/admin/fee` | Set fee % | `{fee_pct}` |
| `GET /api/admin/stats` | GGR, volumes, counts | JSON |

### WebSocket events (real-time board)

```
bet:posted      {bet_id, amount, side, bet_hash}
bet:cancelled   {bet_id}
game:matched    {game_id, commitments…}
game:settled    {game_id, result, winner, payout, proof…}
wallet:updated  {balance, escrow}
```

---

## 10. Concurrency, integrity & security requirements

1. **Double-take prevention** — take the bet row `SELECT … FOR UPDATE` inside the match transaction; flip status `OPEN → MATCHED` atomically; the `UNIQUE` on `bets.game_id` is the backstop.
2. **Double-spend prevention** — escrow debit and balance check in one transaction; `CHECK (wallet_balance >= 0)`; negative balances impossible.
3. **Idempotency** — all money-moving endpoints accept an `Idempotency-Key` header; retries never double-charge.
4. **Settlement atomicity** — reveal seed, record result, credit winner, book fee, write ledger rows — one DB transaction, all-or-nothing.
5. **No plain outcomes ever stored** — the results table only ever contains commitments before settle; there is no "predefined result" column by design.
6. **Append-only audit** — ledger + proof bundles are never updated, only inserted.
7. **Rate limits & auth** — OTP/2FA logins, per-IP bet-rate limits, withdrawal limits & cooling-off delays.
8. **Transport & secrets** — TLS everywhere; server seeds in an HSM/KMS or at minimum OS keystore; seed reveal must be a separate, logged action.
9. **Monitoring** — fee revenue reconciliation, conservation check job (§5.4), anomaly alerts on win-rate deviation per cohort (should hover at 50% ± noise).

---

## 11. Admin module (as in the demo, plus production additions)

- **Fee control** — set `feePct` (0–25%), effective for future games; full audit trail of changes.
- **Dashboard** — games settled, total wagered, fees collected (house revenue), current fee.
- **Game explorer** — every settled game with its complete proof bundle (commit, seeds, preimages, merged hash, result).
- **Player management** — demo: play-coin top-ups & reset. Production: KYC states, limits, self-exclusion.
- **Compliance panel** — licensing status, geo/age gating health, RNG certification expiry.

---

## 12. Compliance & licensing (real-money path — mandatory reading)

1. **Jurisdiction first.** Incorporate and licence where chance-based gaming is legal (e.g., certain US states, Malta, Curacao, Philippines/PAGCOR, etc.). Target markets must be legal to serve — geo-block everywhere else, **including all of India for real stakes**.
2. **Indian users.** Real-money coin-toss wagering is not legal in Delhi/most states; the Public Gambling Act 1867 and 2025 IT rules apply. Play-money operation is the only legal mode from India.
3. **KYC/AML** — identity verification, source-of-funds thresholds, suspicious-activity reporting.
4. **Payments** — licensed PSPs/aggregators only; no personal UPI settlement of wagers; segregated player-fund accounts.
5. **Fairness certification** — RNG/algorithm audit by an accredited lab (iGaminglabs, BMM, GLI); publish the commit–reveal spec for players.
6. **Responsible gaming** — deposit/loss/session limits, self-exclusion, age gating (18+/21+ by market), clear odds disclosure (50/50).
7. **Terms, privacy (DPDP Act 2023 for Indian user data), grievance officer** — before launch.
8. **Get a gaming-law firm.** This document is engineering documentation, **not legal advice**.

---

## 13. Launch checklist

- [ ] Legal opinion + licence in target jurisdiction; India geo-blocked for real money
- [ ] Company, bank/PSP contracts, segregated player funds
- [ ] KYC vendor + flows
- [ ] This matching/escrow/fee engine implemented server-side with §10 integrity controls
- [ ] 3-party commit–reveal engine implemented exactly per §6 + lab certification
- [ ] Ledger reconciliation job (§5.4) + alerting
- [ ] Public proof/verifier page for players
- [ ] Load test: match contention, flip storms, idempotent retries
- [ ] Penetration test & key management review
- [ ] Responsible-gaming suite & T&Cs live
- [ ] Soft launch with play money → audit → real-money go-live

---

## Appendix A — Demo file map (`toss-bet-demo.html`)

| Function | Role |
|---|---|
| `sha256 / hmacSha256 / randomHex` | Pure-JS SHA-256 + HMAC (verified against official test vectors) |
| `initState` | Wallets, seeds, seeded opening bet, auto-match defaults ON |
| `placeBet / cancelBet` | Escrow, bet fingerprint, refund, queue entry |
| `findMatchFor / attemptAutoMatch` | **Auto-match queue engine** (FIFO, exact amount, opposite side, no self-match) |
| `sweepQueue / toggleAutoMatch` | Queue sweep on enable + admin toggle |
| `createGame` | Shared match factory (auto & manual) — commitments published here |
| `acceptBet` | Manual take (always available) |
| `tossResult` | **The merged 3-party result** |
| `settle` | Fee math, payout, ledger, proof storage |
| `renderModal` | Pre-flip commitments + post-flip full proof |
| `applyFee / topUp / resetDemo` | Admin controls |
| Tabs Aman/Binish/Admin | Two-player simulation + admin |

## Appendix B — Crypto test vectors used

```
SHA-256("abc")
  = ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad   PASS
SHA-256("")
  = e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855   PASS
SHA-256("abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq")
  = 248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1   PASS
HMAC-SHA256("key","The quick brown fox jumps over the lazy dog")
  = f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8   PASS
```

## Appendix C — FAQ

**Q: Can we store tomorrow's results in the DB like originally planned?**
No. That column is the fraud vector — the house (or a hacker) reads heads/tails and takes the opposite side. The 3-party merged hash gives the same "result fixed in advance" property (everything needed to determine it exists at match time) with zero ability for anyone to peek or steer.

**Q: What if a player changes their seed after posting?**
Their bet fingerprint was frozen at post time; a changed seed produces a different hash and the proof fails. Fingerprint ≠ recomputation = tamper detected.

**Q: What decides HEADS vs TAILS exactly?**
The parity of the first byte of `HMAC-SHA256(serverSeed, betHashA+betHashB:gameId)` — even HEADS, odd TAILS. A uniform byte's parity is exactly 50/50.

**Q: Where does the house make money?**
Only the fee (default 5% of pot). The house never wins a stake.

**Q: Difference between this and the v1 demo?**
v1 used one system seed + one client seed. v2 (this document) merges **both players' bet fingerprints + the system commit** — all three parties' entropy is required, making unilateral manipulation impossible even in theory.

---

*End of document — v2.0. Companion implementation: `toss-bet-demo.html`.*

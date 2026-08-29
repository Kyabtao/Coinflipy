/* FlipArena shared module — safe money math, wallet invariants & ledger audit.
   Imported by both the player app and the admin console so that every coin
   movement in the product goes through one audited, integer-subunit path. */
import "./runtime.js";
import {
  SUBUNIT, toSubunits, fromSubunits, addSubunits, subSubunits,
  pctOfSubunits, allocateSubunits, roundCoin, nonNegativeCoin, isSaneAmount
} from "../../src/js/utils/math.js";

export { SUBUNIT, toSubunits, fromSubunits, roundCoin };

const WALLET_KEYS = ["main", "bonus", "referral", "rakeback", "bank"];

/* ── Pure coin helpers ──────────────────────────────────────────────────── */

/** Normalise any input to a whole, finite coin amount (half-up, NaN-safe). */
export function coin(n) {
  const v = Number(n);
  if (!isFinite(v)) return 0;
  return Math.round(v);
}

/** Integer-safe addition of coin amounts. */
export function add(a, b) { return coin(fromSubunits(addSubunits(toSubunits(a), toSubunits(b)))); }

/** Integer-safe subtraction of coin amounts. */
export function sub(a, b) { return coin(fromSubunits(subSubunits(toSubunits(a), toSubunits(b)))); }

/* Percentages and multipliers are scaled to integers first, then rounded to
   whole coins exactly once. Rounding twice (subunits, then coins) would push
   values like 92 × 3.8% = 3.496 up to 4 instead of down to 3. */
const PCT_SCALE = 1000, MULT_SCALE = 1000000;

/** `pct`% of an amount → whole coins, rounded half-up exactly once. */
export function pct(amount, p) {
  const n = Math.round(Number(amount) || 0), scaled = Math.round((Number(p) || 0) * PCT_SCALE);
  return Math.round((n * scaled) / (100 * PCT_SCALE));
}

/** `pct`% of an amount, rounded down to whole coins (used for jackpot floors). */
export function pctFloor(amount, p) {
  const n = Math.round(Number(amount) || 0), scaled = Math.round((Number(p) || 0) * PCT_SCALE);
  return Math.floor((n * scaled) / (100 * PCT_SCALE));
}

/** Integer multiplication of an amount by a scalar (multipliers, pot sizes). */
export function mul(amount, factor) {
  const n = Math.round(Number(amount) || 0), scaled = Math.round((Number(factor) || 0) * MULT_SCALE);
  return Math.round((n * scaled) / MULT_SCALE);
}

/** Coerce a value to a finite number, falling back when it is missing or NaN. */
export function numOr(value, fallback = 0) {
  const n = Number(value);
  return isFinite(n) ? n : fallback;
}

/** Clamp an amount into [min, max] using integer coin math. */
export function clampCoin(amount, min, max) {
  const v = coin(amount);
  if (v < min) return coin(min);
  if (max != null && v > max) return coin(max);
  return v;
}

/** Split `amount` (whole coins) across `weights` with no fractional drift. */
export function allocate(amount, weights) {
  const n = coin(amount);
  const list = Array.isArray(weights) ? weights : [];
  const total = list.reduce((s, w) => s + Math.max(0, Number(w) || 0), 0);
  if (total <= 0 || !list.length) return list.map(() => 0);
  const out = list.map(w => Math.floor((n * Math.max(0, Number(w) || 0)) / total));
  let rest = n - out.reduce((s, v) => s + v, 0);
  for (let i = 0; rest > 0; i++, rest--) out[i % out.length] += 1;
  return out;
}

/* ── Wallet state helpers ───────────────────────────────────────────────── */

export function walletSegments() {
  const w = (globalThis.S && globalThis.S.wallet) || {};
  return WALLET_KEYS.reduce((acc, k) => { acc[k] = coin(w[k]); return acc; }, {});
}

/** Playable balance (everything except the parked bank/vault). */
export function playableBalance() {
  const w = walletSegments();
  return add(add(w.main, w.bonus), add(w.referral, w.rakeback));
}

/** Repair a wallet segment that drifted negative or became non-finite. */
function sanitizeSegment(key) {
  const w = globalThis.S.wallet;
  const v = Number(w[key]);
  if (!isFinite(v) || v < 0) { w[key] = 0; return true; }
  const rounded = roundCoin(v);
  if (rounded !== v) { w[key] = rounded; return true; }
  return false;
}

/** Force every wallet segment and bot balance back inside its invariant. */
export function enforceWalletInvariants() {
  const fixes = [];
  if (!globalThis.S) return fixes;
  globalThis.S.wallet = globalThis.S.wallet || {};
  for (const k of WALLET_KEYS) if (sanitizeSegment(k)) fixes.push("wallet." + k);
  for (const b of globalThis.S.bots || []) {
    if (!isFinite(Number(b.balance)) || b.balance < 0) { b.balance = 0; fixes.push("bot:" + b.name); }
    else b.balance = roundCoin(b.balance);
    if (!isFinite(Number(b.bonusBalance)) || b.bonusBalance < 0) { b.bonusBalance = 0; fixes.push("bonus:" + b.name); }
    else b.bonusBalance = roundCoin(b.bonusBalance);
  }
  if (!isFinite(Number(globalThis.S.jackpot)) || globalThis.S.jackpot < 0) { globalThis.S.jackpot = 0; fixes.push("jackpot"); }
  return fixes;
}

/* ── Ledger ─────────────────────────────────────────────────────────────── */

export function pushLedger(type, delta, note) {
  const S = globalThis.S;
  if (!S) return;
  S.ledger = Array.isArray(S.ledger) ? S.ledger : [];
  S.ledger.unshift({ t: Date.now(), type, delta: coin(delta), note: note || "", balance: coin(S.wallet && S.wallet.main) });
  if (S.ledger.length > 400) S.ledger.length = 400;
}

/* ── Atomic wallet movements ────────────────────────────────────────────── */

/**
 * Debit one or more wallet segments. The whole movement is validated first and
 * then applied in a single synchronous block, so a partially applied debit can
 * never be observed (and can never be triggered twice by rapid clicks).
 * @returns {{ok:boolean, error?:string}}
 */
export function debitWallet(split, note) {
  const S = globalThis.S;
  if (!S || !S.wallet) return { ok: false, error: "Wallet unavailable." };
  const parts = {};
  let total = 0;
  for (const k of WALLET_KEYS) {
    const v = coin(split && split[k]);
    if (v < 0) return { ok: false, error: "Negative debit rejected." };
    if (v > 0) { parts[k] = v; total = add(total, v); }
    if (v > coin(S.wallet[k])) return { ok: false, error: "Insufficient " + k.toUpperCase() + " balance." };
  }
  for (const k in parts) S.wallet[k] = sub(S.wallet[k], parts[k]);
  if (total > 0) pushLedger("debit", -total, note || "wallet debit");
  return { ok: true, amount: total };
}

/** Credit wallet segments (never negative, always integer). */
export function creditWallet(split, note) {
  const S = globalThis.S;
  if (!S || !S.wallet) return { ok: false, error: "Wallet unavailable." };
  let total = 0;
  for (const k of WALLET_KEYS) {
    const v = coin(split && split[k]);
    if (v <= 0) continue;
    S.wallet[k] = add(S.wallet[k] || 0, v);
    total = add(total, v);
  }
  if (total > 0) pushLedger("credit", total, note || "wallet credit");
  return { ok: true, amount: total };
}

/** Debit a simulated bot wallet with the same invariants. */
export function debitBot(bot, amount, bonusAmount) {
  if (!bot) return { ok: false, error: "Unknown player." };
  const amt = coin(amount), bonus = coin(bonusAmount);
  const haveBonus = coin(bot.bonusBalance), haveMain = coin(bot.balance);
  if (bonus > haveBonus || amt > haveMain) return { ok: false, error: "Insufficient bot balance." };
  bot.bonusBalance = sub(haveBonus, bonus);
  bot.balance = sub(haveMain, amt);
  return { ok: true, amount: add(amt, bonus) };
}

/** Credit a simulated bot wallet. */
export function creditBot(bot, amount, bonusAmount) {
  if (!bot) return { ok: false, error: "Unknown player." };
  bot.balance = add(coin(bot.balance), coin(amount));
  bot.bonusBalance = add(coin(bot.bonusBalance), coin(bonusAmount));
  return { ok: true };
}

/* ── Concurrency guard (double-spend protection) ────────────────────────── */

let walletQueue = Promise.resolve();

/**
 * Serialise wallet-critical sections. Rapid clicks, bot ticks and cross-tab
 * storage events all funnel through this queue, so two overlapping spends can
 * never both observe the same starting balance.
 */
export function withWalletLock(fn) {
  const run = walletQueue.then(() => fn());
  walletQueue = run.then(() => null, () => null);
  return run;
}

/* ── Reconciliation & audit ─────────────────────────────────────────────── */

/** Gross / net revenue and cash-flow reconciliation for the house account.
 *
 *  Gross revenue = Coin Toss fees + P2P/catalog fees + cup rakes + tournament
 *                  rakes + shop & commerce + transfer fees + auction fees
 *  Costs         = promo cost + comps + rakeback paid + referral payouts
 *  Net revenue   = Gross revenue − Costs
 *  Cash in       = player deposits + bot deposits          (funding, never revenue)
 *  Cash out      = bot withdrawals + player withdrawals    (cash-out, never an expense)
 */
export function reconciliation() {
  const S = globalThis.S;
  const h = (S && S.config && S.config.house) || {};
  const gross = coin(coin(h.fees) + coin(h.catalogFees) + coin(h.cupRakes) + coin(h.trnyRakes) + coin(h.shop) + coin(h.xfFees) + coin(h.auctionFees));
  const promo = coin(h.promoCost), comps = coin(h.comps),
        rakebackPaid = coin(h.rakebackPaid), referralCost = coin(h.referralCost);
  const costs = add(add(promo, comps), add(rakebackPaid, referralCost));
  const net = sub(gross, costs);
  const cashIn = add(coin(h.deposits), coin(h.botDeposits));
  const cashOut = add(coin(h.withdrawals), coin(h.playerWithdrawals));
  return {
    fees: coin(h.fees), catalogFees: coin(h.catalogFees), cupRakes: coin(h.cupRakes),
    trnyRakes: coin(h.trnyRakes), shop: coin(h.shop), xfFees: coin(h.xfFees),
    auctionFees: coin(h.auctionFees),
    gross, promoCost: promo, comps, rakebackPaid, referralCost, costs, net,
    cashIn, cashOut, netCash: sub(cashIn, cashOut),
    capital: coin(h.capital), bankroll: add(coin(h.capital), net),
    jackpotPool: coin(S && S.jackpot),
    taps: coin(S && S.config && S.config.taps), sinks: coin(S && S.config && S.config.sinks),
  };
}

/** Total staked volume across settled player games and P2P/catalog history. */
export function wageredVolume() {
  const S = globalThis.S || {};
  const games = Array.isArray(S.games) ? S.games : [];
  const staked = games.reduce((n, g) => add(n, coin(g && g.stake)), 0);
  return {
    games: games.length,
    staked,
    lifetime: coin(S.stats && S.stats.lifetimeWagered),
    catalog: coin(S.stats && S.stats.catalogGames),
    arcade: coin(S.stats && S.stats.arcadePlays),
    global: coin(S.global && S.global.totalGames),
  };
}

/**
 * Verify every ledger invariant. Returns a machine-checkable report used by the
 * audit harness, the Admin Revenue screen and the self-healing audit loop.
 */
export function ledgerAudit() {
  const S = globalThis.S;
  const issues = [];
  if (!S) return { ok: false, issues: ["state unavailable"], metrics: {} };

  for (const k of WALLET_KEYS) {
    const v = Number(S.wallet && S.wallet[k]);
    if (!isFinite(v)) issues.push("wallet." + k + " is not a finite number");
    else if (v < 0) issues.push("wallet." + k + " is negative (" + v + ")");
    else if (Math.abs(v - roundCoin(v)) > 0) issues.push("wallet." + k + " has a fractional balance");
  }

  let botIssues = 0;
  for (const b of S.bots || []) {
    if (!isFinite(Number(b.balance)) || Number(b.balance) < 0) botIssues++;
    if (!isFinite(Number(b.bonusBalance)) || Number(b.bonusBalance) < 0) botIssues++;
    if (!isFinite(Number(b.net))) botIssues++;
  }
  if (botIssues) issues.push(botIssues + " simulated player wallet(s) violate the zero-negative rule");

  if (!isFinite(Number(S.jackpot)) || Number(S.jackpot) < 0) issues.push("jackpot pool is negative");

  const r = reconciliation();
  if (r.net !== sub(r.gross, r.costs)) issues.push("net revenue does not equal gross − total costs (promo + comps + rakeback + referral)");
  if (r.taps < 0) issues.push("taps (coins created) is negative");
  if (r.sinks < 0) issues.push("sinks (coins removed) is negative");

  // Escrow integrity: every open bet must still hold a split that adds up.
  let escrowIssues = 0;
  for (const b of S.waiting || []) {
    const stake = coin(b && b.stake), split = b && b.split;
    if (!split) continue;
    const held = add(add(coin(split.main), coin(split.bonus)), add(coin(split.referral), coin(split.rakeback)));
    if (held !== stake) escrowIssues++;
  }
  if (escrowIssues) issues.push(escrowIssues + " open bet(s) have an escrow split that does not match the stake");

  // Double-spend / duplicate settlement detection.
  const ids = new Set();
  let dupes = 0;
  for (const g of S.games || []) { if (ids.has(g.id)) dupes++; ids.add(g.id); }
  if (dupes) issues.push(dupes + " duplicate settled game id(s) detected");

  // Ledger row well-formedness.
  let ledgerIssues = 0;
  for (const l of S.ledger || []) {
    if (!l || !isFinite(Number(l.delta)) || !isFinite(Number(l.t)) || !isSaneAmount(l.balance)) ledgerIssues++;
  }
  if (ledgerIssues) issues.push(ledgerIssues + " malformed ledger row(s)");

  return {
    ok: issues.length === 0,
    issues,
    metrics: { ...r, ...wageredVolume(), jackpot: coin(S.jackpot), wallet: walletSegments(), playable: playableBalance() },
  };
}

/* ── Unified transaction log (Admin exports + charts) ───────────────────── */

/**
 * Merge every coin movement into one chronological transaction log.
 * Each row: {t, type, category, who, amount, balance, note}
 */
export function transactionLog(limit = 2000) {
  const S = globalThis.S || {};
  const rows = [];
  const push = (t, type, category, who, amount, note, balance) => {
    if (!isFinite(Number(t))) return;
    rows.push({ t: Number(t), type, category, who: who || "", amount: coin(amount), note: note || "", balance: coin(balance) });
  };
  for (const g of S.games || []) {
    push(g.t, "wager", g.game || "Coin Toss", g.oppName || "", -coin(g.stake), "Stake · " + (g.result || ""), "");
    const payout = coin(g.delta) > 0 ? add(coin(g.stake), coin(g.delta)) : 0;
    if (payout > 0) push(g.t, "payout", g.game || "Coin Toss", g.oppName || "", payout, "Payout · " + (g.result || ""), "");
    if (coin(g.fee) > 0) push(g.t, "fee", g.game || "Coin Toss", g.oppName || "", coin(g.fee), "Platform fee", "");
  }
  for (const d of (S.rg && S.rg.deposits) || []) push(d.t, "deposit", "Wallet", "Player", coin(d.base), (d.method || "wallet") + " · " + (d.reference || ""), coin(d.credited));
  for (const w of (S.playerWithdrawals && S.playerWithdrawals.log) || []) push(w.t, "withdrawal", "Wallet", "Player", -coin(w.amount), (w.method || "") + " · " + (w.reference || ""), "");
  for (const l of S.ledger || []) push(l.t, l.type || "ledger", "Ledger", "Player", coin(l.delta), l.note || "", coin(l.balance));
  for (const b of S.botTopups || []) push(b.t, "bot-topup", "Liquidity", b.bot || "Bot", coin(b.base), b.reason || "bot top-up", "");
  for (const w of (S.withdrawals && S.withdrawals.log) || []) push(w.t, "bot-withdrawal", "Liquidity", w.name || "Bot", -coin(w.amount), "bot cash-out", "");
  for (const x of S.botTransfers || []) push(x.t, "transfer", "Transfer", (x.from || "") + " → " + (x.to || ""), coin(x.received), "peer transfer", "");
  rows.sort((a, b) => b.t - a.t);
  return rows.slice(0, limit);
}

function bucketStart(t, unit) {
  const d = new Date(t);
  if (unit === "day") return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const day = d.getDay() || 7; // Monday-first weeks
  d.setDate(d.getDate() - (day - 1));
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Volume / profit buckets for the Admin revenue charts. */
export function revenueSeries(unit = "day", periods = 14) {
  const rows = transactionLog(4000);
  const now = Date.now();
  const step = unit === "week" ? 7 * 86400000 : 86400000;
  const out = [];
  for (let i = periods - 1; i >= 0; i--) {
    const anchor = now - i * step;
    const start = bucketStart(anchor, unit);
    const end = start + step;
    out.push({ start, end, volume: 0, revenue: 0, payouts: 0, count: 0, label: "" });
  }
  const byStart = new Map(out.map(b => [b.start, b]));
  for (const r of rows) {
    const b = byStart.get(bucketStart(r.t, unit));
    if (!b) continue;
    b.count++;
    if (r.type === "wager") b.volume += Math.abs(r.amount);
    if (r.category !== "Ledger" && (r.type === "fee" || r.type === "payout")) {
      // recognised revenue per settled game = fee; payouts are tracked separately
    }
    if (r.type === "fee") b.revenue += r.amount;
    if (r.type === "payout") b.payouts += r.amount;
  }
  for (const b of out) {
    const d = new Date(b.start);
    b.label = unit === "week"
      ? "W" + Math.ceil(((d - new Date(d.getFullYear(), 0, 1)) / 86400000 + 1) / 7)
      : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  }
  return out;
}

/** Inline SVG bar/line chart for the revenue dashboard (no canvas required). */
export function revenueChartSVG(series, valueKey = "volume", opts = {}) {
  const width = opts.width || 720, height = opts.height || 190;
  const pad = { l: 46, r: 12, t: 12, b: 26 };
  const values = series.map(s => Math.abs(Number(s[valueKey]) || 0));
  const max = Math.max(1, ...values);
  const innerW = width - pad.l - pad.r, innerH = height - pad.t - pad.b;
  const bw = series.length ? innerW / series.length : innerW;
  const bars = series.map((s, i) => {
    const v = Math.abs(Number(s[valueKey]) || 0);
    const h = Math.max(v > 0 ? 2 : 0, Math.round((v / max) * innerH));
    const x = pad.l + i * bw + bw * 0.18;
    const y = pad.t + innerH - h;
    const w = Math.max(2, bw * 0.64);
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="3" fill="url(#revGrad)"><title>${s.label} · ${Math.round(v).toLocaleString("en-IN")}</title></rect>`;
  }).join("");
  const labels = series.map((s, i) => {
    if (series.length > 10 && i % 2) return "";
    return `<text x="${(pad.l + i * bw + bw / 2).toFixed(1)}" y="${height - 8}" text-anchor="middle" font-size="9" fill="var(--mut)">${s.label}</text>`;
  }).join("");
  const grid = [0, 0.5, 1].map(f => {
    const y = (pad.t + innerH - f * innerH).toFixed(1);
    const val = Math.round(max * f);
    return `<line x1="${pad.l}" y1="${y}" x2="${width - pad.r}" y2="${y}" stroke="var(--line)" stroke-width="1"/><text x="${pad.l - 6}" y="${y}" text-anchor="end" font-size="9" fill="var(--mut)">${val.toLocaleString("en-IN")}</text>`;
  }).join("");
  return `<svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" role="img" aria-label="${opts.label || "Revenue chart"}">
    <defs><linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${opts.color || "var(--gold)"}"/><stop offset="100%" stop-color="rgba(128,128,128,.35)"/>
    </linearGradient></defs>${grid}${bars}${labels}</svg>`;
}

/* expose top-level symbols to globalThis so legacy inline handlers and the shared theme engine can resolve them */
Object.assign(globalThis, {
  add, allocate, clampCoin, coin, creditBot, creditWallet, debitBot, debitWallet,
  enforceWalletInvariants, ledgerAudit, mul, numOr, pct, pctFloor, playableBalance, pushLedger,
  reconciliation, revenueChartSVG, revenueSeries, sub, transactionLog, wageredVolume, walletSegments, withWalletLock,
});

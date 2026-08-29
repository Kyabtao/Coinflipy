#!/usr/bin/env node
/* FlipArena — ledger & money-math simulation harness (Phase 3 / audit step 5).
   Runs the real shared money module (tossmatch/js/shared/money.js) against
   synthetic state: floating-point accuracy, escrow/refund conservation,
   concurrent betting cycles (double-spend), invariant detection and the
   revenue reconciliation formula. Prints a JSON report; exits non-zero on any
   failure so the continuous audit loop can gate on it. */
'use strict';

const results = [];
function record(name, ok, detail = '') { results.push({ name, ok: !!ok, detail }); }

const money = await import('../tossmatch/js/shared/money.js');
const math = await import('../tossmatch/src/js/utils/math.js');

/* Synthetic state that mirrors the shape produced by js/player/state.js. */
function freshState(overrides = {}) {
  return Object.assign({
    wallet: { main: 100000, bonus: 5000, referral: 500, rakeback: 250, bank: 0 },
    bots: Array.from({ length: 25 }, (_, i) => ({ name: 'Bot ' + i, balance: 1000, bonusBalance: 1000, net: 0 })),
    config: {
      house: { capital: 100000, fees: 0, catalogFees: 0, cupRakes: 0, trnyRakes: 0, shop: 0, xfFees: 0, promoCost: 0, comps: 0, withdrawals: 0, playerWithdrawals: 0, deposits: 0, botDeposits: 0, netRevenue: 0, netCash: 0 },
      taps: 0, sinks: 0, audit: [], reviewFlags: [], feePct: 5, jpFundPct: 10, jpFloor: 1,
    },
    jackpot: 500,
    waiting: [],
    games: [],
    ledger: [],
    rg: { deposits: [] },
    playerWithdrawals: { count: 0, amount: 0, log: [] },
    botTopups: [],
    withdrawals: { count: 0, amount: 0, log: [] },
    botTransfers: [],
    stats: { lifetimeWagered: 0 },
    global: { totalGames: 0 },
  }, overrides);
}

/* ── 1. Floating-point accuracy ──────────────────────────────────────────── */
{
  // pot and pct10 are integers, so pot*pct10/1000 is the exact rational answer;
  // the legacy float path (pot*pct/100) can land on the wrong side of .5.
  let drift = 0, floatDrift = 0, worst = null;
  for (let i = 0; i < 20000; i++) {
    const pot = 2 * (10 + (i % 997));             // odd, awkward pots
    const pct10 = 5 + (i % 50);                   // 0.5% … 5.4% in tenths
    const pct = pct10 / 10;
    const exact = Math.round((pot * pct10) / 1000);
    const safe = money.pct(pot, pct);             // subunit path
    const legacy = Math.round((pot * pct) / 100); // legacy float path
    if (safe !== exact) { drift++; if (!worst) worst = `pot ${pot} @ ${pct}% → safe ${safe}, exact ${exact}`; }
    if (legacy !== exact) floatDrift++;
  }
  record('subunit percentage math matches exact integer arithmetic across 20,000 pots', drift === 0,
    worst || ('no drift (legacy float path would diverge on ' + floatDrift + ' of them)'));

  const frac = [0.1, 0.7, 1.005, 2.675, 33.333, 999.999].map(v => money.coin(v));
  record('fractional inputs round half-up to whole coins',
    JSON.stringify(frac) === JSON.stringify([0, 1, 1, 3, 33, 1000]), JSON.stringify(frac));

  const splitTest = money.allocate(100, [1, 1, 1]);
  record('allocation never loses or invents a coin', money.add(money.add(splitTest[0], splitTest[1]), splitTest[2]) === 100, JSON.stringify(splitTest));
}

/* ── 2. Escrow / refund conservation ─────────────────────────────────────── */
{
  globalThis.S = freshState();
  const before = { ...globalThis.S.wallet };
  let failures = 0;
  for (let i = 0; i < 5000; i++) {
    const stake = 10 + (i % 400);
    const cap = money.pct(stake, 20);
    let rem = cap, split = { main: 0, bonus: 0, referral: 0, rakeback: 0 };
    for (const seg of ['bonus', 'referral', 'rakeback']) {
      const take = Math.min(rem, globalThis.S.wallet[seg]);
      split[seg] = take; rem = money.sub(rem, take);
    }
    split.main = money.sub(stake, split.bonus + split.referral + split.rakeback);
    const d = money.debitWallet(split, 'escrow');
    const c = money.creditWallet(split, 'refund');
    if (!d.ok || !c.ok) failures++;
  }
  const after = globalThis.S.wallet;
  const conserved = ['main', 'bonus', 'referral', 'rakeback'].every(k => after[k] === before[k]);
  record('5,000 escrow + refund round-trips conserve every wallet segment exactly', conserved && failures === 0,
    JSON.stringify(after));

  /* unsplit refunds can never push a segment below zero */
  globalThis.S.wallet.main = 10;
  const over = money.debitWallet({ main: 50 }, 'double-spend attempt');
  record('a debit larger than the balance is rejected (zero-negative invariant)',
    !over.ok && globalThis.S.wallet.main === 10, JSON.stringify(over));
}

/* ── 3. Concurrent betting cycles (double-spend) ─────────────────────────── */
{
  globalThis.S = freshState({ wallet: { main: 5000, bonus: 0, referral: 0, rakeback: 0, bank: 0 } });
  const STAKE = 100, ATTEMPTS = 200;
  let successes = 0, negatives = 0;
  const jobs = [];
  for (let i = 0; i < ATTEMPTS; i++) {
    jobs.push(money.withWalletLock(() => {
      const res = money.debitWallet({ main: STAKE }, 'concurrent stake');
      if (res.ok) successes++;
      if (globalThis.S.wallet.main < 0) negatives++;
      return res.ok;
    }));
  }
  await Promise.all(jobs);
  const expected = Math.floor(5000 / STAKE);
  record(`${ATTEMPTS} concurrent stakes are serialised (exactly ${expected} succeed)`,
    successes === expected && negatives === 0, `succeeded ${successes}, negatives ${negatives}, balance ${globalThis.S.wallet.main}`);
  record('concurrent cycle leaves an exact remainder', globalThis.S.wallet.main === 5000 - expected * STAKE,
    String(globalThis.S.wallet.main));
}

/* ── 4. Ledger invariant detection ──────────────────────────────────────── */
{
  globalThis.S = freshState();
  let rep = money.ledgerAudit();
  record('clean state passes every ledger invariant', rep.ok, rep.issues.join('; '));

  globalThis.S.wallet.main = -5;
  rep = money.ledgerAudit();
  record('negative wallet balance is detected', !rep.ok && rep.issues.some(i => /main is negative/.test(i)), rep.issues.join('; '));

  globalThis.S = freshState();
  globalThis.S.bots[3].balance = -1;
  rep = money.ledgerAudit();
  record('negative simulated-player balance is detected', !rep.ok && rep.issues.some(i => /zero-negative/.test(i)), rep.issues.join('; '));

  globalThis.S = freshState();
  globalThis.S.waiting = [{ id: 'w1', stake: 100, split: { main: 40, bonus: 10, referral: 0, rakeback: 0 } }];
  rep = money.ledgerAudit();
  record('escrow split that does not match the stake is detected', !rep.ok && rep.issues.some(i => /escrow/.test(i)), rep.issues.join('; '));

  globalThis.S = freshState();
  globalThis.S.games = [{ id: 1, stake: 10, delta: 5 }, { id: 1, stake: 10, delta: 5 }];
  rep = money.ledgerAudit();
  record('duplicate settled game ids are detected', !rep.ok && rep.issues.some(i => /duplicate/.test(i)), rep.issues.join('; '));

  globalThis.S = freshState();
  const fixed = money.enforceWalletInvariants();
  record('invariant repair is a no-op on a healthy wallet', fixed.length === 0, fixed.join(','));
  globalThis.S.wallet.bonus = -20; globalThis.S.bots[0].balance = -9;
  const fixed2 = money.enforceWalletInvariants();
  record('invariant repair clamps drifted balances back to zero',
    fixed2.length === 2 && globalThis.S.wallet.bonus === 0 && globalThis.S.bots[0].balance === 0, fixed2.join(','));
}

/* ── 5. Revenue reconciliation formula ──────────────────────────────────── */
{
  let formulaFails = 0, sample = '';
  for (let i = 0; i < 2000; i++) {
    const h = {
      fees: (i * 7) % 900, catalogFees: (i * 13) % 700, cupRakes: (i * 3) % 400,
      trnyRakes: (i * 5) % 600, shop: (i * 11) % 800, xfFees: (i * 2) % 90,
      promoCost: (i * 17) % 500, comps: (i * 19) % 300, deposits: i, botDeposits: i * 2,
      withdrawals: i * 3, playerWithdrawals: i, capital: 100000,
    };
    globalThis.S = freshState({ config: { house: h, taps: 10, sinks: 4 } });
    const r = money.reconciliation();
    const gross = h.fees + h.catalogFees + h.cupRakes + h.trnyRakes + h.shop + h.xfFees;
    const expectedNet = gross - h.promoCost - h.comps;
    if (r.gross !== gross || r.net !== expectedNet || r.netCash !== (h.deposits + h.botDeposits) - (h.withdrawals + h.playerWithdrawals)) {
      formulaFails++; if (!sample) sample = `gross ${r.gross}/${gross} net ${r.net}/${expectedNet}`;
    }
  }
  record('net revenue = gross − promo − comps across 2,000 randomised houses', formulaFails === 0, sample);

  globalThis.S = freshState();
  globalThis.S.games = [{ t: Date.now(), stake: 100, fee: 10, delta: 90, game: 'Coin Toss', oppName: 'Bot 1', result: 'WIN' }];
  const log = money.transactionLog(50);
  record('transaction log merges wagers, fees and payouts', log.length >= 2 && log.some(r => r.type === 'fee') && log.some(r => r.type === 'wager'),
    JSON.stringify(log.map(r => r.type)));
  const series = money.revenueSeries('day', 14);
  record('revenue series returns daily buckets with labels', series.length === 14 && series.every(s => typeof s.label === 'string'), '');
  const svg = money.revenueChartSVG(series, 'volume', {});
  record('revenue chart renders an accessible SVG', /<svg[\s\S]*role="img"[\s\S]*<\/svg>/.test(svg), '');
}

/* ── 6. Subunit primitives ──────────────────────────────────────────────── */
{
  record('subunit round-trip is lossless', math.fromSubunits(math.toSubunits(1234.56)) === 1234.56, '');
  record('0.1 + 0.2 in subunits equals 0.3 exactly',
    math.fromSubunits(math.addSubunits(math.toSubunits(0.1), math.toSubunits(0.2))) === 0.3, '');
  record('percentage of subunits never exceeds the whole',
    math.pctOfSubunits(math.toSubunits(100), 100) === math.toSubunits(100), '');
}

const ok = results.every(r => r.ok);
console.log(JSON.stringify({ ok, checks: results }, null, 2));
process.exit(ok ? 0 : 1);

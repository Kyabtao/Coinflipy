#!/usr/bin/env bash
# TossMatch continuous audit loop (v13.1).
# Runs the full audit stack N times (default 20): static/hygiene audit,
# headless jsdom boot smoke and the new-features regression suite.
# Every pass must be clean; any failing pass aborts (exit 1) so a fix +
# re-run (counter restarts) is required.
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PASSES="${1:-20}"
# The headless boot smoke needs jsdom; install it on demand so a fresh clone
# (or a clean workspace) can run the whole stack with `npm i` handled for you.
ensure_deps() {
  [ -d "$ROOT/node_modules/jsdom" ] && return 0
  command -v npm >/dev/null 2>&1 || return 0
  npm --prefix "$ROOT" i --no-save --silent jsdom >/dev/null 2>&1 || true
}
LOG="$ROOT/tossmatch/docs/audit-loop-v13.0.log"
rm -f "$LOG"
echo "TossMatch continuous audit — $PASSES consecutive passes (audit.js + boot-smoke.mjs + test-new-features.mjs)" | tee -a "$LOG"
fails=0
for i in $(seq 1 "$PASSES"); do
  printf "\n=== PASS %d/%d (%s) ===\n" "$i" "$PASSES" "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" | tee -a "$LOG"
  ensure_deps
  pass_ok=1
  if node "$ROOT/tools/audit.js" >> "$LOG" 2>&1; then
    echo "PASS $i: audit.js clean" | tee -a "$LOG"
  else
    echo "PASS $i: audit.js FAILED" | tee -a "$LOG"
    pass_ok=0
  fi
  if node "$ROOT/tools/boot-smoke.mjs" >> "$LOG" 2>&1; then
    echo "PASS $i: boot-smoke.mjs clean" | tee -a "$LOG"
  else
    echo "PASS $i: boot-smoke.mjs FAILED" | tee -a "$LOG"
    pass_ok=0
  fi
  if node "$ROOT/tools/test-new-features.mjs" >> "$LOG" 2>&1; then
    echo "PASS $i: test-new-features.mjs clean" | tee -a "$LOG"
  else
    echo "PASS $i: test-new-features.mjs FAILED" | tee -a "$LOG"
    pass_ok=0
  fi
  if [ "$pass_ok" -eq 1 ]; then
    echo "PASS $i: clean" | tee -a "$LOG"
  else
    echo "PASS $i: FAILED" | tee -a "$LOG"
    fails=1
    break
  fi
done
echo | tee -a "$LOG"
if [ "$fails" -eq 0 ]; then
  echo "RESULT: $PASSES/$PASSES clean — audit satisfied." | tee -a "$LOG"
  exit 0
else
  echo "RESULT: audit stopped on pass $i — fix and rerun." | tee -a "$LOG"
  exit 1
fi

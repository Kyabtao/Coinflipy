#!/usr/bin/env bash
# TossMatch continuous audit loop.
# Runs the full audit stack N times (default 20): static/hygiene audit, ledger
# & concurrency simulation and the headless jsdom boot smoke.
# Any failing pass aborts with exit 1 so a fix + re-run is required.
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PASSES="${1:-20}"
LOG="$ROOT/tossmatch/docs/audit-loop-v13.0.log"
rm -f "$LOG"
echo "TossMatch continuous audit — $PASSES consecutive passes" | tee -a "$LOG"
fails=0
for i in $(seq 1 "$PASSES"); do
  printf "\n=== PASS %d/%d (%s) ===\n" "$i" "$PASSES" "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" | tee -a "$LOG"
  if node "$ROOT/tools/audit.js" >> "$LOG" 2>&1; then
    echo "PASS $i: clean" | tee -a "$LOG"
  else
    echo "PASS $i: FAILED" | tee -a "$LOG"
    fails=1
    break
  fi
done
echo | tee -a "$LOG"
if [ "$fails" -eq 0 ]; then
  echo "RESULT: $PASSES/20 clean — audit satisfied." | tee -a "$LOG"
  exit 0
else
  echo "RESULT: audit stopped on pass $i — fix and rerun." | tee -a "$LOG"
  exit 1
fi

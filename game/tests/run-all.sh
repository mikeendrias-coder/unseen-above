#!/bin/bash
# Runs every flow test in order and prints one summary line per test. Serve dist on 8766 first.
cd "$(dirname "$0")/.."
for t in flow.js ep2-extras.js flow-ep3.js flow-ep4.js flow-ep5.js boss.js boss-end.js looks.js rooms.js kids-flow.js handoff-34.js smoke.js review.js; do
  out=$(timeout 700 node tests/$t 2>&1)
  fails=$(echo "$out" | grep -c "^FAIL")
  errs=$(echo "$out" | grep -c "^ERRORS")
  echo "== $t: $( [ $fails -eq 0 ] && [ $errs -eq 0 ] && echo pass || echo PROBLEM )"
  echo "$out" | grep -E "^FAIL|^ERRORS|Error" | head -5
done

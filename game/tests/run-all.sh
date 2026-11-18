#!/bin/bash
# Runs every flow test, several at once (JOBS, default 6), and prints one summary line per test.
# Serve dist on 8766 first: (cd dist && python3 -m http.server 8766)
# On Michael's PC Playwright lives in ~/work/node_modules: NODE_PATH=/home/michael/work/node_modules
cd "$(dirname "$0")/.."
JOBS=${JOBS:-6}
out=$(mktemp -d)
one() {
  t=$1; o="$2/$t.txt"
  timeout 700 node tests/$t > "$o" 2>&1
  fails=$(grep -c "^FAIL" "$o"); errs=$(grep -c "^ERRORS" "$o")
  { echo "== $t: $( [ $fails -eq 0 ] && [ $errs -eq 0 ] && echo pass || echo PROBLEM )"; grep -E "^FAIL|^ERRORS|Error" "$o" | head -5; } > "$o.sum"
}
export -f one
start=$(date +%s)
printf '%s\n' pause.js flow.js ep2-extras.js flow-ep3.js flow-ep4.js flow-ep5.js boss.js boss-end.js looks.js rooms.js kids-flow.js handoff-34.js smoke.js review.js \
  | xargs -P "$JOBS" -I{} bash -c 'one "$@"' _ {} "$out"
cat "$out"/*.sum
echo "took $(( $(date +%s) - start )) s with $JOBS at a time"
rm -rf "$out"

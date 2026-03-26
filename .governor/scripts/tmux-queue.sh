#!/usr/bin/env bash
set -euo pipefail

# Queue a message through the governor file bus for cross-session or cross-role delivery.
# Unlike the original claude-tmux which writes to ~/.claude/tmux-messages/,
# this routes through .governor/bus/ to stay within the governance model.

usage() {
  cat <<'USAGE'
Usage: tmux-queue.sh -f <from> -t <to> -m <message> [-s sprint_id]
       echo "message" | tmux-queue.sh -f <from> -t <to> -m -

Options:
  -f, --from      Sender role (captain, halo, dev, ghost, qa, docs_writer)
  -t, --to        Recipient role
  -m, --message   Message text (use - to read from stdin)
  -s, --sprint    Sprint ID (optional)
  -h, --help      Show this help

Examples:
  tmux-queue.sh -f ghost -t halo -m "Verification complete: 3 violations found"
  tmux-queue.sh -f captain -t dev -m "Proceed with sprint S001"
USAGE
}

from=""
to=""
message=""
sprint_id="none"

while [[ $# -gt 0 ]]; do
  case "$1" in
    -f|--from)    from="${2:-}"; shift 2 ;;
    -t|--to)      to="${2:-}"; shift 2 ;;
    -m|--message) message="${2:-}"; shift 2 ;;
    -s|--sprint)  sprint_id="${2:-none}"; shift 2 ;;
    -h|--help)    usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ -z "$from" || -z "$to" || -z "$message" ]]; then
  echo '{"error": "--from, --to, and --message are required"}' >&2
  exit 1
fi

# Read from stdin if message is "-"
if [[ "$message" == "-" ]]; then
  message=$(cat)
fi

if [[ -z "$message" ]]; then
  echo '{"error": "Message cannot be empty"}' >&2
  exit 1
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
QUEUE="$ROOT/bus/${from}-to-${to}"
mkdir -p "$QUEUE"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RAND="$(printf '%04d' $((RANDOM % 10000)))"
OUT="$QUEUE/${STAMP}_${from}_${to}_tmux-queue_${sprint_id}_${RAND}.json"

cat > "$OUT" <<EOF
{
  "id": "MSG-$STAMP-$RAND",
  "from": "$from",
  "to": "$to",
  "type": "tmux-queue",
  "sprintId": $(if [[ "$sprint_id" == "none" ]]; then echo "null"; else echo "\"$sprint_id\""; fi),
  "createdAt": "$STAMP",
  "requiresAck": false,
  "payload": {
    "message": $(printf '%s' "$message" | jq -Rs .)
  }
}
EOF

echo "{\"success\": true, \"file\": \"$OUT\", \"from\": \"$from\", \"to\": \"$to\"}"

#!/usr/bin/env bash
set -euo pipefail

# Poll a tmux pane for a text pattern and exit when found.
# Used to wait for signals like "server ready", "tests passed", "verification complete".

usage() {
  cat <<'USAGE'
Usage: tmux-wait.sh -t <target> -p <pattern> [-T timeout] [-i interval]
       tmux-wait.sh -w <window> -p <pattern> [-T timeout] [-i interval]

Options:
  -t, --target    Tmux target (session:window.pane)
  -w, --window    Window name (resolves automatically)
  -p, --pattern   Regex pattern to look for (required)
  -F, --fixed     Treat pattern as fixed string (not regex)
  -T, --timeout   Seconds to wait (default: 30)
  -i, --interval  Poll interval in seconds (default: 0.5)
  -l, --lines     Number of history lines to inspect (default: 500)
  -h, --help      Show this help

Exit codes:
  0 - Pattern found
  1 - Timeout or error

Examples:
  tmux-wait.sh -w dev -p "ready on port" -T 60
  tmux-wait.sh -w ghost -p "verification complete" -T 120
USAGE
}

target=""
window_name=""
pattern=""
grep_flag="-E"
timeout=30
interval=0.5
lines=500

while [[ $# -gt 0 ]]; do
  case "$1" in
    -t|--target)   target="${2:-}"; shift 2 ;;
    -w|--window)   window_name="${2:-}"; shift 2 ;;
    -p|--pattern)  pattern="${2:-}"; shift 2 ;;
    -F|--fixed)    grep_flag="-F"; shift ;;
    -T|--timeout)  timeout="${2:-30}"; shift 2 ;;
    -i|--interval) interval="${2:-0.5}"; shift 2 ;;
    -l|--lines)    lines="${2:-500}"; shift 2 ;;
    -h|--help)     usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ -z "$pattern" ]]; then
  echo '{"error": "--pattern is required"}' >&2
  exit 1
fi

if ! tmux display-message -p '#{session_name}' >/dev/null 2>&1; then
  echo '{"error": "Not running inside tmux"}' >&2
  exit 1
fi

session=$(tmux display-message -p '#{session_name}')

# Resolve window name to target if provided
if [[ -n "$window_name" && -z "$target" ]]; then
  window_index=$(tmux list-windows -t "$session" -F '#{window_index} #{window_name}' \
    | awk -v name="$window_name" '$2 == name {print $1; exit}')
  if [[ -z "$window_index" ]]; then
    echo '{"error": "Window not found", "window_name": "'"$window_name"'"}' >&2
    exit 1
  fi
  target="$session:$window_index.0"
fi

if [[ -z "$target" ]]; then
  echo '{"error": "--target or --window is required"}' >&2
  exit 1
fi

if ! [[ "$timeout" =~ ^[0-9]+$ ]]; then
  echo '{"error": "timeout must be an integer"}' >&2
  exit 1
fi

start_epoch=$(date +%s)
deadline=$((start_epoch + timeout))

while true; do
  pane_text=$(tmux capture-pane -p -J -t "$target" -S "-${lines}" 2>/dev/null || true)

  if printf '%s\n' "$pane_text" | grep $grep_flag -- "$pattern" >/dev/null 2>&1; then
    echo '{"found": true, "target": "'"$target"'"}'
    exit 0
  fi

  now=$(date +%s)
  if (( now >= deadline )); then
    echo '{"found": false, "error": "timeout", "target": "'"$target"'", "timeout": '"$timeout"'}' >&2
    exit 1
  fi

  sleep "$interval"
done
